# USP-ATS: Product Requirements & Software Requirements Specification

## 1. Overview

**Project:** USP-ATS — an AI-assisted Applicant Tracking System for USP job postings
**Problem:** Job openings at USP (student assistant roles, RA/TA positions, work-study, admin vacancies) are scattered across emails and informal channels, making them easy to miss.
**Solution:** A unified platform where admins post and manage jobs, students build a profile and apply, both track status, and an AI scoring feature assists admins in evaluating fit.

**Roles:** Student, Admin (2 roles only, provisioned via Entra ID — internal users only)

---

## 2. Product Requirements Document (PRD)

### 2.1 Features

| # | Feature | Owner | Contributors |
|---|---|---|---|
| 1 | User Profile Management | Vishant | Rohan, Vishant |
| 2 | Job Posting Management | James | Dipika, James, Rohan |
| 3 | Job Feed | Dipika | Dipika, Anav, James |
| 4 | Application & Tracking | Anav | Vishant, Dipika, James, Anav |
| 5 | AI Scoring / Recommendation | Rohan | Rohan, Anav, Vishant |
| 6 | Authentication | — | Anav, Vishant |

### 2.2 Feature Details

**1. User Profile Management**
- Student creates/updates their profile after first sign-in (onboarding flow)
- Fields: degree(s) (supports multiple), education history, technical skills (free text), average GPA (single value, out of 4.5), personal projects (repeatable: name, description, link)
- Profile may be left incomplete initially, but a complete profile (all fields filled) is required before applying to a job

**2. Job Posting Management** *(Admin only)*
- CRUD for job postings
- Fields: title, department, job type (free text), campus (from a defined list, supports multiple campuses), requirements (GPA minimum, degree, skills — free text), hours/week, deadline
- Postings can be edited after applications exist; existing applications/scores are not retroactively recalculated
- No draft state — postings are live as soon as created
- Deleting a posting: hard-deletes if no applications exist; archives (soft-delete) if applications exist

**3. Job Feed** *(Student-facing)*
- Search by job title/description
- Filter by campus, GPA requirement, job type
- All jobs shown regardless of student's own eligibility (not hidden)
- Default sort: newest first

**4. Application & Tracking**
- *Student side:* apply to a job by submitting profile snapshot + required cover letter (plain text); view own application statuses; withdraw an application (status change, not deletion)
- *Admin side:* view all applications for a given job posting in a table, ranked by AI score; update status (shortlisted / accepted / declined)
- Cannot apply to the same job twice (can withdraw and nothing further — no re-apply)
- Status values: `applied`, `shortlisted`, `accepted`, `declined`, `withdrawn`
- No notification system — status visible only when the student checks

**5. AI Scoring / Recommendation**
- Triggered automatically on application submission (async, via trigger.dev)
- Inputs: job requirements, applicant's structured profile (skills, education, GPA, projects), cover letter text
- Personal projects are considered a positive signal in scoring (exact weighting tunable during prompt design)
- Output: match score, eligibility flag, qualification fit reasoning, motivation fit reasoning, missing requirements
- Visible to admin only — never shown to the student
- Score is a snapshot at application time; not recalculated if the student later edits their profile
- On AI call failure: shown as a failed/error state in the admin table; no automatic retry in the prototype

**6. Authentication**
- Entra ID (Azure AD) SSO via better-auth, using a personal tenant provisioned through GitHub Education
- Only users explicitly assigned to the app (Enterprise Application "Assignment Required" enabled) can sign in
- Role (student/admin) determined by Entra ID App Role assignment, synced to the app's user record on sign-in
- First sign-in with no existing profile → redirected to onboarding
- Sign-in with no assigned role → access-denied page

### 2.3 Out of Scope (for this iteration)
- Notifications (email/in-app)
- Re-scoring on profile edits
- Retry mechanism for failed AI scoring calls
- Structured/tagged skills (free text for prototype)
- File/resume upload (profile is fully structured; cover letter is plain text)
- Draft state for job postings

---

## 3. Software Requirements Specification (SRS)

