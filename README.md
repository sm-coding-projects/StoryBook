# StoryBook 📸

**A beautiful client gallery platform for photographers.**

<!-- ![StoryBook Screenshot](screenshot.png) -->

## Features

- **Create & organize photo collections** — Group photos into collections within galleries
- **Beautiful, responsive gallery view** — Masonry layout with smooth lightbox browsing
- **Password-protected galleries** — Secure client galleries with bcrypt-hashed passwords
- **Client favorites & proofing** — Clients can favorite photos and leave notes
- **Photo downloads** — Single photo and bulk download support
- **Drag-and-drop uploads** — Upload photos with real-time progress tracking
- **Gallery slideshow mode** — Full-screen slideshow for client presentations
- **Photographer branding** — Custom logo, colors, and fonts per gallery
- **Email sharing** — Send gallery links directly to clients via email
- **Mobile-optimized** — Fully responsive design for all devices

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5 (credentials + Google OAuth)
- **Storage:** AWS S3 / Cloudflare R2 (presigned URL uploads)
- **Image Processing:** Sharp (thumbnails, web-size, watermarks)
- **State:** Zustand (client) + React Query (server)
- **Email:** Resend (transactional emails)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- S3-compatible storage (AWS S3, Cloudflare R2, MinIO)

### Setup

```bash
# Clone the repository
git clone https://github.com/sm-coding-projects/StoryBook.git
cd StoryBook

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see table below)

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `POSTGRES_PRISMA_URL` | PostgreSQL connection string (pooled) | Yes |
| `POSTGRES_URL_NON_POOLING` | PostgreSQL connection string (direct) | Yes |
| `NEXTAUTH_SECRET` | Random secret for session encryption | Yes |
| `NEXTAUTH_URL` | App URL (e.g., `http://localhost:3000`) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `S3_BUCKET` | S3 bucket name | Yes |
| `S3_REGION` | S3 region | Yes |
| `S3_ACCESS_KEY_ID` | S3 access key | Yes |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | Yes |
| `S3_ENDPOINT` | Custom S3 endpoint (for R2/MinIO) | No |
| `RESEND_API_KEY` | Resend API key for emails | No |

## Deployment

Vercel is the recommended deployment platform:

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com)
3. Add all required environment variables
4. Deploy — Vercel auto-detects Next.js and configures the build

Subsequent pushes to `main` trigger automatic deployments.

## License

MIT
