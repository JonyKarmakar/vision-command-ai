# G.5 Architecture and Deployment Diagrams

This document provides current architecture and deployment diagrams for VisionCommand AI during Milestone G.

The diagrams are written in Mermaid so they render directly in GitHub Markdown.

## Purpose

G.5 makes the project easier to understand visually for:

- GitHub visitors
- recruiters
- technical interviewers
- portfolio reviewers
- future maintainers

The diagrams show implemented behavior and clearly label historical or optional deployment paths.

## Current architecture summary

VisionCommand AI is a full-stack AI media assistant.

It combines:

- React and TypeScript frontend
- FastAPI backend
- YOLO, OpenCV, Pillow, FFmpeg, and PyTorch-based media workflows
- PostgreSQL-backed persistence
- command parsing, planning, execution, and audit metadata
- structured image and video chat
- analysis-memory retrieval over generated outputs
- Docker Compose local demo setup
- historical Render deployment evidence

## Full system architecture

```mermaid
flowchart TD
    user[User or reviewer] --> frontend[React and TypeScript frontend]

    frontend --> mode[User Mode and Developer Mode]
    mode --> upload[Image and video upload UI]
    mode --> command_ui[Command assistant UI]
    mode --> memory_ui[Analysis memory chat UI]
    mode --> history_ui[Generated output and video history UI]
    mode --> observability_ui[Developer observability panels]

    frontend --> api_proxy[Relative /api requests through Vite proxy or hosting rewrite]
    api_proxy --> backend[FastAPI backend]

    backend --> media_api[Media upload and file serving APIs]
    backend --> vision_api[Image and video workflow APIs]
    backend --> command_api[Command parse, plan, prepare, and execute APIs]
    backend --> chat_api[Image chat, video chat, and analysis memory chat APIs]
    backend --> db_api[Database, logs, summaries, and analytics APIs]

    vision_api --> cv_stack[YOLO, OpenCV, Pillow, FFmpeg, PyTorch]
    command_api --> command_services[Parser, planner, validation, skills registry, safety hints]
    chat_api --> llm_services[Rule-based, mock LLM, local LLM, and external-provider aware services]
    chat_api --> memory_services[Analysis memory retrieval and grounded answer services]

    backend --> storage[Filesystem storage for uploads, outputs, videos, logs, and local models]
    backend --> postgres[(PostgreSQL when DATABASE_URL is configured)]

    postgres --> media_metadata[Media metadata]
    postgres --> detection_logs[Detection and inference logs]
    postgres --> command_logs[Command and parser logs]
    postgres --> generated_outputs[Generated output history and lineage]
    generated_outputs --> memory_services
```

## Local Docker architecture

The current primary demo path is local Docker.

```mermaid
flowchart LR
    browser[Browser at localhost:5173] --> vite[Vite frontend container]

    vite -->|relative /api requests| vite_proxy[Vite dev proxy]
    vite_proxy -->|http://backend:8000| backend[FastAPI backend container]

    backend --> storage_mount[Bind mount: ./backend/storage to /app/storage]
    storage_mount --> uploads[uploads]
    storage_mount --> outputs[outputs]
    storage_mount --> videos[videos]
    storage_mount --> logs[logs]
    storage_mount --> models[models/yolo26n.pt]

    backend --> postgres[(PostgreSQL container)]
    postgres --> pg_volume[Docker volume: postgres_data]

    backend --> yolo[YOLO model loading]
    yolo --> models

    subgraph docker_compose[Docker Compose services]
        vite
        backend
        postgres
    end
```

Current local ports:

| Service | Local port | Purpose |
| --- | --- | --- |
| frontend | `5173` | React/Vite app |
| backend | `8000` | FastAPI backend |
| postgres | `5432` | Local PostgreSQL database |

## Local Docker request flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React/Vite frontend
    participant Proxy as Vite /api proxy
    participant Backend as FastAPI backend
    participant Storage as /app/storage
    participant DB as PostgreSQL

    User->>Frontend: Open http://localhost:5173
    User->>Frontend: Upload image or video
    Frontend->>Proxy: POST /api/media/upload
    Proxy->>Backend: POST /media/upload
    Backend->>Storage: Save uploaded media
    Backend->>DB: Save media metadata when configured
    Backend-->>Frontend: Return stored filename and file URL

    User->>Frontend: Run detection or command
    Frontend->>Proxy: POST /api/vision/... or /api/commands/...
    Proxy->>Backend: Forward request
    Backend->>Storage: Read source media
    Backend->>Backend: Run workflow service
    Backend->>Storage: Save generated output
    Backend->>DB: Save logs/history when configured
    Backend-->>Frontend: Return result payload
