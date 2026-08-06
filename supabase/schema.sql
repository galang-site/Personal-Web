-- =====================================================================
-- Personal Brand Website — Supabase schema
-- Run this in Supabase Dashboard > SQL Editor > New query > Run
--
-- SAFE TO RE-RUN: every statement below is idempotent — you can paste
-- and run this whole file again anytime (e.g. after Claude adds a new
-- column or feature) without errors and without duplicating your data
-- or wiping edits you've already made through /admin.
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
  content text default '',
  tags jsonb default '[]',
  link text default '#',
  image_url text default '',
  sort_order int default 0
);

-- ---------- ARTICLES ----------
create table if not exists articles (
  id bigint generated always as identity primary key,
  title text not null,
  category text default '',
  excerpt text default '',
  content text default '',
  article_date text default '',
  link text default '#',
  image_url text default '',
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

-- ---------- Backfill columns for projects/tables created before this update ----------
alter table projects add column if not exists image_url text default '';
alter table articles add column if not exists image_url text default '';
alter table projects add column if not exists content text default '';
alter table articles add column if not exists content text default '';

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
    execute format('drop policy if exists "public_read_%1$s" on %1$s;', t);
    execute format('drop policy if exists "auth_write_%1$s" on %1$s;', t);
    execute format('drop policy if exists "auth_update_%1$s" on %1$s;', t);
    execute format('drop policy if exists "auth_delete_%1$s" on %1$s;', t);
    execute format('create policy "public_read_%1$s" on %1$s for select using (true);', t);
    execute format('create policy "auth_write_%1$s" on %1$s for insert with check (auth.role() = ''authenticated'');', t);
    execute format('create policy "auth_update_%1$s" on %1$s for update using (auth.role() = ''authenticated'');', t);
    execute format('create policy "auth_delete_%1$s" on %1$s for delete using (auth.role() = ''authenticated'');', t);
  end loop;
end $$;

-- =====================================================================
-- STORAGE — a public bucket for project/article images, uploaded from
-- the /admin panel. Public can view images; only logged-in users can
-- upload/replace/delete them.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_site_images" on storage.objects;
drop policy if exists "auth_upload_site_images" on storage.objects;
drop policy if exists "auth_update_site_images" on storage.objects;
drop policy if exists "auth_delete_site_images" on storage.objects;

create policy "public_read_site_images" on storage.objects
  for select using (bucket_id = 'site-images');
create policy "auth_upload_site_images" on storage.objects
  for insert with check (bucket_id = 'site-images' and auth.role() = 'authenticated');
create policy "auth_update_site_images" on storage.objects
  for update using (bucket_id = 'site-images' and auth.role() = 'authenticated');
create policy "auth_delete_site_images" on storage.objects
  for delete using (bucket_id = 'site-images' and auth.role() = 'authenticated');

-- =====================================================================
-- SEED DATA — Galang's real profile from LinkedIn.
-- Profile/About use upsert (safe to re-run, always reflects this file).
-- The list tables only seed if empty, so re-running this script never
-- duplicates rows or overwrites edits you've made via /admin.
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
) on conflict (id) do nothing;

insert into about (id, paragraphs, skills_technical, skills_management, skills_tools, certifications, languages)
values (
  1,
  '["I''m a Cost Estimating Coordinator at PT Wijaya Karya (Persero) Tbk, with more than five years of focused experience in tender cost estimation, scope evaluation, and cost breakdown for construction and EPC projects.", "My role centers on coordinating with vendors, clients, and stakeholders to ensure accurate, competitive tender submissions that support the organization''s strategic bidding objectives — working across cross-functional teams to deliver data-driven results.", "Alongside my technical work, I''m building toward broader project and business leadership — and I use this site to share what I''ve learned about EPCC cost estimation, tendering, and the path from engineer to manager."]',
  '["Tender Cost Estimation", "Cost Breakdown & RAB", "Scope Evaluation & BOQ", "Material Take-off", "Work Breakdown Structure (WBS)", "Quality Assurance & Quality Control"]',
  '["Team Leadership", "Vendor Negotiation", "Client & Stakeholder Liaison", "Contract & Risk Management", "Value Engineering", "Strategic Bidding"]',
  '["Construction Project Management", "Financial Analysis", "Web Development"]',
  '["Project Management Foundations", "Microsoft Teams Enablement Training", "Strategic Project Risk Management", "Building Business Relationships", "CFI Corporate Finance Foundations Professional Certificate"]',
  '["Bahasa Indonesia", "English", "Javanese"]'
) on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from stats) then
    insert into stats (num, label, sort_order) values
      ('8+', 'Years Experience', 1),
      ('5', 'Certifications', 2),
      ('3', 'Languages Spoken', 3),
      ('EPCC', 'Energy & Oil and Gas Focus', 4);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from experience) then
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
  end if;
