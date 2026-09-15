# Build Progress — NEXUS Content Platform

Phase-by-phase tracker. Keep updated after every drop. **Do not delete working
code from earlier phases.**

Stack: Next.js + TS (frontend) · FastAPI + Python (backend) · Supabase Postgres
· Redis · object storage (B2/R2) · Cloudflare CDN · FFmpeg video worker.

Deploy: Python 3.12.7. Vercel root=`frontend`. Render root=`backend`.
DATABASE_URL auto-upgrades to asyncpg + SSL. See SETUP.md for all env vars.

---

## Phase 1 — Foundation ✅ COMPLETE

### Design system + scaffold
Tokens/atmosphere/glass + Button, GlassPanel, Pill, TierBadge, Skeleton, Input,
`cn()`. Frontend (Next.js) + backend (FastAPI) wired, React Query, render.yaml.

### Database
`0001_init.sql` (roles/users/profiles/sessions + indexes + RLS). `core/db.py`
async SQLAlchemy (asyncpg, SSL, pooler-safe). `/api/health/db`.

### Themed app shell + home feed
Header, Sidebar, MobileBottomNav, AppShell, CategoryPills, HeroPoster,
ContentCard, ContentFeed (infinite scroll). Backend `/api/content` seed feed
(placeholder — replaced by real content in Phase 2).

### Authentication (full)
- Register, login, logout, logout-all, /me, refresh (rotating httpOnly cookie).
- Email verification (send on register, /verify-email, /resend-verification).
- Forgot + reset password (email link, revokes sessions on reset).
- bcrypt hashing, JWT access + opaque refresh (hashed at rest).
- Provider-agnostic SMTP email (`core/email.py` + templates) — Resend/any SMTP.
- Frontend: auth-provider (silent refresh), login/register/forgot/reset/verify
  pages, header profile menu, verify-email banner.

### Security hardening
- Per-IP rate limiting on auth endpoints (`core/ratelimit.py`; Redis in P11).
- Security headers middleware (nosniff, frame-deny, referrer, permissions).
- JWT-secret production warning. Deny-by-default RLS. `get_verified_user` dep
  ready for gating uploads/gems.

---

## Phase 2 — Content & Taxonomy (NEXT)
Real content model (video/photo/link), 3-level categories, tags/keywords,
admin category+tag management, upload interface, scheduled publish, thumbnails.
Replaces the placeholder `/api/content` seed feed with real DB content owned by
authenticated users.

## Phases 3–12
Not started. See project spec / memory for the full roadmap.
