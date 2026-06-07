# VisionCommand AI Environment Variables

## Purpose

This document explains the environment variables used by VisionCommand AI for local development, Docker Compose, and future production deployment.

The goal is to keep local configuration simple while making production secrets, public frontend variables, database configuration, and LLM provider settings clear.

---

## Environment Files

Current environment example files:

- backend/.env.example
- frontend/.env.example

Important rules:

- Do not commit real .env files.
- Do not commit API keys.
- Do not commit production database credentials.
- Frontend environment variables are public and must not contain secrets.
- Backend environment variables may contain secrets and should be configured through the deployment provider.

---

## Backend Environment Variables

### DATABASE_URL

PostgreSQL connection string used by the backend.

Local Docker Compose example:

DATABASE_URL=postgresql://vision_user:vision_password@postgres:5432/vision_command

Local non-Docker example:

DATABASE_URL=postgresql://vision_user:vision_password@127.0.0.1:5432/vision_command

Production pattern:

DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>

Production notes:

- Store it as a backend secret or environment variable.
- Do not commit it to Git.
- Do not expose it to the frontend.

---

### LLM_PROVIDER

Selects the LLM provider used by the backend command parser.

Supported values:

- disabled
- openai
- ollama

Recommended local default:

LLM_PROVIDER=disabled

Recommended first cloud deployment option:

LLM_PROVIDER=openai

Notes:

- disabled is safest for local/default development.
- openai is suitable for cloud deployment.
- ollama is mainly suitable for local or self-hosted environments.

---

### OPENAI_API_KEY

OpenAI API key used by the backend when LLM_PROVIDER=openai.

Production notes:

- Required only when LLM_PROVIDER=openai.
- Must be stored only in the backend environment.
- Must never be placed in frontend variables.
- Must never be committed to Git.

---

### OPENAI_MODEL

OpenAI model name used by the backend when LLM_PROVIDER=openai.

Example:

OPENAI_MODEL=gpt-4o-mini

Notes:

- Required only when LLM_PROVIDER=openai.
- The selected model should balance quality, speed, and cost.
- The value can be changed without modifying application code.

---

### OLLAMA_BASE_URL

Base URL for a local or self-hosted Ollama server when LLM_PROVIDER=ollama.

Local example:

OLLAMA_BASE_URL=http://localhost:11434

Notes:

- Required only when LLM_PROVIDER=ollama.
- Best suited for local development or self-hosted deployments.
- Not recommended for the first simple cloud demo unless Ollama is hosted separately.

---

### OLLAMA_MODEL

Ollama model name used when LLM_PROVIDER=ollama.

Example:

OLLAMA_MODEL=llama3.2

Notes:

- Required only when LLM_PROVIDER=ollama.
- The model must already be available in the Ollama server.
- Small local models may produce weaker structured JSON responses than stronger hosted models.

---

### PYTHONUNBUFFERED

Controls Python output buffering.

Recommended value:

PYTHONUNBUFFERED=1

Notes:

- Useful for Docker logs.
- Safe for local and production environments.

---

## Frontend Environment Variables

### VITE_BACKEND_URL

Backend API base URL used by Vite development proxy/config.

Local non-Docker example:

VITE_BACKEND_URL=http://127.0.0.1:8000

Docker Compose example:

VITE_BACKEND_URL=http://backend:8000

Production example:

VITE_BACKEND_URL=https://<deployed-backend-url>

Important frontend notes:

- Vite frontend variables are public to the browser.
- Do not put secrets in frontend environment variables.
- API keys such as OPENAI_API_KEY must stay in backend environment variables only.

---

## Local Docker Compose Configuration

The current docker-compose.yml contains local development values for:

- PostgreSQL database name
- PostgreSQL user
- PostgreSQL password
- Backend DATABASE_URL
- Frontend VITE_BACKEND_URL

These values are for local development only.

Production notes:

- Do not reuse local Docker Compose credentials in production.
- Production database credentials should come from the managed database provider.
- Backend secrets should be configured in the backend hosting provider.
- Frontend public config should only contain public URLs or non-secret values.

---

## Recommended First Cloud Deployment Values

Backend:

- DATABASE_URL=<managed-postgresql-connection-string>
- LLM_PROVIDER=openai
- OPENAI_API_KEY=<backend-secret>
- OPENAI_MODEL=<chosen-openai-model>
- PYTHONUNBUFFERED=1

Frontend:

- VITE_BACKEND_URL=https://<deployed-backend-url>

Recommended first cloud approach:

- Use OpenAI provider for cloud deployment.
- Keep Ollama as a local or self-hosted provider option.
- Keep real API keys only in the backend environment.
- Use managed PostgreSQL for production-like deployment.

---

## Security Checklist

Before deployment:

- [ ] No .env file is committed.
- [ ] No OpenAI API key is committed.
- [ ] No production database credential is committed.
- [ ] OPENAI_API_KEY exists only in backend environment variables.
- [ ] Frontend variables contain only public values.
- [ ] Production DATABASE_URL is configured through the hosting provider.
- [ ] Local Docker Compose credentials are not reused in production.
- [ ] Ollama is treated as local/self-hosted unless separately deployed.

---

## Related Files

- backend/.env.example
- frontend/.env.example
- docker-compose.yml
- docs/deployment-roadmap.md
