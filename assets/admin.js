// =====================================================================
// ADMIN PANEL — auth + CRUD for every content table.
// =====================================================================
const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
const $ = (id) => document.getElementById(id);

const loginView = $("loginView");
const dashboardView = $("dashboardView");
const adminMain = $("adminMain");

/* ---------- helpers ---------- */
const linesToArray = (text) => (text || "").split("\n").map(s => s.trim()).filter(Boolean);
const arrayToLines = (arr) => (Array.isArray(arr) ? arr : []).join("\n");
const csvToArray = (text) => (text || "").split(",").map(s => s.trim()).filter(Boolean);
const arrayToCsv = (arr) => (Array.isArray(arr) ? arr : []).join(", ");
const esc = (s) => String(s ?? "").replace(/"/g, "&quot;");

function toast(msg) {
  const t = $("saveToast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- auth ---------- */
async function checkSession() {
  const { data } = await sb.auth.getSession();
  if (data.session) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginView.style.display = "flex";
  dashboardView.style.display = "none";
}
function showDashboard() {
  loginView.style.display = "none";
  dashboardView.style.display = "grid";
  goToSection("profile");
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  const errEl = $("loginError");
  errEl.classList.remove("show");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = error.message;
    errEl.classList.add("show");
    return;
  }
  showDashboard();
});

$("signOutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  showLogin();
});

sb.auth.onAuthStateChange((_event, session) => {
  if (!session) showLogin();
});

/* ---------- nav ---------- */
document.querySelectorAll(".admin-nav-btn[data-section]").forEach(btn => {
  btn.addEventListener("click", () => goToSection(btn.dataset.section));
});

function goToSection(section) {
  document.querySelectorAll(".admin-nav-btn[data-section]").forEach(b => b.classList.toggle("active", b.dataset.section === section));
  SECTIONS[section]();
}

/* =====================================================================
   SECTION RENDERERS
   ===================================================================== */
const SECTIONS = {
  profile: renderProfileSection,
  about: renderAboutSection,
  stats: () => renderListSection({
    table: "stats", title: "Stats", subtitle: "The four highlight numbers shown at the top of your homepage.",
    fields: [
      { key: "num", label: "Number / Value", type: "text", placeholder: "e.g. 8+" },
      { key: "label", label: "Label", type: "text", placeholder: "e.g. Years Experience" },
      { key: "sort_order", label: "Order", type: "number", placeholder: "1" },
    ],
    rowTitle: r => r.num, rowSubtitle: r => r.label,
  }),
  experience: () => renderListSection({
    table: "experience", title: "Experience", subtitle: "Your career timeline, most recent (or future goal) first.",
    fields: [
      { key: "role", label: "Role / Title", type: "text" },
      { key: "company", label: "Company", type: "text" },
      { key: "period", label: "Period", type: "text", placeholder: "e.g. Apr 2023 — Present" },
      { key: "description", label: "Short description", type: "textarea" },
      { key: "bullets", label: "Bullet points (one per line)", type: "lines" },
      { key: "is_future", label: "This is a future / aspirational goal", type: "checkbox" },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    rowTitle: r => r.role, rowSubtitle: r => `${r.company} · ${r.period}`,
  }),
  companies: () => renderListSection({
    table: "companies", title: "Companies & Clients", subtitle: "Where you've worked, and who you've worked for.",
    fields: [
      { key: "name", label: "Company name", type: "text" },
      { key: "role", label: "Your role / relationship", type: "text", placeholder: "e.g. Employer — Cost Estimator" },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    rowTitle: r => r.name, rowSubtitle: r => r.role,
  }),
  projects: () => renderListSection({
    table: "projects", title: "Projects", subtitle: "Your portfolio of work, shown with category filters.",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "category", label: "Category", type: "text", placeholder: "e.g. EPC, Business, Management" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "tags", label: "Tags (comma-separated)", type: "csv" },
      { key: "link", label: "Link (optional)", type: "text", placeholder: "https://..." },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    rowTitle: r => r.title, rowSubtitle: r => r.category,
  }),
  articles: () => renderListSection({
    table: "articles", title: "Writing / Knowledge Sharing", subtitle: "Articles and notes shown on your Writing tab.",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "article_date", label: "Date label", type: "text", placeholder: "e.g. Aug 2026" },
      { key: "link", label: "Link (optional)", type: "text", placeholder: "https://..." },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    rowTitle: r => r.title, rowSubtitle: r => `${r.category || ""} · ${r.article_date || ""}`,
  }),
  testimonials: () => renderListSection({
    table: "testimonials", title: "Testimonials", subtitle: "Quotes from colleagues and clients.",
    fields: [
      { key: "quote", label: "Quote", type: "textarea" },
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role / Company", type: "text" },
      { key: "sort_order", label: "Order", type: "number" },
    ],
    rowTitle: r => r.name, rowSubtitle: r => r.role,
  }),
};

