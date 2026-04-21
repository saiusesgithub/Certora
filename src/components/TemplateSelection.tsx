import { useState } from "react";
import UploadCard from "./UploadCard";

const allowedExtensions = ["png", "jpg", "jpeg", "pdf"];

const getFileExtension = (name: string) => {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
};

const readImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      reject(new Error("Unable to detect image dimensions."));
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });
};

const TemplateSelection = () => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    const extension = getFileExtension(file.name);

    if (!allowedExtensions.includes(extension)) {
      setSelectedFileName(null);
      setDimensions(null);
      setErrorMessage("Unsupported file type. Please upload PNG, JPG, JPEG, or PDF.");
      return;
    }

    setSelectedFileName(file.name);
    setErrorMessage(null);

    if (extension === "pdf") {
      setDimensions(null);
      return;
    }

    try {
      const imageDimensions = await readImageDimensions(file);
      setDimensions(imageDimensions);
    } catch {
      setDimensions(null);
      setErrorMessage("Unable to detect image dimensions from this file.");
    }
  };

  return (
    <section className="template-selection" aria-label="Template selection page">
      <div className="selection-stack">
        <UploadCard
          onFileSelected={handleFileSelected}
          selectedFileName={selectedFileName}
          dimensions={dimensions}
          errorMessage={errorMessage}
        />

        <button type="button" className="selection-card gallery-card" aria-label="Explore template gallery">
          <h2>Explore Template Gallery</h2>
          <p>Choose from pre-made templates</p>
        </button>
      </div>
    </section>
  );
};

export default TemplateSelection;
