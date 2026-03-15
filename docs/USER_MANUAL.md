# RadElement CDE Authoring Platform — User Manual

**Version:** 1.0
**Schema Version:** ACR-RSNA-CDEs 1.0.0
**Audience:** Radiologists, Informatics Specialists, CDE Authors, Reviewers
**Published:** 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Understanding the Data Model](#3-understanding-the-data-model)
4. [Working with Sets](#4-working-with-sets)
5. [Working with Elements](#5-working-with-elements)
6. [Ontology Search Feature](#6-ontology-search-feature)
7. [Value Set Management](#7-value-set-management)
8. [The Ontology Tab in the Editor](#8-the-ontology-tab-in-the-editor)
9. [The Review Workflow](#9-the-review-workflow)
10. [Exporting Data](#10-exporting-data)
11. [Keyboard Shortcuts and Tips](#11-keyboard-shortcuts-and-tips)
12. [Troubleshooting](#12-troubleshooting)
13. [Appendix A: Supported Specialties](#appendix-a-supported-specialties)
14. [Appendix B: Supported Modalities](#appendix-b-supported-modalities)
15. [Appendix C: CDE Status Lifecycle](#appendix-c-cde-status-lifecycle)

---

## 1. Introduction

### What Is RadElement?

RadElement is the official repository of Common Data Elements (CDEs) for radiology, jointly maintained by the American College of Radiology (ACR) and the Radiological Society of North America (RSNA). CDEs are standardized, precisely defined data fields that radiologists and clinical systems use when generating structured reports. By agreeing on a shared vocabulary and data structure for observations such as lesion size, margin characteristics, or nodule composition, radiology practices, healthcare systems, and AI vendors can exchange and compare findings consistently.

The RadElement CDE Authoring Platform is the web-based tool used by radiologists, informatics specialists, and subspecialty societies to create, edit, review, and publish CDE Sets. It connects directly to the live RadElement API at `api3.rsna.org/radelement/v1` and provides integrated ontology search against RadLex (via BioPortal) and SNOMED CT (via the SNOMED International Snowstorm server).

### Why CDEs Matter in Radiology

Radiology reports have historically been free-text narratives. While expressive, free-text reports are difficult to aggregate, query, and share across systems. CDEs address this by defining structured fields with controlled vocabularies, so that:

- A "present/absent" observation for a pulmonary nodule means the same thing in every EHR and AI system.
- Outcomes research and clinical decision support can query structured findings reliably.
- Imaging AI vendors and structured reporting systems share a common data layer.
- Quality metrics and registries (such as the ACR's NRDR) can be populated automatically.

CDE Sets are used by products like RadReport, Nuance PowerScribe, and many third-party reporting tools. The program has been active since 2016 and continues to grow in coverage and adoption.

### The ACR-RSNA CDE Schema

All data in this platform conforms to the ACR-RSNA CDE schema version 1.0.0. The schema defines how Sets, Elements, Value Sets, ontology index codes, contributors, versioning, and status fields are structured in JSON. This manual describes the schema from the author's perspective; the full JSON specification is published by the ACR and RSNA.

### Who This Manual Is For

| User Role | Description |
|---|---|
| **Viewer** | Can browse published CDE Sets and Elements. No login required for read access. |
| **Author** | Can create draft CDE Sets, edit elements, and submit drafts for review. Requires login. |
| **Reviewer** | Can browse submitted drafts, leave comments, and resolve feedback. Requires login. |
| **Admin** | Full access: author, reviewer, and administrative functions. |

---

## 2. Getting Started

### Accessing the Application

The RadElement CDE Authoring Platform is a web application. Open it in any modern browser (Chrome, Firefox, Safari, or Edge). No software installation is required.

- **Browsing CDEs:** Any visitor can browse published Sets and Elements without signing in.
- **Authoring CDEs:** To create or edit CDE Sets, click **Sign In** in the top navigation and use your registered credentials.

> **Note:** If you do not have an account, contact the RadElement program administrator to request author access.

### Interface Overview

The application is organized into a persistent top navigation bar and a main content area. The navigation provides links to all major sections:

| Navigation Item | Description |
|---|---|
| **Home** | Dashboard with statistics, featured published sets, and specialty browsing. |
| **Sets** | Browse and search all CDE Sets in the repository. |
| **Elements** | Browse and search individual CDE Elements across all sets. |
| **Drafts** | View and manage your in-progress draft CDE Sets (requires login). |
| **Review** | View CDE Sets that have been submitted for community review (requires login). |
| **About** | Background information about the CDE program and authoring guidelines. |
| **Profile** | Your account profile and role information (requires login). |

A **dark mode** toggle is available in the header for comfortable viewing in low-light environments.

### The Home Page

The home page provides:

- A **search bar** that accepts free-text queries and navigates directly to the Sets list filtered by that query.
- **Statistics cards** showing the total number of CDE Sets, how many are Published, how many specialties are represented, and how long the program has been active.
- A grid of **featured Published Sets** for quick access to recently updated or widely used CDE sets.
- A **Browse by Specialty** panel that groups sets by radiology subspecialty with counts per specialty.
- A **Platform Features** summary highlighting Browse & Search, Authoring, and Peer Review capabilities.

![Figure 1: Home Page Overview](figures/fig1-home.png)

---

## 3. Understanding the Data Model

The RadElement schema organizes content into a two-level hierarchy: **Sets** contain **Elements**. Both levels carry metadata, versioning, status information, and ontology index codes.

### CDE Sets

A **CDE Set** is a thematically coherent collection of related data elements. Typically, a Set covers a single clinical scenario or observation type — for example, "CT Pulmonary Nodule" or "MR Prostate Lesion Assessment."

A Set carries the following metadata:

| Field | Description |
|---|---|
| **ID** | Unique identifier assigned by the RadElement system (e.g., `RDES123`). |
| **Name** | Human-readable title. Convention: `(Modality) (Body region) (Finding) (Setting)`, Title Case. |
| **Description** | Free-text explanation of the clinical purpose of the set. |
| **Status** | One of `Proposed`, `Published`, or `Retired`. |
| **Version** | Version number and date. |
| **Modalities** | One or more imaging modalities (CT, MR, US, XR, PET, NM, MG, FL, DX, CR, PT). |
| **Specialties** | One or more radiology subspecialties (e.g., Chest Radiology, Neuroradiology). |
| **Body Parts** | Anatomical regions covered, optionally linked to ontology codes. |
| **Index Codes** | Ontology codes (RadLex, SNOMED CT, LOINC, ACRCOMMON) representing the subject of the set. |
| **Contributors** | People and organizations who authored or reviewed the set. |
| **History** | A log of past status transitions with dates. |
| **References** | Citations or DOIs for supporting literature. |

### CDE Elements

A **CDE Element** is a single structured observation or data field within a Set. Each element represents one specific thing a radiologist can report — for example, "Nodule size," "Margin characteristics," or "Enhancement pattern."

An Element carries the following core fields:

| Field | Description |
|---|---|
| **ID** | Unique identifier (e.g., `RDE456`). Assigned by the system; placeholder IDs are used in drafts. |
| **Name** | Short label for the element. Convention: Sentence case (e.g., `Nodule size`). |
| **Definition** | Full semantic description of what the element captures and its clinical context. Required. |
| **Question** | Optional prompt phrased as a question to the radiologist when filling a structured report. |
| **Value Type** | Determines the allowed data values: `value_set`, `integer`, or `float`. |
| **Index Codes** | Ontology codes linking this element to standard terminologies. |
| **Version** | Version number and date. |

### Element Value Types

| Type | Description | Example Use |
|---|---|---|
| **Value Set** | A coded enumeration — a fixed list of named options the radiologist selects from. | `present`, `absent`, `indeterminate` |
| **Integer** | A whole number, with optional minimum, maximum, step, and unit. | Lesion diameter in mm |
| **Float** | A decimal number, with optional minimum, maximum, step, and unit. | SUV max (e.g., 3.4) |

### Value Sets

When an Element's type is **Value Set**, the element contains an ordered list of **ElementValue** entries. Each entry has:

| Field | Description |
|---|---|
| **Value** | A machine-readable code or short string (e.g., `present`). Lower case convention. |
| **Name** | A human-readable display label (e.g., `Present`). |
| **Definition** | Optional clarification of what the value means clinically. |
| **Index Codes** | Optional ontology codes for this specific value. |

The Value Set also carries **min cardinality** and **max cardinality** fields, which define how many values a user must (or may) select. A cardinality of min=1/max=1 means exactly one value must be chosen (single-select). A cardinality of min=0/max=3 means zero to three values may be selected (multi-select).

### Ontology Index Codes

Index codes link Elements and Sets to standard medical terminologies. The platform supports the following systems:

| System | Description | Code Format |
|---|---|---|
| **RADLEX** | Radiology Lexicon — a hierarchical ontology of radiology terms maintained by RSNA. | `RID12345` |
| **SNOMEDCT** | SNOMED Clinical Terms — a comprehensive clinical terminology. | Numeric concept ID |
| **LOINC** | Logical Observation Identifiers Names and Codes — used for lab and clinical observations. | `12345-6` |
| **ACRCOMMON** | ACR Common Codes — ACR-specific coding. | Varies |

---

## 4. Working with Sets

### Viewing the Set List

Navigate to **Sets** in the top navigation to see a paginated grid of all CDE Sets in the repository. The list shows up to 12 sets per page and can be searched and filtered.

![Figure 2: Set List View](figures/fig2-set-list.png)

**Searching:** Type in the search bar to filter sets by name, description, or ID. The search is performed client-side against all loaded sets for immediate feedback. Click the **X** inside the search bar to clear the current query.

**Filtering:** Click the **Filters** button to expand the filter panel. Available filters are:

- **Status:** Proposed, Published, or Retired (single-select radio buttons).
- **Specialty:** Any radiology subspecialty from the full RSNA specialty list (dropdown).
- **Modality:** Any imaging modality — CT, MR, US, etc. (dropdown).

Active filters appear as removable chips below the search bar. Click the **X** on a chip or use **Clear all** to remove all active filters. The count of matching sets is displayed directly below the page heading.

**Pagination:** Use the numbered page buttons or the Previous/Next arrows at the bottom of the list to navigate between pages. The display resets to page 1 whenever any filter or search term changes.

### Viewing a Set Detail Page

Click on any Set card to open the Set Detail page. This page displays:

- The set ID, name, description, status badge, modality badges, and specialty tags in a header card.
- Quick stats: element count, version number and date, schema version, and body parts.
- A tab strip: **Elements**, **Metadata**, and **Comments**.

**Elements tab:** Shows all elements in the set as collapsible rows. Click any row to expand it and see the element's definition, question, allowed values (for Value Set type), numeric constraints (for Integer or Float type), and attached ontology codes.

**Metadata tab:** Shows contributors (people and organizations with ORCID IDs if available), set-level ontology index codes, version history timeline, and any external URL associated with the set.

**Comments tab:** Shows general review comments on the set. Signed-in users can post new comments from this tab. Element-level comments are visible by expanding the relevant element row in the Elements tab.

### Forking a Published Set as a New Draft

If you are signed in as an Author or Admin and want to build on an existing published set, click **Fork as New Draft** on the Set Detail page. This creates a copy of the entire set — including all elements, value sets, ontology codes, modalities, and specialties — as a new local draft with " (draft)" appended to the name. The editor opens automatically with the forked draft. The original published set is not modified in any way.

> **Note:** The Fork as New Draft button is only visible to users with the Author or Admin role. Viewers and Reviewers will not see this button.

### Downloading a Set

Click **Download JSON** on the Set Detail page to download the full set data as a JSON file. The file is named `{set-id}.cdes.json` and conforms to the ACR-RSNA CDE schema 1.0.0. This works for both published sets and your own local drafts.

---

## 5. Working with Elements

### The Element Editor

Within the CDE Set editor, all elements for the current set are listed below the set metadata panel. Each element is displayed as a collapsible card showing:

- The element's assigned ID in monospace font.
- A type badge (violet for Value Set, blue for Integer, teal for Float).
- The element name (or "Untitled element" if not yet named).
- Up/down reorder arrows and a delete button in the card header.
- An expand/collapse toggle.

![Figure 3: Element Editor Card](figures/fig3-element-editor.png)

### Creating a New Element

Scroll to the bottom of the elements list and click **Add Element**. A new blank element card appears at the bottom with:

- A placeholder ID (`RDETO_BE_DETERMINED####`).
- Type defaulting to **Value Set**.
- Empty name, definition, and question fields.
- An empty value set ready to receive values.

### Element Name

The element name should use **sentence case** (capitalize only the first word and proper nouns). Well-formed examples: `Nodule size`, `Margin characteristics`, `Enhancement pattern`.

As you type the element name, two automated features activate:

1. **Ontology Suggestions Dropdown:** After 2 or more characters, a floating dropdown appears showing matching RadLex and SNOMED CT terms. See [Section 6](#6-ontology-search-feature) for full details.

2. **Duplicate Element Warning:** The application checks the live RadElement API for elements with similar names already existing in other sets. If matches are found, a blue informational banner appears below the name field listing the matching element IDs and their parent sets. This helps avoid creating redundant elements and encourages reuse of existing definitions. Dismiss the warning with the X button if you confirm your element is genuinely distinct.

### Element Definition

The definition is a required field and must be a complete semantic description of what the element captures — more than a brief phrase or restatement of the name. A good definition:

- States what clinical observation or measurement the element represents.
- Clarifies the context of the measurement (e.g., "as measured on axial CT image at lung windows").
- Notes any relevant caveats or exclusion criteria.
- May reference peer-reviewed literature or grading systems.

> **Example of a good definition:**
> `The longest dimension of the dominant pulmonary nodule measured in millimeters on the axial CT image at lung windows.`

### Element Question (Optional)

The question field is an optional prompt phrased as a clinical question that would be posed to the radiologist when completing this element in a structured reporting form. Example:
> `What is the size of the dominant pulmonary nodule?`

### Selecting the Value Type

The **Value type** selector presents three buttons: **Value Set**, **Integer**, and **Float**. Clicking a button immediately reconfigures the lower portion of the element card for that type:

- **Value Set** — shows the Value Set Editor (see [Section 7](#7-value-set-management)).
- **Integer** — shows numeric constraint fields (min, max, step, unit).
- **Float** — shows numeric constraint fields (min, max, step, unit).

> **Warning:** Switching value types clears the current value configuration. Changing from Value Set to Integer or Float (or vice versa) will discard any values or numeric constraints previously entered for that element.

### Numeric Constraints for Integer and Float Types

For Integer and Float elements, configure the following fields:

| Field | Description |
|---|---|
| **Min** | Minimum allowed value. Leave blank for no lower bound. |
| **Max** | Maximum allowed value. Leave blank for no upper bound. |
| **Step** | The increment for numeric inputs (e.g., 1 for integers, 0.1 for decimals). |
| **Unit (UCUM)** | The unit of measure in UCUM notation. Examples: `mm`, `HU`, `mL`, `%`. |

### Ontology Codes on Elements

Attached ontology codes are shown as link chips below the element's definition fields. Each chip shows the system name (RADLEX, SNOMEDCT, etc.), the code, and the display term, with an external link to the term's page in its source ontology browser. Codes can be added in two ways:

1. **Via the Ontology Suggest dropdown** — by typing the element name and clicking a suggestion (see Section 6).
2. **Via the Ontology Search panel** in the editor's Ontology tab (see Section 8).

### Reordering Elements

Each element card has up (ChevronUp) and down (ChevronDown) arrow buttons in its header. Click up to move an element earlier in the set; click down to move it later. The up button is disabled for the first element and the down button is disabled for the last element.

### Deleting an Element

Click the **trash icon** in the element card header. The element is removed immediately from the draft. This action cannot be undone within the editor (you would need to add the element back manually).

---

## 6. Ontology Search Feature

### Overview

The Ontology Search feature is the most distinctive productivity tool in the CDE editor. As an author types in certain text fields — the element name, the body part name, or a value set entry name — the application automatically queries two medical ontology services in parallel and presents matching terms in a floating dropdown. Selecting a term attaches its standardized ontology code to the element or value being edited.

This feature ensures CDE elements are grounded in established terminologies, which is required for interoperability with clinical systems that consume RadElement data.

### Data Sources

The ontology search queries two sources simultaneously:

**1. RadLex via BioPortal (Primary)**

RadLex is the Radiology Lexicon, a hierarchical ontology of over 34,000 radiology-specific terms maintained by RSNA. The platform queries RadLex through the BioPortal API. In production, the BioPortal API key is held server-side in a Vercel environment variable (not exposed to the browser). If BioPortal is available, results are returned ranked by BioPortal's own relevance algorithm, with up to 5 RadLex terms shown.

**2. RadLex Curated List (BioPortal Fallback)**

If the BioPortal API is unavailable — because the key is not configured or a network error occurs — the application automatically falls back to a curated list of 178 RadLex terms sourced from the RadElement API (`/api/radelement/v1/codes/radlex`). This list is fetched once per app session and cached in memory for all subsequent queries. Results from this fallback are scored by local textual similarity and the top 5 matches above the threshold are shown.

**3. SNOMED CT via Snowstorm (Parallel)**

SNOMED CT is queried in parallel with RadLex via the SNOMED International Snowstorm public API, proxied through the platform backend. Up to 7 active SNOMED CT concept descriptions matching the query are returned, deduplicated by concept ID.

### How to Use Ontology Suggestions

1. Click into the **Element name** field (or a Body Part name field or Value Set display name field) in the editor.
2. Begin typing. After you have entered **2 or more characters**, a floating dropdown panel appears below the field after a 300 ms pause.
3. The dropdown header reads "Ontology suggestions — click to add code." A spinning loader in the header indicates results are being fetched.
4. Results are organized into two sections: **RadLex** and **SNOMED CT**. Each result shows:
   - The ontology code (e.g., `RID4872` for RadLex or a numeric concept ID for SNOMED CT) in a colored badge.
   - The preferred display name for the term.
   - A small external link icon that opens the full term record in the RadLex or SNOMED CT browser in a new tab.
5. Click a term row to select it. The term's ontology code is immediately added to the element's `index_codes` array. The element name field itself is **not** overwritten — you retain full control of the display label.
6. Press **Escape** or click the **✕** in the dropdown header to dismiss the suggestions without selecting any term.
7. Multiple terms can be applied to the same element. Duplicate codes (same system + same code) are silently ignored.

![Figure 4: Ontology Suggestion Dropdown](figures/fig4-ontology-suggest.png)

> **Note:** The ontology suggestion dropdown uses a 300 ms debounce delay to avoid making excessive API calls while the author is actively typing. Results appear shortly after you pause typing.

### Scoring and Ranking

RadLex results from BioPortal are pre-ranked by BioPortal's relevance algorithm and presented in that order. Results from the curated fallback list are scored locally using the following rules:

| Match Type | Score |
|---|---|
| Exact match (case-insensitive) | 100 |
| Term starts with query string | 85 |
| Term contains all display words matching query | 65 |
| Term contains query as substring | 55 |
| Partial word overlap (≥50% of query words match) | Up to 40 |

Results with a score below 25 are suppressed. The top 5 scoring curated terms are shown.

SNOMED CT results are filtered to active concepts only and returned in Snowstorm's default relevance order.

---

## 7. Value Set Management

When an element's type is set to **Value Set**, the lower portion of the element card shows the Value Set Editor. This is where you define the enumerated options a radiologist will choose from when completing the element in a structured report.

### Cardinality Settings

At the top of the Value Set Editor are two numeric fields:

- **Min selections:** The minimum number of values the user must select. Use `0` to make the element optional; `1` to require exactly one answer.
- **Max selections:** The maximum number of values the user may select. Use `1` for single-select behavior, or a higher number for multi-select (check-all-that-apply) behavior.

Most binary observations (present/absent) use min=1, max=1. Multi-select elements — for example, a list of features where all applicable should be checked — use min=0 or min=1 with max equal to the total number of values.

### Adding Values

Click **Add value** at the bottom of the value list. A new row appears with four fields:

| Column | Description |
|---|---|
| **Index** | Auto-assigned row number (zero-indexed, read-only). |
| **Value** | Machine-readable key string. Use lower case and underscores. Examples: `present`, `absent`, `indeterminate`, `grade_3_4`. |
| **Display name** | Human-readable label shown to the reporting radiologist. Supports live ontology suggestions (see below). |
| **Definition** | A clarifying description of what this value means clinically (optional). Shown on medium and larger screens. |

### Ontology Suggestions for Value Names

The **Display name** field in each value row also supports live ontology search. As you type a display name, the same RadLex/SNOMED CT dropdown appears as described in Section 6. Selecting a term simultaneously:

1. Fills the display name field with the ontology term's preferred label.
2. Attaches the term's ontology code to that value's `index_codes` array.

A small indicator (e.g., "1 code" or "2 codes") appears to the right of the name field when one or more ontology codes are attached to that value.

### Reordering Values

Values are displayed in the order they will appear in structured reporting forms and in the exported JSON. Values are ordered by the sequence in which they were added. Plan the intended display order before adding values, as the current editor does not provide a drag-to-reorder interface for value rows — reordering requires deleting and re-adding entries.

> **Best practice:** Order values from most clinically important to least, or in a logical clinical progression (e.g., `absent` before `present`, or `mild` to `severe` for graded scales).

### Deleting a Value

Click the **X** (remove) icon at the right end of the value row to delete it. Removal is immediate and cannot be undone within the editor session.

### Conventions for Value Authoring

- The **value** field (machine key) should use lower case: `present`, `absent`, `indeterminate`. Use underscores for multi-word keys: `not_evaluated`, `grade_3_4`.
- The **display name** field should use Sentence case: `Present`, `Absent`, `Not evaluated`, `Grade 3–4`.
- Provide a definition for any value that is ambiguous, uses clinical jargon that varies by institution, or references a specific grading system criteria.
- Use standard abbreviations and UCUM units in display names where appropriate (e.g., `HU` for Hounsfield units, `SUV` for standardized uptake value).

---

## 8. The Ontology Tab in the Editor

### Accessing the Ontology Tab

The CDE Set editor is organized into tabs. In addition to the main editing view, there is an **Ontology** tab in the editor tab strip. Click it to switch to the ontology view.

### What the Ontology Tab Shows

The Ontology tab presents a consolidated, read-only view of all ontology codes attached to the current set and to each of its elements. It organizes codes by element, showing for each:

- The element ID and name.
- Each attached code's system badge (RADLEX in violet, SNOMEDCT in teal), code value, and display term.
- An external link icon that opens the full term record in the source ontology browser in a new tab.

This view is most useful for **auditing ontology coverage** before submitting a set for review — verifying that all elements have appropriate ontology groundings, and identifying elements that still need codes.

### Searching Ontologies from the Ontology Tab

The Ontology tab also contains a dedicated **Search Ontologies** panel. This allows you to search RadLex and SNOMED CT by free text and add codes directly to the set's top-level `index_codes` array. This is most useful for adding set-level ontology mappings that describe the overall clinical subject of the set.

To use it:

1. Click the **Ontology** tab in the editor.
2. Type a radiology concept in the search field (e.g., "pulmonary nodule", "hepatic lesion", "lymphadenopathy").
3. Results appear below the search field, grouped by RadLex and SNOMED CT.
4. Click **Add** on any result to attach it to the set's index codes. A green checkmark confirms successful addition.
5. Navigate to the set metadata section to confirm the code now appears in the set's index codes list.

![Figure 5: Ontology Tab Search Panel](figures/fig5-ontology-tab.png)

---

## 9. The Review Workflow

### Overview

Before a CDE Set can be considered for publication in the RadElement repository, it goes through a community review process. The platform supports a draft-to-review pipeline managed through the Drafts and Review pages.

### Draft States

A draft can be in one of two states, reflected visually on the Drafts page:

| State | Indicator | Description |
|---|---|---|
| **Draft** | Amber pen icon | In progress. The author can edit it freely. |
| **In Review** | Green send icon | Submitted for community review. Read-only for the author; reviewers may add comments. |

### Submitting a Draft for Review

From the **Drafts** page:

1. Locate the draft you wish to submit.
2. Click **Submit**. The draft immediately transitions to "In Review" state.
3. The draft becomes visible in the **Review** page to all signed-in users.
4. On the Drafts page, the Edit button is replaced with a Preview button for the duration of the review.

> **Note:** Submitting for review does not publish the set. Publication requires formal approval by the RadElement program office after community review is complete.

### Retracting a Draft from Review

If you need to make revisions after submitting:

1. From the **Drafts** page, click **Retract** on the in-review draft.
2. A confirmation dialog explains that existing comments are preserved.
3. Confirm to return the draft to editable state. The Edit button reappears.

### The Review Queue

Navigate to **Review** in the navigation bar to see all drafts currently submitted for community review. Each entry in the queue shows:

- Set ID, name, author name, and date submitted.
- Element count.
- Count of open (unresolved) and resolved comments.
- The two most recent comments for at-a-glance context.

Click **Review** on any entry to open the Set Detail page for that draft, where you can read element definitions, expand the full schema, and add comments.

### Leaving Review Comments

**Element-level comments:** On the Set Detail page of a draft under review, expand any element row, then click **Add comment on this element**. Type your note and click **Post comment**.

**Set-level comments:** Click the **Comments** tab on the Set Detail page. Type a general comment and click **Post comment**.

Comments are attributed to the logged-in user's name, role, and the date posted.

### Resolving Comments

Reviewers and Admins can resolve open comments. On the Set Detail page, expand the element with comments, find the comment, and click **Resolve**. Resolved comments display a green checkmark but remain visible in the thread for the historical record.

---

## 10. Exporting Data

### JSON Export

The ACR-RSNA CDE schema serializes completely to JSON. To export any set:

1. Navigate to the Set Detail page (a published set from the repository or your own draft).
2. Click **Download JSON**.
3. The browser downloads a file named `{set-id}.cdes.json`.

The exported JSON is a complete, self-contained representation of the set conforming to schema version 1.0.0. It includes all element definitions, value sets, ontology codes, contributor information, version history, and references.

### JSON Structure Overview

The top-level JSON object follows this structure:

```json
{
  "id": "RDES123",
  "name": "CT Pulmonary Nodule",
  "description": "...",
  "schema_version": "1.0.0",
  "set_version": { "number": 1, "date": "2024-01-01" },
  "status": { "name": "Published", "date": "2024-01-01" },
  "modalities": ["CT"],
  "specialties": [{ "name": "Chest Radiology", "abbreviation": "CH" }],
  "body_parts": [{ "name": "Lung", "index_codes": [...] }],
  "contributors": { "people": [...], "organizations": [...] },
  "index_codes": [...],
  "elements": [
    {
      "id": "RDE456",
      "name": "Nodule size",
      "definition": "The longest dimension of the dominant pulmonary nodule...",
      "integer_value": { "min": 1, "max": 300, "step": 1, "unit": "mm" },
      "index_codes": [...]
    },
    {
      "id": "RDE457",
      "name": "Nodule margin",
      "definition": "...",
      "value_set": {
        "min_cardinality": 1,
        "max_cardinality": 1,
        "values": [
          { "value": "smooth", "name": "Smooth", "definition": "..." },
          { "value": "lobulated", "name": "Lobulated", "definition": "..." }
        ]
      },
      "index_codes": [...]
    }
  ]
}
```

### Submitting to the RadElement Repository

The platform manages the review pipeline for submission. Once you have submitted a draft for review (via the Drafts page) and the community review process is complete, the RadElement program office coordinates formal publication, assigns permanent IDs, and updates the repository. Formal submission instructions and contact information are available at [radelement.org](https://radelement.org) and from the ACR informatics team.

For bulk imports or programmatic ingestion of multiple sets, the RadElement API at `api3.rsna.org/radelement/v1` accepts JSON conforming to the CDE schema. Contact the program office for API write credentials.

---

## 11. Keyboard Shortcuts and Tips

### Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Dismiss ontology suggestion dropdown | `Escape` |
| Navigate between form fields | `Tab` / `Shift+Tab` |
| Confirm a focused primary button | `Enter` |

### Common Workflows

**Creating a new set from scratch:**

1. Sign in → click **Drafts** → click **New CDE Set**.
2. Fill in the set name, description, modality, and specialty in the metadata panel.
3. Add body parts (type in the body part field and use ontology suggestions to attach RadLex codes).
4. Click **Add Element** for each data field the set needs.
5. For each element: enter the name (using ontology suggestions to attach codes), select the value type, write a complete definition, and configure value set options or numeric constraints.
6. Switch to the **Ontology** tab to review code coverage across all elements.
7. Click **Save**. Export JSON as a local backup.
8. Click **Submit** on the Drafts page when the set is ready for peer review.

**Forking an existing published set:**

1. Browse to the published set and click **Fork as New Draft**.
2. Rename the set to reflect the intended changes or subspecialty focus.
3. Add, remove, or modify elements as needed.
4. Update the description to note what differs from the source set.
5. Follow the same review and submission process as a new set.

**Adding ontology codes efficiently:**

- Type the element name thoughtfully — the ontology dropdown appears as you type, so you can select a term before moving to the definition field.
- You do not need to select a term; press Escape to dismiss without selecting if no suggestion is appropriate.
- For body parts, always try to apply an ontology suggestion to ensure standard RadLex coding.
- You can add multiple codes to one element by selecting terms from the dropdown multiple times, or by using the Ontology tab search panel.

### Best Practices for CDE Authoring

**Naming conventions:**

- **Set names:** Title Case, format `(Modality) (Body region) (Finding or reason) (Setting)`. Example: `MR Knee Cartilage Assessment`.
- **Element names:** Sentence case. Example: `Cartilage defect grade`.
- **Value keys:** Lower case. Examples: `present`, `absent`, `grade_3_4`.
- **Value display names:** Sentence case. Examples: `Present`, `Absent`, `Grade 3–4`.

**Definitions:**

- Every element must have a definition that is more than a few words.
- Definitions should be clinically meaningful and self-contained.
- Reference peer-reviewed literature or established grading systems when specific criteria are used.

**Units:**

- Use UCUM notation for all units: `mm`, `mL`, `HU`, `%`, `SUV`, `s`.
- Do not use `cm³` — use `mL` instead.
- Do not use `cc` — use `mL` instead.

**Value sets:**

- Cover all clinically meaningful states, including `indeterminate` and `not applicable` where relevant.
- Avoid overlapping or ambiguous categories.
- A two-value set (`present`/`absent` or `yes`/`no`) is a boolean element and is a common, valid pattern.

**Avoiding duplication:**

- Always read the Duplicate Warning banners when naming sets and elements.
- If a similar set exists, fork and extend it rather than creating a new one from scratch.
- If an element with the same name exists in another set, review its definition — if it represents the same concept, align your definition language and use the same ontology codes.

---

## 12. Troubleshooting

### Ontology Suggestions Not Appearing

**Symptom:** You type an element name but no dropdown appears.

| Cause | Solution |
|---|---|
| Query is fewer than 2 characters | Type at least 2 characters. The dropdown activates only after the minimum length is met. |
| BioPortal API key not configured | The system falls back to the 178-term curated RadLex list. Suggestions still appear for terms in that list, but coverage is limited to common radiology terms. Contact your administrator to configure the BioPortal API key in the server environment. |
| Network connectivity issue | Verify that the application can reach the backend proxy. Reload the page and try again. |
| Unusual or highly specific term | Try a shorter or more general form of the term. SNOMED CT has broader coverage than the curated RadLex fallback for general clinical concepts. |
| Field does not support suggestions | Ontology suggestions are only active for the Element name field, Body Part name field, and Value Set display name field. Other text fields (definition, question) do not trigger suggestions. |

### Duplicate Warning Appears for a Legitimate New Set

The duplicate detection algorithm uses textual similarity scoring and may surface false positives for common clinical terms. If the warning appears for a name that is genuinely distinct from the flagged existing sets, click the **X** in the banner header to dismiss the warning and continue. The warning is advisory only and does not block authoring.

### Draft Work Was Lost After Closing the Browser

Drafts are stored in browser memory using the application's client-side state layer (Zustand). They persist across navigation within the same browser tab session but are not backed by a server database.

**To prevent future loss:**
1. Click **Save** frequently during editing sessions.
2. Export your draft as JSON regularly using **Download JSON** from the Set Detail preview page for your draft.
3. Keep local backup copies of exported JSON files.

### Fork as New Draft Button Not Visible

This button only appears for signed-in users with the **Author** or **Admin** role. If you do not see it:
- Verify you are signed in (the profile icon or name should appear in the navigation).
- Verify your account has the Author role (check the Profile page).
- Contact the RadElement program administrator to request the appropriate role.

### Submitted Draft Is No Longer Editable

Once a draft is submitted for review, the Edit button is replaced with Preview to preserve the integrity of the reviewed content. To make changes:

1. Go to **Drafts** in the navigation.
2. Click **Retract** on the draft.
3. Confirm the retraction in the dialog.
4. The Edit button reappears and the draft returns to editable state.
5. Existing review comments are preserved after retraction.

### Page Shows 404

If you navigate to a URL for a set ID that does not exist in the repository — including a draft ID that has been deleted — a 404 error page is displayed. Use the browser Back button or navigate to **Sets** to return to the repository browser.

### API Errors on the Sets or Elements Pages

If the Sets or Elements pages display an error message such as "Failed to load CDE sets," this indicates a network connectivity problem with the RadElement API at `api3.rsna.org/radelement/v1`. Steps to resolve:

1. Check your internet connection.
2. Reload the page.
3. If the error persists across multiple reloads, the RadElement API may be temporarily unavailable. Check the RSNA system status page or contact the RadElement program office.

---

## Appendix A: Supported Specialties

| Abbreviation | Full Name |
|---|---|
| AB | Abdominal Radiology |
| BR | Breast Imaging |
| CA | Cardiac Radiology |
| CH | Chest Radiology |
| ER | Emergency Radiology |
| GI | Gastrointestinal Radiology |
| GU | Genitourinary Radiology |
| HN | Head and Neck |
| IR | Interventional Radiology |
| MI | Molecular Imaging |
| MK | Musculoskeletal Radiology |
| NR | Neuroradiology |
| OB | Obstetric and Gynecologic Radiology |
| OI | Oncologic Imaging |
| PD | Pediatric Radiology |
| QI | Quality Improvement |
| RS | Radiation Safety |
| VI | Vascular and Interventional |

---

## Appendix B: Supported Modalities

| Code | Full Name |
|---|---|
| CT | Computed Tomography |
| MR | Magnetic Resonance |
| US | Ultrasound |
| XR | Radiography |
| PET | Positron Emission Tomography |
| NM | Nuclear Medicine |
| MG | Mammography |
| FL | Fluoroscopy |
| DX | Digital Radiography |
| CR | Computed Radiography |
| PT | PET-CT |

---

## Appendix C: CDE Status Lifecycle

| Status | Description |
|---|---|
| **Proposed** | The set has been authored and submitted for consideration. It is visible to reviewers but has not yet received formal endorsement. |
| **Published** | The set has been reviewed, approved, and formally published in the RadElement repository. It is available for use in clinical reporting systems, AI products, and registries. |
| **Retired** | The set has been superseded by a newer version or is no longer recommended for use. It remains visible in the repository for historical reference and backward compatibility but should not be used in new implementations. |

---

*This manual was prepared for the RadElement CDE Authoring Platform. For questions about the RadElement program, visit [radelement.org](https://radelement.org) or contact the ACR informatics team. For technical issues with this platform, contact your system administrator.*
