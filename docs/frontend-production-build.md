# Frontend Production Build

## Purpose

This document explains the frontend production build strategy for VisionCommand AI.

The existing frontend Dockerfile is kept for local development because it runs the Vite development server on port 5173.

For production-style Docker deployment, the project now includes a separate production Dockerfile:

- frontend/Dockerfile.prod

This avoids breaking the current local Docker Compose workflow while preparing the frontend for production static serving.

---

## Current Frontend Behavior

The frontend uses React, TypeScript, and Vite.

Local development command:

npm run dev

Production build command:

npm run build

The production build output is created in:

frontend/dist

---

## API Routing Strategy

The frontend source code currently calls backend endpoints using relative /api paths.

Examples:

- /api/media/upload
- /api/vision/detect
- /api/video/trim
- /api/db/stats
- /api/commands/parse
- /api/llmops/dashboard

During local Vite development, vite.config.ts proxies /api requests to VITE_BACKEND_URL.

During production Docker serving, nginx.conf proxies /api requests to the backend container.

This keeps the frontend code stable and avoids hardcoding backend URLs inside React components.

---

## Files Added

### frontend/Dockerfile.prod

Builds the React/Vite app and serves the generated static files with Nginx.

Build stage:

- Uses node:22-alpine
- Installs dependencies with npm ci
- Runs npm run build

Runtime stage:

- Uses nginx:1.27-alpine
- Serves frontend/dist from Nginx
- Exposes port 80

### frontend/nginx.conf

Serves the frontend and proxies backend API calls.

Main behavior:

- Serves static frontend assets from /usr/share/nginx/html
- Proxies /api/ requests to http://backend:8000/
- Supports large uploads with client_max_body_size 200M
- Uses try_files fallback for single-page app routing

---

## Local Development vs Production

### Local development

Use the existing frontend Dockerfile or local npm dev server.

Existing local Dockerfile:

- frontend/Dockerfile
- Runs npm run dev
- Exposes port 5173

### Production-style Docker

Use the production Dockerfile:

- frontend/Dockerfile.prod
- Builds static files
- Serves through Nginx
- Exposes port 80

---

## Build Commands

Run local production build check:

npm run build

Build production Docker image:

docker build -f frontend/Dockerfile.prod -t vision-command-frontend-prod ./frontend

---

## Important Notes

- frontend/Dockerfile remains for local development.
- frontend/Dockerfile.prod is for production-style static serving.
- VITE_BACKEND_URL is used by Vite development proxy.
- In the production Docker setup, /api routing is handled by Nginx.
- The backend service must be reachable as backend:8000 when using this Nginx config in Docker networking.
- For Vercel, Netlify, or other static hosting platforms, equivalent /api rewrite rules will be needed.
