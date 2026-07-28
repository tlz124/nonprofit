(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Mobile nav toggle                                                   */
  /* ------------------------------------------------------------------ */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                       */
  /* ------------------------------------------------------------------ */
  var revealTargets = document.querySelectorAll(
    ".mission-copy, .stat-list, .program-card, .gallery-strip figure, .quote-wrap, .donate-card, .donate-copy"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ------------------------------------------------------------------ */
  /* Animated stat counters                                              */
  /* ------------------------------------------------------------------ */
  var statList = document.getElementById("statList");

  function formatNumber(n) {
    return n.toLocaleString("en-US");
  }

  function animateCount(el, target) {
    if (prefersReducedMotion) {
      el.textContent = formatNumber(target);
      return;
    }
    var start = 0;
    var duration = 1400;
    var startTime = null;

    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var current = Math.floor(start + (target - start) * eased);
      el.textContent = formatNumber(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target);
      }
    }
    window.requestAnimationFrame(step);
  }

  if (statList && "IntersectionObserver" in window) {
    var statIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var stat = entry.target;
            var target = parseInt(stat.getAttribute("data-count"), 10) || 0;
            var numEl = stat.querySelector(".num");
            if (numEl) animateCount(numEl, target);
            statIO.unobserve(stat);
          }
        });
      },
      { threshold: 0.4 }
    );
    statList.querySelectorAll(".stat").forEach(function (stat) { statIO.observe(stat); });
  } else if (statList) {
    statList.querySelectorAll(".stat").forEach(function (stat) {
      var target = parseInt(stat.getAttribute("data-count"), 10) || 0;
      var numEl = stat.querySelector(".num");
      if (numEl) numEl.textContent = formatNumber(target);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Donation amount picker                                              */
  /* ------------------------------------------------------------------ */
  var amountGroup = document.getElementById("amountGroup");
  var otherWrap = document.getElementById("otherWrap");
  var otherAmountInput = document.getElementById("otherAmount");
  var submitLabel = document.getElementById("submitLabel");
  var currentAmount = 60;

  function updateSubmitLabel() {
    if (!submitLabel) return;
    if (currentAmount === "other") {
      var val = otherAmountInput && otherAmountInput.value ? parseInt(otherAmountInput.value, 10) : null;
      submitLabel.textContent = val && val > 0 ? "Give $" + formatNumber(val) : "Give what I can";
    } else {
      submitLabel.textContent = "Give $" + formatNumber(currentAmount);
    }
  }

  if (amountGroup) {
    var amountButtons = amountGroup.querySelectorAll(".amount-btn");
    amountButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        amountButtons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var amt = btn.getAttribute("data-amount");
        currentAmount = amt === "other" ? "other" : parseInt(amt, 10);

        if (otherWrap) {
          otherWrap.hidden = amt !== "other";
          if (amt === "other" && otherAmountInput) otherAmountInput.focus();
        }
        updateSubmitLabel();
      });
    });
  }

  if (otherAmountInput) {
    otherAmountInput.addEventListener("input", updateSubmitLabel);
  }

  /* ------------------------------------------------------------------ */
  /* Donate form submission (front-end demo — no backend wired up)       */
  /* ------------------------------------------------------------------ */
  var donateForm = document.getElementById("donateForm");
  var donorEmail = document.getElementById("donorEmail");
  var emailError = document.getElementById("emailError");
  var formNote = document.getElementById("formNote");

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  if (donateForm) {
    donateForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailVal = donorEmail ? donorEmail.value.trim() : "";

      if (!isValidEmail(emailVal)) {
        if (emailError) emailError.textContent = "That email doesn't look quite right — mind checking it?";
        if (donorEmail) donorEmail.setAttribute("aria-invalid", "true");
        return;
      }

      if (emailError) emailError.textContent = "";
      if (donorEmail) donorEmail.removeAttribute("aria-invalid");

      var amountText =
        currentAmount === "other"
          ? "$" + (otherAmountInput && otherAmountInput.value ? otherAmountInput.value : "0")
          : "$" + currentAmount;

      if (formNote) {
        formNote.textContent =
          "Thank you — " + amountText + " noted for " + emailVal + ". (Demo form: no payment was actually processed.)";
      }
      donateForm.reset();
      currentAmount = 60;
      if (amountGroup) {
        amountGroup.querySelectorAll(".amount-btn").forEach(function (b) { b.classList.remove("is-active"); });
        var sixty = amountGroup.querySelector('[data-amount="60"]');
        if (sixty) sixty.classList.add("is-active");
      }
      if (otherWrap) otherWrap.hidden = true;
      updateSubmitLabel();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Newsletter form                                                     */
  /* ------------------------------------------------------------------ */
  var newsletterForm = document.getElementById("newsletterForm");
  var newsletterEmail = document.getElementById("newsletterEmail");
  var newsletterMsg = document.getElementById("newsletterMsg");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = newsletterEmail ? newsletterEmail.value.trim() : "";
      if (!isValidEmail(val)) {
        if (newsletterMsg) {
          newsletterMsg.style.color = "#b3452f";
          newsletterMsg.textContent = "Please enter a valid email address.";
        }
        return;
      }
      if (newsletterMsg) {
        newsletterMsg.style.color = "";
        newsletterMsg.textContent = "You're on the list — see you Saturday.";
      }
      newsletterForm.reset();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Footer year                                                         */
  /* ------------------------------------------------------------------ */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
