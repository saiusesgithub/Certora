import { useRef, useState } from "react";

type UploadCardProps = {
  onFileSelected: (file: File) => void;
  selectedFileName: string | null;
  dimensions: { width: number; height: number } | null;
  errorMessage: string | null;
};

const UploadCard = ({
  onFileSelected,
  selectedFileName,
  dimensions,
  errorMessage,
}: UploadCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    // Accept only one file and ignore extras.
    onFileSelected(files[0]);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <article className="selection-card upload-card" aria-label="Upload template">
      <h2>Upload Template</h2>
      <p>Upload your certificate design (PNG, JPG, PDF)</p>

      <div
        className={`dropzone ${isDragging ? "is-dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Drag and drop template file or click to browse"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          multiple={false}
          onChange={(event) => {
            handleFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
          className="file-input"
        />
        <span>
          {isDragging
            ? "Drop your template here"
            : "Drag and drop file here, or click to browse"}
        </span>
      </div>

      {selectedFileName ? <p className="file-meta">Selected: {selectedFileName}</p> : null}
      {dimensions ? (
        <p className="file-meta">
          Dimensions: {dimensions.width} x {dimensions.height}
        </p>
      ) : null}
      {errorMessage ? <p className="file-error">{errorMessage}</p> : null}
    </article>
  );
};

export default UploadCard;
