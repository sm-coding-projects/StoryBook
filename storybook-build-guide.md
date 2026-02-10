# StoryBook — Complete Build Guide

## Build a Pixieset-style Client Gallery Using Claude Code Agent Teams

---

## Project References

| Resource | URL |
|---|---|
| **Figma Design (Make)** | https://www.figma.com/make/KKrNZ2u2AuPePr5oeEgTVS/StoryBook |
| **Figma Published Site** | https://wish-sage-44236274.figma.site/ |
| **GitHub Repository** | https://github.com/sm-coding-projects/StoryBook |
| **Deployment** | Vercel (via MCP) |

---

## Prerequisites Checklist

Before you start, confirm all of these are ready:

```bash
# 1. Claude Code installed
claude --version

# 2. Agent Teams enabled — add to ~/.claude/settings.json:
# {
#   "env": {
#     "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
#   }
# }

# 3. Verify MCP servers are connected
claude mcp list
# You should see: GitHub MCP, Vercel MCP, Figma MCP (if connected)

# 4. tmux installed (recommended for split-pane view)
tmux -V

# 5. Start a tmux session
tmux new -s storybook
```

If you're missing any MCP servers, add them:

```bash
# GitHub MCP (if not already connected)
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# Vercel MCP (official — for logs, docs, project info)
claude mcp add --transport http vercel https://mcp.vercel.com/sse

# Figma MCP (if not already connected)
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

---

## How This Guide Works

This guide is structured as **5 sequential prompts** you copy-paste into Claude Code. Each prompt is self-contained. Just paste it and let Claude run.

| Step | What It Does | Agent Mode |
|---|---|---|
| **Prompt 1** | Project scaffolding + GitHub setup | Single agent |
| **Prompt 2** | Vercel project setup + GitHub integration | Single agent |
| **Prompt 3** | Full MVP implementation | **Agent Team (3 teammates)** |
| **Prompt 4** | Integration, testing, polish | Single agent |
| **Prompt 5** | Final deploy to production | Single agent |

---

## PROMPT 1 — Project Scaffolding + GitHub Setup

> Copy and paste this entire prompt into Claude Code:

```
I'm building StoryBook, a Pixieset-style client gallery web app for photographers.

Here are the key references:
- Figma design: https://www.figma.com/make/KKrNZ2u2AuPePr5oeEgTVS/StoryBook
- Published Figma site (browse this for visual reference): https://wish-sage-44236274.figma.site/
- GitHub repo: https://github.com/sm-coding-projects/StoryBook

## Task: Scaffold the project and push to GitHub

### Step 1: Clone the repo and set up Next.js
```bash
git clone https://github.com/sm-coding-projects/StoryBook.git
cd StoryBook
```

If the repo is empty, initialize Next.js inside it:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

If it already has files, work with what's there.

### Step 2: Install all dependencies
```bash
npm install prisma @prisma/client next-auth@5 @auth/prisma-adapter
npm install sharp zustand @tanstack/react-query
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install resend bcryptjs nanoid archiver
npm install -D @types/bcryptjs @types/archiver
```

### Step 3: Initialize Prisma
```bash
npx prisma init
```

### Step 4: Set up shadcn/ui
```bash
npx shadcn@latest init -d
npx shadcn@latest add button input dialog dropdown-menu avatar card tabs toast separator badge skeleton scroll-area sheet label select switch textarea popover command tooltip progress
```

### Step 5: Create the full project structure
Create these directories (empty files with .gitkeep if needed):
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── collections/
│   │       ├── page.tsx
│   │       ├── new/page.tsx
│   │       └── [id]/
│   │           ├── page.tsx
│   │           └── settings/page.tsx
│   ├── (gallery)/
│   │   └── g/[slug]/
│   │       ├── page.tsx
│   │       ├── [setId]/page.tsx
│   │       └── favorites/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── collections/route.ts
│       ├── collections/[id]/route.ts
│       ├── collections/[id]/photos/route.ts
│       ├── uploads/presigned/route.ts
│       ├── uploads/complete/route.ts
│       ├── favorites/route.ts
│       ├── downloads/[photoId]/route.ts
│       └── gallery/[slug]/verify/route.ts
├── components/
│   ├── ui/          (shadcn components already here)
│   ├── dashboard/
│   ├── gallery/
│   └── shared/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── s3.ts
│   ├── image-processing.ts
│   ├── email.ts
│   └── utils.ts
├── hooks/
├── stores/
└── types/
    └── index.ts
