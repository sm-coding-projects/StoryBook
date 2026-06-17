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
