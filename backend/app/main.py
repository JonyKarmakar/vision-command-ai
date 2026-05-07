from fastapi import FastAPI

app = FastAPI(
    title="VisionCommand AI Backend",
    description="Backend API for the VisionCommand AI project",
    version="0.1.0",
)


@app.get("/")
def root():
    return {"message": "VisionCommand AI backend is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