/* ---------- PROFILE (singleton) ---------- */
async function renderProfileSection() {
  adminMain.innerHTML = `<div class="admin-header"><div><h2>Profile</h2><p>Your name, headline, and contact details shown across the site.</p></div></div><div class="admin-card" id="profileForm">Loading…</div>`;
  const { data, error } = await sb.from("profile").select("*").eq("id", 1).single();
  if (error) { $("profileForm").innerHTML = `<div class="empty-state">${esc(error.message)}</div>`; return; }
  const p = data || {};
  $("profileForm").innerHTML = `
    <div class="two-col">
      <div class="field"><label>Full name</label><input id="f_name" value="${esc(p.name)}"></div>
      <div class="field"><label>Initials (for photo placeholder)</label><input id="f_initials" value="${esc(p.initials)}"></div>
    </div>
    <div class="field"><label>Role / headline</label><input id="f_role" value="${esc(p.role)}"></div>
    <div class="field"><label>Badge text (small pill above your name)</label><input id="f_badge_text" value="${esc(p.badge_text)}"></div>
    <div class="field"><label>Tagline</label><textarea id="f_tagline">${esc(p.tagline)}</textarea></div>
    <div class="two-col">
      <div class="field"><label>Location</label><input id="f_location" value="${esc(p.location)}"></div>
      <div class="field"><label>Résumé / CV link</label><input id="f_resume_url" value="${esc(p.resume_url)}"></div>
    </div>
    <div class="two-col">
      <div class="field"><label>Email</label><input id="f_email" value="${esc(p.email)}"></div>
      <div class="field"><label>Phone</label><input id="f_phone" value="${esc(p.phone)}"></div>
    </div>
    <div class="field"><label>LinkedIn URL</label><input id="f_linkedin" value="${esc(p.linkedin)}"></div>
    <div class="field"><label>Photo URL (optional)</label><input id="f_photo" value="${esc(p.photo)}"><div class="hint">Small avatar image, if you use one.</div></div>
    <div class="field"><label>Hero background image URL (optional)</label><input id="f_hero_image" value="${esc(p.hero_image)}"><div class="hint">Shown behind/beside your name on the homepage.</div></div>
    <hr style="border:none;border-top:1px solid var(--line);margin:20px 0;">
    <div class="field"><label>Contact section text</label><textarea id="f_contact_text">${esc(p.contact_text)}</textarea></div>
    <div class="field"><label>Newsletter title</label><input id="f_newsletter_title" value="${esc(p.newsletter_title)}"></div>
    <div class="field"><label>Newsletter text</label><textarea id="f_newsletter_text">${esc(p.newsletter_text)}</textarea></div>
    <div class="form-actions"><button class="btn primary" id="saveProfileBtn">Save Profile</button></div>
  `;
  $("saveProfileBtn").addEventListener("click", async () => {
    const payload = {
      name: $("f_name").value, initials: $("f_initials").value, role: $("f_role").value,
      badge_text: $("f_badge_text").value, tagline: $("f_tagline").value, location: $("f_location").value,
      resume_url: $("f_resume_url").value, email: $("f_email").value, phone: $("f_phone").value,
      linkedin: $("f_linkedin").value, photo: $("f_photo").value, hero_image: $("f_hero_image").value,
      contact_text: $("f_contact_text").value, newsletter_title: $("f_newsletter_title").value,
      newsletter_text: $("f_newsletter_text").value,
    };
    const { error } = await sb.from("profile").update(payload).eq("id", 1);
    if (error) { alert("Error saving: " + error.message); return; }
    toast("Profile saved");
  });
}

/* ---------- ABOUT (singleton) ---------- */
async function renderAboutSection() {
  adminMain.innerHTML = `<div class="admin-header"><div><h2>About & Skills</h2><p>Your bio and the skill/certification/language tags shown on the About tab.</p></div></div><div class="admin-card" id="aboutForm">Loading…</div>`;
  const { data, error } = await sb.from("about").select("*").eq("id", 1).single();
  if (error) { $("aboutForm").innerHTML = `<div class="empty-state">${esc(error.message)}</div>`; return; }
  const a = data || {};
  $("aboutForm").innerHTML = `
    <div class="field"><label>Bio paragraphs (one paragraph per line)</label><textarea id="f_paragraphs" style="min-height:140px;">${esc(arrayToLines(a.paragraphs))}</textarea></div>
    <div class="field"><label>Technical / EPC skills (one per line)</label><textarea id="f_skills_technical">${esc(arrayToLines(a.skills_technical))}</textarea></div>
    <div class="field"><label>Leadership & Management skills (one per line)</label><textarea id="f_skills_management">${esc(arrayToLines(a.skills_management))}</textarea></div>
    <div class="field"><label>Top skills (one per line)</label><textarea id="f_skills_tools">${esc(arrayToLines(a.skills_tools))}</textarea></div>
    <div class="field"><label>Certifications (one per line)</label><textarea id="f_certifications">${esc(arrayToLines(a.certifications))}</textarea></div>
    <div class="field"><label>Languages (one per line)</label><textarea id="f_languages">${esc(arrayToLines(a.languages))}</textarea></div>
    <div class="form-actions"><button class="btn primary" id="saveAboutBtn">Save About</button></div>
  `;
  $("saveAboutBtn").addEventListener("click", async () => {
    const payload = {
      paragraphs: linesToArray($("f_paragraphs").value),
      skills_technical: linesToArray($("f_skills_technical").value),
      skills_management: linesToArray($("f_skills_management").value),
      skills_tools: linesToArray($("f_skills_tools").value),
      certifications: linesToArray($("f_certifications").value),
      languages: linesToArray($("f_languages").value),
    };
    const { error } = await sb.from("about").update(payload).eq("id", 1);
    if (error) { alert("Error saving: " + error.message); return; }
    toast("About section saved");
  });
}

