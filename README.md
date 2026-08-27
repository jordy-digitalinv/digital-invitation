# Digital Invitation

Wedding invitation SaaS — buat, kelola, dan distribusikan undangan digital pernikahan dengan dashboard admin lengkap (guest list, RSVP, barcode check-in, seating, wishes, WhatsApp blast, dan lainnya).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4**
- **Prisma 6 + Supabase (PostgreSQL)** — 2 project terpisah: Development & Production
- **next-auth v5** (credentials login)
- **Supabase Storage** — foto tamu (disposable camera)
- **Framer Motion 12**

## Struktur Project

```
src/
├── app/
│   ├── admin/              # Dashboard (login required)
│   │   ├── clients/        # Manajemen client + sub-halaman per client
│   │   └── users/          # Manajemen user (SUPERADMIN only)
│   ├── invite/[slug]/      # Undangan publik (?preview=1 untuk preview)
│   ├── invite/g/[token]/   # Undangan personal per tamu
│   ├── login/              # Halaman login
│   └── api/                # Route handlers
├── components/
│   ├── invitation/
│   │   ├── sections/       # Komponen shared antar tema (MusicPlayer, Barcode, dll)
│   │   └── templates/      # Template undangan per tema
│   └── cms/                # UI dashboard admin
├── lib/                    # prisma, auth, supabase, utils
├── modules/                # Service & schema layer (per domain)
└── proxy.ts                # Subdomain rewrite + auth guard
prisma/
├── schema.prisma           # Data model
└── seed.ts                 # Buat user SUPERADMIN pertama
```

## Setup dari Nol

### 1. Install dependencies

```bash
npm install
```

### 2. Buat 2 project Supabase (Development & Production)

Buat **dua project terpisah** di [supabase.com](https://supabase.com) (region singkat: Singapore):

| Project | Kegunaan |
|---|---|
| `digital-invitation-dev` | Development lokal |
| `digital-invitation-prod` | Production di Vercel |

Untuk tiap project, ambil kredensial:

1. **Database**: Project Settings → Database → Connection string
   - `DATABASE_URL` ← **Transaction pooler** (port 6543), tambahkan `?pgbouncer=true&connection_limit=1`
   - `DATABASE_URL_UNPOOLED` ← **Direct connection** (port 5432)
2. **Storage API**: Project Settings → API
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Storage bucket**: Storage → New bucket bernama `guest-photos` (private)

### 3. Isi environment variables

```bash
cp .env.example .env.local
```

Lalu isi nilai **Supabase Development** ke `.env.local`. Generate secret:

```bash
openssl rand -base64 32
```

Variabel production **tidak** ditaruh di file — akan diset di Vercel Dashboard saat deploy.

### 4. Push schema + seed admin

```bash
npm run db:setup
```

### 5. Jalankan development server

```bash
npm run dev
```

## Login Dashboard

Buka `http://localhost:3000/login`:

| Email | Password |
|---|---|
| `admin@digitalinvitation.my.id` | `admin123` |

> Ganti password default sebelum production lewat halaman `/admin/users`.

Role: **SUPERADMIN** (akses penuh), **ADMIN**, **STAFF** (hanya attendance client terkait).

## Template Undangan

Template terdaftar di `TemplateRenderer.tsx` + array `TEMPLATES` di `ThemeEditor.tsx`:

| Slug | Nama | Gaya |
|---|---|---|
| `classic-elegant` | Classic Elegant | Klasik abadi, serif emas *(default)* |
| `modern-minimal` | Modern Minimal | Bersih modern, whitespace lega |
| `floral-blush` | Floral Blush | Romantis lembut, script manis |
| `luxe-darkgold` | Luxe Dark Gold | Mewah dramatis, hitam-emas |
| `sage-botanical` | Sage Botanical | Hijau alami botanikal |
| `rustic-terracotta` | Rustic Terracotta | Hangat kraft countryside |
| `jawa-ageng` | Jawa Ageng | Tradisional Jawa, batik indigo-emas |
| `ambon-manise` | Ambon Manise | Laut Banda, ombak & cengkeh khas Maluku |
| `islami-emerald` | Islami Emerald | Hijau zamrud islami, lengkung kubah |
| `sangjit-merah` | Sangjit Merah | Merah-emas Tionghoa, 囍 lampion |
| `minang-gadang` | Minang Gadang | Minangkabau, songket merah-emas |
| `batak-ulos` | Batak Ulos | Tenunan ulos Batak, Horas! |
| `hanoi-modern` | Hanoi Modern | Editorial modern, tipografi majalah |

Fitur **Auto Scroll** (toggle di tab Tema): halaman bergulir perlahan otomatis setelah undangan dibuka; berhenti saat tamu menggulir sendiri. Berlaku untuk semua tema.

Menambah template baru: buat folder di `src/components/invitation/templates/<slug>/`, implementasikan komponen default export, daftarkan di `TemplateRenderer.tsx`, `ThemeEditor.tsx`, dan enum `TEMPLATE_SLUGS` di route API theme. Detail aturan tema ada di `CLAUDE.md`.

## Link Undangan

Slug client dipakai sebagai **subdomain**: client "Jordy & Rea" (slug `jordy-rea`) →
`https://jordy-rea.digital-invitation.my.id`

Link personal tamu: `https://jordy-rea.domain.com/<guest-token>`.

Untuk tes subdomain di lokal, `.env.local` memakai `NEXT_PUBLIC_INVITATION_DOMAIN=lvh.me:3000`
(`*.lvh.me` otomatis resolve ke 127.0.0.1).

## Deploy ke Vercel (Production)

1. Push repo ke GitHub (repo baru), lalu import di Vercel
2. Set Environment Variables (scope: **Production**) — lihat bagian PRODUCTION di `.env.example`:
   - `DATABASE_URL`, `DATABASE_URL_UNPOOLED` ← Supabase **Prod**
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://digital-invitation.my.id`
   - `NEXT_PUBLIC_INVITATION_DOMAIN=digital-invitation.my.id`
   - `NEXT_PUBLIC_APP_URL=https://digital-invitation.my.id`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ← Supabase **Prod**
3. Jalankan migrasi ke DB prod sekali:
   ```bash
   DATABASE_URL="<prod pooled url>" DATABASE_URL_UNPOOLED="<prod direct url>" npm run db:setup
   ```
4. Tambahkan wildcard domain `*.digital-invitation.my.id` + apex domain di Vercel → Project Settings → Domains
5. DNS registrar: A record apex ke Vercel + CNAME `*` ke `cname.vercel-dns.com`

## Push ke GitHub Baru

```bash
git remote add origin git@github.com:<username>/<repo>.git
git push -u origin main
```

## Scripts

| Command | Fungsi |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
| `npm run db:setup` | Push schema + seed admin |
| `npm run db:migrate` | Migrasi dengan history |
| `npm run db:studio` | Prisma Studio |

Dokumentasi konvensi coding & aturan theme untuk AI ada di `CLAUDE.md`.
