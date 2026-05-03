import base64
import os
import shutil
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "vendor"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

try:
    from generator.main import generate_certificates_from_data
except ImportError:
    from backend.generator.main import generate_certificates_from_data


BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "output")


class GenerateRequest(BaseModel):
    templatePath: str = ""
    templateData: str = ""
    fields: list[dict] = Field(default_factory=list)
    data: list[str] = Field(default_factory=list)
    college: str = ""
    event: str = ""


app = FastAPI(title="Certora API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clean_old_output():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for entry in os.listdir(OUTPUT_DIR):
        if entry == ".gitkeep":
            continue

        path = os.path.join(OUTPUT_DIR, entry)
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)


@app.post("/generate")
def generate(request: GenerateRequest):
    clean_old_output()
    run_output_dir = os.path.join(OUTPUT_DIR, str(uuid.uuid4()))

    try:
        os.makedirs(run_output_dir, exist_ok=True)
        background_path = request.templatePath

        if request.templateData:
            encoded_template = request.templateData.split(",", 1)[-1]
            background_path = os.path.join(run_output_dir, "template.png")

            with open(background_path, "wb") as template_file:
                template_file.write(base64.b64decode(encoded_template))

        if not background_path:
            raise ValueError("templatePath or templateData is required")

        zip_path = generate_certificates_from_data(
            background_path=background_path,
            fields=request.fields,
            data=request.data,
            output_dir=run_output_dir,
            college=request.college,
            event=request.event,
        )
    except Exception as error:
        if os.path.exists(run_output_dir):
            shutil.rmtree(run_output_dir)

        raise HTTPException(status_code=400, detail=str(error)) from error

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename="certificates.zip",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
