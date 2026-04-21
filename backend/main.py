from __future__ import annotations

import argparse
import json
import sys
import zipfile
from pathlib import Path

from parser import ParseError, parse_input_data
from render import RenderError, render_certificates


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Certora certificate generator backend")
    parser.add_argument("--background", required=True, help="Path to certificate background image")
    parser.add_argument("--config", required=True, help="Path to JSON config with fields and styles")
    parser.add_argument("--data", required=True, help="Path to CSV or text list input")
    parser.add_argument("--output", required=True, help="Output folder for generated certificates")
    parser.add_argument("--college", default="", help="Optional default college for text input mode")
    parser.add_argument("--event", default="", help="Optional default event for text input mode")
    parser.add_argument(
        "--zip-name",
        default="certificates.zip",
        help="Output ZIP file name (created inside output folder)",
    )
    return parser.parse_args()


def load_config(config_path: str) -> dict:
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")

    with path.open("r", encoding="utf-8") as config_file:
        try:
            data = json.load(config_file)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON config: {exc}") from exc

    if not isinstance(data, dict):
        raise ValueError("Config root must be a JSON object.")

    return data


def write_zip(files: list[Path], output_folder: str, zip_name: str) -> Path:
    out_dir = Path(output_folder)
    out_dir.mkdir(parents=True, exist_ok=True)

    zip_path = out_dir / zip_name
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in files:
            archive.write(file_path, arcname=file_path.name)

    return zip_path


def main() -> int:
    args = parse_args()

    try:
        config = load_config(args.config)
        rows = parse_input_data(
            args.data,
            default_college=args.college,
            default_event=args.event,
        )
        rendered_files = render_certificates(
            background_image_path=args.background,
            config=config,
            rows=rows,
            output_folder=args.output,
        )

        zip_path = write_zip(rendered_files, args.output, args.zip_name)

        print(f"Generated {len(rendered_files)} certificate(s).")
        print(f"ZIP archive created at: {zip_path}")
        return 0
    except (FileNotFoundError, ValueError, ParseError, RenderError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # Defensive fallback for unexpected failures.
        print(f"Unexpected error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
