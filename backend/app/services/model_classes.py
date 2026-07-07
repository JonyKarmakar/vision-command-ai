SUPPORTED_OBJECT_CLASSES = [
    "person",
    "bicycle",
    "car",
    "motorcycle",
    "airplane",
    "bus",
    "train",
    "truck",
    "boat",
    "traffic light",
    "fire hydrant",
    "stop sign",
    "parking meter",
    "bench",
    "bird",
    "cat",
    "dog",
    "horse",
    "sheep",
    "cow",
    "elephant",
    "bear",
    "zebra",
    "giraffe",
    "backpack",
    "umbrella",
    "handbag",
    "tie",
    "suitcase",
    "frisbee",
    "skis",
    "snowboard",
    "sports ball",
    "kite",
    "baseball bat",
    "baseball glove",
    "skateboard",
    "surfboard",
    "tennis racket",
    "bottle",
    "wine glass",
    "cup",
    "fork",
    "knife",
    "spoon",
    "bowl",
    "banana",
    "apple",
    "sandwich",
    "orange",
    "broccoli",
    "carrot",
    "hot dog",
    "pizza",
    "donut",
    "cake",
    "chair",
    "couch",
    "potted plant",
    "bed",
    "dining table",
    "toilet",
    "tv",
    "laptop",
    "mouse",
    "remote",
    "keyboard",
    "cell phone",
    "microwave",
    "oven",
    "toaster",
    "sink",
    "refrigerator",
    "book",
    "clock",
    "vase",
    "scissors",
    "teddy bear",
    "hair drier",
    "toothbrush",
]

CLASS_ALIASES = {
    "people": "person",
    "persons": "person",
    "human": "person",
    "humans": "person",
    "man": "person",
    "men": "person",
    "woman": "person",
    "women": "person",
    "child": "person",
    "children": "person",
    "bike": "bicycle",
    "bikes": "bicycle",
    "cycle": "bicycle",
    "cycles": "bicycle",
    "motorbike": "motorcycle",
    "motorbikes": "motorcycle",
    "motor cycle": "motorcycle",
    "motor cycles": "motorcycle",
    "plane": "airplane",
    "planes": "airplane",
    "aeroplane": "airplane",
    "aeroplanes": "airplane",
    "traffic signal": "traffic light",
    "traffic signals": "traffic light",
    "hydrant": "fire hydrant",
    "street sign": "stop sign",
    "bag": "handbag",
    "bags": "handbag",
    "travel bag": "suitcase",
    "travel bags": "suitcase",
    "ball": "sports ball",
    "balls": "sports ball",
    "sofa": "couch",
    "sofas": "couch",
    "plant": "potted plant",
    "plants": "potted plant",
    "table": "dining table",
    "tables": "dining table",
    "television": "tv",
    "televisions": "tv",
    "smartphone": "cell phone",
    "smartphones": "cell phone",
    "phone": "cell phone",
    "phones": "cell phone",
    "mobile": "cell phone",
    "mobiles": "cell phone",
    "mobile phone": "cell phone",
    "mobile phones": "cell phone",
    "cellphone": "cell phone",
    "cellphones": "cell phone",
    "fridge": "refrigerator",
    "fridges": "refrigerator",
    "hair dryer": "hair drier",
    "hair dryers": "hair drier",
}


def get_supported_model_classes():
    return SUPPORTED_OBJECT_CLASSES.copy()


def get_class_aliases():
    return dict(CLASS_ALIASES)


def normalize_model_class_name(class_name: str):
    normalized = " ".join(class_name.lower().strip().split())

    if normalized in CLASS_ALIASES:
        return CLASS_ALIASES[normalized]

    if normalized in SUPPORTED_OBJECT_CLASSES:
        return normalized

    if normalized.endswith("s") and len(normalized) > 1:
        singular = normalized[:-1]

        if singular in CLASS_ALIASES:
            return CLASS_ALIASES[singular]

        if singular in SUPPORTED_OBJECT_CLASSES:
            return singular

    return normalized


def is_supported_model_class(class_name: str):
    return normalize_model_class_name(class_name) in SUPPORTED_OBJECT_CLASSES


def get_class_groups():
    return {
        "vehicle": [
            "bicycle",
            "car",
            "motorcycle",
            "airplane",
            "bus",
            "train",
            "truck",
            "boat",
        ],
        "vehicles": [
            "bicycle",
            "car",
            "motorcycle",
            "airplane",
            "bus",
            "train",
            "truck",
            "boat",
        ],
        "animal": [
            "bird",
            "cat",
            "dog",
            "horse",
            "sheep",
            "cow",
            "elephant",
            "bear",
            "zebra",
            "giraffe",
        ],
        "animals": [
            "bird",
            "cat",
            "dog",
            "horse",
            "sheep",
            "cow",
            "elephant",
            "bear",
            "zebra",
            "giraffe",
        ],
        "furniture": [
            "chair",
            "couch",
            "bed",
            "dining table",
            "toilet",
        ],
        "food": [
            "banana",
            "apple",
            "sandwich",
            "orange",
            "broccoli",
            "carrot",
            "hot dog",
            "pizza",
            "donut",
            "cake",
        ],
    }


def normalize_class_request(class_name: str):
    requested = " ".join(str(class_name).lower().strip().split())
    normalized = normalize_model_class_name(requested)
    supported = normalized in SUPPORTED_OBJECT_CLASSES
    class_groups = get_class_groups()
    matched_group = class_groups.get(requested)

    return {
        "requested_class": requested,
        "normalized_class": normalized,
        "is_supported": supported,
        "matched_alias": normalized != requested and supported,
        "matched_group": matched_group,
    }


def get_supported_class_examples(limit: int = 15):
    return SUPPORTED_OBJECT_CLASSES[:limit]


def build_unsupported_class_message(class_name: str):
    request = normalize_class_request(class_name)

    if request["matched_group"]:
        examples = ", ".join(request["matched_group"])
        return (
            f"'{request['requested_class']}' is a broad object category. "
            "The current model works with specific supported classes, not broad categories. "
            f"Try one of these supported classes: {examples}."
        )

    examples = ", ".join(get_supported_class_examples())
    return (
        f"Unsupported object class '{class_name}'. "
        "The current model cannot detect this class. "
        f"Try supported classes like: {examples}. "
        "For arbitrary objects, this project would need an open-vocabulary detection model in a future milestone."
    )
