from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def root():
    return {"message": "VisionCommand AI backend is running"}


@router.get("/health")
def health_check():
    return {"status": "healthy"}
