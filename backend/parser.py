from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List


class ParseError(Exception):
    """Raised when input data cannot be parsed into certificate rows."""


def _normalize_row(row: Dict[str, str]) -> Dict[str, str]:
    normalized = {str(key).strip().lower(): (value or "").strip() for key, value in row.items()}

    name = normalized.get("name", "")
    college = normalized.get("college", "")
    event = normalized.get("event", "")

    return {
        "name": name,
        "college": college,
        "event": event,
    }


def parse_csv(csv_path: Path) -> List[Dict[str, str]]:
    if not csv_path.exists():
        raise ParseError(f"CSV file not found: {csv_path}")

    rows: List[Dict[str, str]] = []
    try:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            if not reader.fieldnames:
                raise ParseError("CSV is missing a header row.")

            for raw_row in reader:
                row = _normalize_row(raw_row)
                if not row["name"]:
                    continue
                rows.append(row)
    except csv.Error as exc:
        raise ParseError(f"Invalid CSV format: {exc}") from exc

    if not rows:
        raise ParseError("CSV contains no valid rows with a name column.")

    return rows


def parse_text_list(text_path: Path, default_college: str = "", default_event: str = "") -> List[Dict[str, str]]:
    if not text_path.exists():
        raise ParseError(f"Text list file not found: {text_path}")

    content = text_path.read_text(encoding="utf-8")
    lines = [line.strip() for line in content.splitlines() if line.strip()]

    if not lines:
        raise ParseError("Text list is empty.")

    return [{"name": line, "college": default_college, "event": default_event} for line in lines]


def parse_input_data(input_path: str, default_college: str = "", default_event: str = "") -> List[Dict[str, str]]:
    path = Path(input_path)
    suffix = path.suffix.lower()

    if suffix == ".csv":
        return parse_csv(path)

    if suffix in {".txt", ".list"}:
        return parse_text_list(path, default_college=default_college, default_event=default_event)

    raise ParseError(
        f"Unsupported input file: {path.name}. Use .csv for structured data or .txt for name list."
    )
