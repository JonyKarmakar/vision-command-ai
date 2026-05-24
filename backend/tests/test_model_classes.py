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
