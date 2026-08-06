// =====================================================================
// PUBLIC SITE — fetches content from Supabase and renders it.
// No editing needed here for day-to-day content changes — use /admin.
// =====================================================================
const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);
const initials = (name) => (name || "").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
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
    { id: "companies", label: "Companies" },
    { id: "projects", label: "Work" },
    { id: "articles", label: "Writing" },
    { id: "contact", label: "Contact" },
  ];
  $("tabs").innerHTML = tabs.map((t,i) => `<button class="tab-btn ${i===0?'active':''}" data-tab="${t.id}">${t.label}</button>`).join("");
  function goTo(id){
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

  // DETAIL MODAL — expands a project/article to a full read view on click.
  function openModal({ eyebrow, title, meta, image, contentHtml, link }) {
    $("modalEyebrow").textContent = eyebrow || "";
    $("modalTitle").textContent = title || "";
    $("modalMeta").textContent = meta || "";
    $("modalMedia").style.display = image ? "block" : "none";
    $("modalMedia").innerHTML = image ? `<img src="${image}" alt="${title || ""}">` : "";
    $("modalContent").innerHTML = contentHtml || `<p>More detail coming soon.</p>`;
    $("modalActions").innerHTML = (link && link !== "#")
      ? `<a class="btn ghost" href="${link}" target="_blank" rel="noopener">View original / external link ↗</a>`
      : "";
    $("detailModal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("detailModal").classList.remove("open");
    document.body.style.overflow = "";
  }
  function openArticleModal(a) {
    openModal({
      eyebrow: a.category, title: a.title, meta: a.article_date || "", image: a.image_url,
      contentHtml: textToParagraphs(a.content) || `<p>${a.excerpt || ""}</p>`,
      link: a.link,
    });
  }
  function openProjectModal(p) {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    openModal({
      eyebrow: p.category, title: p.title, meta: tags.join(" · "), image: p.image_url,
      contentHtml: textToParagraphs(p.content) || `<p>${p.description || ""}</p>`,
      link: p.link,
    });
  }
  $("modalClose").addEventListener("click", closeModal);
  $("detailModal").addEventListener("click", (e) => { if (e.target.id === "detailModal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // HERO
  $("heroBadgeText").textContent = profile.badge_text || "";
  $("heroName").innerHTML = (profile.name || "").replace(/\s(\S+)$/, ' <span class="grad">$1</span>');
  $("heroTagline").textContent = profile.tagline || "";
  $("heroMeta").innerHTML = `<span>📍 ${profile.location || ""}</span><span>✉️ ${profile.email || ""}</span><span>💼 ${profile.role || ""}</span>`;
  const heroImg = profile.hero_image || profile.photo;
  if (heroImg) { $("heroPhoto").innerHTML = `<img src="${heroImg}" alt="${profile.name || ""}">`; }
  else { const initEl = $("heroPhoto").querySelector(".initials"); if (initEl) initEl.textContent = profile.initials || initials(profile.name); }

  // STATS
  $("statRow").innerHTML = stats.map(s => `
    <div class="stat-card"><div class="stat-num">${s.num}</div><div class="stat-label">${s.label}</div></div>
  `).join("");

  // PRESS STRIP (home)
  $("pressNames").innerHTML = companies.map(c => `<span class="press-chip">${c.name}</span>`).join("");

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

  // SPOTLIGHT — one featured project (home)
  (function(){
    const p = projects[0];
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

  // QUOTE (home)
  (function(){
    const t = testimonials[0];
    if(!t) { $("homeQuote").innerHTML = ""; return; }
    $("homeQuote").innerHTML = `<blockquote>"${t.quote}"</blockquote><cite>${t.name} — ${t.role || ""}</cite>`;
  })();

  // NEWSLETTER (home)
  $("newsletterTitle").textContent = profile.newsletter_title || "";
  $("newsletterText").textContent = profile.newsletter_text || "";

  // ABOUT
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
      <div class="company-avatar">${initials(c.name)}</div>
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