### 3.1 Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| UI Library | HeroUI + Tailwind CSS v4 |
| ORM | Prisma |
| Database | Neon (Postgres) |
| Auth | better-auth + Entra ID (Microsoft/Azure AD provider) |
| Forms & Validation | React Hook Form + Zod |
| Data fetching/mutations | TanStack Query (client-side, primary) |
| Async processing | trigger.dev |
| AI | Gemini API (free tier) via Vercel AI SDK (`generateObject` + Zod schema) |
| Deployment | Vercel |
| File/object storage | None required |

### 3.2 Core Entities

- **User** — id, entraId, email, role (student/admin), createdAt
- **Profile** — userId (FK), degrees[], education[], skills (text), gpa (decimal, /4.5), projects[] (name, description, link)
- **JobPosting** — id, title, department, jobType (text), campus, requirements (gpaMin, degree, skills text), hours, deadline, status (active/archived), createdBy (admin userId)
- **Application** — id, jobId (FK), studentId (FK), coverLetter (text), status (enum), createdAt
- **ScoreResult** — applicationId (FK), matchScore, eligible (bool), qualificationFit (text), motivationFit (text), missingRequirements (text[]), status (pending/complete/failed)

### 3.3 Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | System shall allow admins to create, read, update, and delete job postings |
| FR2 | System shall allow students to submit an application (profile + cover letter) to a job posting |
| FR3 | System shall provide a searchable, filterable feed of all active job postings |
| FR4 | System shall track each application through a defined status pipeline and allow admins to update status |
| FR5 | System shall compute an AI-generated fit score for each application asynchronously and display it to admins only |
| FR6 | System shall authenticate users via Entra ID SSO and restrict access to users explicitly assigned to the application |
| FR7 | System shall assign user roles (student/admin) based on Entra ID App Role claims |
| FR8 | System shall redirect first-time users without a profile to an onboarding flow |

### 3.4 Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR1 | AI scoring shall not block application submission (processed asynchronously) |
| NFR2 | Only the application layer (Next.js app) shall be internet-facing; database, queue, and AI processing are not directly exposed |
| NFR3 | All blocked/invalid actions shall be communicated via modal dialogs with an icon and message |
| NFR4 | All empty states shall display an icon and message |
| NFR5 | System shall support at minimum 2 concurrent roles (student, admin) with role-based route and action guards |
| NFR6 | No PII beyond what's required for the ATS function (profile, application data) shall be stored |

### 3.5 Routes

**Public/shared:** `/`, `/sign-in`, `/onboarding`, `/access-denied`
**Student:** `/jobs`, `/jobs/[id]`, `/profile`, `/applications`
**Admin:** `/admin/jobs`, `/admin/jobs/new`, `/admin/jobs/[id]/edit`, `/admin/jobs/[id]/applicants`

---

## 4. Engineering Standards & Paradigms

### 4.1 Project Structure
- Route files in `app/` stay thin — they are composition roots, not containers of business logic
- Business logic lives in `lib/` and feature-scoped modules; reusable UI lives in `components/`
- One component per file; split files aggressively as they grow rather than accumulating in place
- Co-locate related hooks, types, and utilities with the feature they serve

### 4.2 Components
- Build all UI from HeroUI primitives (buttons, inputs, modals, tables, etc.) instead of hand-rolling equivalents
- Use `lucide-react` for all icons
- Prefer small, focused components with a single responsibility
- Server Components by default; add `"use client"` only where interactivity requires it

