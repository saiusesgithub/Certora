import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "vendor"))

from PIL import Image, ImageDraw, ImageFont

from utils import hex_to_rgb, replace_placeholders, safe_filename


def load_font(font_family, font_size):
    try:
        if font_family and os.path.exists(font_family):
            return ImageFont.truetype(font_family, font_size)

        return ImageFont.truetype(font_family or "arial.ttf", font_size)
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
