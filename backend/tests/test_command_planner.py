from app.services.command_planner import plan_command


def test_plan_detect_all_objects_in_image():
    plan = plan_command("Detect all objects in this image")

    assert plan.media_type == "image"
    assert plan.action == "detect"
    assert plan.target_class is None
    assert plan.target_scope == "all"
    assert plan.requires_detection is True
    assert plan.requires_tracking is False
    assert plan.needs_clarification is False


def test_plan_blur_all_people():
    plan = plan_command("Blur all people")

    assert plan.media_type == "image"
    assert plan.action == "blur_all_by_class"
    assert plan.target_class == "person"
    assert plan.target_scope == "all"
    assert plan.requires_detection is True
    assert plan.requires_tracking is False
    assert plan.needs_clarification is False


def test_plan_crop_largest_car():
    plan = plan_command("Crop the largest car")

    assert plan.media_type == "image"
    assert plan.action == "crop_by_class"
    assert plan.target_class == "car"
    assert plan.target_scope == "largest"
    assert plan.requires_detection is True
    assert plan.requires_tracking is False
    assert plan.needs_clarification is False


def test_plan_track_person_in_video():
    plan = plan_command("Track the person in the video")

    assert plan.media_type == "video"
    assert plan.action == "track"
    assert plan.target_class == "person"
    assert plan.target_scope == "single"
    assert plan.requires_detection is True
    assert plan.requires_tracking is True
    assert plan.needs_clarification is False


def test_plan_zoom_object_on_left():
    plan = plan_command("Zoom into the object on the left")

    assert plan.media_type == "image"
    assert plan.action == "zoom"
    assert plan.target_class is None
    assert plan.target_scope == "left"
    assert plan.requires_detection is True
    assert plan.requires_tracking is False
    assert plan.needs_clarification is False


def test_plan_uses_existing_model_class_aliases():
    bike_plan = plan_command("Crop the bike")
    phone_plan = plan_command("Blur the phone")

    assert bike_plan.target_class == "bicycle"
    assert phone_plan.target_class == "cell phone"


def test_plan_unknown_command_needs_clarification():
    plan = plan_command("Make it better somehow")

    assert plan.media_type == "unknown"
    assert plan.action == "unknown"
    assert plan.target_class is None
    assert plan.target_scope == "unknown"
    assert plan.requires_detection is False
    assert plan.requires_tracking is False
    assert plan.needs_clarification is True
    assert plan.clarification_question is not None


def test_plan_crop_without_class_needs_clarification():
    plan = plan_command("Crop the object")

    assert plan.media_type == "image"
    assert plan.action == "crop_by_class"
    assert plan.target_class is None
    assert plan.target_scope == "single"
    assert plan.requires_detection is True
    assert plan.needs_clarification is True
    assert plan.clarification_question == "Which object class should I use for this command?"


def test_plan_blur_all_people_includes_command_skill_metadata():
    plan = plan_command("Blur all people")

    assert plan.command_skill is not None
    assert plan.command_skill["id"] == "blur_by_class"
    assert plan.command_skill["execution_status"] == "implemented_command"
    assert "POST /commands/execute" in plan.command_skill["mapped_workflows"]


def test_plan_video_summary_includes_manual_video_workflow_metadata():
    plan = plan_command("Summarize this video")

    assert plan.media_type == "video"
    assert plan.action == "summarize"
    assert plan.command_skill is not None
    assert plan.command_skill["id"] == "video_object_analysis_workflow"
    assert plan.command_skill["execution_status"] == "workflow_available_manual"


def test_plan_unknown_command_has_no_command_skill_metadata():
    plan = plan_command("Make it better somehow")

    assert plan.action == "unknown"
    assert plan.command_skill is None
