-- =====================================================================
-- Personal Brand Website — Supabase schema
-- Run this in Supabase Dashboard > SQL Editor > New query > Run
-- =====================================================================

-- ---------- PROFILE (singleton row) ----------
create table if not exists profile (
  id int primary key default 1,
  name text not null default 'Galang Nur Aji Pamungkas',
  initials text default 'GP',
  photo text default '',
  hero_image text default '',
  role text default '',
  badge_text text default '',
  tagline text default '',
  location text default '',
  email text default '',
  phone text default '',
  linkedin text default '',
  resume_url text default '#',
  contact_text text default '',
  newsletter_title text default '',
  newsletter_text text default '',
  constraint single_row check (id = 1)
);

-- ---------- ABOUT (singleton row, arrays as jsonb) ----------
create table if not exists about (
  id int primary key default 1,
  paragraphs jsonb default '[]',
  skills_technical jsonb default '[]',
  skills_management jsonb default '[]',
  skills_tools jsonb default '[]',
  certifications jsonb default '[]',
  languages jsonb default '[]',
  constraint single_row check (id = 1)
);

-- ---------- STATS ----------
create table if not exists stats (
  id bigint generated always as identity primary key,
  num text not null,
  label text not null,
  sort_order int default 0
);

-- ---------- EXPERIENCE ----------
create table if not exists experience (
  id bigint generated always as identity primary key,
  role text not null,
  company text not null,
  period text not null,
  description text default '',
  bullets jsonb default '[]',
  is_future boolean default false,
  sort_order int default 0
);

-- ---------- COMPANIES ----------
create table if not exists companies (
  id bigint generated always as identity primary key,
  name text not null,
  role text default '',
  sort_order int default 0
);

-- ---------- PROJECTS ----------
create table if not exists projects (
  id bigint generated always as identity primary key,
  title text not null,
  category text default 'EPC',
  description text default '',
  tags jsonb default '[]',
  link text default '#',
  sort_order int default 0
);

-- ---------- ARTICLES ----------
create table if not exists articles (
  id bigint generated always as identity primary key,
  title text not null,
  category text default '',
  excerpt text default '',
  article_date text default '',
  link text default '#',
  sort_order int default 0
);

-- ---------- TESTIMONIALS ----------
create table if not exists testimonials (
  id bigint generated always as identity primary key,
  quote text not null,
  name text not null,
  role text default '',
  sort_order int default 0
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- Public (anon) can READ everything. Only logged-in users can write.
-- Since public sign-up should be disabled in Supabase Auth settings
-- (see README), "authenticated" effectively means just you.
-- =====================================================================
alter table profile enable row level security;
alter table about enable row level security;
alter table stats enable row level security;
alter table experience enable row level security;
alter table companies enable row level security;
alter table projects enable row level security;
alter table articles enable row level security;
alter table testimonials enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['profile','about','stats','experience','companies','projects','articles','testimonials'])
  loop
    execute format('create policy "public_read_%1$s" on %1$s for select using (true);', t);
    execute format('create policy "auth_write_%1$s" on %1$s for insert with check (auth.role() = ''authenticated'');', t);
    execute format('create policy "auth_update_%1$s" on %1$s for update using (auth.role() = ''authenticated'');', t);
    execute format('create policy "auth_delete_%1$s" on %1$s for delete using (auth.role() = ''authenticated'');', t);
  end loop;
end $$;

