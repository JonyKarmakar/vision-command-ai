from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_database_media_files_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/media-files")

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "count": 0,
        "media_files": [],
    }
