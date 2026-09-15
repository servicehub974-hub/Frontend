# NEXUS — Full Setup Guide (Database + Environment)

এক জায়গায় সব: Supabase database setup, পুরো SQL, আর কোন environment variable
কোথায় বসাতে হবে (Render / Vercel / local)।

---

## 1) Supabase project তৈরি

1. https://supabase.com → নতুন project বানাও।
2. Project বানানোর সময় একটা **Database Password** দেবে — এটা লিখে রাখো (পরে
   `DATABASE_URL`-এ লাগবে)। ভুলে গেলে: **Project Settings → Database → Reset
   database password**.

---

## 2) Database SQL চালাও (একবার)

Supabase → **SQL Editor** → **New query** → নিচের পুরো SQL paste করে **Run**।
(এটাই `backend/db/migrations/0001_init.sql` ফাইল।)

```sql
-- Extensions
create extension if not exists citext;

-- updated_at helper
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Roles
create table if not exists roles (
  id          smallint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);
insert into roles (name) values ('user'), ('creator'), ('admin')
on conflict (name) do nothing;

-- Users
create table if not exists users (
  id                 uuid primary key default gen_random_uuid(),
  email              citext not null unique,
  username           citext not null unique,
  password_hash      text,
  display_name       text,
  role_id            smallint not null default 1 references roles(id),
  status             text not null default 'active'
                       check (status in ('active','suspended','banned')),
  email_verified     boolean not null default false,
  created_by_user_id uuid references users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_users_role       on users(role_id);
create index if not exists idx_users_status      on users(status);
create index if not exists idx_users_created_at  on users(created_at, id);
drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

-- Profiles (1:1)
create table if not exists profiles (
  user_id     uuid primary key references users(id) on delete cascade,
  avatar_url  text,
  cover_url   text,
  bio         text,
  location    text,
  website     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Sessions (refresh tokens)
create table if not exists sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  refresh_token_hash  text not null,
  user_agent          text,
  ip                  inet,
  expires_at          timestamptz not null,
  revoked_at          timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists idx_sessions_user       on sessions(user_id);
create index if not exists idx_sessions_expires_at on sessions(expires_at);

-- Row Level Security (backend uses a privileged connection; deny anon/PostgREST)
alter table users    enable row level security;
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table roles    enable row level security;
```

Run করার পর **Table Editor**-এ `roles`, `users`, `profiles`, `sessions`
টেবিল দেখতে পাবে। `roles`-এ ৩টা row (user/creator/admin) থাকবে।

---

## 3) DATABASE_URL বের করো

Supabase → **Project Settings → Database → Connection string** → **URI** ট্যাব।
সেখানে **Connection pooling** (Transaction, port **6543**) টা নাও — এটা এমন
দেখতে:

```
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

এখন এটাকে আমাদের **async** ফর্মে বদলাও — শুধু শুরুর `postgresql://` কে
`postgresql+asyncpg://` করো, আর `[YOUR-PASSWORD]` জায়গায় আসল password বসাও:

```
postgresql+asyncpg://postgres.abcdefgh:tomar_password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

> এটাই তোমার `DATABASE_URL`। (SSL আপনাআপনি হ্যান্ডেল হবে — কোড-এ করা আছে।)
> Password-এ special character (@, #, : ইত্যাদি) থাকলে সেগুলো URL-encode করতে
> হবে — সমস্যা এড়াতে password-এ শুধু অক্ষর+সংখ্যা রাখা ভালো।

---

## 4) Environment variables — কোনটা কোথায়

### 🔵 Backend → Render (Settings → Environment)

| Key | Value (production) |
|---|---|
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | উপরের async connection string |
| `JWT_SECRET` | লম্বা random string (নিচে বানানোর নিয়ম) |
| `CORS_ORIGINS` | তোমার Vercel URL, যেমন `https://your-app.vercel.app` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` |
| `PYTHON_VERSION` | `3.12.7` |

`JWT_SECRET` বানাও:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### 🟢 Frontend → Vercel (Settings → Environment Variables)

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | তোমার Render backend URL, যেমন `https://nexus-api.onrender.com` |

> Render-এ `CORS_ORIGINS` আর Vercel-এ `NEXT_PUBLIC_API_URL` — দুটো একে অপরের
> দিকে ঠিকঠাক তাক করা থাকতে হবে, নইলে CORS/connection error আসবে।

---

## 5) Local development (নিজের পিসিতে চালাতে)

**`backend/.env`** (ফাইল বানাও, `.env.example` কপি করে):
```
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql+asyncpg://postgres.abcdefgh:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
JWT_SECRET=dev-secret-anything
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

**`frontend/.env.local`**:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> Local-এও একই Supabase DB ব্যবহার করতে পারো (উপরের একই `DATABASE_URL`)। আলাদা
> local Postgres লাগবে না।

---

## 6) Verify (ঠিক হলো কিনা)

1. Backend deploy/run → খোলো `.../api/health/db` → `{"database":"connected"}`
   দেখলে DB ঠিক আছে। `not_configured` = DATABASE_URL সেট হয়নি। `error` = URL
   ভুল বা password ভুল।
2. Frontend-এ `/register` → account বানাও → Supabase **Table Editor → users**-এ
   নতুন row দেখবে।
3. Page refresh দিলেও logged in থাকবে।

সমস্যা হলে `/api/health/db`-এর `detail` অংশ বা Render log পাঠিও।

---

## 7) Email / SMTP (verification + password reset)

Auth এখন verification + forgot/reset password ইমেইল পাঠাতে পারে। যেকোনো SMTP
provider চলবে — শুধু env বদলাবে।

### Resend SMTP (Render env)
| Key | Value |
|---|---|
| `EMAIL_ENABLED` | `true` |
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `resend` |
| `SMTP_PASSWORD` | তোমার Resend API key (`re_...`) |
| `SMTP_FROM` | `onboarding@resend.dev` (বা verified domain-এর ঠিকানা) |
| `SMTP_FROM_NAME` | `NEXUS` |
| `SMTP_TLS` | `false` |
| `SMTP_SSL` | `true` |
| `FRONTEND_URL` | তোমার Vercel URL (ইমেইলের link এখান থেকে বানে) |

> পোর্ট 587 ব্যবহার করলে: `SMTP_PORT=587`, `SMTP_TLS=true`, `SMTP_SSL=false`।
> অন্য provider (Mailgun/Gmail/নিজের server) — শুধু উপরের SMTP_* মানগুলো সেই
> provider-এরটা দিয়ে বদলাও, কোড একই থাকবে।
> `EMAIL_ENABLED=false` রাখলে ইমেইল "পাঠানো" হবে না, শুধু log হবে (dev-এ ঠিক আছে;
> register response-এ `verification_token` তখনো আসে টেস্টের জন্য)।

### কাজ করছে কিনা
1. env সেট করে backend redeploy।
2. `/register` করো → ইমেইল আসবে "Verify your email" — link-এ ক্লিক →
   `/verify-email` page → verified ✓ (উপরের হলুদ banner চলে যাবে)।
3. `/forgot-password` → ইমেইল → `/reset-password` link → নতুন password।