-- =====================================================================
-- SEED DATA — Galang's real profile from LinkedIn
-- =====================================================================
insert into profile (id, name, initials, role, badge_text, tagline, location, email, phone, linkedin, resume_url, contact_text, newsletter_title, newsletter_text)
values (
  1,
  'Galang Nur Aji Pamungkas',
  'GP',
  'Cost Estimating Coordinator at PT Wijaya Karya (Persero) Tbk',
  '8+ Years in EPCC, Energy & Oil and Gas Projects',
  'I lead tender cost estimation and financial analysis for EPCC, Energy, and Oil & Gas projects — and I''m building toward broader project and business leadership.',
  'Jakarta, Indonesia',
  'galangnuraji@gmail.com',
  '+62 813-2754-2734',
  'https://www.linkedin.com/in/galangnuraji',
  '#',
  'Open to new opportunities, project collaboration, or a conversation about EPCC cost estimation and project management.',
  'A short note, now and then',
  'Occasional thoughts on EPC work, project leadership, and the move into management.'
) on conflict (id) do update set
  name = excluded.name, role = excluded.role, badge_text = excluded.badge_text,
  tagline = excluded.tagline, location = excluded.location, email = excluded.email,
  phone = excluded.phone, linkedin = excluded.linkedin, contact_text = excluded.contact_text,
  newsletter_title = excluded.newsletter_title, newsletter_text = excluded.newsletter_text;

insert into about (id, paragraphs, skills_technical, skills_management, skills_tools, certifications, languages)
values (
  1,
  '["I''m a Cost Estimating Coordinator at PT Wijaya Karya (Persero) Tbk, with more than five years of focused experience in tender cost estimation, scope evaluation, and cost breakdown for construction and EPC projects.", "My role centers on coordinating with vendors, clients, and stakeholders to ensure accurate, competitive tender submissions that support the organization''s strategic bidding objectives — working across cross-functional teams to deliver data-driven results.", "Alongside my technical work, I''m building toward broader project and business leadership — and I use this site to share what I''ve learned about EPCC cost estimation, tendering, and the path from engineer to manager."]',
  '["Tender Cost Estimation", "Cost Breakdown & RAB", "Scope Evaluation & BOQ", "Material Take-off", "Work Breakdown Structure (WBS)", "Quality Assurance & Quality Control"]',
  '["Team Leadership", "Vendor Negotiation", "Client & Stakeholder Liaison", "Contract & Risk Management", "Value Engineering", "Strategic Bidding"]',
  '["Construction Project Management", "Financial Analysis", "Web Development"]',
  '["Project Management Foundations", "Microsoft Teams Enablement Training", "Strategic Project Risk Management", "Building Business Relationships", "CFI Corporate Finance Foundations Professional Certificate"]',
  '["Bahasa Indonesia", "English", "Javanese"]'
) on conflict (id) do update set
  paragraphs = excluded.paragraphs, skills_technical = excluded.skills_technical,
  skills_management = excluded.skills_management, skills_tools = excluded.skills_tools,
  certifications = excluded.certifications, languages = excluded.languages;

insert into stats (num, label, sort_order) values
  ('8+', 'Years Experience', 1),
  ('5', 'Certifications', 2),
  ('3', 'Languages Spoken', 3),
  ('EPCC', 'Energy & Oil and Gas Focus', 4);

