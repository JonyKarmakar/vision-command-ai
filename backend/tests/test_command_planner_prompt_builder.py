from app.services.llm_prompt_builder import build_command_planner_prompt


def test_build_command_planner_prompt_returns_expected_shape():
    prompt = build_command_planner_prompt("Blur all people")

    assert prompt["prompt_version"] == "planner-prompt-v1"
    assert "system_prompt" in prompt
    assert "user_prompt" in prompt
    assert "expected_json_schema" in prompt


def test_command_planner_prompt_includes_supported_plan_fields():
    prompt = build_command_planner_prompt("Crop the largest car")
    schema = prompt["expected_json_schema"]

    assert schema["type"] == "object"

    required_fields = schema["required"]

    assert "media_type" in required_fields
    assert "action" in required_fields
    assert "target_class" in required_fields
    assert "target_scope" in required_fields
    assert "requires_detection" in required_fields
    assert "requires_tracking" in required_fields
    assert "parameters" in required_fields
    assert "confidence" in required_fields
    assert "needs_clarification" in required_fields
    assert "clarification_question" in required_fields


def test_command_planner_prompt_includes_actions_scopes_and_rules():
    prompt = build_command_planner_prompt("Track the person in the video")
    user_prompt = prompt["user_prompt"]

    assert "Supported action values:" in user_prompt
    assert "- detect" in user_prompt
    assert "- crop_by_class" in user_prompt
    assert "- blur_all_by_class" in user_prompt
    assert "- track" in user_prompt
    assert "- summarize" in user_prompt

    assert "Supported target_scope values:" in user_prompt
    assert "- all" in user_prompt
    assert "- largest" in user_prompt
    assert "- left" in user_prompt
    assert "- center" in user_prompt

    assert "Set requires_detection=true" in user_prompt
    assert "Set requires_tracking=true only for video tracking plans." in user_prompt


def test_command_planner_prompt_includes_supported_classes_and_aliases():
    prompt = build_command_planner_prompt("Blur the phone")
    user_prompt = prompt["user_prompt"]

    assert "Supported object classes for target_class:" in user_prompt
    assert "person" in user_prompt
    assert "car" in user_prompt
    assert "cell phone" in user_prompt

    assert "Common alias normalizations:" in user_prompt
    assert "- people -> person" in user_prompt
    assert "- bike -> bicycle" in user_prompt
    assert "- phone -> cell phone" in user_prompt


def test_command_planner_prompt_embeds_original_command():
    command = "Zoom into the object on the left"
    prompt = build_command_planner_prompt(command)

    assert command in prompt["user_prompt"]
