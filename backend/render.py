from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

from PIL import Image, ImageDraw, ImageFont


class RenderError(Exception):
    """Raised when a certificate cannot be rendered."""


def _parse_color(color_value: object) -> Tuple[int, int, int]:
    if isinstance(color_value, str):
        value = color_value.strip()
        if value.startswith("#") and len(value) == 7:
            return tuple(int(value[i : i + 2], 16) for i in (1, 3, 5))

    if isinstance(color_value, list) and len(color_value) == 3:
        return tuple(int(c) for c in color_value)  # type: ignore[return-value]

    return (0, 0, 0)


def _load_font(font_path: str | None, font_size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if font_path:
        try:
            return ImageFont.truetype(font_path, font_size)
        except OSError as exc:
            raise RenderError(f"Unable to load font: {font_path}") from exc

    for fallback_font in ("arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(fallback_font, font_size)
        except OSError:
            continue

    return ImageFont.load_default()


def _resolve_position(
    field: Dict[str, object],
    image_width: int,
    image_height: int,
    reference_width: int | None,
    reference_height: int | None,
) -> Tuple[float, float]:
    position = field.get("position", {})
    if not isinstance(position, dict):
        return 0.0, 0.0

    x = float(position.get("x", 0))
    y = float(position.get("y", 0))
    is_relative = bool(position.get("relative", False))

    if is_relative:
        return image_width * x, image_height * y

    if reference_width and reference_height:
        scaled_x = (x / reference_width) * image_width
        scaled_y = (y / reference_height) * image_height
        return scaled_x, scaled_y

    return x, y


def _resolve_text(field: Dict[str, object], row: Dict[str, str]) -> str:
    template = str(field.get("template", ""))
    text = template
    for key, value in row.items():
        text = text.replace(f"{{{{{key}}}}}", value)
    return text


def _draw_field(
    draw: ImageDraw.ImageDraw,
    field: Dict[str, object],
    row: Dict[str, str],
    image_size: Tuple[int, int],
    reference_size: Tuple[int | None, int | None],
) -> None:
    style = field.get("style", {})
    if not isinstance(style, dict):
        style = {}

    text = _resolve_text(field, row)
    if not text.strip():
        return

    font_size = int(style.get("font_size", 40))
    font_path = style.get("font_path")
    font = _load_font(str(font_path) if font_path else None, font_size)

    color = _parse_color(style.get("color", "#000000"))
    align = str(style.get("align", "left")).lower()

    x, y = _resolve_position(
        field,
        image_width=image_size[0],
        image_height=image_size[1],
        reference_width=reference_size[0],
        reference_height=reference_size[1],
    )

    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_width = right - left

    draw_x = x
    if align == "center":
        draw_x = x - text_width / 2
    elif align == "right":
        draw_x = x - text_width

    draw.text((draw_x, y), text, fill=color, font=font)


def render_certificates(
    background_image_path: str,
    config: Dict[str, object],
    rows: List[Dict[str, str]],
    output_folder: str,
) -> List[Path]:
    image_path = Path(background_image_path)
    if not image_path.exists():
        raise RenderError(f"Background image not found: {image_path}")

    try:
        base_image = Image.open(image_path).convert("RGBA")
    except OSError as exc:
        raise RenderError(f"Could not open image: {image_path}") from exc

    fields = config.get("fields", [])
    if not isinstance(fields, list):
        raise RenderError("Config is invalid: fields must be a list.")

    reference_size = config.get("reference_size", {})
    ref_width = None
    ref_height = None
    if isinstance(reference_size, dict):
        ref_width = int(reference_size.get("width", 0)) or None
        ref_height = int(reference_size.get("height", 0)) or None

    out_dir = Path(output_folder)
    out_dir.mkdir(parents=True, exist_ok=True)

    rendered_files: List[Path] = []
    for idx, row in enumerate(rows, start=1):
        image = base_image.copy()
        draw = ImageDraw.Draw(image)

        for field in fields:
            if isinstance(field, dict):
                _draw_field(
                    draw,
                    field,
                    row,
                    image_size=image.size,
                    reference_size=(ref_width, ref_height),
                )

        safe_name = "".join(c for c in row.get("name", f"certificate_{idx}") if c.isalnum() or c in (" ", "-", "_"))
        safe_name = safe_name.strip().replace(" ", "_") or f"certificate_{idx}"
        output_path = out_dir / f"{idx:03d}_{safe_name}.png"
        image.convert("RGB").save(output_path, format="PNG")
        rendered_files.append(output_path)

    return rendered_files
