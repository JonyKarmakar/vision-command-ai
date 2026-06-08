# VisionCommand AI Cloud Deployment Targets

## Purpose

This document compares possible cloud deployment targets for VisionCommand AI.

The goal is to choose a practical first deployment path for a portfolio-ready demo while keeping the project architecture production-aware.

This document does not deploy the project yet.

---

## Current Project Architecture

VisionCommand AI currently has:

- React and Vite frontend
- FastAPI backend
- PostgreSQL database
- Local media storage
- YOLO model loading
- Optional OpenAI or Ollama LLM provider support
- Docker and Docker Compose support
- Development Dockerfile for frontend
- Production-style frontend Dockerfile with Nginx
- Backend Dockerfile
- Environment variable examples
- Deployment, database, and media storage planning documents

---

## Deployment Requirements

The first cloud deployment should support:

- Backend container deployment
- Frontend deployment
- Backend environment variables
- PostgreSQL connection through DATABASE_URL
- OpenAI API key as backend-only secret if LLM_PROVIDER=openai
- File upload support
- Large enough timeout for video processing
- Clear logs
- Low cost
- Simple GitHub-based deployment workflow

---

## Current Deployment Risks

### Risk 1: Media files are still local

Uploaded files and generated outputs currently live in backend storage folders.

This is acceptable for a first demo only if the limitation is documented.

For production, object storage or persistent volume support is needed.

### Risk 2: YOLO model loading strategy is not finalized

The backend uses MODEL_NAME.

The final deployment must decide whether the model should be downloaded by Ultralytics, copied into the image, mounted, or fetched from object storage.

### Risk 3: Ollama is not ideal for first cloud deployment

Ollama is useful locally, but it is not the simplest option for a first hosted demo.

For first deployment, OpenAI provider or disabled LLM mode is simpler.

### Risk 4: Video processing may need more resources

Video trimming, frame extraction, and tracking can be CPU and memory intensive.

The first deployment should use small sample videos and avoid promising large-scale processing.

---

## Candidate 1: Render

Render is a practical first option for a portfolio deployment.

### Possible setup

- Frontend as static site or Docker web service
- Backend as Docker web service
- PostgreSQL as managed database
- Optional persistent disk for backend media storage
- Environment variables configured in Render dashboard

### Pros

- Beginner-friendly deployment flow
- Good fit for Docker-based backend
- Environment variable management is straightforward
- Managed PostgreSQL available
- Persistent disk option can help with current file storage limitation
- Good for portfolio demos

### Cons

- Persistent disks may require paid services
- Free or low-cost resources may sleep or be limited
- Video processing may be slow on small instances
- Object storage is still better long term

### Fit for VisionCommand AI

Good first deployment target.

Render is suitable if the goal is a simple public demo with the backend and frontend deployed quickly.

---

## Candidate 2: Railway

Railway is another practical first option.

### Possible setup

- Backend service from Dockerfile
- Frontend service from Dockerfile or static deployment pattern
- PostgreSQL plugin/service
- Environment variables through Railway variables
- Optional volumes depending on deployment design

### Pros

- Developer-friendly
- Good GitHub workflow
- PostgreSQL setup is simple
- Dockerfile support
- Good for fast prototyping

### Cons

- Costs and resource limits must be monitored
- Persistent file strategy still needs careful planning
- Long-running video processing may need resource tuning

### Fit for VisionCommand AI

Good first deployment target.

Railway is suitable if the priority is quick setup and simple service wiring.

---

## Candidate 3: Google Cloud Run plus Cloud SQL

Google Cloud Run is a strong production-learning option.

### Possible setup

- Backend container on Cloud Run
- Frontend on Firebase Hosting, Cloud Run, Vercel, or another static host
- PostgreSQL through Cloud SQL
- Media files through Google Cloud Storage
- Secrets through Google Secret Manager or Cloud Run environment variables

### Pros

- Strong production learning value
- Good for containerized backend
- Integrates well with Cloud SQL and Cloud Storage
- Good fit for a cloud-native architecture
- Useful experience for AI, MLOps, and deployment learning

### Cons

- More setup complexity
- More cloud concepts to manage
- Local filesystem should not be treated as persistent
- Cloud SQL and Cloud Storage configuration requires care
- Billing needs attention

### Fit for VisionCommand AI

Best long-term learning target.

Cloud Run is recommended after one simpler deployment has been completed, or if the goal is specifically to learn Google Cloud production patterns.

---

## Candidate 4: Fly.io

Fly.io is useful for Docker-based apps that need regional deployment and persistent volumes.

### Possible setup

- Backend as Fly app
- Frontend as separate Fly app or static deployment elsewhere
- PostgreSQL through Fly Postgres or external managed PostgreSQL
- Volume for media storage if staying filesystem-based temporarily

### Pros

- Good Docker deployment workflow
- Supports persistent volumes
- Good for learning app-level deployment configuration
- Can run close to users by region

### Cons

- More operational understanding required
- Volumes are tied to machines and need careful planning
- Horizontal scaling with file storage still needs object storage thinking
- May be more complex than Render or Railway for the first demo

