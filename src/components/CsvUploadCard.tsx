import { useRef } from "react";

type CsvUploadCardProps = {
  onFileSelected: (file: File) => void;
  selectedFileName: string | null;
  disabled: boolean;
};

const CsvUploadCard = ({ onFileSelected, selectedFileName, disabled }: CsvUploadCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) {
      return;
    }

    onFileSelected(files[0]);
  };

  return (
    <article className="selection-card" aria-label="Upload CSV data">
      <h2>Upload CSV</h2>
      <p>Upload a CSV file containing your recipient data.</p>

      <div
        className={`dropzone csv-dropzone ${disabled ? "is-disabled" : ""}`}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Click to upload CSV"
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          multiple={false}
          className="file-input"
          onChange={(event) => {
            handleFileSelect(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
          disabled={disabled}
        />
        <span>
          {disabled ? "Textarea input is active. Clear it to use CSV." : "Click to upload a CSV file"}
        </span>
      </div>

      {selectedFileName ? <p className="file-meta">Selected: {selectedFileName}</p> : null}
    </article>
  );
};

export default CsvUploadCard;
