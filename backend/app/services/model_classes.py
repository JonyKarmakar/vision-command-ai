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
