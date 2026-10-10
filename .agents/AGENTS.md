# Vercel Deployment & Security Guidelines for AI Agent

## 🚀 Overview & Principles
This workspace (`EduCore`) is configured for seamless deployment on Vercel. All future agent interactions, builds, and code additions must comply with Vercel security standards, Next.js optimization guidelines, and edge caching rules.

---

## 🔒 Security Best Practices

### 1. HTTP Security Headers
All requests served via Vercel are protected with production-grade HTTP security headers configured in [`vercel.json`](file:///e:/user/Schools/vercel.json):
- `Strict-Transport-Security`: Enforces HSTS with a 2-year duration (`max-age=63072000; includeSubDomains; preload`).
- `X-Frame-Options`: Set to `SAMEORIGIN` to mitigate clickjacking attacks.
- `X-Content-Type-Options`: Set to `nosniff` to prevent MIME type sniffing.
- `Referrer-Policy`: Configured to `origin-when-cross-origin`.
- `Permissions-Policy`: Restricts camera, microphone, and geolocation access (`camera=(), microphone=(), geolocation=()`).

### 2. Secret & Environment Variable Hygiene
- **Never commit `.env` or `.env.local` files containing real API secrets into version control.**
- Always reference public environment variables with the `NEXT_PUBLIC_` prefix (e.g., `NEXT_PUBLIC_APP_URL`).
- Use Vercel Environment Variables (`Vercel Dashboard -> Settings -> Environment Variables`) for Production, Preview, and Development environments.

---

## ⚡ Performance & Caching Rules

### 1. Static Asset Caching
- Static assets under `/_next/static/*` are configured with `Cache-Control: public, max-age=31536000, immutable`.
- Utilize Next.js default page generation strategies (SSG / ISR / Dynamic SSR) efficiently.

### 2. Bundle Optimization
- Keep third-party dependencies lightweight.
- Ensure all pages in `pages/` avoid unnecessary heavy client-side imports.

---

## 🛠️ Vercel CLI & Deployment Commands

- **Deploying to Vercel via CLI**:
  ```bash
  npx vercel
  ```
- **Deploying to Production**:
  ```bash
  npx vercel --prod
  ```
- **Pulling Vercel Environment Variables**:
  ```bash
  npx vercel env pull .env.local
  ```

---

## 📋 Pre-Deployment Checklists for Agent Tasks

Before submitting PRs or executing production deployments, verify:
- [x] [`vercel.json`](file:///e:/user/Schools/vercel.json) exists and contains valid security headers.
- [x] Project builds cleanly via `npm run build` with zero syntax or SSR errors.
- [x] All routes handle missing local storage gracefully on server side (using `typeof window !== 'undefined'`).
