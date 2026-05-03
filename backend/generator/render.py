import os

from PIL import Image, ImageDraw, ImageFont

try:
    from .utils import hex_to_rgb, replace_placeholders, safe_filename
except ImportError:
    from utils import hex_to_rgb, replace_placeholders, safe_filename


FONT_FILES = {
    "arial": "arial.ttf",
    "inter": "arial.ttf",
    "georgia": "georgia.ttf",
    "times new roman": "times.ttf",
    "merriweather": "Merriweather_24pt-Regular.ttf",
    "raleway": "Raleway-Regular.ttf",
    "bebas neue": "BebasNeue-Regular.ttf",
    "great vibes": "GreatVibes-Regular.ttf",
    "montserrat": "Montserrat-Regular.ttf",
    "montserrat alternates": "MontserratAlternates-Regular.ttf",
    "pacifico": "Pacifico-Regular.ttf",
    "playfair display": "PlayfairDisplay-Regular.ttf",
    "poppins": "Poppins-Regular.ttf",
    "satisfy": "Satisfy-Regular.ttf",
    "cause": "Cause-Regular.ttf",
    "cinzel": "Cinzel-Regular.ttf",
}


def resolve_font_path(font_family):
    if not font_family:
        return "arial.ttf"

    if os.path.exists(font_family):
        return font_family

    normalized = font_family.strip().lower()
    mapped_font = FONT_FILES.get(normalized, font_family)
    project_font_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "public", "fonts", mapped_font)
    )

    if os.path.exists(project_font_path):
        return project_font_path

    windows_font_path = os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", mapped_font)

    if os.path.exists(windows_font_path):
        return windows_font_path

    return mapped_font


def load_font(font_family, font_size):
    try:
        return ImageFont.truetype(resolve_font_path(font_family), font_size)
    except OSError:
        try:
            return ImageFont.truetype(resolve_font_path("arial"), font_size)
        except OSError:
            return ImageFont.load_default()


def fit_text(draw, text, font_family, font_size, max_width):
    font = load_font(font_family, font_size)

    while font_size > 8:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]

        if text_width <= max_width:
            return font

        font_size -= 1
        font = load_font(font_family, font_size)

    return font


def draw_field(draw, field, name, college="", event="", canvas_width=None):
    field_type = field.get("type", "text")
    raw_text = field.get("text", f"{{{{{field_type}}}}}")
    text = replace_placeholders(raw_text, name, college, event)

    font_size = int(field.get("fontSize", 32))
    font_family = field.get("fontFamily", "arial.ttf")
    color = hex_to_rgb(field.get("color", "#ffffff"))
    x = int(field.get("x", 0))
    y = int(field.get("y", 0))
    max_width = int(field.get("maxWidth", canvas_width - x if canvas_width else 600))
    font = fit_text(draw, text, font_family, font_size, max_width)

    draw.text((x, y), text, font=font, fill=color)


def render_certificate(background_path, fields, name, output_dir, college="", event=""):
    if not os.path.exists(background_path):
        raise FileNotFoundError(f"Background image not found: {background_path}")

    with Image.open(background_path).convert("RGB") as image:
        draw = ImageDraw.Draw(image)

        for field in fields:
            draw_field(
                draw,
                field,
                name=name,
                college=college,
                event=event,
                canvas_width=image.width,
            )

        output_name = f"{safe_filename(name)}.png"
        output_path = os.path.join(output_dir, output_name)
        image.save(output_path)
        return output_path