end $$;

do $$ begin
  if not exists (select 1 from companies) then
    insert into companies (name, role, sort_order) values
      ('PT Wijaya Karya (Persero) Tbk', 'Employer — Cost Estimating Coordinator', 1),
      ('PT Nusa Konstruksi Enjiniring Tbk', 'Employer — Civil Engineering Internship', 2),
      ('Universitas Sebelas Maret', 'Alma Mater — B.Eng. Civil Engineering', 3);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from projects) then
    insert into projects (title, category, description, content, tags, link, sort_order) values
      ('EPC Tender Cost Estimation — Oil & Gas Facility', 'EPC', 'Led cost breakdown, scope evaluation, and vendor coordination to prepare a competitive EPC tender submission in the oil & gas sector.',
       'This project involved preparing a full tender cost estimate for an oil & gas facility under a tight submission deadline.

I led the cost breakdown process across civil, mechanical, and electrical scopes, working closely with the estimating team to make sure every line item was traceable back to the client''s bill of quantities.

A key part of the work was vendor coordination — collecting and comparing quotations, negotiating pricing and terms, and folding the results back into the overall tender price without losing sight of the schedule.

The submission was delivered on time and was competitive enough to move the company forward in the bidding process, which reinforced how much a disciplined, well-documented estimate matters in EPC tendering.',
       '["EPC", "Cost Estimation", "Oil & Gas"]', '#', 1),
      ('RAB & Estimation Workflow Improvement', 'Business', 'Streamlined the tender cost estimation and RAB process to improve turnaround time and accuracy across the estimating team.',
       'The estimating team was spending too much time on repetitive parts of the RAB (cost budget plan) process, and small inconsistencies were creeping into submissions under deadline pressure.

I mapped out the existing workflow end-to-end, identified where handoffs and rework were happening, and proposed a simplified process with clearer templates and checkpoints.

After rolling it out, turnaround time on RAB preparation improved noticeably, and the number of last-minute corrections dropped — freeing up the team to spend more time on the parts of estimation that actually need judgment, like vendor negotiation and risk assessment.',
       '["Process Improvement", "Cost Management"]', '#', 2),
      ('Power Plant Quality Assurance Program', 'Management', 'Set up inspection standards and quality documentation processes for a coal-fired steam power plant construction project.',
       'As QA/QC Engineer on a coal-fired steam power plant project in East Kalimantan, I was responsible for building out inspection, testing, and evaluation standards aligned with local and international requirements.

I worked across suppliers, the production team, and the client to resolve quality issues as they came up, and set up a structured system for raising Requests for Inspection and maintaining quality documentation.

Managing nonconformance reports and punch lists through to close-out was a major part of the role, and by the end of the project I prepared the final hand-over documentation for the power plant buildings and utilities — a strong grounding in how quality discipline holds a project together.',
       '["QA/QC", "Project Control"]', '#', 3);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from articles) then
    insert into articles (title, category, excerpt, content, article_date, link, sort_order) values
      ('Five Lessons From My First EPC Project', 'EPC Insights', 'The things you don''t learn in a classroom but that matter the moment you''re on site.',
       'When I joined my first EPC project, I thought the technical knowledge from my civil engineering degree would carry me most of the way. It helped, but it wasn''t the full picture.

The first lesson was how much EPC work depends on coordination, not just calculation. A cost estimate is only as good as the assumptions behind it, and those assumptions come from conversations with vendors, clients, and the field team — not from a spreadsheet alone.

The second was the value of documentation discipline. Every scope clarification, every price negotiation, every change needs a paper trail, because tender decisions get questioned months later and you need to be able to show your reasoning.

The third was learning to read a bill of quantities the way an experienced estimator does — not just totaling numbers, but spotting where scope is ambiguous or where risk is hiding.

The fourth was that deadlines in EPC tendering are rarely negotiable, so building buffer into your own personal workflow matters more than trying to be perfect.

And the fifth, maybe the most important: staying calm under pressure builds more credibility with a team than technical skill alone. People remember how you handled the crunch, not just whether the numbers were right.',
       'Jul 2026', '#', 1),
      ('From Engineer to Project Manager: What Actually Changes', 'Career', 'Reflections on the shift in mindset that comes with taking on managerial responsibility.',
       'Moving from an individual contributor role into leading a team of estimators changed more than my job title — it changed what "doing good work" actually means day to day.

As an engineer, success was mostly about the accuracy of my own output: a correct cost breakdown, a clean take-off, a well-supported estimate. As a coordinator, success became less about what I personally produced and more about whether the whole team was set up to produce good work — clear priorities, the right information at the right time, and enough context for people to make good judgment calls without me in the room.

The hardest adjustment was learning to let go of controlling every detail myself, while still being accountable for the outcome. That meant investing more time in reviewing and coaching, and less time doing the work directly — which felt uncomfortable at first, especially under deadline pressure when it''s tempting to just do it yourself.

I''m still early in this transition toward broader project and business leadership, but the biggest shift so far has been thinking in terms of the team''s capability, not just my own.',
       'Jun 2026', '#', 2),
      ('How to Build an Accurate RAB for an EPCC Project', 'Knowledge Sharing', 'A practical guide to preparing a cost estimate from a client''s BOQ.',
       'A Rencana Anggaran Biaya (RAB), or cost budget plan, is only as reliable as the process behind it. Here''s the approach I follow when building one from a client''s bill of quantities (BOQ).

Start by reading the BOQ line by line against the drawings and specifications — not just trusting the descriptions. Ambiguous scope is where estimates go wrong, so flag anything unclear early and get it clarified before pricing it.

Break the work down into a clear Work Breakdown Structure so every cost component — materials, labor, equipment, subcontracted work — has a home. This also makes the estimate easier to review and defend later.

Collect vendor quotations for every major material and equipment item, and don''t rely on outdated price lists. Prices move, and a stale reference number in a competitive tender can cost you the bid or your margin.

Build in a clear contingency and escalation allowance based on project duration and market volatility, rather than a flat arbitrary percentage — this is where experience and judgment matter most.

Finally, cross-check the total against a sanity benchmark — cost per unit area, cost per capacity, or comparable past projects — before it goes out the door. A RAB that "looks right" on that final check has usually caught most of its own mistakes.',
       'May 2026', '#', 3);
  end if;
