# Vidyaaraa Notes Explorer — Audit & Architecture Plan

## Phase 1: Codebase Audit & Ground Truth

### 1. Framework & Dependencies
- **Framework:** Next.js `16.3.0` (Turbopack, App Router)
- **React:** `19.2.8`
- **Styling:** Tailwind CSS `v4` with `@tailwindcss/postcss`
- **Icons:** `lucide-react`
- **Database:** **Supabase** (`@supabase/supabase-js` v2.117.3)
  > *Note on Context:* The prompt review hypothesized Firebase, but ground truth investigation confirms Vidyaaraa runs entirely on **Supabase PostgreSQL**. Zero Firebase dependencies exist in the repository.

### 2. Current Notes Storage & Data Model
- **Source of Truth:** Supabase PostgreSQL table `resources`.
- **Schema (`DbResource` / `Resource`):**
  - `id`: string (UUID)
  - `subject_id`: string (nullable)
  - `subject_name`: string
  - `branch_id`: string (matches branch IDs in `data/universities.ts`, e.g. `cse`, `cse-allied`, `ise`, `ece`, `me`)
  - `semester`: number (1 through 8)
  - `university_id`: string (`vtu`)
  - `type`: `'notes' | 'pyq' | 'syllabus' | 'question-bank' | 'lab-manual' | 'other'`
  - `title`: string
  - `description`: string
  - `url`: string (typically Google Drive sharing links)
  - `is_demo`: boolean
  - `uploaded_at`: ISO timestamp string
- **Static Fallback:** `data/resources.ts` exports `export const resources: Resource[] = []`. All static mock notes were intentionally removed per user directive; **only database-backed notes uploaded via the Admin Panel are displayed**.

### 3. File Delivery & Embedding Architecture
- Most student materials are hosted on Google Drive.
- `lib/utils.ts` provides `formatGoogleDriveUrl(url)` which automatically converts `drive.google.com/file/d/FILE_ID/view` links into `drive.google.com/file/d/FILE_ID/preview`.
- This `/preview` mode allows embedding PDFs cleanly in `<iframe>` viewers without triggering Google Drive account selection screens on mobile.
- To prevent cross-origin embedding issues on restrictive mobile browsers, an **"Open in Google Drive / New Tab"** escape button must always accompany any in-app viewer.

### 4. Existing Pain Points in `/resources`
- Flat list of cards with 3 disconnected dropdown filters (Branch, Semester, Search).
- No folder hierarchy—students cannot browse subjects or modules naturally.
- No in-app preview—clicking "View Notes" opens a new tab immediately.
- Filter-heavy interface feels like an administrative database table instead of an academic digital library.

---

## Phase 2: Architecture & Virtual File System (VFS)

### 1. Hierarchical Information Architecture
The explorer will structure notes into a 4-tier virtual folder hierarchy:

```text
Root: Vidyaaraa Academic Library
└── Tier 1: Academic Stream / Branch (e.g. CSE & Allied, ECE, Mechanical, etc.)
    └── Tier 2: Semester (e.g. Semester 3, Semester 4, Semester 5)
        └── Tier 3: Subject (e.g. Database Management Systems, Operating Systems)
            └── Tier 4: Resource Group / Category (Lecture Notes, Question Banks, Lab Manuals)
                └── File Leaves (PDF Document, Description, Upload Date, Preview & Download)
```

- **Smart Collapse:** If a tier has only one child or if direct navigation makes more sense (e.g. a subject only has "Lecture Notes"), the hierarchy displays files directly with category badges to prevent unnecessary clicking.
- **Accurate Item Counts:** Counts represent the real sum of database records inside that branch/semester/subject.

### 2. Thin Service Layer (`lib/notesExplorer/`)
All folder operations and resource transformations are isolated behind a modular service layer:

```typescript
export interface ExplorerNode {
  id: string;
  name: string;
  slug: string;
  type: 'folder' | 'file';
  category?: 'branch' | 'semester' | 'subject' | 'type';
  resourceCount?: number;
  resource?: Resource;
  path: string[]; // e.g. ['cse-allied', 'sem-4', 'dbms']
  children?: ExplorerNode[];
}
```