```

## Historical Render deployment architecture

The Render deployment is historical evidence, not the current guaranteed active demo path.

```mermaid
flowchart TD
    reviewer[Reviewer browser] --> render_frontend[Render Static Site frontend]

    render_frontend -->|/api/* rewrite| render_backend[Render Docker Web Service backend]
    render_backend --> render_postgres[(Render PostgreSQL)]
    render_backend --> render_storage[Ephemeral backend filesystem storage]

    render_backend --> render_yolo[YOLO inference in backend service]

    evidence[Deployment evidence docs] --> render_frontend
    evidence --> render_backend
    evidence --> render_postgres

    note1[Historical controlled cloud demo] --> evidence
    note2[Not current guaranteed live production] --> evidence
    note3[Free-tier database and storage limitations] --> evidence
```

Safe claim:

```text
VisionCommand AI was previously deployed on Render as a controlled public cloud demo.
```

Unsafe claim:

```text
VisionCommand AI currently has a guaranteed active production cloud deployment.
```

## Command execution architecture

```mermaid
flowchart TD
    user_command[User command text or voice input] --> command_panel[Frontend command panel]
    command_panel --> parse_api[POST /api/commands/parse or execute]
    parse_api --> parser[Command parser]

    parser --> rule_based[Rule-based parser]
    parser --> mock_llm[Mock LLM path]
    parser --> real_llm[Real LLM provider-aware path]

    parser --> normalized_command[Normalized command result]
    normalized_command --> planner[Command planner]
    planner --> skill_registry[Command skills registry]
    planner --> safety_hints[Safety hints and readiness labels]
    planner --> prepared_execution[Prepared execution plan]

    prepared_execution --> confirmation[Manual confirmation gate]
    confirmation --> executor[Command executor]

    executor --> image_actions[Image crop, blur, zoom, detect]
    executor --> video_actions[Video trim, frame extraction, sampled detection, tracking-related workflows]

    executor --> generated_output[Generated output]
    executor --> command_audit[Command execution audit summary]

    generated_output --> history[Generated output or video history]
    command_audit --> developer_mode[Developer Mode details]
```

## Generated output history and analysis memory flow

```mermaid
flowchart TD
    workflow[Image, video, or command workflow] --> output[Generated output]
    output --> output_card[Frontend generated output card]
    output --> save_request[Save generated output metadata]
    save_request --> backend[FastAPI backend]
    backend --> generated_table[(generated_outputs table)]

    generated_table --> analysis_item[Analysis memory item]
    analysis_item --> search_text[Searchable summary text]
    analysis_item --> metadata[Media type, source filename, action, detected class hints, privacy/workflow signals]

    search_text --> retrieval[Deterministic retrieval service]
    metadata --> retrieval
    retrieval --> memory_chat[Analysis memory chat]
```

## Analysis-memory RAG-style flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Analysis Memory Chat UI
    participant API as /assistant/analysis-memory-chat
    participant Retrieval as Analysis memory retrieval service
    participant DB as Generated outputs from PostgreSQL
    participant Answer as Grounded answer builder

    User->>UI: Ask a question about previous outputs
    UI->>API: Send question, filters, and retrieval limit
    API->>Retrieval: Retrieve relevant analysis memory items
    Retrieval->>DB: Read generated output history
    DB-->>Retrieval: Return candidate outputs
    Retrieval-->>API: Return ranked source cards
    API->>Answer: Build grounded answer from retrieved items
    Answer-->>API: Answer, notes, limitations, and source cards
    API-->>UI: Display grounded response
    UI-->>User: Show answer and retrieved sources
```

This is RAG-style because the answer is grounded in retrieved project-generated analysis context.

Current boundary:

- no external web search
- no external vector database
- no claim of deep semantic retrieval
- no claim that the system reasons from raw images or videos during memory chat
- answers are grounded in saved/generated analysis outputs

## Deployment status view

```mermaid
flowchart LR
    current[Current primary demo] --> local_docker[Local Docker Compose]
    local_docker --> validated[Validated in G.2]

    historical[Historical deployment proof] --> render_evidence[Render deployment evidence]
    render_evidence --> v04[v0.4.0 deployment milestone]

    future[Optional future deployment] --> paid_cloud[Paid cloud or temporary cloud demo]
    paid_cloud --> managed_db[Managed PostgreSQL]
    paid_cloud --> object_storage[Persistent media or object storage]
    paid_cloud --> monitoring[Monitoring and production logs]

    not_now[Not required in current Milestone G] --> no_paid_render[No paid Render upgrade now]
    not_now --> no_active_prod_claim[No active production claim]
```

## Project explanation

A concise explanation:

```text
VisionCommand AI is a full-stack applied AI media assistant. The frontend lets users upload images or videos, run object detection and editing workflows, execute natural-language commands, and ask grounded questions about previous generated outputs. The FastAPI backend handles media processing, command intelligence, LLM-aware assistant paths, persistence, and analysis-memory retrieval. PostgreSQL stores workflow metadata, generated output history, logs, and analysis memory sources. The current reliable demo path is Docker Compose, while an earlier Render deployment is documented as historical cloud deployment evidence.
```

## Boundary

G.5 does not add new application features.

G.5 does not create a new deployment.

G.5 does not add screenshots or generated image files.

G.5 does not claim v1 readiness.

G.5 only adds visual architecture and deployment documentation for the current implemented project state.