insert into experience (role, company, period, description, bullets, is_future, sort_order) values
  ('Project Manager (Target)', 'Next Career Step', 'Ahead',
   'Focused on growing into a management role that combines EPCC technical depth with strategic business leadership.',
   '["Pursuing a PMP / project management certification", "Building business acumen and leadership capability"]', true, 1),
  ('Cost Estimating Coordinator', 'PT Wijaya Karya (Persero) Tbk', 'Apr 2023 — Present',
   'Leading a team of estimators in preparing tender cost estimations and RAB for EPC, Energy, and Oil & Gas projects in Jakarta.',
   '["Lead and guide a team of estimators in preparing tender cost estimations and RAB", "Perform cost breakdown, scope evaluation, and material take-offs for tender submissions", "Coordinate with vendors to obtain quotations and negotiate competitive pricing and terms", "Liaise with EPC and Oil & Gas clients to clarify tender requirements and commercial conditions", "Ensure accuracy and competitiveness of submitted tenders to support strategic bidding decisions"]',
   false, 2),
  ('Cost Estimator', 'PT Wijaya Karya (Persero) Tbk', 'May 2020 — Apr 2023',
   'Prepared detailed cost estimates and managed budgets across the full construction project lifecycle in Jakarta.',
   '["Prepared detailed cost estimates and managed project budgets, including materials, labor, and equipment", "Reviewed scope of work, bills of quantities, and specifications; evaluated and compared contractor/supplier bids", "Defined Work Breakdown Structures and evaluated preliminary master schedules and productivity", "Reviewed contracts and managed contractual obligations, variations, claims, and disputes", "Identified value engineering opportunities and risk mitigation strategies to control cost and schedule"]',
   false, 3),
  ('Quality Assurance and Quality Control Engineer', 'PT Wijaya Karya (Persero) Tbk', 'Jul 2018 — May 2020',
   'Developed inspection standards and ensured construction quality on a power plant project in East Kalimantan.',
   '["Developed inspection, testing, and evaluation standards per local/international requirements", "Resolved product quality issues across suppliers, production, and client teams", "Raised Requests for Inspection and maintained inspection and quality management documentation", "Managed nonconformance reporting, punch listing, and close-out", "Prepared final hand-over documentation for power plant buildings and utilities"]',
   false, 4),
  ('Management Trainee', 'PT Wijaya Karya (Persero) Tbk', 'Jan 2018 — Jul 2018',
   'Recognized as one of the best employees in the WIKA 77 & 78 Management Trainee batch, Greater Jakarta Area.',
   '["Published research: \"The Use of Cement Type I & Silica Fume as an Alternate of Cement Type V on Coal Fired Steam Power Plant Construction\""]',
   false, 5),
  ('Student Internship', 'PT Nusa Konstruksi Enjiniring Tbk', 'Jul 2016 — Sep 2016',
   'Supported civil engineering teams in Rawa Buaya, West Jakarta with shop drawings, bar bending schedules, and method statements.',
   '[]', false, 6);

insert into companies (name, role, sort_order) values
  ('PT Wijaya Karya (Persero) Tbk', 'Employer — Cost Estimating Coordinator', 1),
  ('PT Nusa Konstruksi Enjiniring Tbk', 'Employer — Civil Engineering Internship', 2),
  ('Universitas Sebelas Maret', 'Alma Mater — B.Eng. Civil Engineering', 3);

insert into projects (title, category, description, tags, link, sort_order) values
  ('EPC Tender Cost Estimation — Oil & Gas Facility', 'EPC', 'Led cost breakdown, scope evaluation, and vendor coordination to prepare a competitive EPC tender submission in the oil & gas sector.', '["EPC", "Cost Estimation", "Oil & Gas"]', '#', 1),
  ('RAB & Estimation Workflow Improvement', 'Business', 'Streamlined the tender cost estimation and RAB process to improve turnaround time and accuracy across the estimating team.', '["Process Improvement", "Cost Management"]', '#', 2),
  ('Power Plant Quality Assurance Program', 'Management', 'Set up inspection standards and quality documentation processes for a coal-fired steam power plant construction project.', '["QA/QC", "Project Control"]', '#', 3);

insert into articles (title, category, excerpt, article_date, link, sort_order) values
  ('Five Lessons From My First EPC Project', 'EPC Insights', 'The things you don''t learn in a classroom but that matter the moment you''re on site.', 'Jul 2026', '#', 1),
  ('From Engineer to Project Manager: What Actually Changes', 'Career', 'Reflections on the shift in mindset that comes with taking on managerial responsibility.', 'Jun 2026', '#', 2),
  ('How to Build an Accurate RAB for an EPCC Project', 'Knowledge Sharing', 'A practical guide to preparing a cost estimate from a client''s BOQ.', 'May 2026', '#', 3);

insert into testimonials (quote, name, role, sort_order) values
  ('A genuinely professional working relationship — detail-oriented and always on time with every project deliverable.', 'Colleague Name', 'Project Director, Company X', 1),
  ('Strong technical ability paired with clear communication to every stakeholder involved.', 'Client Name', 'Site Manager, Client Y', 2);
