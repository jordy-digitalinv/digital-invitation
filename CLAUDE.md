@AGENTS.md

# Project: digital-invitation

Wedding invitation SaaS built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma + Supabase (PostgreSQL).

## Stack & Versions
- Next.js 16.2.6 (App Router) — read `node_modules/next/dist/docs/` before any Next.js code
- React 19, TypeScript strict mode
- Tailwind CSS v4 — config via `postcss.config.mjs`, no `tailwind.config.js`
- Prisma 6 + PostgreSQL
- next-auth v5 (beta) — auth APIs differ from v4
- Framer Motion v12
- Zod v4

## File Structure
- `src/app/` — App Router pages & API routes
- `src/components/invitation/` — per-theme template directories (`dark/`, `classic/`, `sage/`, `pearl/`, `envelope/`)
- `src/components/cms/` — CMS/admin UI components
- `src/components/common/` — shared UI components
- `src/lib/` — utilities, prisma client, auth config
- `src/types/` — shared TypeScript types
- `prisma/schema.prisma` — source of truth for data model

## Template / Theme Rules
- Each theme lives in `src/components/invitation/templates/<slug>/`
- `TemplateRenderer.tsx` routes to templates by `client.theme.templateSlug`
- When adding a new theme: create the directory, implement the component, register in `TemplateRenderer`, the `ThemeEditor` TEMPLATES array, and `TEMPLATE_SLUGS` in the theme API route
- Available slugs: `classic-elegant` (default), `modern-minimal`, `floral-blush`; `lucky-envelope` is legacy (unregistered from catalog but still renders for old data)
- Guest invitation categories are derived dynamically from the client's events — see `src/lib/categories.ts` (`getInvitationCategories`). Combo values use `+` separator (e.g. `PEMBERKATAN+RESEPSI`)
- Client slug doubles as invitation subdomain: `<slug>.digital-invitation.my.id`

## Coding Conventions
- No comments unless the WHY is non-obvious
- No unnecessary abstractions — three similar lines > premature helper
- Server Components by default; add `"use client"` only when needed (event handlers, hooks, browser APIs)
- API routes go in `src/app/api/` as Route Handlers (`route.ts`)
- Use `formatDate` from `@/lib/utils` for Indonesian locale date formatting
- Use `MusicPlayer` from `../../sections/MusicPlayer` with `registerPlay` prop + ref
- Animations: `useInView({ once: false, amount: 0.15 })` from framer-motion for scroll animations

## Database
- Always run `prisma db push` (dev) or `prisma migrate dev` (with migration history) — never edit the DB directly
- Prisma Client is a singleton in `src/lib/database/prisma.ts` — never instantiate a new `PrismaClient` outside it
- Two Supabase projects: one for Development (local `.env.local`), one for Production (Vercel env vars) — never mix
- `guest.maxPax` — max allowed attendees per invitation link
- Gallery types: `HERO`, `COVER`, `BACKGROUND`, `GALLERY`, `PREWEDDING`
- Event types: `AKAD`, `PEMBERKATAN`, `RESEPSI`, `AFTER_PARTY`, `SANGJIT`, `LAMARAN`

## Environment / Deployment
- Main invitation domain is env-driven: `NEXT_PUBLIC_INVITATION_DOMAIN` (prod: `digital-invitation.my.id`)
- Never hardcode domains — always read from env with `"digital-invitation.my.id"` as fallback
- Supabase Storage (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) backs guest photo uploads (bucket `guest-photos`)

## Key API Contracts
- RSVP: `POST /api/rsvp` — `{ clientId, guestId, token, name, paxCount, status, message }`
- Wishes: `POST /api/wishes` — `{ clientId, name, message, guestId }`

## Do NOT
- Don't use `getServerSideProps` / `getStaticProps` — this is App Router
- Don't create a new `PrismaClient` instance outside `src/lib/prisma.ts`
- Don't install new dependencies without asking first
- Don't touch `prisma/schema.prisma` without mentioning the migration step

## Invitation UX Rules

* Wedding invitations are emotional products, not dashboard applications.
* Prioritize visual storytelling over dense information display.
* Every section should feel premium and intentional.
* Avoid generic SaaS-style layouts.
* Mobile experience is the primary target.
* Most guests will open invitations from WhatsApp links.

## Theme Architecture Rules

* Each theme must be self-contained.
* Avoid importing styling or components from other theme directories.
* Shared logic belongs in common components, not theme folders.
* Themes should be interchangeable without affecting invitation data structure.
* A theme must be able to render gracefully even when optional content is missing.

## Theme Design Rules

* Every theme requires:

  * Hero Section
  * Couple Section
  * Event Section
  * Story / Timeline Section (if available)
  * Gallery Section
  * RSVP Section
  * Wishes Section
  * Gift Section (if enabled)
  * Closing Section
  * Music Player

* Never hide required sections because of design preferences.

* Maintain consistent spacing rhythm across sections.

* Large visual breaks are preferred over cramped layouts.

## Performance Rules

* Optimize for mobile devices first.
* Avoid unnecessary re-renders.
* Avoid animation-heavy effects that reduce FPS on mid-range Android devices.
* Lazy load images whenever possible.
* Minimize client-side JavaScript.

## Framer Motion Rules

* Use subtle animations.
* Prefer opacity, translateY, scale.
* Avoid excessive rotations and bouncing effects.
* Entrance animations should feel elegant and wedding-oriented.
* Animation duration should generally remain between 0.4s–1.2s.

## Image Rules

* Always assume uploaded images may have inconsistent dimensions.
* Use defensive layouts that handle portrait and landscape images.
* Prevent layout shifts caused by image loading.
* Hero images must maintain visual quality on mobile.

## CMS Rules

* Admin users are non-technical users.
* Prioritize clarity over clever UI patterns.
* Every form should have sensible defaults.
* Avoid exposing implementation details to CMS users.

## Accessibility Rules

* Maintain sufficient text contrast.
* Interactive elements must remain usable on mobile.
* Buttons should have touch-friendly sizes.
* Content must remain readable even when animations are disabled.

## Error Handling Rules

* Fail gracefully when optional data is missing.
* Missing gallery images should not break layout.
* Missing music should disable player cleanly.
* Missing event data should hide only the affected section.

## New Theme Rules

Before creating a new theme:

1. Check existing theme implementations.
2. Follow existing section data contracts.
3. Register the theme in:

   * TemplateRenderer
   * ThemeEditor
   * Any template selection UI
4. Verify responsive behavior on:

   * 390px width
   * 430px width
   * Tablet width
   * Desktop width

## Wedding Industry Rules

* Design should feel timeless rather than trendy.
* Avoid gaming, corporate, SaaS, fintech, or dashboard aesthetics.
* Prioritize elegance, romance, celebration, and family values.
* Guests range from teenagers to elderly family members.
* Readability is more important than visual experimentation.

## AI Generation Rules

When generating code:

* Always inspect existing project patterns before creating new components.
* Reuse existing utility functions before creating new ones.
* Follow existing naming conventions.
* Do not introduce new dependencies.
* Do not refactor unrelated files.
* Keep changes as small and focused as possible.
* Prefer modifying existing files over creating new abstractions.
- Always inspect existing theme implementations before creating a new theme.
- Follow existing design patterns unless explicitly instructed otherwise.
- Prefer consistency with the current codebase over introducing a better but different pattern.