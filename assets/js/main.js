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
      toggle.innerHTML = nav.classList.contains("open") ? "&#10005;" : "&#9776;";
    });
    nav.querySelectorAll("a").forEach(a=> a.addEventListener("click", ()=>{
      nav.classList.remove("open"); toggle.innerHTML = "&#9776;";
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
function villaCardHTML(v){
  return `
    <div class="villa-card">
      <div class="img-wrap">
        <span class="villa-tag">${v.location}</span>
        <img src="${v.cover}" alt="${v.name}" loading="lazy">
      </div>
      <div class="villa-body">
        <h3>${v.name}</h3>
        <span class="villa-loc">${v.location}</span>
        <p>${v.descriptionShort}</p>
        <div class="villa-meta">
          <span>${v.bedrooms} BR</span><span>${v.guests} guests</span><span>${v.bathrooms} bath</span>
        </div>
        <div class="villa-actions">
          <a href="villa.html?id=${v.id}" class="btn btn-navy" data-i18n="view_villa">View Villa</a>
          <a href="#" class="btn btn-blue" data-open-booking data-villa="${v.name}" data-i18n="book_now">Book Now</a>
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
    : `<p class="empty-state">No villas published for this destination yet — check back soon.</p>`;
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
      form.addEventListener("submit", e=>{
        e.preventDefault();
        if(!validateForm(form)) return;
        form.style.display = "none";
        document.getElementById("bookingSuccess").classList.add("show");
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
      reForm.addEventListener("submit", e=>{
        e.preventDefault();
        if(!validateForm(reForm)) return;
        reForm.style.display = "none";
        document.getElementById("realEstateSuccess").classList.add("show");
      });
    }
  }

  document.addEventListener("keydown", e=>{
    if(e.key === "Escape"){ closeModal("bookingModal"); closeModal("realEstateModal"); }
  });
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
  initHeroVideoSpeed();
});