```

### Step 6: Create the Prisma schema
Write this to `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String       @id @default(cuid())
  name          String?
  email         String       @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?
  brandName     String?
  logo          String?
  primaryColor  String?      @default("#000000")
  accounts      Account[]
  sessions      Session[]
  collections   Collection[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Collection {
  id               String           @id @default(cuid())
  userId           String
  name             String
  slug             String           @unique
  description      String?
  coverPhotoId     String?
  coverStyle       String           @default("standard")
  status           CollectionStatus @default(DRAFT)
  password         String?
  allowDownloads   Boolean          @default(true)
  downloadSize     DownloadSize     @default(ORIGINAL)
  maxDownloads     Int?
  allowFavorites   Boolean          @default(true)
  requireEmail     Boolean          @default(false)
  watermarkEnabled Boolean          @default(false)
  watermarkText    String?
  expiresAt        DateTime?
  fontFamily       String           @default("inter")
  accentColor      String           @default("#000000")
  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  sets             PhotoSet[]
  photos           Photo[]
  favoriteLists    FavoriteList[]
  galleryVisits    GalleryVisit[]
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}

model PhotoSet {
  id           String     @id @default(cuid())
  collectionId String
  name         String
  sortOrder    Int        @default(0)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  photos       Photo[]
  createdAt    DateTime   @default(now())
}

model Photo {
  id            String         @id @default(cuid())
  collectionId  String
  setId         String?
  filename      String
  originalUrl   String
  thumbnailUrl  String?
  webUrl        String?
  width         Int
  height        Int
  sizeBytes     Int
  mimeType      String
  sortOrder     Int            @default(0)
  collection    Collection     @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  set           PhotoSet?      @relation(fields: [setId], references: [id], onDelete: SetNull)
  favoriteItems FavoriteItem[]
  createdAt     DateTime       @default(now())
}

model FavoriteList {
  id           String         @id @default(cuid())
  collectionId String
  clientName   String
  clientEmail  String?
  collection   Collection     @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  items        FavoriteItem[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}

model FavoriteItem {
  id             String       @id @default(cuid())
  favoriteListId String
  photoId        String
  note           String?
  favoriteList   FavoriteList @relation(fields: [favoriteListId], references: [id], onDelete: Cascade)
  photo          Photo        @relation(fields: [photoId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())
  @@unique([favoriteListId, photoId])
}

model GalleryVisit {
  id           String     @id @default(cuid())
  collectionId String
  visitorEmail String?
  ipAddress    String?
  userAgent    String?
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())
}

enum CollectionStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum DownloadSize {
  ORIGINAL
  HIGH
  WEB
}
```

### Step 7: Create the .env.example file
```
DATABASE_URL="postgresql://user:password@localhost:5432/storybook"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AWS S3 / Cloudflare R2
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME="storybook-photos"
S3_REGION="us-east-1"
S3_ENDPOINT=""

# Resend (email)
RESEND_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 8: Create CLAUDE.md in the project root
```markdown
# StoryBook — Client Gallery for Photographers

## What is this?
StoryBook is a web app for photographers to create beautiful, shareable photo galleries for clients. Focused on gallery creation, sharing, proofing (favorites), and downloads. Inspired by Pixieset Client Gallery.

## Design Reference
- Figma Make: https://www.figma.com/make/KKrNZ2u2AuPePr5oeEgTVS/StoryBook
- Published preview: https://wish-sage-44236274.figma.site/
- IMPORTANT: Use the Figma MCP to fetch design context from the Figma Make file. Browse the published site for visual reference. Match the design as closely as possible.

## Tech Stack
- Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- PostgreSQL + Prisma ORM
- NextAuth.js v5 (Auth.js) — credentials + Google OAuth
- AWS S3 / Cloudflare R2 — presigned URLs for uploads
- Sharp — thumbnails (400px), web-size (2048px), watermarks
- Zustand (client state), React Query (server state)
- Resend (transactional emails)

## GitHub & Deployment
- Repo: https://github.com/sm-coding-projects/StoryBook
- Hosting: Vercel (auto-deploys from main branch)
- Use Vercel MCP for deployment logs and project info
- Branch strategy: develop on feature branches, merge to main for deploy

## Project Structure
- src/app/(auth)/ — Login, register
- src/app/(dashboard)/ — Photographer dashboard (protected)
- src/app/(gallery)/g/[slug]/ — Client-facing gallery (public/password-protected)
- src/app/api/ — API routes
- src/components/dashboard/ — Dashboard components
- src/components/gallery/ — Gallery view components
- src/components/ui/ — shadcn/ui primitives
- src/lib/ — Utilities (auth, db, s3, image processing, email)
- prisma/schema.prisma — Database schema

## Key Patterns
- Server Components by default; "use client" only for interactivity
- Server Actions for mutations
- Presigned S3 URLs for client-side photo uploads
- Sharp for thumbnails + web-size on upload completion
- Gallery slugs are unique URL-friendly identifiers
- Collection passwords hashed with bcrypt
- API routes validate auth via getServerSession

## File Ownership (Agent Teams)
- backend: prisma/, src/lib/, src/app/api/, src/types/
- dashboard: src/app/(auth)/, src/app/(dashboard)/, src/components/dashboard/
- gallery: src/app/(gallery)/, src/components/gallery/, src/hooks/, src/stores/
- shared (lead only): src/components/ui/, src/components/shared/, config files, CLAUDE.md

## Commands
- npm run dev — Dev server
- npx prisma db push — Push schema
- npx prisma generate — Generate client
- npm run build — Production build
- npm run lint — Lint
- git push origin main — Triggers Vercel deploy
```

### Step 9: Create .gitignore additions
Make sure .gitignore includes:
```
.env
.env.local
node_modules/
.next/
```

### Step 10: Commit and push
```bash
git add -A
git commit -m "chore: scaffold StoryBook project with Next.js, Prisma, shadcn/ui"
git push origin main
```

### Step 11: Verify
Run `npm run build` to ensure everything compiles. Fix any issues.

DO NOT implement any features yet. Just scaffold, commit, and push.
```

---

## PROMPT 2 — Vercel Project Setup

> Copy and paste this into Claude Code after Prompt 1 completes:

```
I need to connect the StoryBook project to Vercel for deployment.

## Task: Set up Vercel deployment

1. Use the Vercel MCP to check if I already have a project named "StoryBook" or
   "storybook" on Vercel. If not, help me create one.

2. The GitHub repo is: https://github.com/sm-coding-projects/StoryBook
   - Connect this repo to the Vercel project
   - Set the framework preset to Next.js
   - Set the root directory to "/" (project root)
   - Enable automatic deployments from the `main` branch

3. List the environment variables we need to set on Vercel. Based on our
   .env.example, these are:
   - DATABASE_URL
   - NEXTAUTH_URL (set to the Vercel production URL)
   - NEXTAUTH_SECRET
   - GOOGLE_CLIENT_ID (optional)
   - GOOGLE_CLIENT_SECRET (optional)
   - S3_ACCESS_KEY_ID
   - S3_SECRET_ACCESS_KEY
   - S3_BUCKET_NAME
   - S3_REGION
   - S3_ENDPOINT
   - RESEND_API_KEY
   - NEXT_PUBLIC_APP_URL (set to the Vercel production URL)

   Help me set these up via the Vercel MCP or tell me what to set manually
   in the Vercel dashboard.

4. Trigger a deploy and verify the build succeeds. If there are build errors,
   fix them and push again.

5. Tell me the production URL when done.
```

---

## PROMPT 3 — Agent Team Implementation (The Big One)

> This is the main build prompt. Copy and paste the entire thing into Claude Code:

```
I'm building StoryBook, a Pixieset-style client gallery app for photographers.
The project is already scaffolded and connected to GitHub + Vercel.

Read CLAUDE.md for full context. Key references:
- Figma Make file: https://www.figma.com/make/KKrNZ2u2AuPePr5oeEgTVS/StoryBook
- Published Figma preview (browse for visual reference): https://wish-sage-44236274.figma.site/
- GitHub: https://github.com/sm-coding-projects/StoryBook
- Vercel auto-deploys from main branch

IMPORTANT DESIGN INSTRUCTIONS:
- Use the Figma MCP to fetch design context from the Make file for each page/component
- Browse the published Figma site to understand the visual design language
- Match colors, typography, spacing, layout, and component styles from the Figma design
- If you cannot access the Figma file, use a clean, modern, photography-portfolio aesthetic:
  elegant typography, generous whitespace, dark/neutral color palette, full-bleed imagery

Create an agent team with 3 teammates. Use delegate mode — you coordinate only, do not code.

## Git Workflow
- Create a feature branch: git checkout -b feat/mvp-implementation
- Each teammate works on their own files (see ownership below)
- When all tasks are done, the lead merges to main: git checkout main && git merge feat/mvp-implementation && git push origin main
- This triggers Vercel auto-deploy

## Team Structure

### Teammate "backend"
**Owns:** prisma/, src/lib/, src/app/api/, src/types/
**Context:** You are building the backend for a photographer client gallery app. Read CLAUDE.md for full details. Use the Figma references to understand what data each page needs.

**Tasks in order:**

**Task 1 — Database & Auth Setup**
- Run `npx prisma generate` to generate the Prisma client from the existing schema
- Create src/lib/db.ts — Prisma singleton with global caching for dev
- Create src/lib/auth.ts — NextAuth v5 configuration:
  - Credentials provider (email + bcrypt-hashed password)
  - Google OAuth provider
  - Prisma adapter for session/user storage
  - Session callback that includes user ID
- Create src/app/api/auth/[...nextauth]/route.ts — NextAuth route handler
- Create src/types/index.ts — TypeScript types for Collection, Photo, PhotoSet, FavoriteList, etc.
- Test: `npm run build` must pass

**Task 2 — S3 & Image Processing**
- Create src/lib/s3.ts:
  - S3 client initialization (works with both AWS S3 and Cloudflare R2)
  - generatePresignedUploadUrl(key, contentType) — returns a presigned PUT URL
  - generateSignedUrl(key) — returns a signed GET URL for private files
  - deleteObject(key) — delete a file from S3
- Create src/lib/image-processing.ts:
  - generateThumbnail(buffer) — Sharp resize to 400px wide, return buffer
  - generateWebSize(buffer) — Sharp resize to 2048px wide, return buffer
  - applyWatermark(buffer, text) — Sharp composite text watermark overlay
  - getImageDimensions(buffer) — return { width, height }

**Task 3 — Upload API Routes**
- POST /api/uploads/presigned — accepts { filename, contentType, collectionId }
  - Validates auth, generates a unique S3 key, returns presigned URL + key
- POST /api/uploads/complete — accepts { key, collectionId, setId?, filename }
  - Downloads the uploaded file from S3
  - Generates thumbnail + web-size variants using Sharp, uploads them to S3
  - Creates a Photo record in the database with all URLs and dimensions
  - Returns the Photo record

**Task 4 — Collection API Routes**
- POST /api/collections — create a new collection (auto-generate slug with nanoid)
- GET /api/collections/[id] — get collection with sets and photo counts
- PATCH /api/collections/[id] — update collection settings
- DELETE /api/collections/[id] — delete collection and all photos (also delete from S3)
- GET /api/collections/[id]/photos — list photos with pagination (cursor-based), optional setId filter

**Task 5 — Gallery & Favorites API Routes**
- POST /api/gallery/[slug]/verify — verify gallery password, return success boolean
- GET /api/gallery/[slug] — public endpoint, returns collection data if published (check password/email gate)
- POST /api/favorites — create a FavoriteList or add a FavoriteItem
- DELETE /api/favorites — remove a FavoriteItem
- GET /api/favorites/[listId] — get a FavoriteList with all items
- GET /api/downloads/[photoId] — generate a signed download URL for a photo (original/web based on collection settings)

**Task 6 — Email Utility**
- Create src/lib/email.ts:
  - sendGalleryShareEmail({ to, collectionName, galleryUrl, photographerName, message? })
  - Uses Resend SDK

When all tasks are done, run `npm run build` and fix any errors. Then message the lead.


### Teammate "dashboard"
**Owns:** src/app/(auth)/, src/app/(dashboard)/, src/components/dashboard/
**Context:** You are building the photographer dashboard for a client gallery app. Read CLAUDE.md. Use the Figma MCP to fetch design context from the Figma Make file (https://www.figma.com/make/KKrNZ2u2AuPePr5oeEgTVS/StoryBook). Also browse https://wish-sage-44236274.figma.site/ to understand the visual design. Match the Figma design closely.

**Dependency:** Wait for backend Task 1 (auth setup) to complete before starting Task 2.

**Tasks in order:**

**Task 1 — Auth Pages**
- Build src/app/(auth)/login/page.tsx:
  - Email + password form, Google OAuth button
  - Use NextAuth signIn() function
  - Match the Figma design for the login page
  - Link to register page
- Build src/app/(auth)/register/page.tsx:
  - Name, email, password form
  - POST to a registration API endpoint (create this at /api/auth/register)
  - Auto-login after registration
  - Match the Figma design

**Task 2 — Dashboard Layout**
- Build src/app/(dashboard)/layout.tsx:
  - Sidebar with: StoryBook logo, navigation (Collections, Settings), user avatar + dropdown (profile, logout)
  - Main content area with header
  - Mobile: hamburger menu with sheet/drawer sidebar
  - Protected route — redirect to /login if not authenticated
  - Match the Figma dashboard layout exactly

**Task 3 — Collections List Page**
- Build src/app/(dashboard)/page.tsx (or /collections/page.tsx):
  - Grid of collection cards showing: cover photo thumbnail, collection name, photo count, status badge (Draft/Published/Archived), created date
  - "New Collection" button
  - Empty state for no collections
  - Search/filter by name
  - Use React Query to fetch collections
  - Match Figma design

**Task 4 — Create Collection Flow**
- Build src/app/(dashboard)/collections/new/page.tsx:
  - Form: collection name, description, cover style dropdown
  - On submit: POST to /api/collections, redirect to collection detail page
  - Simple and clean UI matching Figma

**Task 5 — Collection Detail Page (Photo Upload & Management)**
- Build src/app/(dashboard)/collections/[id]/page.tsx:
  - Header: collection name, status, quick actions (publish, share, settings)
  - Photo upload zone: drag-and-drop area + file picker
  - Upload flow: get presigned URL → upload to S3 → call /complete endpoint
  - Show upload progress (progress bar per file)
  - Photo grid: masonry or grid layout showing thumbnails
  - Select multiple photos (checkbox), bulk actions (delete, move to set)
  - Set management: create sets, drag photos between sets, tab navigation between sets
  - Match Figma design for the collection detail view

**Task 6 — Collection Settings Page**
- Build src/app/(dashboard)/collections/[id]/settings/page.tsx:
  - Tabbed settings: General, Privacy, Downloads, Branding
  - General: name, description, slug editor, cover photo picker, expiry date
  - Privacy: published/draft toggle, password protection, email registration requirement
  - Downloads: allow downloads toggle, download size (original/high/web), max download limit
  - Branding: accent color picker, font family selector, watermark toggle + text
  - Favorites: enable/disable favorites for clients
  - Save button (PATCH to /api/collections/[id])
  - Match Figma design

**Task 7 — Share Gallery Dialog**
- Build src/components/dashboard/ShareDialog.tsx:
  - Dialog/modal with: gallery URL (copy to clipboard), email share form (to, message)
  - Send gallery via email using the backend email utility
  - Show preview of how the gallery link will look

**Task 8 — Account Settings**
- Build src/app/(dashboard)/settings/page.tsx:
  - Profile: name, email, avatar upload
  - Branding defaults: brand name, logo upload, primary color
  - Save changes

When all tasks are done, run `npm run build` and fix any errors. Then message the lead.


### Teammate "gallery"
**Owns:** src/app/(gallery)/, src/components/gallery/, src/hooks/, src/stores/
**Context:** You are building the client-facing gallery view for a photographer gallery app. This is what clients see when they receive a gallery link. Read CLAUDE.md. Use the Figma MCP to fetch design context from the Figma Make file (https://www.figma.com/make/KKrNZ2u2AuPePr5oeEgTVS/StoryBook). Also browse https://wish-sage-44236274.figma.site/ to understand the visual design. This is the most important part of the app visually — it MUST be stunning and match the Figma design precisely.

**Dependency:** Wait for backend Task 4 and Task 5 (collection + gallery API routes) before starting.

**Tasks in order:**

**Task 1 — Gallery Zustand Store**
- Create src/stores/gallery-store.ts:
  - State: currentPhoto, lightboxOpen, slideshowActive, favorites (local array), viewMode
  - Actions: openLightbox, closeLightbox, nextPhoto, prevPhoto, toggleFavorite, startSlideshow, stopSlideshow

**Task 2 — Gallery Landing Page**
- Build src/app/(gallery)/g/[slug]/page.tsx:
  - Fetch collection data from /api/gallery/[slug]
  - If password-protected and not yet verified: show password gate (clean form, match Figma)
  - If email-required: show email registration form
  - Once authenticated: show gallery cover with:
    - Full-bleed cover photo
    - Collection name overlay
    - Photographer branding (logo, name)
    - "View Gallery" call-to-action or auto-scroll
  - Match Figma gallery landing design exactly

**Task 3 — Gallery Grid View**
- Build src/components/gallery/GalleryGrid.tsx:
  - Responsive masonry layout (CSS columns or a lightweight masonry lib)
  - Lazy-loaded images with blur-up placeholder
  - Set navigation: tabs or horizontal scroll for photo sets
  - Click photo → open lightbox
  - Hover state: subtle overlay with heart icon (favorite) + download icon
  - Infinite scroll or "Load More" pagination
  - Match Figma grid layout

**Task 4 — Photo Lightbox**
- Build src/components/gallery/Lightbox.tsx:
  - Full-screen overlay with dark background
  - Current photo displayed large, centered
  - Previous/Next navigation (arrows + keyboard left/right + swipe on mobile)
  - Close button (X + Escape key)
  - Bottom bar: photo filename, favorite button (heart), download button, photo counter (3/45)
  - Smooth transitions between photos
  - Match Figma lightbox design

**Task 5 — Slideshow Mode**
- Build src/components/gallery/Slideshow.tsx:
  - Full-screen slideshow with Ken Burns effect or crossfade
  - Auto-advance every 4 seconds
  - Pause on hover/click
  - Play/Pause button, Exit button
  - Photo counter

**Task 6 — Favorites System**
- Build src/app/(gallery)/g/[slug]/favorites/page.tsx:
  - Grid of favorited photos
  - Remove from favorites button
  - Add note to each favorite (text field)
  - "Share Favorites" button — copies a link or sends to photographer
  - Total count
- Build src/components/gallery/FavoriteButton.tsx:
  - Heart icon toggle
  - Animated fill on click
  - Syncs with Zustand store and API
- If collection has favorites disabled, hide all favorite UI

**Task 7 — Download System**
- Build src/components/gallery/DownloadButton.tsx:
  - Single photo download: button in lightbox and hover overlay
  - Calls /api/downloads/[photoId], opens signed URL in new tab
- Build src/components/gallery/BulkDownload.tsx:
  - Select multiple photos (checkbox mode)
  - "Download Selected" button
  - Shows count of selected
  - If downloads disabled on collection, hide download buttons and show message

**Task 8 — Mobile Optimization**
- Ensure all gallery components are fully responsive
- Swipe gestures in lightbox (touch events)
- Bottom sheet for photo actions on mobile
- Gallery grid adapts: 1 column on small screens, 2-3 on medium, 3-4 on large
- Touch-friendly favorite and download buttons

When all tasks are done, run `npm run build` and fix any errors. Then message the lead.


## Coordination Rules for the Lead
1. NEVER code yourself — only coordinate, create shared components, and resolve conflicts
2. Ensure backend finishes Task 1 before dashboard starts Task 2
3. Ensure backend finishes Tasks 4-5 before gallery starts Task 2
4. If teammates need a shared component in src/components/shared/, create it yourself
5. Monitor each teammate's progress regularly
6. When all 3 teammates report done:
   - Run `npm run build` and fix any remaining errors
   - Run `npm run lint` and fix warnings
   - Git workflow:
     ```bash
     git add -A
     git commit -m "feat: implement StoryBook MVP — dashboard, gallery, API"
     git checkout main
     git merge feat/mvp-implementation
     git push origin main
     ```
   - This push triggers Vercel auto-deploy
   - Use Vercel MCP to monitor the deployment and check for errors
```

---

## PROMPT 4 — Integration & Polish

> Copy and paste after Prompt 3 completes and the team has merged to main:

```
The StoryBook MVP has been implemented by the agent team. Now I need to
integrate, test, and polish everything.

References:
- Figma: https://wish-sage-44236274.figma.site/
- GitHub: https://github.com/sm-coding-projects/StoryBook
- Read CLAUDE.md for project context

## Task: Integration & Polish

### Step 1: Fix Build Errors
Run `npm run build`. Fix ALL TypeScript and build errors. Do not skip any.

### Step 2: Integration Testing
Test the full user flow by reading through the code and verifying the logic:

**Photographer Flow:**
1. Register a new account (POST /api/auth/register)
2. Login with credentials
3. Create a new collection
4. Upload photos (presigned URL flow)
5. Organize into sets
6. Configure settings (password, downloads, favorites)
7. Publish collection
8. Share gallery link via email

**Client Flow:**
1. Open gallery link
2. Enter password (if required)
3. View gallery grid
4. Open photos in lightbox
5. Navigate between photos
6. Favorite photos + add notes
7. Download individual photos
8. View favorites page

Fix any broken connections between frontend and API. Ensure:
- All API routes return proper status codes and error messages
- All forms have proper validation and error display
- Loading states (skeletons) are shown during data fetches
- Toast notifications appear for: upload complete, collection published, settings saved, errors
- Redirect after login goes to dashboard
- Redirect after register goes to dashboard
- Gallery password gate works correctly
- Favorites persist correctly

### Step 3: Design Polish
Browse the Figma site at https://wish-sage-44236274.figma.site/ and compare
with our implementation. Fix any visual discrepancies:
- Typography (font sizes, weights, line heights)
- Colors and spacing
- Component styling (buttons, cards, inputs)
- Responsive layout at mobile/tablet/desktop breakpoints
- Hover states and transitions
- Empty states (no collections, no photos, no favorites)

### Step 4: SEO & Meta
Add to gallery pages:
- Dynamic page titles: "{Collection Name} | StoryBook"
- Open Graph meta: og:title, og:description, og:image (cover photo)
- Twitter card meta

### Step 5: Final Commit & Deploy
```bash
git add -A
git commit -m "fix: integration, polish, and SEO improvements"
git push origin main
```

Use the Vercel MCP to verify the deployment succeeds. Check the deployment
logs for any runtime errors.
```

---

## PROMPT 5 — Final Verification & README

> Copy and paste after Prompt 4 completes:

```
StoryBook is now deployed on Vercel. Let's do final verification and documentation.

GitHub: https://github.com/sm-coding-projects/StoryBook

## Task 1: Verify Deployment
Use the Vercel MCP to:
- Get the production URL
- Check that the latest deployment succeeded
- Check deployment logs for any runtime errors or warnings
- Confirm the build output looks correct

## Task 2: Create README.md
Write a professional README.md for the GitHub repo. Include:

- Project logo/title: "StoryBook 📸"
- One-line description: "A beautiful client gallery platform for photographers"
- Screenshot placeholder (can add later)
- Features list:
  - Create and organize photo collections
  - Beautiful, responsive client gallery view
  - Password-protected galleries
  - Client favorites/proofing with notes
  - Photo downloads (single + bulk)
  - Drag-and-drop photo upload with progress
  - Gallery slideshow mode
  - Photographer branding (logo, colors, fonts)
  - Email gallery sharing
  - Mobile-optimized gallery experience
- Tech stack badges
- Getting Started section:
  - Prerequisites (Node.js 18+, PostgreSQL, S3-compatible storage)
  - Clone, install, configure .env, prisma push, npm run dev
  - Link to .env.example
- Environment variables table
- Deployment section (Vercel recommended)
- License: MIT

## Task 3: Final Push
```bash
git add -A
git commit -m "docs: add README and finalize project"
git push origin main
```

## Task 4: Summary
Give me a summary of:
- The production URL
- What was built (feature list)
- Any known issues or things that need manual setup (S3 bucket, OAuth credentials, etc.)
- Suggested next steps
```

---

## Quick Reference: Troubleshooting Agent Teams

| Issue | Fix |
|---|---|
| Teammate isn't appearing | Press `Shift+Down` to cycle through teammates. Check if the task was complex enough. |
| Two teammates editing the same file | Intervene immediately. Clarify ownership per CLAUDE.md. Have one teammate revert. |
| Teammate is stuck waiting | Check the blocking teammate's progress. Nudge them or help unblock. |
| Build errors after team finishes | Expected. Prompt 4 handles this. |
| Vercel deploy fails | Use Vercel MCP to check logs. Fix in Prompt 4/5. |
| "Lead is coding instead of coordinating" | Press `Shift+Tab` to switch to delegate mode. |
| Context window running out | Teammate may need a `/clear`. Re-provide their task from the team prompt. |

---

## Post-MVP Feature Roadmap

| Priority | Feature |
|---|---|
| P1 | PWA support ("add to home screen" for clients) |
| P1 | Watermark overlay on gallery view |
| P2 | Gallery analytics dashboard (views, downloads, favorites) |
| P2 | Custom email templates for sharing |
| P2 | Social sharing (WhatsApp, Instagram, Facebook) |
| P3 | Video upload and playback in galleries |
| P3 | Custom domain mapping for photographers |
| P3 | Print store integration |
| P3 | Client comments on photos |
