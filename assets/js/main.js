/* ============== LANGUAGES ============== */
const LANGS = [
  {code:"en", label:"English"},
  {code:"sq", label:"Shqip"},
  {code:"el", label:"Ελληνικά"},
  {code:"de", label:"Deutsch"},
  {code:"fr", label:"Français"},
  {code:"ar", label:"العربية"},
  {code:"es", label:"Español"},
  {code:"it", label:"Italiano"},
  {code:"zh", label:"中文"},
  {code:"ja", label:"日本語"},
  {code:"ru", label:"Русский"}
];
const RTL_LANGS = ["ar"];

function getLang(){ return localStorage.getItem("mm_lang") || "en"; }
function setLang(code){ localStorage.setItem("mm_lang", code); applyLang(code); }

function applyLang(code){
  const dict = (window.I18N && window.I18N[code]) || (window.I18N && window.I18N.en) || {};
  document.documentElement.lang = code;
  document.documentElement.dir = RTL_LANGS.includes(code) ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    if(dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
    const key = el.getAttribute("data-i18n-ph");
    if(dict[key]) el.setAttribute("placeholder", dict[key]);
  });
  document.querySelectorAll(".lang-select").forEach(sel=> sel.value = code);
}

function buildLangSelect(sel){
  sel.innerHTML = LANGS.map(l=>`<option value="${l.code}">${l.label}</option>`).join("");
  sel.value = getLang();
  sel.addEventListener("change", e=> setLang(e.target.value));
}

/* Translate a key for JS-generated strings (alerts, dynamic cards) that
   aren't static DOM elements main.js's data-i18n scanner can reach. */
function t(key, fallback){
  const dict = (window.I18N && window.I18N[getLang()]) || (window.I18N && window.I18N.en) || {};
  return dict[key] || fallback || key;
}

/* ============== PRELOADER ============== */
function initPreloader(){
  const pre = document.getElementById("preloader");
  if(!pre) return;
  const minTime = 700;
  const start = Date.now();
  const hide = ()=>{
    const elapsed = Date.now() - start;
    const wait = Math.max(0, minTime - elapsed);
    setTimeout(()=>{ pre.classList.add("hide"); }, wait);
  };
  if(document.readyState === "complete") hide();
  else window.addEventListener("load", hide);
  setTimeout(hide, 2500); // safety fallback
}

/* ============== HERO BACKGROUND VIDEO SPEED ============== */
function initHeroVideoSpeed(){
  document.querySelectorAll(".hero-bg-video").forEach(vid=>{
    const speed = parseFloat(vid.getAttribute("data-speed")) || 1;
    const apply = ()=>{ vid.playbackRate = speed; };
    vid.addEventListener("loadedmetadata", apply);
    apply(); // in case metadata is already available
    vid.play().catch(()=>{ /* autoplay blocked, ignore */ });
  });
}

/* ============== HEADER / NAV ============== */
function initHeader(){
  const header = document.querySelector(".site-header");
  if(!header) return;
  const onScroll = ()=>{
    if(window.scrollY > 40) header.classList.add("solid");
    else header.classList.remove("solid");
  };
  window.addEventListener("scroll", onScroll);
  onScroll();

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if(toggle && nav){
    toggle.addEventListener("click", ()=>{
      nav.classList.toggle("open");
      const isOpen = nav.classList.contains("open");
      toggle.innerHTML = isOpen ? "&#10005;" : "&#9776;";
      document.body.style.overflow = isOpen ? "hidden" : "";
      if(isOpen) nav.scrollTop = 0;
    });
    nav.querySelectorAll("a").forEach(a=> a.addEventListener("click", ()=>{
      nav.classList.remove("open"); toggle.innerHTML = "&#9776;";
      document.body.style.overflow = "";
    }));
  }
}

/* ============== REVEAL ON SCROLL ============== */
function initReveal(){
  const els = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} });
  },{threshold:.15});
  els.forEach(el=> io.observe(el));
}

