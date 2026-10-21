# DocFlow

A full-featured document management and collaboration platform built with Next.js, PostgreSQL, and Prisma. DocFlow helps teams create native rich-text documents, manage uploads, prevent editing collisions with check-in/check-out locks, run approval workflows, and maintain an audit-proof version history.

---

<!-- SCREENSHOT 1: DASHBOARD -->
<!--
  Screenshot to add:
  Take a screenshot of your main "My Files" screen (http://localhost:3000/dashboard/files)
  showing the document list, status pills, filter bar, and "New Document" button.
-->
<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/fb9039c5-0d45-4188-b2d3-cf693407fe3c" />
</>
</>
</>
</>
<img width="1917" height="905" alt="image" src="https://github.com/user-attachments/assets/cb675563-745d-4059-b46e-35fd3b19b9f7" />



---

## What DocFlow Does

DocFlow is designed around how teams actually work with documents—balancing quick editing with proper review checkpoints and access controls.

### 1. Dual-Mode Document Management
* **Native Rich-Text Editor**: Write documents directly inside DocFlow using an integrated TipTap editor. Supports formatted text, headings, task lists, code blocks with syntax highlighting, tables, callouts, and inline media.
* **Multi-Format Export**: Export any native document to **PDF** (rendered via Puppeteer for clean print layout), **Word (.docx)**, **Markdown (.md)**, or **HTML**.
* **File Uploads**: Store and organize pre-existing files (PDFs, spreadsheets, slide decks, images) in the same workspace.

---

<!-- SCREENSHOT 2: DOCUMENT EDITOR -->
<!--
  Screenshot to add:
  Open any native document (http://localhost:3000/dashboard/files/[id]) and take a screenshot
  showing the rich-text editing canvas, formatting toolbar, and the top actions (Save, Lock, Export).
-->
<img width="1917" height="902" alt="image" src="https://github.com/user-attachments/assets/ebb37e32-8b1b-4d01-b538-9ecf44e9b7da" />
</>

<img width="1917" height="910" alt="image" src="https://github.com/user-attachments/assets/bd65f877-2ac8-4b25-994c-91b1a42a167e" />


---

### 2. Collision-Free Collaboration (Check-In / Check-Out)
* Prevents two people from overwriting each other's edits.
* When you want to edit a document, **check it out** to lock it under your name. Other team members can see who locked the file and when.
* When you are done, **check it in** with an optional change summary. This unlocks the file and automatically increments the version counter.

### 3. Version History & Audit Trail
* Every check-in snapshots the document into an immutable version record.
* View past versions, compare modifications, and restore earlier revisions when needed.
* An automatic audit trail records critical lifecycle events: creation, edits, permission changes, review submissions, approvals, and deletions.

---

<!-- SCREENSHOT 3: VERSION HISTORY & AUDIT LOG -->
<!--
  Screenshot to add:
  Scroll to the version history or audit sidebar in the document view showing
  past versions, timestamps, and user actions.
-->
<img width="1913" height="907" alt="image" src="https://github.com/user-attachments/assets/b1c2cd27-31ff-44da-b2b1-758a54e7bcd2" />
</>

<img width="1917" height="900" alt="image" src="https://github.com/user-attachments/assets/98f155e8-d982-438d-8f2e-63cafe45b783" />


---

### 4. Workspaces, Folders & Teams
* Group related documents into **Project Workspaces** and nested folders.
* Create teams (e.g., Engineering, Marketing, Legal) and attach projects directly to teams.
* Projects can be public to the team or locked down so only approved team members can open them.

### 5. Granular Sharing & Access Control
* **Document-Level Sharing**: Share any individual document with a colleague via email.
* **Permission Levels**:
  * **Viewer**: Read-only access.
  * **Editor**: Can edit and check-in new versions.
* **Download Restrictions**: Toggle whether a recipient is allowed to download the raw source file or view it only in the browser.
* **Access Requests**: If someone navigates to a restricted document or project, they can submit an access request with an explanation. The owner gets notified directly in their dashboard to approve or decline with a single click.

---

<!-- SCREENSHOT 4: SHARING MODAL -->
<!--
  Screenshot to add:
  Click the "Share" button on any document row in the table or within the project view
  and take a screenshot of the popup dialog showing email input and permission selector.
-->
<img width="917" height="696" alt="image" src="https://github.com/user-attachments/assets/909a603c-3d4a-45af-ba4a-7efc4290014e" />
</>
<img width="1000" height="662" alt="image" src="https://github.com/user-attachments/assets/b72e62e6-924b-4b11-971e-38f55639a316" />


---

### 6. Review & Approval Workflow
* Move documents through a structured lifecycle:
  * `DRAFT` &rarr; `PENDING REVIEW` &rarr; `APPROVED` or `CHANGES REQUESTED`
* Submit documents to specific reviewers for review before publication.
* Dedicated review dashboard tabs (**Pending Approval**, **Approved Documents**, **Needs Changes**) so reviewers and authors always know what needs attention.

---

<!-- SCREENSHOT 5: APPROVAL WORKFLOW -->
<!--
  Screenshot to add:
  Navigate to "Pending Approval" in the sidebar (http://localhost:3000/dashboard/approvals)
  and screenshot the review queue with document review cards and action buttons.
-->
<img width="1912" height="901" alt="image" src="https://github.com/user-attachments/assets/7e83b835-418a-4eee-b9f6-cae8741afe1e" />
</>
<img width="1911" height="906" alt="image" src="https://github.com/user-attachments/assets/4c990606-cf92-48cd-8b3b-82f9aba5a71e" />
</>
For User B now it is showing Pending Review
</>
<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/08048611-c897-4858-881f-5f4bc0ef16ea" />

---

## How It Works: A Typical Workflow

```mermaid
flowchart LR
    A[Create Draft Document] --> B[Check-Out / Lock File]
    B --> C[Edit in Rich-Text Editor]
    C --> D[Check-In as New Version]
    D --> E[Submit for Approval]
    E --> F{Reviewer Decision}
    F -->|Approved| G[Marked Approved / Ready to Share]
    F -->|Needs Changes| H[Author Re-edits & Resubmits]
```

1. **Create or Upload**: Click **New Document** to open the native editor, or click **Upload** to add an existing file.
2. **Lock & Edit**: Check out the document to avoid conflicts. Make edits using formatting, tables, or code snippets.
3. **Save & Version**: Check the document back in. DocFlow creates version `v2`, `v3`, etc.
4. **Request Review**: Submit the document for review. The assigned reviewer receives the request under their **Pending Approval** queue.
5. **Approve & Share**: Once approved, the document is marked official. Share read-only or editor access with specific colleagues or teams.

---

## Tech Stack

* **Framework**: Next.js 16 (App Router)
* **Frontend**: React 19, Tailwind CSS v4, Lucide Icons
* **Rich-Text Editor**: TipTap (ProseMirror-based) with extensions for tables, code blocks, task items, and text styling
* **Database & ORM**: PostgreSQL with Prisma ORM
* **Authentication**: NextAuth.js (Credentials provider with bcrypt password hashing)
* **Export Engine**: Puppeteer (print-accurate PDF rendering), html-to-docx (Word document generation), Turndown (Markdown)

---

## Getting Started Locally

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher)
* [PostgreSQL](https://www.postgresql.org/) database running locally or hosted (e.g., Supabase, Neon)

### 2. Clone and Install
```bash
git clone <repository-url>
cd dms-platform
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:

```env
# PostgreSQL database connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/docflow_db?schema=public"

# NextAuth configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-random-secret-key"
```

> **Tip**: You can generate a random secret for `NEXTAUTH_SECRET` by running:
> ```bash
> openssl rand -base64 32
> ```

### 4. Setup the Database
Push the Prisma schema to your database to create all tables:

```bash
npx prisma db push
```

*(Optional)* If you want to inspect your database data visually in your browser:
```bash
npx prisma studio
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Register an account on the signup page to get started.

---

## Project Structure

```text
├── app/
│   ├── api/                 # Next.js backend API routes
│   │   ├── access-requests/ # Access request submission & approval
│   │   ├── auth/            # NextAuth authentication endpoints
│   │   ├── documents/       # Document CRUD, check-in/out, versions, export
│   │   ├── folders/         # Project workspaces & folder hierarchy
│   │   ├── share/           # Sharing & granular permissions
│   │   ├── teams/           # Team management
│   │   └── upload/          # Direct file upload endpoint
│   ├── dashboard/           # Authenticated application views
│   │   ├── approvals/       # Pending reviews & approved documents
│   │   ├── files/           # My Files document list & native editor
│   │   ├── folders/         # Project workspaces
│   │   ├── shared/          # Documents shared with me
│   │   └── teams/           # Team workspaces
│   ├── login/               # Authentication page (Sign in / Sign up)
│   ├── globals.css          # Design system tokens and styles
│   └── layout.tsx           # Root application layout
├── components/              # Reusable React UI components
│   ├── tiptap/              # Rich-text editor canvas, menus, toolbar
│   ├── FileListTable.tsx    # Document table with sorting & quick actions
│   ├── Header.tsx           # Global search, theme toggle, and user menu
│   ├── Sidebar.tsx          # Navigation sidebar with badges
│   ├── ShareModal.tsx       # Share document dialog
│   └── UploadModal.tsx      # Drag-and-drop file uploader
├── lib/
│   └── db.ts                # Prisma database client singleton
├── prisma/
    └── schema.prisma        # Database schema models

```

---

