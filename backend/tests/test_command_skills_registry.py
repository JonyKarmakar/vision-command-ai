from fastapi.testclient import TestClient

from app.main import app
from app.services.command_skills_registry import (
    get_command_skill_by_id,
    get_command_skills_registry,
)


client = TestClient(app)


def test_command_skills_registry_contains_required_metadata():
    registry = get_command_skills_registry()

    assert registry["version"] == "e4.1-command-skills-registry-v1"
    assert registry["milestone"] == "E.4.1"
    assert registry["status"] == "foundation"
    assert registry["skill_count"] == len(registry["skills"])
    assert registry["skill_count"] >= 10

    required_fields = {
        "id",
        "title",
        "category",
        "execution_status",
        "supported_media",
        "user_examples",
        "mapped_actions",
        "mapped_workflows",
        "required_context",
        "optional_context",
        "outputs",
        "limitations",
    }

    for skill in registry["skills"]:
        assert required_fields.issubset(skill.keys())


def test_command_skills_registry_separates_current_and_manual_workflows():
    registry = get_command_skills_registry()
    skills_by_id = {skill["id"]: skill for skill in registry["skills"]}

    assert skills_by_id["background_blur"]["execution_status"] == "implemented_command"
    assert "background_blur" in skills_by_id["background_blur"]["mapped_actions"]

    video_report_skill = skills_by_id["video_analysis_report"]
    assert video_report_skill["execution_status"] == "workflow_available_manual"
    assert any(
        "Command-driven report generation is planned for E.4." in limitation
        for limitation in video_report_skill["limitations"]
    )


def test_get_command_skill_by_id_returns_normalized_skill():
    skill = get_command_skill_by_id("background-blur")

    assert skill is not None
    assert skill["id"] == "background_blur"
    assert skill["category"] == "image_editing"


def test_command_skills_endpoint_returns_registry():
    response = client.get("/commands/skills")

    assert response.status_code == 200
    data = response.json()

    assert data["version"] == "e4.1-command-skills-registry-v1"
    assert data["skill_count"] == len(data["skills"])

    skill_ids = {skill["id"] for skill in data["skills"]}
    assert "detect_objects" in skill_ids
    assert "video_object_analysis_workflow" in skill_ids
    assert "video_analysis_report" in skill_ids


def test_command_skill_detail_endpoint_returns_one_skill():
    response = client.get("/commands/skills/background_blur")

    assert response.status_code == 200
    data = response.json()

    assert data["id"] == "background_blur"
    assert data["execution_status"] == "implemented_command"


def test_command_skill_detail_endpoint_returns_404_for_unknown_skill():
    response = client.get("/commands/skills/not_a_real_skill")

    assert response.status_code == 404
    assert "not_a_real_skill" in response.json()["detail"]