/* ============== VILLA CARDS + DESTINATION FILTER ============== */
function bookNowButtonHTML(v){
  // If a villa has a bookingUrl set in villas-data.js, "Book Now" becomes a
  // direct link to that URL (e.g. your Airbnb/Booking.com listing) instead
  // of opening the on-site enquiry form. Leave bookingUrl blank/empty to
  // keep the default on-site form — this is the only switch you need.
  if(v.bookingUrl && v.bookingUrl.trim()){
    return `<a href="${v.bookingUrl}" target="_blank" rel="noopener" class="btn btn-blue" data-i18n="book_now">Book Now</a>`;
  }
  return `<a href="#" class="btn btn-blue" data-open-booking data-villa="${v.name}" data-i18n="book_now">Book Now</a>`;
}

function villaCardHTML(v){
  const bedrooms = v.bedrooms ?? "-";
  const guests = v.guests ?? "-";
  const bathrooms = v.bathrooms ?? "-";
  return `
    <div class="villa-card">
      <div class="img-wrap">
        <span class="villa-tag">${v.location || ""}</span>
        <img src="${v.cover}" alt="${v.name}" loading="lazy">
      </div>
      <div class="villa-body">
        <h3>${v.name}</h3>
        <span class="villa-loc">${v.location || ""}</span>
        <p>${v.descriptionShort || v.description || ""}</p>
        <div class="villa-meta">
          <span>${bedrooms} <b data-i18n="card_br">BR</b></span>
          <span>${guests} <b data-i18n="card_guests">guests</b></span>
          <span>${bathrooms} <b data-i18n="card_bath">bath</b></span>
        </div>
        <div class="villa-actions">
          <a href="villa.html?id=${v.id}" class="btn btn-navy" data-i18n="view_villa">View Villa</a>
          ${bookNowButtonHTML(v)}
        </div>
      </div>
    </div>`;
}

function renderVillaGrid(gridId, destination){
  const grid = document.getElementById(gridId);
  if(!grid || !window.VILLAS) return;
  const list = (!destination || destination === "all")
    ? window.VILLAS
    : window.VILLAS.filter(v => v.destination === destination);
  grid.innerHTML = list.length
    ? list.map(villaCardHTML).join("")
    : `<p class="empty-state">${t("empty_state","No villas published for this destination yet — check back soon.")}</p>`;
  applyLang(getLang());
}

function initDestinationTabs(tabsId, gridId, defaultDest){
  const tabs = document.getElementById(tabsId);
  if(!tabs) { renderVillaGrid(gridId, defaultDest); return; }
  tabs.querySelectorAll(".dest-tab").forEach(tab=>{
    tab.addEventListener("click", ()=>{
      tabs.querySelectorAll(".dest-tab").forEach(t=> t.classList.remove("active"));
      tab.classList.add("active");
      renderVillaGrid(gridId, tab.getAttribute("data-dest"));
    });
  });
  const initial = tabs.querySelector(".dest-tab.active");
  renderVillaGrid(gridId, initial ? initial.getAttribute("data-dest") : defaultDest);
}

/* ============== EMAIL DELIVERY (Web3Forms) ============== */
const WEB3FORMS_ACCESS_KEY = "e3d3f685-8bde-4a0c-9448-a305c901cc9f";

