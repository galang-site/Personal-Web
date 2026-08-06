// =====================================================================
// PUBLIC SITE — fetches content from Supabase and renders it.
// No editing needed here for day-to-day content changes — use /admin.
// =====================================================================
const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);
const initials = (name) => (name || "").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
// Inline SVG icons (no emoji) used across the public site.
const ICON_PIN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const ICON_MAIL = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`;
const ICON_BRIEFCASE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
const ICON_EXTERNAL = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px;"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>`;
// Renders a category-label placeholder, or a real photo if image_url is set.
const mediaHtml = (baseClass, imageUrl, label, alt) =>
  imageUrl
    ? `<div class="${baseClass} has-image"><img src="${imageUrl}" alt="${alt || ""}" loading="lazy"></div>`
    : `<div class="${baseClass}">${label || ""}</div>`;
// Turns plain text (blank-line-separated paragraphs) into <p> HTML for the detail modal.
const textToParagraphs = (text) =>
  (text || "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

async function loadAll() {
  const [profileRes, aboutRes, statsRes, expRes, compRes, projRes, artRes, testiRes] = await Promise.all([
    sb.from("profile").select("*").eq("id", 1).single(),
    sb.from("about").select("*").eq("id", 1).single(),
    sb.from("stats").select("*").order("sort_order"),
    sb.from("experience").select("*").order("sort_order"),
    sb.from("companies").select("*").order("sort_order"),
    sb.from("projects").select("*").order("sort_order"),
    sb.from("articles").select("*").order("sort_order"),
    sb.from("testimonials").select("*").order("sort_order"),
  ]);

  const profile = profileRes.data || {};
  const about = aboutRes.data || {};
  const stats = statsRes.data || [];
  const experience = expRes.data || [];
  const companies = compRes.data || [];
  const projects = projRes.data || [];
  const articles = artRes.data || [];
  const testimonials = testiRes.data || [];

  render({ profile, about, stats, experience, companies, projects, articles, testimonials });
}

function render({ profile, about, stats, experience, companies, projects, articles, testimonials }) {
  document.title = `${profile.name || "Personal Site"} — ${profile.role || ""}`;
  $("brand").innerHTML = `<span class="mark"></span>${profile.name || ""}`;
  $("navResume").href = profile.resume_url || "#";

  const tabs = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "experience", label: "Experience" },
    { id: "companies", label: "Clients" },
    { id: "projects", label: "Portfolio" },
    { id: "articles", label: "Writing" },
  ];
  $("tabs").innerHTML = tabs.map((t,i) => `<button class="tab-btn ${i===0?'active':''}" data-tab="${t.id}">${t.label}</button>`).join("");
  function goTo(id){
    closeDetailPage();
    closeModal();
    document.querySelectorAll(".tabpanel").forEach(p => p.classList.toggle("active", p.dataset.panel === id));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
    document.getElementById("tabs").classList.remove("open");
    window.scrollTo(0,0);
  }
  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest("[data-tab]");
    const gotoBtn = e.target.closest("[data-goto]");
    const artBtn = e.target.closest("[data-open-article]");
    const projBtn = e.target.closest("[data-open-project]");
    if (tabBtn) goTo(tabBtn.dataset.tab);
    if (gotoBtn) goTo(gotoBtn.dataset.goto);
    if (artBtn) {
      const a = articles.find(x => String(x.id) === artBtn.dataset.openArticle);
      if (a) openArticleModal(a);
    }
    if (projBtn) {
      const p = projects.find(x => String(x.id) === projBtn.dataset.openProject);
      if (p) openProjectModal(p);
    }
  });
  $("navToggle").addEventListener("click", () => $("tabs").classList.toggle("open"));

  // QUICK-PREVIEW MODAL — short excerpt/description, with a "Read more" button
  // that opens the full read page (see below) for the same item.
  let currentItem = null; // { type: 'article'|'project', data }
  function openModal({ eyebrow, title, meta, image, previewHtml, link }) {
    $("modalEyebrow").textContent = eyebrow || "";
    $("modalTitle").textContent = title || "";
    $("modalMeta").textContent = meta || "";
    $("modalMedia").style.display = image ? "block" : "none";
    $("modalMedia").innerHTML = image ? `<img src="${image}" alt="${title || ""}">` : "";
    $("modalContent").innerHTML = previewHtml || `<p>More detail coming soon.</p>`;
    $("modalActions").innerHTML = `
      <button class="btn primary" id="modalReadMoreBtn">Lihat Selengkapnya →</button>
      ${(link && link !== "#") ? `<a class="btn ghost" href="${link}" target="_blank" rel="noopener">${ICON_EXTERNAL}View original / external link</a>` : ""}
    `;
    $("modalReadMoreBtn").addEventListener("click", () => { closeModal(); openDetailPageForCurrentItem(); });
    $("detailModal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("detailModal").classList.remove("open");
    document.body.style.overflow = "";
  }
  function openArticleModal(a) {
    currentItem = { type: "article", data: a };
    openModal({
      eyebrow: a.category, title: a.title, meta: a.article_date || "", image: a.image_url,
      previewHtml: `<p>${a.excerpt || ""}</p>`,
      link: a.link,
    });
  }
  function openProjectModal(p) {
    currentItem = { type: "project", data: p };
    const tags = Array.isArray(p.tags) ? p.tags : [];
    openModal({
      eyebrow: p.category, title: p.title, meta: tags.join(" · "), image: p.image_url,
      previewHtml: `<p>${p.description || ""}</p>`,
      link: p.link,
    });
  }
  $("modalClose").addEventListener("click", closeModal);
  $("detailModal").addEventListener("click", (e) => { if (e.target.id === "detailModal") closeModal(); });

  // FULL READ PAGE — a dedicated full-screen page (not a small popup) for the
  // full write-up plus a photo gallery, with a Back button. Reached via the
  // modal's "Read more" button — built for posts with lots of images.
  function openDetailPageForCurrentItem() {
    if (!currentItem) return;
    const { type, data } = currentItem;
    if (type === "article") openArticleDetailPage(data);
    else openProjectDetailPage(data);
  }
  function openArticleDetailPage(a) {
    openDetailPage({
      eyebrow: a.category, title: a.title, meta: a.article_date || "", cover: a.image_url,
      contentHtml: textToParagraphs(a.content) || `<p>${a.excerpt || ""}</p>`,
      images: Array.isArray(a.images) ? a.images : [], link: a.link,
    });
  }
  function openProjectDetailPage(p) {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    openDetailPage({
      eyebrow: p.category, title: p.title, meta: tags.join(" · "), cover: p.image_url,
      contentHtml: textToParagraphs(p.content) || `<p>${p.description || ""}</p>`,
      images: Array.isArray(p.images) ? p.images : [], link: p.link,
    });
  }
  function openDetailPage({ eyebrow, title, meta, cover, contentHtml, images, link }) {
    $("detailPageEyebrow").textContent = eyebrow || "";
    $("detailPageTitle").textContent = title || "";
    $("detailPageMeta").textContent = meta || "";
    $("detailPageMedia").style.display = cover ? "block" : "none";
    $("detailPageMedia").innerHTML = cover ? `<img src="${cover}" alt="${title || ""}">` : "";
    $("detailPageContent").innerHTML = contentHtml || `<p>More detail coming soon.</p>`;
    $("detailPageGallery").innerHTML = (images && images.length)
      ? images.map(url => `<div class="detail-gallery-item"><img src="${url}" alt="${title || ""}" loading="lazy"></div>`).join("")
      : "";
    $("detailPageActions").innerHTML = (link && link !== "#")
      ? `<a class="btn ghost" href="${link}" target="_blank" rel="noopener">${ICON_EXTERNAL}View original / external link</a>`
      : "";
    $("detailPage").classList.add("open");
    document.body.style.overflow = "hidden";
    $("detailPage").scrollTop = 0;
  }
  function closeDetailPage() {
    $("detailPage").classList.remove("open");
    document.body.style.overflow = "";
  }
  $("detailBackBtn").addEventListener("click", closeDetailPage);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if ($("detailPage").classList.contains("open")) closeDetailPage();
    else closeModal();
  });

  // HERO
  $("heroBadgeText").textContent = profile.badge_text || "";
  $("heroName").innerHTML = (profile.name || "").replace(/\s(\S+)$/, ' <span class="grad">$1</span>');
  $("heroTagline").textContent = profile.tagline || "";
  $("heroMeta").innerHTML = `<span>${ICON_PIN}${profile.location || ""}</span><span>${ICON_MAIL}${profile.email || ""}</span><span>${ICON_BRIEFCASE}${profile.role || ""}</span>`;
  const heroImg = profile.hero_image || profile.photo;
  $("heroPhoto").classList.toggle("is-placeholder", !heroImg);
  if (heroImg) { $("heroPhoto").innerHTML = `<img src="${heroImg}" alt="${profile.name || ""}">`; }
  else { $("heroPhoto").innerHTML = `<span class="initials">${profile.initials || initials(profile.name)}</span>`; }

  // STATS
  $("statRow").innerHTML = stats.map(s => `
    <div class="stat-card"><div class="stat-num">${s.num}</div><div class="stat-label">${s.label}</div></div>
  `).join("");

  // PRESS STRIP (home)
  $("pressNames").innerHTML = companies.map(c => c.logo_url
    ? `<span class="press-chip has-logo"><img src="${c.logo_url}" alt="${c.name}"></span>`
    : `<span class="press-chip">${c.name}</span>`
  ).join("");

  // FEED — recent writing (home)
  $("homeFeed").innerHTML = articles.slice(0,3).map((a,i) => `
    <div class="feed-card ${i===0?'featured':''}" data-open-article="${a.id}">
      ${mediaHtml("feed-media", a.image_url, a.category, a.title)}
      <div class="feed-body">
        <h3>${a.title}</h3>
        <p>${a.excerpt || ""}</p>
        <div class="feed-meta">${a.article_date || ""}</div>
      </div>
    </div>
  `).join("") || `<div class="empty-state">No writing published yet.</div>`;

  // SPOTLIGHT — one featured project (home) — prefers the project marked
  // "Featured" in /admin, falls back to the first project if none is marked.
  (function(){
    const p = projects.find(x => x.is_featured) || projects[0];
    if(!p) { $("homeSpotlight").innerHTML = `<div class="empty-state">No project added yet.</div>`; return; }
    const tags = Array.isArray(p.tags) ? p.tags : [];
    $("homeSpotlight").innerHTML = `
      ${mediaHtml("spotlight-media", p.image_url, p.category, p.title)}
      <div class="spotlight-body">
        <span class="eyebrow">Featured Project</span>
        <h3>${p.title}</h3>
        <p>${p.description || ""}</p>
        <div class="card-tags">${tags.map(t=>`<span>${t}</span>`).join("")}</div>
        <div style="margin-top:8px;"><button class="btn primary" data-open-project="${p.id}">View details</button></div>
      </div>
    `;
  })();

  // QUOTE (home) — auto-rotates through every testimonial if there's more than one.
  (function(){
    if (!testimonials.length) { $("homeQuote").innerHTML = ""; return; }
    let idx = 0;
    function renderQuote(){
      const t = testimonials[idx];
      $("homeQuote").innerHTML = `
        <div class="quote-inner">
          <blockquote>"${t.quote}"</blockquote>
          <cite>${t.name} — ${t.role || ""}</cite>
        </div>
        ${testimonials.length > 1 ? `<div class="quote-dots">${testimonials.map((_,i)=>`<span class="quote-dot ${i===idx?'active':''}"></span>`).join("")}</div>` : ""}
      `;
    }
    renderQuote();
    if (testimonials.length > 1) {
      setInterval(() => {
        const inner = $("homeQuote").querySelector(".quote-inner");
        if (inner) inner.classList.add("fade-out");
        setTimeout(() => {
          idx = (idx + 1) % testimonials.length;
          renderQuote();
        }, 300);
      }, 5000);
    }
  })();

  // NEWSLETTER (home)
  $("newsletterTitle").textContent = profile.newsletter_title || "";
  $("newsletterText").textContent = profile.newsletter_text || "";

  // ABOUT
  const aboutImg = profile.about_photo || profile.photo || profile.hero_image;
  $("aboutPhoto").classList.toggle("is-placeholder", !aboutImg);
  if (aboutImg) { $("aboutPhoto").innerHTML = `<img src="${aboutImg}" alt="${profile.name || ""}">`; }
  else { $("aboutPhoto").innerHTML = `<span class="initials">${profile.initials || initials(profile.name)}</span>`; }
  const paragraphs = Array.isArray(about.paragraphs) ? about.paragraphs : [];
  $("aboutText").innerHTML = paragraphs.map(p=>`<p>${p}</p>`).join("");
  const tagList = (arr) => (Array.isArray(arr) ? arr : []).map(s=>`<span class="tag">${s}</span>`).join("");
  $("skillsTechnical").innerHTML = tagList(about.skills_technical);
  $("skillsManagement").innerHTML = tagList(about.skills_management);
  $("skillsTools").innerHTML = tagList(about.skills_tools);
  $("skillsCertifications").innerHTML = tagList(about.certifications);
  $("skillsLanguages").innerHTML = tagList(about.languages);

  // EXPERIENCE
  $("experienceTimeline").innerHTML = experience.map(e => {
    const bullets = Array.isArray(e.bullets) ? e.bullets : [];
    return `
    <div class="tl-item ${e.is_future ? 'future':''}">
      <div class="tl-dot"></div>
      <div class="tl-card">
        <div class="tl-head">
          <div class="tl-role">${e.role}<small>${e.company}</small></div>
          <div class="tl-date">${e.period}</div>
        </div>
        <div class="tl-desc">${e.description || ""}</div>
        ${bullets.length ? `<ul>${bullets.map(b=>`<li>${b}</li>`).join("")}</ul>` : ""}
      </div>
    </div>
  `; }).join("") || `<div class="empty-state">No experience added yet.</div>`;

  // COMPANIES
  $("companiesGrid").innerHTML = companies.map(c => `
    <div class="company-card">
      <div class="company-avatar${c.logo_url ? ' has-logo' : ''}">${c.logo_url ? `<img src="${c.logo_url}" alt="${c.name}">` : initials(c.name)}</div>
      <div><div class="name">${c.name}</div><div class="role">${c.role || ""}</div></div>
    </div>
  `).join("") || `<div class="empty-state">No companies added yet.</div>`;

  // PROJECTS + FILTER
  const categories = ["All", ...new Set(projects.map(p=>p.category).filter(Boolean))];
  let activeCategory = "All";
  function renderProjects(){
    const list = activeCategory === "All" ? projects : projects.filter(p=>p.category===activeCategory);
    $("projectGrid").innerHTML = list.map(p => {
      const tags = Array.isArray(p.tags) ? p.tags : [];
      return `
      <div class="card" data-open-project="${p.id}">
        ${mediaHtml("card-media", p.image_url, p.category, p.title)}
        <div class="card-body">
          <h3>${p.title}</h3>
          <p>${p.description || ""}</p>
          <div class="card-tags">${tags.map(t=>`<span>${t}</span>`).join("")}</div>
        </div>
      </div>
    `; }).join("") || `<div class="empty-state">No projects in this category yet.</div>`;
  }
  $("projectFilters").innerHTML = categories.map(c => `<button class="filter-btn ${c===activeCategory?'active':''}" data-cat="${c}">${c}</button>`).join("");
  $("projectFilters").addEventListener("click", (e)=>{
    const btn = e.target.closest(".filter-btn");
    if(!btn) return;
    activeCategory = btn.dataset.cat;
    $("projectFilters").querySelectorAll(".filter-btn").forEach(b=>b.classList.toggle("active", b===btn));
    renderProjects();
  });
  renderProjects();

  // ARTICLES
  $("articleList").innerHTML = articles.map(a => `
    <div class="article-item" data-open-article="${a.id}">
      ${a.image_url ? `<img class="article-thumb" src="${a.image_url}" alt="${a.title}" loading="lazy">` : ""}
      <div style="flex:1;min-width:0;"><span class="article-cat">${a.category || ""}</span>
        <div class="article-title">${a.title}</div>
        <div class="article-excerpt">${a.excerpt || ""}</div>
      </div>
      <div class="article-date">${a.article_date || ""}</div>
    </div>
  `).join("") || `<div class="empty-state">No writing published yet.</div>`;

  // TESTIMONIALS
  $("testiGrid").innerHTML = testimonials.map(t => `
    <div class="testi-card">
      <p>"${t.quote}"</p>
      <div class="testi-who"><div class="testi-avatar">${initials(t.name)}</div>
        <div><div class="testi-name">${t.name}</div><div class="testi-role">${t.role || ""}</div></div>
      </div>
    </div>
  `).join("") || `<div class="empty-state">No testimonials yet.</div>`;

  // CONTACT
  $("contactText").textContent = profile.contact_text || "";
  $("contactLinks").innerHTML = `
    <a class="primary" href="mailto:${profile.email || ""}">Send Email</a>
    ${profile.linkedin ? `<a href="${profile.linkedin}" target="_blank" rel="noopener">LinkedIn</a>` : ""}
    ${profile.phone ? `<a href="tel:${profile.phone}">${profile.phone}</a>` : ""}
  `;

  // FOOTER
  $("footerName").textContent = `© ${new Date().getFullYear()} ${profile.name || ""}`;
}

loadAll().catch(err => {
  console.error("Failed to load site content from Supabase:", err);
  document.body.innerHTML = `<div style="padding:60px;text-align:center;font-family:sans-serif;color:#68667e;">
    <h2 style="color:#151426;">Couldn't load site content</h2>
    <p>Check that assets/config.js has your Supabase URL and anon key, and that the schema has been run.</p>
    <p style="font-size:13px;">${(err && err.message) || err}</p>
  </div>`;
});