- **`buildVirtualFolderTree(resources: Resource[]): ExplorerNode`**: Ingests database records from `fetchResources()` and indexes them into the multi-tier tree.
- **`getNodeByPath(tree: ExplorerNode, pathSegments: string[]): ExplorerNode | null`**: Traverses the tree based on active URL segments.
- **`searchVirtualTree(tree: ExplorerNode, query: string): SearchResult[]`**: Client-side full-text search indexing title, subject, branch, and category.

### 3. State & URL Synchronization
- **Deep-linking & Refresh Support:** The explorer state synchronizes with URL query parameters:
  - Root: `/resources`
  - Folder path: `/resources?path=cse-allied/sem-4/dbms`
  - View mode: `/resources?path=cse-allied&view=grid` (or `list`)
- **Browser History:** Uses `window.history.pushState` or Next.js `useRouter.push` with `{ scroll: false }` so browser Back and Forward buttons work seamlessly like navigating back to parent folders.

### 4. Component Structure
```text
components/notesExplorer/
├── NotesExplorerContainer.tsx    # Main state coordinator (URL sync, active folder, search)
├── ExplorerHeader.tsx            # Title, dynamic breadcrumbs, search trigger, grid/list toggle
├── BreadcrumbNav.tsx             # Collapsible, click-to-navigate breadcrumb trail
├── FolderCard.tsx                # Google Drive-style folder cards with item count & icons
├── FileCard.tsx                  # File card with type badge, date, action buttons
├── FileListItem.tsx              # High-density row view for fast scanning
├── DocPreviewModal.tsx           # In-app Google Drive /preview modal + fallback button
├── SearchOverlay.tsx             # Instant search modal with keyboard navigation (Esc, Enter)
└── EmptyFolderState.tsx          # Clean empty state with "Request Notes" CTA
```

### 5. Multi-Device Responsive Design Matrix
| Viewport | Screen Width | Grid Columns | Navigation & Layout Strategy |
| :--- | :--- | :--- | :--- |
| **Mobile Narrow** | `320px – 390px` | 1 col (files) / 2 col (folders) | Truncated breadcrumbs with dropdown, 44px touch targets, full-screen doc preview modal. |
| **Mobile Standard** | `390px – 430px` | 2 col (folders) | Full thumb-zone ergonomics, bottom padding guard (`pb-28`) for bottom navigation bar. |
| **Tablet Portrait** | `600px – 900px` | 2 – 3 columns | Auto-fitting grid, breadcrumbs wrap cleanly, high-touch card padding. |
| **Tablet Landscape** | `900px – 1200px`| 3 columns | Enhanced metadata visibility, optional list view toggle. |
| **Desktop / Laptop**| `1200px – 1600px`| 3 – 4 columns | Max-width 7xl container, keyboard shortcuts (`/` for search, `Esc` to close preview), hover states. |

### 6. In-App Document Preview UX
- When clicking a file:
  - Opens `DocPreviewModal` with an embedded `iframe` pointing to `formatGoogleDriveUrl(resource.url)`.
  - Header displays resource title, subject name, and semester badge.
  - Action bar includes:
    1. **"Open in Drive / New Tab"** (essential fallback for mobile or blocked iframes)
    2. **"Bookmark / Save"** (syncs with `localStorage.getItem('cf_saved_resources')`)
    3. **"Close"** (`Esc` key or backdrop tap)

---

## Phase 3 Implementation Steps
1. Create `lib/notesExplorer/vfs.ts` (Virtual Folder System tree builder and search index).
2. Create `components/notesExplorer/` modular components (Breadcrumbs, FolderCard, FileCard, DocPreviewModal, SearchOverlay).
3. Update `app/resources/page.tsx` to mount the new `NotesExplorerContainer` with backward-compatible support for all existing database records.
4. Verify responsiveness across all 4 viewport targets, test keyboard navigation, and run `npm run build`.
