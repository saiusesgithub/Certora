import json
import os


def load_json(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def ensure_output_dir(path):
    os.makedirs(path, exist_ok=True)
    return path


def safe_filename(value):
    cleaned = "".join(
        character if character.isalnum() or character in (" ", "-", "_") else ""
        for character in value.strip()
    )
    cleaned = "_".join(cleaned.split())
    return cleaned or "certificate"


def hex_to_rgb(value):
    color = value.strip().lstrip("#")

    if len(color) != 6:
        raise ValueError(f"Invalid hex color: {value}")

    return tuple(int(color[index : index + 2], 16) for index in (0, 2, 4))


def replace_placeholders(value, name, college="", event=""):
    return (
        str(value)
        .replace("{{name}}", name)
        .replace("{{college}}", college)
        .replace("{{event}}", event)
    )