end $$;

-- Backfill full write-ups for the placeholder rows above if they were
-- seeded before the "content" column existed (safe: only fills empty content).
update projects set content = 'This project involved preparing a full tender cost estimate for an oil & gas facility under a tight submission deadline.

I led the cost breakdown process across civil, mechanical, and electrical scopes, working closely with the estimating team to make sure every line item was traceable back to the client''s bill of quantities.

A key part of the work was vendor coordination — collecting and comparing quotations, negotiating pricing and terms, and folding the results back into the overall tender price without losing sight of the schedule.

The submission was delivered on time and was competitive enough to move the company forward in the bidding process, which reinforced how much a disciplined, well-documented estimate matters in EPC tendering.'
where title = 'EPC Tender Cost Estimation — Oil & Gas Facility' and (content is null or content = '');

update projects set content = 'The estimating team was spending too much time on repetitive parts of the RAB (cost budget plan) process, and small inconsistencies were creeping into submissions under deadline pressure.

I mapped out the existing workflow end-to-end, identified where handoffs and rework were happening, and proposed a simplified process with clearer templates and checkpoints.

After rolling it out, turnaround time on RAB preparation improved noticeably, and the number of last-minute corrections dropped — freeing up the team to spend more time on the parts of estimation that actually need judgment, like vendor negotiation and risk assessment.'
where title = 'RAB & Estimation Workflow Improvement' and (content is null or content = '');

update projects set content = 'As QA/QC Engineer on a coal-fired steam power plant project in East Kalimantan, I was responsible for building out inspection, testing, and evaluation standards aligned with local and international requirements.

