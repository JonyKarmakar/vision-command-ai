from pathlib import Path
from typing import BinaryIO
from uuid import uuid4

from app.config import LOG_DIR, OUTPUT_DIR, STORAGE_ROOT, UPLOAD_DIR, VIDEO_DIR


class LocalStorageService:
    """Local filesystem storage service.

    This service keeps the current local/container storage behavior, but
    centralizes file path, URL, and save logic behind one interface.

    Future cloud storage providers can implement the same type of behavior
    without requiring every API endpoint to know storage details.
    """

    def __init__(self) -> None:
        self.root = STORAGE_ROOT
        self.directories = {
            "uploads": UPLOAD_DIR,
            "outputs": OUTPUT_DIR,
            "videos": VIDEO_DIR,
            "logs": LOG_DIR,
        }
        self.url_prefixes = {
            "uploads": "/media/uploads",
            "outputs": "/media/outputs",
            "videos": "/media/videos",
        }

    def ensure_directories(self) -> None:
        """Create all configured storage directories if they do not exist."""
        self.root.mkdir(parents=True, exist_ok=True)

        for directory in self.directories.values():
            directory.mkdir(parents=True, exist_ok=True)

    def make_unique_filename(self, original_filename: str, default_suffix: str = "") -> str:
        """Create a safe unique filename while preserving the original suffix."""
        suffix = Path(original_filename).suffix or default_suffix
        return f"{uuid4().hex}{suffix}"

    def directory_for(self, category: str) -> Path:
        """Return the local directory for a storage category."""
        try:
            return self.directories[category]
        except KeyError as exc:
            valid_categories = ", ".join(sorted(self.directories.keys()))
            raise ValueError(
                f"Unknown storage category '{category}'. "
                f"Valid categories are: {valid_categories}"
            ) from exc

    def path_for(self, category: str, filename: str) -> Path:
        """Return the local file path for a storage category and filename.

        The filename must be a plain filename, not a nested path. This prevents
        accidental path traversal such as '../../secret.txt'.
        """
        safe_filename = Path(filename).name

        if safe_filename != filename:
            raise ValueError("Filename must not contain path separators")

        return self.directory_for(category) / safe_filename

    def url_for(self, category: str, filename: str) -> str:
        """Return the public API URL for a stored media file."""
        try:
            prefix = self.url_prefixes[category]
        except KeyError as exc:
            valid_categories = ", ".join(sorted(self.url_prefixes.keys()))
            raise ValueError(
                f"Storage category '{category}' does not have a public URL. "
                f"Valid URL categories are: {valid_categories}"
            ) from exc

        safe_filename = Path(filename).name

        if safe_filename != filename:
            raise ValueError("Filename must not contain path separators")

        return f"{prefix}/{safe_filename}"

    def save_stream(self, category: str, filename: str, stream: BinaryIO) -> Path:
        """Save a binary stream to local storage and return the stored path."""
        self.ensure_directories()

        destination = self.path_for(category, filename)

        with destination.open("wb") as buffer:
            while chunk := stream.read(1024 * 1024):
                buffer.write(chunk)

        return destination

    def file_size(self, category: str, filename: str) -> int:
        """Return the size of a stored file in bytes."""
        return self.path_for(category, filename).stat().st_size

    def delete_file(self, category: str, filename: str, missing_ok: bool = True) -> None:
        """Delete a stored file."""
        self.path_for(category, filename).unlink(missing_ok=missing_ok)


storage_service = LocalStorageService()