### Fit for VisionCommand AI

Good technical option, but not the simplest first deployment target.

---

## Candidate 5: Vercel or Netlify for Frontend Only

Vercel or Netlify can be useful for frontend hosting.

### Possible setup

- Frontend hosted on Vercel or Netlify
- Backend hosted separately on Render, Railway, Cloud Run, or Fly.io
- Managed PostgreSQL connected to backend
- Media files served by backend or object storage

### Pros

- Excellent frontend deployment experience
- Good GitHub integration
- Good for React/Vite frontend hosting
- Keeps frontend separate from backend

### Cons

- Backend still needs separate hosting
- API routing and CORS must be configured carefully
- Media URLs must point to the backend or object storage
- More moving parts for first deployment

### Fit for VisionCommand AI

Useful if the frontend is deployed separately.

For first full-stack deployment, using one provider for both frontend and backend may be simpler.

---

## Recommended First Deployment Path

Recommended first path:

1. Render or Railway for the first public demo
2. Managed PostgreSQL
3. Backend Docker service
4. Frontend production build
5. LLM_PROVIDER=disabled first, then OpenAI after the base app works
6. Local filesystem storage temporarily, with limitation documented
7. Object storage added later

Recommended reason:

- Fastest route to a working demo
- Lower operational complexity
- Good enough for portfolio showcase
- Allows later migration to a more production-grade architecture

---

## Recommended Production-Learning Path

Recommended second path:

1. Google Cloud Run for backend
2. Cloud SQL for PostgreSQL
3. Cloud Storage for media files
4. Secret Manager for secrets
5. Firebase Hosting or Cloud Run/Nginx for frontend
6. GitHub Actions for CI/CD deployment

Recommended reason:

- Strong learning value
- Good cloud architecture practice
- Better alignment with modern production AI services
- Better preparation for MLOps and data engineering workflows

---

## Deployment Decision Matrix

| Target | First demo speed | Production learning | PostgreSQL support | Media persistence | Complexity |
| --- | --- | --- | --- | --- | --- |
| Render | High | Medium | Good | Persistent disk or external storage | Low to Medium |
| Railway | High | Medium | Good | Volume or external storage | Low to Medium |
| Google Cloud Run | Medium | High | Cloud SQL | Cloud Storage recommended | Medium to High |
| Fly.io | Medium | Medium to High | Fly Postgres or external DB | Volumes or object storage | Medium |
| Vercel/Netlify frontend only | High for frontend | Medium | Backend external | Backend/object storage required | Medium |

---

## First Deployment Environment Variables

Minimum backend variables:

- DATABASE_URL
- STORAGE_ROOT
- MODEL_NAME
- LLM_PROVIDER
- PYTHONUNBUFFERED

Optional backend variables:

- OPENAI_API_KEY
- OPENAI_MODEL
- OLLAMA_BASE_URL
- OLLAMA_MODEL

Frontend variable:

- VITE_BACKEND_URL

Important rule:

Frontend variables must not contain backend secrets.

---

## Recommended First Deployment Mode

For the first hosted demo:

- LLM_PROVIDER=disabled
- DATABASE_URL configured with managed PostgreSQL
- STORAGE_ROOT set according to platform
- MODEL_NAME set to the selected YOLO model
- Use small sample images and videos
- Test upload, detection, annotation, crop, blur, video frame extraction, and dashboard pages
- Enable OpenAI only after base deployment works

---

## First Deployment Checklist

Before first deployment:

- [ ] Choose first provider
- [ ] Confirm frontend deployment method
- [ ] Confirm backend Docker deployment method
- [ ] Confirm PostgreSQL provider
- [ ] Configure DATABASE_URL as backend secret
- [ ] Configure LLM_PROVIDER
- [ ] Keep OPENAI_API_KEY backend-only if used
- [ ] Confirm media storage limitation
- [ ] Confirm upload size limit
- [ ] Confirm backend timeout behavior
- [ ] Confirm YOLO model loading
- [ ] Confirm frontend can call backend API
- [ ] Confirm CORS or proxy routing
- [ ] Confirm logs are visible
- [ ] Confirm app works after redeploy

---

## Suggested Next Milestones

After this document:

1. Create provider-specific deployment checklist
2. Start with Render or Railway
3. Deploy PostgreSQL
4. Deploy backend
5. Deploy frontend
6. Test public demo workflow
7. Add deployment troubleshooting notes
8. Add object storage abstraction later

---

## Recommendation

For the next implementation milestone, choose one first deployment provider.

Recommended first provider:

Render or Railway

Recommended learning provider after that:

Google Cloud Run with Cloud SQL and Cloud Storage

The first goal should be a working public demo, not perfect production architecture.

---

## Related Files

- docker-compose.yml
- backend/Dockerfile
- frontend/Dockerfile.prod
- frontend/nginx.conf
- backend/.env.example
- frontend/.env.example
- docs/deployment-roadmap.md
- docs/environment-variables.md
- docs/database-deployment-plan.md
- docs/media-storage-plan.md