async function sendToWeb3Forms(payload){
  payload.access_key = WEB3FORMS_ACCESS_KEY;
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

/* ============== BOOKING MODAL ============== */
function openBookingModal(villaName){
  const overlay = document.getElementById("bookingModal");
  if(!overlay) return;
  const villaField = document.getElementById("bk-villa");
  if(villaField) villaField.value = villaName || "";
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal(id){
  const overlay = document.getElementById(id);
  if(!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function initBookingModal(){
  const overlay = document.getElementById("bookingModal");
  if(overlay){
    overlay.addEventListener("click", e=>{ if(e.target === overlay) closeModal("bookingModal"); });
    document.querySelectorAll("[data-open-booking]").forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        e.preventDefault();
        openBookingModal(btn.getAttribute("data-villa") || "");
      });
    });
    overlay.querySelectorAll("[data-close-booking]").forEach(btn=> btn.addEventListener("click", ()=>closeModal("bookingModal")));

    const form = document.getElementById("bookingForm");
    if(form){
      form.addEventListener("submit", async e=>{
        e.preventDefault();
        if(!validateForm(form)) return;
        const submitBtn = form.querySelector("button[type=submit]");
        const originalText = submitBtn ? submitBtn.textContent : "";
        if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = t("form_sending","Sending…"); }

        const val = id => (document.getElementById(id)?.value || "").trim();
        const payload = {
          subject: `New villa booking enquiry — ${val("bk-villa") || "Mykonos Management"}`,
          from_name: "Mykonos Management Website",
          name: val("bk-name"),
          villa: val("bk-villa"),
          bedrooms: val("bk-bedrooms"),
          guests: val("bk-guests"),
          check_in: val("bk-checkin"),
          check_out: val("bk-checkout"),
          email: val("bk-email"),
          phone: val("bk-phone"),
          comments: val("bk-comments"),
          marketing_consent: document.getElementById("bk-consent")?.checked ? "Yes" : "No"
        };

        try{
          const result = await sendToWeb3Forms(payload);
          if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText; }
          if(result.success){
            form.style.display = "none";
            document.getElementById("bookingSuccess").classList.add("show");
          } else {
            alert(t("form_error_generic","Sorry, something went wrong sending your enquiry. Please try again or contact us directly on WhatsApp."));
          }
        } catch(err){
          if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText; }
          alert(t("form_error_generic","Sorry, something went wrong sending your enquiry. Please try again or contact us directly on WhatsApp."));
        }
      });
    }
  }

  const re = document.getElementById("realEstateModal");
  if(re){
    re.addEventListener("click", e=>{ if(e.target === re) closeModal("realEstateModal"); });
    document.querySelectorAll("[data-open-realestate]").forEach(btn=>{
      btn.addEventListener("click", (e)=>{ e.preventDefault(); re.classList.add("open"); document.body.style.overflow="hidden"; });
    });
    re.querySelectorAll("[data-close-booking]").forEach(btn=> btn.addEventListener("click", ()=>closeModal("realEstateModal")));
    const reForm = document.getElementById("realEstateForm");
    if(reForm){
      reForm.addEventListener("submit", async e=>{
        e.preventDefault();
        if(!validateForm(reForm)) return;
        const submitBtn = reForm.querySelector("button[type=submit]");
        const originalText = submitBtn ? submitBtn.textContent : "";
        if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = t("form_sending","Sending…"); }

        const val = id => (document.getElementById(id)?.value || "").trim();
        const intent = document.getElementById("re-intent-sell")?.checked ? "Sell a villa" : "Buy a villa";
        const payload = {
          subject: `New real estate enquiry — ${intent}`,
          from_name: "Mykonos Management Website",
          name: val("re-name"),
          intent: intent,
          budget: val("re-budget"),
          email: val("re-email"),
          phone: val("re-phone"),
          comments: val("re-comments"),
          marketing_consent: document.getElementById("re-consent")?.checked ? "Yes" : "No"
        };

        try{
          const result = await sendToWeb3Forms(payload);
          if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText; }
          if(result.success){
            reForm.style.display = "none";
            document.getElementById("realEstateSuccess").classList.add("show");
          } else {
            alert(t("form_error_generic","Sorry, something went wrong sending your enquiry. Please try again or contact us directly on WhatsApp."));
          }
        } catch(err){
          if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText; }
          alert(t("form_error_generic","Sorry, something went wrong sending your enquiry. Please try again or contact us directly on WhatsApp."));
        }
      });
    }
  }

  document.addEventListener("keydown", e=>{
    if(e.key === "Escape"){ closeModal("bookingModal"); closeModal("realEstateModal"); closeModal("propMgmtModal"); }
  });
}