### 4.3 Modals & Forms
- All create/edit/delete flows use forms inside modals (per NFR3); full-page forms only where the flow requires it (e.g. onboarding)
- Shared UI primitives live in `components/ui/`: `form-modal.tsx` (generic modal shell), `confirm-modal.tsx` (destructive/confirm actions), `form-field.tsx` (label + hint/error wrapper)
- `FormModal` owns the shell: header contains only the title and close trigger, plus an optional `closeDisabled` prop. The caller's form renders `Modal.Body` and `Modal.Footer` itself so the submit button stays inside the `<form>` element
- `ConfirmModal` is used for deletes, withdrawals, and status changes: icon + title + message in the body, cancel/confirm buttons in the footer, `isPending` disables both buttons
- Per-feature form components (e.g. profile) share small field subcomponents (academic, degree, education, project fields) that consume React Hook Form via `FormProvider`/`useFormContext`; a form is a composition of those fields plus a navigation pattern (stepper, tabs, or plain sections)
- Section metadata shared by navigation patterns lives in a single config file (e.g. `profile-sections.ts`: id, label, icon, fields, optional) consumed by both stepper and tabs
- Server actions return `{ success: true } | { success: false; error }`; forms await `mutateAsync` and gate post-save actions (close modal, navigate) on `result.success`
- Save flow: the submit button shows a spinner and stays disabled while `isPending`; the modal stays open until the DB write confirms, then closes on success; the close trigger is disabled during save by lifting `isPending` up via an `onPendingChange` callback into `FormModal.closeDisabled`
- Modal forms receive data via `initialData` mapped to RHF `defaultValues`; remount the form when the data changes (e.g. `key={JSON.stringify(profile)}`) so reopening the modal shows fresh values
- Form state persists while navigating within the form (tabs, steps); closing without saving discards changes (no dirty warning)

### 4.4 Data Fetching & State
- All server data is fetched via TanStack Query hooks; no ad-hoc `fetch` calls scattered through components
- Centralize query keys (e.g. a query-key factory) instead of inline string literals
- Mutations run through TanStack Query and invalidate/update the relevant cached queries
- TanStack Query owns server state; ephemeral UI state stays in local component state

### 4.5 Types & Validation
- Zod schemas are the single source of truth for data shapes; derive TypeScript types with `z.infer`
- Validate at the API/action boundary (route handlers and server actions)
- Forms use React Hook Form + Zod for validation (per SRS)

### 4.6 Naming & File Conventions
- kebab-case file names; PascalCase for components; `use*` prefix for hooks
- Use the `@/*` path alias for imports
- Co-locate related hooks/utils with their feature

### 4.7 Server/Client Boundary
- Never import server-only code (e.g. `lib/auth.ts`, Prisma) into client files; use `import type` when only types are needed
- `proxy.ts` (middleware) is the coarse route gate; client-side guards (`RequireAuth`) handle UX; route/action checks are the enforcement layer (NFR5)

### 4.8 Errors & Empty States
- Blocked/invalid actions are communicated via modal dialogs with an icon and message (NFR3)
- All empty states display an icon and message (NFR4)

### 4.9 Commits
- Use conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, etc.) matching the existing history

### 4.10 Database & Prisma
- Edit `prisma/schema.prisma` freely as a feature requires
- After editing the schema, sync the shared dev database with `pnpm prisma db push`
- Migration files are not used — never run `prisma migrate`; no `prisma/migrations` folder is committed
- `prisma generate` runs automatically via the `postinstall` script; run `pnpm prisma generate` manually if the client is stale
- Destructive recovery is allowed: if schema/DB sync gets stuck, you may nuke the shared dev DB with `pnpm prisma migrate reset` — but you must notify the team afterwards (e.g. team channel or PR comment), since it wipes shared data

### 4.11 Git Branching
- All work happens on a feature branch branched from `dev`, never directly on `dev` or `main`
- Name branches by intent: `feat/<scope>`, `fix/<scope>`, `chore/<scope>` (e.g. `feat/job-search`)
- Keep branches small and scoped to a single feature; merge back via PR into `dev`

### 4.12 AI Coding Agents
- Agents may autonomously create branches and run `pnpm install` (including on new branches) as needed
- Agents must leave the workspace in a working state and pass the checks in 4.14 before finishing

### 4.13 Package Manager
- Use pnpm exclusively: `pnpm install` to install, `pnpm add <pkg>` to add dependencies
- Never mix package managers or commit alternate lockfiles

### 4.14 Verification Before Commit
- Run `pnpm lint` and `pnpm typecheck` before committing or opening a PR
- Run `pnpm build` when a change touches routing or build configuration

### 4.15 Writing Style
- Do not use em dashes (—); use hyphens, commas, or semicolons instead

---

*Draft v1 — adjust as implementation reveals edge cases.*
