# RadElement CDE Platform

A web application for browsing, authoring, and peer-reviewing **Common Data Elements (CDEs)** for standardized radiology structured reporting, built in partnership with the ACR and RSNA.

Live deployment: **[radelement.vercel.app](https://radelement.vercel.app)**

---

## Overview

The RadElement CDE Platform provides a complete workflow for managing radiology Common Data Elements — from public browsing of the live RadElement repository through to collaborative authoring, peer review, and publication. It mirrors the official [RadElement](https://radelement.org) schema and connects directly to the ACR/RSNA API.

---

## Features

### Public (Viewer)
- Browse 270+ published CDE sets from the live RadElement repository
- Card and list view toggle on both the Dashboard and CDE Sets pages
- Filter by status (Published / Proposed / Retired), specialty, and modality
- Full-text search across set names, descriptions, and IDs
- Browse by specialty with element-count breakdowns
- View detailed set pages including elements, value sets, ontology codes, and contributors
- Download individual sets as JSON

### Author
- Create new CDE set drafts with the full schema editor
- Auto-populated contributor record using logged-in user credentials (name, email, ORCID iD)
- Edit set metadata: name, description, modalities, specialties, body parts, index codes
- Add, edit, reorder, and remove data elements (value set, integer, or float types)
- Ontology search with RadLex and SNOMED CT integration for display names and value sets
- Duplicate detection warns when similar published sets already exist
- Submit drafts for peer review; retract if revisions are needed
- Fork any published set as a starting point for a new draft

### Editor
- View and edit all author drafts across the system (not just own)
- Create new CDE sets
- Reorder contributors (people and organizations) within a draft

### Reviewer
- Dedicated Review Queue showing all drafts submitted for review
- Inline comment threads on draft sets
- Resolve and unresolve comments
- View draft detail alongside reviewer commentary

### Admin
- Full access to all roles and functions without restriction
- Admin Panel with four tabs:
  - **Users** — view all registered users, change roles, activate/deactivate accounts, see last login time and total login count
  - **Drafts** — view all drafts system-wide, delete any draft, promote drafts to Proposed status, stub button for RadElement publication submission
  - **Comments** — view all review comments across all sets with resolution status
  - **Audit Log** — complete timestamped record of all system events (logins, role changes, draft lifecycle actions)
- Submit or retract any draft for review (not just own)

### Profile
- Edit display name and institution/organization
- Link ORCID iD — automatically applied to contributor records on new drafts
- ORCID iD propagates to published CDE set contributor listings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Routing | React Router v6 |
| State management | Zustand |
| Styling | Tailwind CSS |
| Build tool | Vite |
| Backend / Auth / DB | Supabase (PostgreSQL + Row Level Security) |
| Deployment | Vercel |
| Ontology search | RadLex (BioPortal API), SNOMED CT (IHTSDO Snowstorm) |
| CDE data source | ACR/RSNA RadElement API v3 |

---

## Roles

| Role | Capabilities |
|---|---|
| **Viewer** | Browse and search published CDEs (no login required) |
| **Author** | Create and manage own drafts, submit for review |
| **Editor** | Edit any author's drafts, create new sets |
| **Reviewer** | Review Queue access, comment and resolve feedback on submitted drafts |
| **Admin** | All of the above plus user management, audit log, promotion, and publication controls |

New accounts are assigned **Viewer** by default. An administrator grants elevated roles after verifying institutional affiliation.

---

## Database Schema

The platform uses Supabase (PostgreSQL) with the following primary tables:

| Table | Purpose |
|---|---|
| `profiles` | User accounts (role, name, email, ORCID, login stats) |
| `drafts` | CDE set drafts (full JSON schema + review status + promoted flag) |
| `comments` | Reviewer comments on draft sets |
| `audit_log` | Immutable event log (admin-readable only) |

Row Level Security (RLS) policies enforce role-based data access at the database level. The `increment_login_stats` RPC function atomically tracks login count and last login timestamp.

---

## Local Development

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [BioPortal](https://bioportal.bioontology.org) API key (for ontology search)

### Setup

```bash
git clone https://github.com/budflanksteak/radelement.git
cd radelement
npm install
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BIOPORTAL_KEY=your-bioportal-api-key
```

### Database

Run `supabase/schema.sql` in the Supabase SQL Editor to create tables, RLS policies, functions, and triggers. The file is fully idempotent and safe to re-run against an existing database.

### Run

```bash
npm run dev
```

The app runs at `http://localhost:5173`. The Vite dev proxy handles SNOMED CT and BioPortal API requests, injecting the BioPortal key automatically.

---

## Deployment

The project deploys to Vercel automatically on push to `main`. Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `BIOPORTAL_KEY`) are set in the Vercel project dashboard.

API routes in `api/bioportal` and `api/snomed` are Vercel Edge Functions that proxy ontology requests and inject the server-side BioPortal API key in production.

---

## Project Structure

```
src/
  api/          # RadElement REST API client
  components/   # Shared UI components (SetCard, OntologySuggest, etc.)
  data/         # Static lookup data (specialties, modalities, colors)
  hooks/        # Custom React hooks (ontology search)
  lib/          # Supabase client, audit log helper
  pages/        # Route-level page components
  store/        # Zustand stores (auth, drafts, review, theme)
  types/        # TypeScript interfaces mirroring the RadElement JSON schema
api/
  bioportal/    # Edge Function: BioPortal proxy (production)
  snomed/       # Edge Function: SNOMED CT proxy (production)
supabase/
  schema.sql    # Complete database schema with migration block
```

---

## License

Internal development project — ACR/RSNA RadElement initiative.