function initPropMgmtModal(){
  const pm = document.getElementById("propMgmtModal");
  if(!pm) return;
  pm.addEventListener("click", e=>{ if(e.target === pm) closeModal("propMgmtModal"); });
  document.querySelectorAll("[data-open-propmgmt]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{ e.preventDefault(); pm.classList.add("open"); document.body.style.overflow="hidden"; });
  });
  pm.querySelectorAll("[data-close-booking]").forEach(btn=> btn.addEventListener("click", ()=>closeModal("propMgmtModal")));

  const pmForm = document.getElementById("propMgmtForm");
  if(pmForm){
    pmForm.addEventListener("submit", async e=>{
      e.preventDefault();
      if(!validateForm(pmForm)) return;
      const submitBtn = pmForm.querySelector("button[type=submit]");
      const originalText = submitBtn ? submitBtn.textContent : "";
      if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = t("form_sending","Sending…"); }

      const val = id => (document.getElementById(id)?.value || "").trim();
      const rented = document.getElementById("pm-rented-yes")?.checked ? "Already rented out" : "Not yet rented";
      const payload = {
        subject: "New property management enquiry",
        from_name: "Mykonos Management Website",
        name: val("pm-name"),
        property_location: val("pm-location"),
        bedrooms: val("pm-bedrooms"),
        currently_rented: rented,
        email: val("pm-email"),
        phone: val("pm-phone"),
        comments: val("pm-comments"),
        marketing_consent: document.getElementById("pm-consent")?.checked ? "Yes" : "No"
      };

      try{
        const result = await sendToWeb3Forms(payload);
        if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText; }
        if(result.success){
          pmForm.style.display = "none";
          document.getElementById("propMgmtSuccess").classList.add("show");
        } else {
          alert(t("form_error_generic","Sorry, something went wrong sending your enquiry. Please try again or contact us directly on WhatsApp."));
        }
      } catch(err){
        if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText; }
        alert(t("form_error_generic","Sorry, something went wrong sending your enquiry. Please try again or contact us directly on WhatsApp."));
      }
    });
  }
}

function validateForm(form){
  let valid = true;
  form.querySelectorAll("[required]").forEach(input=>{
    const err = input.parentElement.querySelector(".field-err") ||
                input.closest(".date-field")?.querySelector(".field-err");
    if(!input.value || !input.value.toString().trim()){
      valid = false;
      if(err) err.classList.add("show");
      input.style.borderColor = "#c0392b";
    } else {
      if(err) err.classList.remove("show");
      input.style.borderColor = "";
    }
  });
  return valid;
}

/* ============== LIGHTBOX (used on villa.html) ============== */
let LB_IMAGES = [];
let LB_INDEX = 0;
function initLightbox(images){
  LB_IMAGES = images || [];
  const lb = document.getElementById("lightbox");
  if(!lb) return;
  document.querySelectorAll("[data-lb-index]").forEach(fig=>{
    fig.addEventListener("click", ()=> openLightbox(parseInt(fig.getAttribute("data-lb-index"),10)));
  });
  document.getElementById("lbClose")?.addEventListener("click", closeLightbox);
  document.getElementById("lbPrev")?.addEventListener("click", ()=> shiftLightbox(-1));
  document.getElementById("lbNext")?.addEventListener("click", ()=> shiftLightbox(1));
  lb.addEventListener("click", e=>{ if(e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", e=>{
    if(!lb.classList.contains("open")) return;
    if(e.key === "Escape") closeLightbox();
    if(e.key === "ArrowLeft") shiftLightbox(-1);
    if(e.key === "ArrowRight") shiftLightbox(1);
  });
}
function openLightbox(i){
  LB_INDEX = i;
  renderLightbox();
  document.getElementById("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox(){
  document.getElementById("lightbox").classList.remove("open");
  document.body.style.overflow = "";
}
function shiftLightbox(dir){
  LB_INDEX = (LB_INDEX + dir + LB_IMAGES.length) % LB_IMAGES.length;
  renderLightbox();
}
function renderLightbox(){
  document.getElementById("lbImg").src = LB_IMAGES[LB_INDEX];
  document.getElementById("lbCounter").textContent = (LB_INDEX+1) + " / " + LB_IMAGES.length;
}

/* ============== INIT ============== */
document.addEventListener("DOMContentLoaded", ()=>{
  initPreloader();
  document.querySelectorAll(".lang-select").forEach(buildLangSelect);
  applyLang(getLang());
  initHeader();
  initReveal();
  initBookingModal();
  initPropMgmtModal();
  initHeroVideoSpeed();
});