/* ---------- generic LIST + FORM for repeatable content ---------- */
async function renderListSection({ table, title, subtitle, fields, rowTitle, rowSubtitle }) {
  adminMain.innerHTML = `
    <div class="admin-header">
      <div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div>
      <button class="btn primary add-btn" id="addNewBtn">+ Add new</button>
    </div>
    <div class="admin-card" id="listArea">Loading…</div>
    <div id="formArea"></div>
  `;

  async function loadList() {
    const { data, error } = await sb.from(table).select("*").order("sort_order");
    const listArea = $("listArea");
    if (error) { listArea.innerHTML = `<div class="empty-state">${esc(error.message)}</div>`; return; }
    if (!data || !data.length) { listArea.innerHTML = `<div class="empty-state">Nothing here yet — click "Add new" to create the first one.</div>`; return; }
    listArea.innerHTML = data.map(row => `
      <div class="admin-row">
        <div class="info">
          <div class="title">${esc(rowTitle(row))}</div>
          <div class="sub">${esc(rowSubtitle(row) || "")}</div>
        </div>
        <div class="actions">
          <button class="icon-btn" data-edit="${row.id}">Edit</button>
          <button class="icon-btn danger" data-delete="${row.id}">Delete</button>
        </div>
      </div>
    `).join("");
    listArea.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => {
        const row = data.find(r => String(r.id) === btn.dataset.edit);
        showForm(row);
      });
    });
    listArea.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this item? This can't be undone.")) return;
        const { error } = await sb.from(table).delete().eq("id", btn.dataset.delete);
        if (error) { alert("Error deleting: " + error.message); return; }
        toast("Deleted");
        loadList();
      });
    });
  }

  function fieldHtml(f, value) {
    const id = `ff_${f.key}`;
    if (f.type === "textarea") return `<div class="field"><label>${esc(f.label)}</label><textarea id="${id}">${esc(value ?? "")}</textarea></div>`;
    if (f.type === "lines") return `<div class="field"><label>${esc(f.label)}</label><textarea id="${id}">${esc(arrayToLines(value))}</textarea><div class="hint">One item per line.</div></div>`;
    if (f.type === "csv") return `<div class="field"><label>${esc(f.label)}</label><input id="${id}" value="${esc(arrayToCsv(value))}"><div class="hint">Separate with commas.</div></div>`;
    if (f.type === "checkbox") return `<div class="field"><label><input type="checkbox" id="${id}" ${value ? "checked" : ""} style="width:auto;display:inline-block;margin-right:8px;"> ${esc(f.label)}</label></div>`;
    if (f.type === "number") return `<div class="field"><label>${esc(f.label)}</label><input type="number" id="${id}" value="${esc(value ?? 0)}"></div>`;
    return `<div class="field"><label>${esc(f.label)}</label><input id="${id}" value="${esc(value ?? "")}" placeholder="${esc(f.placeholder || "")}"></div>`;
  }

  function readField(f) {
    const el = $(`ff_${f.key}`);
    if (f.type === "lines") return linesToArray(el.value);
    if (f.type === "csv") return csvToArray(el.value);
    if (f.type === "checkbox") return el.checked;
    if (f.type === "number") return Number(el.value) || 0;
    return el.value;
  }

  function showForm(row) {
    const isEdit = !!row;
    $("formArea").innerHTML = `
      <div class="admin-card">
        <div class="admin-header" style="margin-bottom:16px;">
          <h2 style="font-size:17px;">${isEdit ? "Edit" : "Add new"}</h2>
        </div>
        ${fields.map(f => fieldHtml(f, row ? row[f.key] : (f.type === "checkbox" ? false : ""))).join("")}
        <div class="form-actions">
          <button class="btn primary" id="submitFormBtn">${isEdit ? "Save changes" : "Add"}</button>
          <button class="btn ghost" id="cancelFormBtn">Cancel</button>
        </div>
      </div>
    `;
    $("cancelFormBtn").addEventListener("click", () => { $("formArea").innerHTML = ""; });
    $("submitFormBtn").addEventListener("click", async () => {
      const payload = {};
      fields.forEach(f => { payload[f.key] = readField(f); });
      let error;
      if (isEdit) {
        ({ error } = await sb.from(table).update(payload).eq("id", row.id));
      } else {
        ({ error } = await sb.from(table).insert(payload));
      }
      if (error) { alert("Error saving: " + error.message); return; }
      toast(isEdit ? "Saved" : "Added");
      $("formArea").innerHTML = "";
      loadList();
    });
  }

  $("addNewBtn").addEventListener("click", () => showForm(null));
  loadList();
}

/* ---------- boot ---------- */
checkSession();
