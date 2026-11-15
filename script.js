/* ==========================================================================
   Miller & Sons Construction Services LLC - Site Scripts
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONTACT CONFIG  <<< EDIT THESE VALUES >>>
   All contact details on the site (contact section + footer) and the email
   recipient for the form come from this one block.
   -------------------------------------------------------------------------- */
const CONFIG = {
  company: "Miller & Sons Construction Services LLC",
  email: "info@millersons.construction",      // PLACEHOLDER: replace with the company email
  phone: "(716) 800-1040",              // PLACEHOLDER: replace with the company phone
  area: "Proudly serving Western New York.", // PLACEHOLDER
  emailSubject: "New Construction Estimate Request"
};

/* Fill in every element tagged data-contact="company|phone|email|area". */
function applyContactConfig() {
  const telHref = "tel:" + CONFIG.phone.replace(/[^\d+]/g, "");
  const mailHref = "mailto:" + CONFIG.email;

  document.querySelectorAll("[data-contact]").forEach(function (el) {
    const key = el.getAttribute("data-contact");
    if (key === "company") el.textContent = CONFIG.company;
    if (key === "area") el.textContent = CONFIG.area;
    if (key === "phone") { el.textContent = CONFIG.phone; el.setAttribute("href", telHref); }
    if (key === "email") { el.textContent = CONFIG.email; el.setAttribute("href", mailHref); }
  });
}

/* --------------------------------------------------------------------------
   2. FOOTER YEAR
   -------------------------------------------------------------------------- */
function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* --------------------------------------------------------------------------
   3. MOBILE NAVIGATION (hamburger)
   -------------------------------------------------------------------------- */
function initNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("open"));
  });

  // Close the menu after choosing a link
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { setOpen(false); });
  });

  // Close with Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* --------------------------------------------------------------------------
   4. LIGHTBOX
   Each <button class="gallery-item"> is one project. Its photos come from
   data-images="a.jpg|b.jpg|c.jpg" and captions from data-captions="A|B|C".
   The lightbox steps through that project's photos only.
   -------------------------------------------------------------------------- */
function initLightbox() {
  const items = Array.from(document.querySelectorAll(".gallery-item"));
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");
  if (!items.length || !box) return;

  let photos = [];   // [{src, caption}] for the open project
  let title = "";
  let current = 0;
  let lastFocused = null;

  function readProject(item) {
    const srcs = (item.dataset.images || "").split("|").filter(Boolean);
    const caps = (item.dataset.captions || "").split("|");
    const thumb = item.querySelector("img");
    title = item.dataset.title || "Project";
    if (!srcs.length && thumb) srcs.push(thumb.src);
    photos = srcs.map(function (src, i) { return { src: src, caption: caps[i] || "" }; });
  }

  function show(index) {
    current = (index + photos.length) % photos.length;
    const p = photos[current];
    img.src = p.src;
    img.alt = "Placeholder image: " + title + (p.caption ? " - " + p.caption : "");
    caption.textContent = title + (p.caption ? ": " + p.caption : "") +
      "  (" + (current + 1) + " of " + photos.length + ")";
    // Hide arrows when a project has only one photo
    prevBtn.hidden = nextBtn.hidden = photos.length < 2;
  }

  function open(item) {
    lastFocused = document.activeElement;
    readProject(item);
    show(0);
    box.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    document.body.style.overflow = "";
    img.src = "";
    if (lastFocused) lastFocused.focus();
  }

  items.forEach(function (item) {
    item.addEventListener("click", function () { open(item); });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () { show(current - 1); });
  nextBtn.addEventListener("click", function () { show(current + 1); });

  // Click on the dark backdrop closes the lightbox
  box.addEventListener("click", function (e) { if (e.target === box) close(); });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
    // Keep keyboard focus inside the dialog
    if (e.key === "Tab") {
      const focusable = [closeBtn, prevBtn, nextBtn].filter(function (b) { return !b.hidden; });
      const idx = focusable.indexOf(document.activeElement);
      e.preventDefault();
      const next = e.shiftKey ? (idx <= 0 ? focusable.length - 1 : idx - 1) : (idx + 1) % focusable.length;
      focusable[next].focus();
    }
  });
}

/* --------------------------------------------------------------------------
   5. CONTACT FORM (Formspree)
   -------------------------------------------------------------------------- */
function initForm() {
  const form = document.getElementById("estimate-form");
  const status = document.getElementById("form-status");
  if (!form || !status) return;

  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xjywyeye";

  const fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    type: document.getElementById("project-type"),
    details: document.getElementById("details")
  };

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : "";

  function setError(input, message) {
    const wrap = input.closest(".field");
    const out = document.getElementById(input.id + "-error");
    if (wrap) wrap.classList.toggle("invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (out) out.textContent = message || "";
  }

  function validate() {
    let firstBad = null;
    function check(input, message) {
      setError(input, message);
      if (message && !firstBad) firstBad = input;
    }

    const name = fields.name.value.trim();
    const email = fields.email.value.trim();
    const phoneDigits = fields.phone.value.replace(/\D/g, "");
    const details = fields.details.value.trim();

    check(fields.name, name.length < 2 ? "Please enter your full name." : "");
    check(fields.email, !email ? "Please enter your email address." :
      !EMAIL_PATTERN.test(email) ? "Please enter a valid email address." : "");
    check(fields.phone, !fields.phone.value.trim() ? "Please enter your phone number." :
      phoneDigits.length < 7 ? "Please enter a valid phone number." : "");
    check(fields.type, !fields.type.value ? "Please choose a project type." : "");
    check(fields.details, details.length < 10 ? "Please describe your project (at least a few words)." : "");

    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  Object.values(fields).forEach(function (input) {
    input.addEventListener("input", function () { setError(input, ""); });
    input.addEventListener("change", function () { setError(input, ""); });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    status.textContent = "";
    status.style.color = "";

    if (!validate()) return;

    if (FORMSPREE_ENDPOINT.includes("YOUR_FORM_ID")) {
      status.textContent = "Add your Formspree form ID in script.js before publishing this form.";
      status.style.color = "#b3261e";
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      });
      const result = await response.json().catch(function () { return {}; });

      if (response.ok) {
        form.reset();
        Object.values(fields).forEach(function (input) { setError(input, ""); });
        status.textContent = "Thank you! Your estimate request has been sent successfully. We will be in touch soon.";
        status.style.color = "#1e6b3a";
      } else {
        status.textContent = result.errors && result.errors.length
          ? result.errors.map(function (error) { return error.message; }).join(" ")
          : "We couldn't send your request. Please try again or contact us by phone or email.";
        status.style.color = "#b3261e";
      }
    } catch (error) {
      status.textContent = "A connection error prevented your request from sending. Please try again or contact us by phone or email.";
      status.style.color = "#b3261e";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}

/* --------------------------------------------------------------------------
   6. SUBTLE SCROLL REVEAL (skipped if the browser lacks IntersectionObserver)
   -------------------------------------------------------------------------- */
function initReveal() {
  const targets = document.querySelectorAll(".card, .why-item, .gallery-item, .contact-form");
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(function (el) {
    el.classList.add("reveal");
    observer.observe(el);
  });
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  applyContactConfig();
  setYear();
  initNav();
  initLightbox();
  initForm();
  initReveal();
});
