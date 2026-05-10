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
- Filter detections by confidence threshold
- Filter detections by object class
- Display annotated output in the frontend
- Crop individual detected objects
- Crop the best detected object by selected class
- Blur individual detected objects
- Blur the best detected object by class using text or voice command
- Use a command box for simple commands such as `detect objects`, `crop person`, and `blur person`
- Use browser-based voice input for simple image commands
- Log command executions locally
- View recent command history in the frontend
- Open and download original, annotated, cropped, and blurred outputs
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

```
---

## Backend API Endpoints

### Health Check

```text
GET /health
```

Returns backend health status.

---

### Upload Image

```text
POST /media/upload
```

Uploads an image and returns metadata such as filename, width, height, and file URL.

---

### View Uploaded Image

```text
GET /media/uploads/{filename}
```

Returns the uploaded image file.

---

### Run YOLO Detection

```text
POST /vision/detect/{filename}
```

Runs YOLO detection and returns detected objects as JSON.

---

### Run YOLO Detection with Annotated Output

```text
POST /vision/detect/{filename}/annotated
```

Runs YOLO detection, draws bounding boxes, saves the annotated image, and returns the annotated image URL.

---

### View Annotated Output

```text
GET /media/outputs/{filename}
```

Returns generated output images such as annotated, cropped, and blurred images.

---

### Crop Uploaded Image by Coordinates

```text
POST /vision/crop/{filename}
```

Crops an uploaded image using bounding-box coordinates.

Example request:

```json
{
  "x1": 100,
  "y1": 100,
  "x2": 500,
  "y2": 400
}
```

---

### Crop Best Object by Class

```text
POST /vision/crop-by-class/{filename}
```

Finds the highest-confidence object for a requested class and returns a cropped output image.

Example request:

```json
{
  "class_name": "person",
  "confidence_threshold": 0.3
}
```

---

### Blur Uploaded Image Region

```text
POST /vision/blur/{filename}
```

Applies blur to a selected image region using bounding-box coordinates.

Example request:

```json
{
  "x1": 100,
  "y1": 100,
  "x2": 500,
  "y2": 400
}
```

---

### Blur Best Object by Class

```text
POST /vision/blur-by-class/{filename}
```

Finds the highest-confidence object for a requested class and returns a blurred output image.

Example request:

```json
{
  "class_name": "person",
  "confidence_threshold": 0.3
}
```

---

### Execute Text Command

```text
POST /commands/execute
```

Executes simple text commands.

Supported examples:

```text
detect objects
crop person
crop bottle
blur person
blur bottle
```

Example request:

```json
{
  "filename": "uploaded_image.png",
  "command": "crop person",
  "confidence_threshold": 0.3
}
```

---

### View Command Logs

```text
GET /commands/logs
```

Returns recent command execution logs.

Example:

```text
GET /commands/logs?limit=10
```

---

## Run Locally Without Docker

### Start Backend

```bash
cd backend
source vision-env/bin/activate
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

FastAPI docs:

```text
http://127.0.0.1:8000/docs
```

### Start Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## Run Full Stack with Docker Compose

From the project root:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:5173
```

To stop:

```bash
CTRL + C
docker compose down --remove-orphans
```

---

## Testing

### Backend Tests

```bash
cd backend
python -m pytest
```

### Frontend Build

```bash
cd frontend
npm run build
```

---

## CI/CD

The project uses GitHub Actions.

### Backend CI

The backend workflow checks:

- Backend dependencies install correctly
- Backend tests pass
- Backend Docker image builds successfully

### Frontend CI

The frontend workflow checks:

- Frontend dependencies install correctly
- React frontend builds successfully

---

## Current Status

Completed:

- Backend foundation
- Health endpoint
- Image upload API
- Image metadata extraction
- Uploaded media access endpoint
- YOLO object detection endpoint
- Annotated YOLO output endpoint
- Object crop endpoint
- Object blur endpoint
- Crop-by-class endpoint
- Blur-by-class endpoint
- Command execution endpoint
- Command logging endpoint
- Command history endpoint
- React frontend foundation
- Frontend image upload flow
- Frontend YOLO detection flow
- Frontend object crop flow
- Frontend object blur flow
- Frontend command box
- Browser-based voice command input
- Frontend command history
- Backend Dockerfile
- Frontend Dockerfile
- Full-stack Docker Compose setup
- Backend CI
- Frontend CI
- Pull Request workflow

---

## Next Planned Features

Planned future improvements:

- Improve frontend layout and component structure
- Add backend-side command parser improvements
- Add support for commands such as `crop the highest confidence person`
- Add support for commands such as `blur all persons`
- Add video upload support
- Add video trimming with FFmpeg
- Add object tracking for videos
- Add chat command parsing with an LLM
- Add proper speech-to-text backend integration
- Add PostgreSQL for metadata and command logs
- Add MLflow for experiment tracking
- Add DVC for data/model versioning
- Add deployment workflow

---

## Learning Goals

This project is designed to teach:

- Computer vision application development
- YOLO model serving
- FastAPI backend development
- React frontend development
- Git and GitHub workflow
- Pull Requests
- Automated testing
- CI/CD with GitHub Actions
- Docker and Docker Compose
- Full-stack AI system design
- MLOps and LLMOps foundations