import argparse
import os
import zipfile

try:
    from .render import render_certificate
    from .utils import ensure_output_dir, load_json
except ImportError:
    from render import render_certificate
    from utils import ensure_output_dir, load_json


def create_zip(file_paths, zip_path):
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for file_path in file_paths:
            archive.write(file_path, arcname=os.path.basename(file_path))

    return zip_path


def generate_certificates(
    background_path,
    config_path,
    names_path,
    output_dir,
    college="",
    event="",
):
    config = load_json(config_path)
    names = load_json(names_path)

    if not isinstance(names, list):
        raise ValueError("Names JSON must be an array of strings")

    fields = config.get("fields")
    if not isinstance(fields, list) or not fields:
        raise ValueError("Config JSON must include a non-empty fields array")

    ensure_output_dir(output_dir)
    generated_files = []

    for name in names:
        if not str(name).strip():
            continue

        generated_files.append(
            render_certificate(
                background_path=background_path,
                fields=fields,
                name=str(name).strip(),
                output_dir=output_dir,
                college=college,
                event=event,
            )
        )

    if not generated_files:
        raise ValueError("No valid names were provided")

    zip_path = os.path.join(output_dir, "certificates.zip")
    create_zip(generated_files, zip_path)
    return zip_path


def generate_certificates_from_data(
    background_path,
    fields,
    data,
    output_dir,
    college="",
    event="",
):
    if not isinstance(data, list):
        raise ValueError("Data must be an array of names")

    if not isinstance(fields, list) or not fields:
        raise ValueError("Fields must be a non-empty array")

    ensure_output_dir(output_dir)
    generated_files = []

    for name in data:
        if not str(name).strip():
            continue

        generated_files.append(
            render_certificate(
                background_path=background_path,
                fields=fields,
                name=str(name).strip(),
                output_dir=output_dir,
                college=college,
                event=event,
            )
        )

    if not generated_files:
        raise ValueError("No valid names were provided")

    zip_path = os.path.join(output_dir, "certificates.zip")
    create_zip(generated_files, zip_path)
    return zip_path


def parse_args():
    parser = argparse.ArgumentParser(description="Generate certificate images.")
    parser.add_argument("--background", required=True, help="Background image path")
    parser.add_argument("--config", required=True, help="Config JSON path")
    parser.add_argument("--names", required=True, help="Names JSON array path")
    parser.add_argument("--output", default="backend/output", help="Output directory")
    parser.add_argument("--college", default="", help="Optional college name")
    parser.add_argument("--event", default="", help="Optional event name")
    return parser.parse_args()


def main():
    args = parse_args()

    try:
        zip_path = generate_certificates(
            background_path=args.background,
            config_path=args.config,
            names_path=args.names,
            output_dir=args.output,
            college=args.college,
            event=args.event,
        )
        print(f"Generated ZIP: {zip_path}")
    except Exception as error:
        print(f"Generation failed: {error}")
        raise


if __name__ == "__main__":
    main()
