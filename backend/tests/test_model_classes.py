from app.services.model_classes import (
    get_supported_model_classes,
    is_supported_model_class,
    normalize_model_class_name,
)


def test_supported_model_classes_include_common_yolo_classes():
    classes = get_supported_model_classes()

    assert "person" in classes
    assert "bicycle" in classes
    assert "car" in classes
    assert "cell phone" in classes
    assert "couch" in classes


def test_normalize_model_class_name_aliases():
    assert normalize_model_class_name("people") == "person"
    assert normalize_model_class_name("bike") == "bicycle"
    assert normalize_model_class_name("motorbike") == "motorcycle"
    assert normalize_model_class_name("phone") == "cell phone"
    assert normalize_model_class_name("sofa") == "couch"
    assert normalize_model_class_name("television") == "tv"


def test_is_supported_model_class_uses_aliases():
    assert is_supported_model_class("bike") is True
    assert is_supported_model_class("phone") is True
    assert is_supported_model_class("wallet") is False


from app.services.model_classes import (
    build_unsupported_class_message,
    get_class_groups,
    normalize_class_request,
)


def test_normalize_model_class_name_person_aliases():
    assert normalize_model_class_name("men") == "person"
    assert normalize_model_class_name("women") == "person"
    assert normalize_model_class_name("children") == "person"


def test_normalize_class_request_reports_supported_alias():
    request = normalize_class_request("people")

    assert request["requested_class"] == "people"
    assert request["normalized_class"] == "person"
    assert request["is_supported"] is True
    assert request["matched_alias"] is True
    assert request["matched_group"] is None


def test_normalize_class_request_reports_unsupported_object():
    request = normalize_class_request("helmet")

    assert request["requested_class"] == "helmet"
    assert request["normalized_class"] == "helmet"
    assert request["is_supported"] is False
    assert request["matched_alias"] is False
    assert request["matched_group"] is None


def test_normalize_class_request_reports_broad_category():
    request = normalize_class_request("vehicles")

    assert request["requested_class"] == "vehicles"
    assert request["normalized_class"] == "vehicles"
    assert request["is_supported"] is False
    assert request["matched_group"] == get_class_groups()["vehicles"]


def test_unsupported_class_message_mentions_open_vocabulary_future_for_arbitrary_objects():
    message = build_unsupported_class_message("helmet")

    assert "Unsupported object class 'helmet'" in message
    assert "current model cannot detect this class" in message
    assert "open-vocabulary detection model" in message


def test_broad_category_message_suggests_specific_supported_classes():
    message = build_unsupported_class_message("vehicles")

    assert "'vehicles' is a broad object category" in message
    assert "specific supported classes" in message
    assert "car" in message
    assert "truck" in message
    assert "motorcycle" in message