I worked across suppliers, the production team, and the client to resolve quality issues as they came up, and set up a structured system for raising Requests for Inspection and maintaining quality documentation.

Managing nonconformance reports and punch lists through to close-out was a major part of the role, and by the end of the project I prepared the final hand-over documentation for the power plant buildings and utilities — a strong grounding in how quality discipline holds a project together.'
where title = 'Power Plant Quality Assurance Program' and (content is null or content = '');

update articles set content = 'When I joined my first EPC project, I thought the technical knowledge from my civil engineering degree would carry me most of the way. It helped, but it wasn''t the full picture.

The first lesson was how much EPC work depends on coordination, not just calculation. A cost estimate is only as good as the assumptions behind it, and those assumptions come from conversations with vendors, clients, and the field team — not from a spreadsheet alone.

The second was the value of documentation discipline. Every scope clarification, every price negotiation, every change needs a paper trail, because tender decisions get questioned months later and you need to be able to show your reasoning.

The third was learning to read a bill of quantities the way an experienced estimator does — not just totaling numbers, but spotting where scope is ambiguous or where risk is hiding.

The fourth was that deadlines in EPC tendering are rarely negotiable, so building buffer into your own personal workflow matters more than trying to be perfect.

And the fifth, maybe the most important: staying calm under pressure builds more credibility with a team than technical skill alone. People remember how you handled the crunch, not just whether the numbers were right.'
where title = 'Five Lessons From My First EPC Project' and (content is null or content = '');

update articles set content = 'Moving from an individual contributor role into leading a team of estimators changed more than my job title — it changed what "doing good work" actually means day to day.

As an engineer, success was mostly about the accuracy of my own output: a correct cost breakdown, a clean take-off, a well-supported estimate. As a coordinator, success became less about what I personally produced and more about whether the whole team was set up to produce good work — clear priorities, the right information at the right time, and enough context for people to make good judgment calls without me in the room.

The hardest adjustment was learning to let go of controlling every detail myself, while still being accountable for the outcome. That meant investing more time in reviewing and coaching, and less time doing the work directly — which felt uncomfortable at first, especially under deadline pressure when it''s tempting to just do it yourself.

I''m still early in this transition toward broader project and business leadership, but the biggest shift so far has been thinking in terms of the team''s capability, not just my own.'
where title = 'From Engineer to Project Manager: What Actually Changes' and (content is null or content = '');

update articles set content = 'A Rencana Anggaran Biaya (RAB), or cost budget plan, is only as reliable as the process behind it. Here''s the approach I follow when building one from a client''s bill of quantities (BOQ).

Start by reading the BOQ line by line against the drawings and specifications — not just trusting the descriptions. Ambiguous scope is where estimates go wrong, so flag anything unclear early and get it clarified before pricing it.

Break the work down into a clear Work Breakdown Structure so every cost component — materials, labor, equipment, subcontracted work — has a home. This also makes the estimate easier to review and defend later.

Collect vendor quotations for every major material and equipment item, and don''t rely on outdated price lists. Prices move, and a stale reference number in a competitive tender can cost you the bid or your margin.

Build in a clear contingency and escalation allowance based on project duration and market volatility, rather than a flat arbitrary percentage — this is where experience and judgment matter most.

Finally, cross-check the total against a sanity benchmark — cost per unit area, cost per capacity, or comparable past projects — before it goes out the door. A RAB that "looks right" on that final check has usually caught most of its own mistakes.'
where title = 'How to Build an Accurate RAB for an EPCC Project' and (content is null or content = '');

do $$ begin
  if not exists (select 1 from testimonials) then
    insert into testimonials (quote, name, role, sort_order) values
      ('A genuinely professional working relationship — detail-oriented and always on time with every project deliverable.', 'Colleague Name', 'Project Director, Company X', 1),
      ('Strong technical ability paired with clear communication to every stakeholder involved.', 'Client Name', 'Site Manager, Client Y', 2);
  end if;
end $$;

-- =====================================================================
-- Force PostgREST to pick up the schema immediately (avoids the
-- "Could not find the table in the schema cache" error right after
-- creating new tables/columns).
-- =====================================================================
notify pgrst, 'reload schema';
