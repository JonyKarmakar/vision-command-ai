# VisionCommand AI

VisionCommand AI is an end-to-end AI-powered computer vision application where users can upload an image, run YOLO object detection, and view the annotated detection result through a React frontend.

The project is being built as a learning-focused production-style AI system. The goal is not only to build a computer vision demo, but also to learn full-stack development, Git/GitHub workflow, Docker, CI/CD, and AI model serving.

## Current Features

- Upload an image from the React frontend
- Send image to FastAPI backend
- Store uploaded images locally
- Extract image metadata such as width and height
- Preview uploaded images
- Run YOLO object detection on uploaded images
- Return detected object classes, confidence scores, and bounding boxes
- Generate annotated images with bounding boxes
- Display annotated output in the frontend
- Run backend and frontend together using Docker Compose
- Automatically check backend tests, backend Docker build, and frontend build using GitHub Actions

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- Pillow
- Ultralytics YOLO
- OpenCV
- PyTorch

### DevOps and Workflow

- Git
- GitHub
- GitHub Actions
- Docker
- Docker Compose

## Project Structure

```text
vision-command-ai/
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── vite.config.ts
│
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
│
├── docs/
├── docker-compose.yml
├── .gitignore
└── README.md