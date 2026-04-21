import { useMemo, useState } from "react";
import CsvUploadCard from "./CsvUploadCard";
import type { EditorPageData } from "./editorTypes";

const cleanerPrompt =
  "Clean and format this list of names into a simple plain list, one per line, without numbering, bullets, or extra spaces. Remove duplicates and fix capitalization. Output only the final cleaned list inside a plain text code block.";

type DataInputProps = {
  templateName: string | null;
  templateType: "image" | "pdf" | null;
  onContinue: (data: EditorPageData) => void;
};

const getLinesFromText = (text: string) => {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const DataInput = ({ templateName, templateType, onContinue }: DataInputProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [pastedData, setPastedData] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [eventName, setEventName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isTextareaActive = pastedData.trim().length > 0;

  const activeInputType = useMemo(() => {
    if (isTextareaActive) {
      return "text" as const;
    }

    if (csvFile) {
      return "csv" as const;
    }

    return "none" as const;
  }, [csvFile, isTextareaActive]);

  const entryCount = useMemo(() => {
    if (activeInputType === "text") {
      return getLinesFromText(pastedData).length;
    }

    if (activeInputType === "csv") {
      return getLinesFromText(csvText).length;
    }

    return 0;
  }, [activeInputType, csvText, pastedData]);

  const handleCsvUpload = async (file: File) => {
    const extension = file.name.toLowerCase().split(".").pop() ?? "";

    if (extension !== "csv") {
      setCsvFile(null);
      setCsvText("");
      setErrorMessage("Invalid CSV file. Please upload a .csv file.");
      return;
    }

    try {
      const text = await file.text();
      const cleaned = text.trim();

      if (cleaned.length === 0) {
        setCsvFile(null);
        setCsvText("");
        setErrorMessage("CSV appears to be empty. Please upload a valid CSV file.");
        return;
      }

      const lines = getLinesFromText(cleaned);
      if (lines.length === 0) {
        setCsvFile(null);
        setCsvText("");
        setErrorMessage("Invalid CSV content. Please check your file and try again.");
        return;
      }

      setCsvFile(file);
      setCsvText(cleaned);
      setErrorMessage(null);
    } catch {
      setCsvFile(null);
      setCsvText("");
      setErrorMessage("Invalid CSV handling failed. Please try another file.");
    }
  };

  const handlePastedDataChange = (value: string) => {
    setPastedData(value);

    if (value.trim().length > 0 && csvFile) {
      setErrorMessage(null);
    }

    if (value.trim().length === 0 && !csvFile) {
      setErrorMessage("Please upload a CSV or paste cleaned data to continue.");
      return;
    }

    setErrorMessage(null);
  };

  const showEmptyInputWarning = activeInputType === "none";
  const entries = activeInputType === "text" ? getLinesFromText(pastedData) : getLinesFromText(csvText);
  const canContinue = entries.length > 0;

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    onContinue({
      templateName,
      templateType,
      dataEntries: entries,
      inputType: activeInputType === "csv" ? "csv" : "text",
      inputContent: activeInputType === "csv" ? csvText : pastedData,
      collegeName: collegeName.trim(),
      eventName: eventName.trim(),
    });
  };

  return (
    <section className="template-selection" aria-label="Data input page">
      <div className="selection-stack data-input-stack">
        <article className="selection-card">
          <h2>Data Input</h2>
          <p>Template selected: {templateName ?? "Unknown template"}</p>
        </article>

        <CsvUploadCard
          onFileSelected={handleCsvUpload}
          selectedFileName={csvFile?.name ?? null}
          disabled={isTextareaActive}
        />

        <article className="selection-card">
          <h2>Paste Data Option</h2>
          <p className="instruction-text">
            Have messy data?
            <br />
            Paste your names into ChatGPT or any AI using the prompt below, then paste the cleaned
            output here.
          </p>

          <pre className="prompt-block">
            <code>{cleanerPrompt}</code>
          </pre>

          <textarea
            className="data-textarea"
            placeholder="Paste cleaned names here, one entry per line..."
            value={pastedData}
            onChange={(event) => handlePastedDataChange(event.currentTarget.value)}
            rows={8}
          />
          <p className="file-meta">
            {activeInputType === "text"
              ? "Textarea input active. CSV upload is ignored."
              : activeInputType === "csv"
                ? "CSV input active. Textarea content is ignored."
                : "Choose CSV upload or paste cleaned text."}
          </p>
        </article>

        <article className="selection-card optional-fields-card">
          <h2>Optional Fields</h2>
          <div className="optional-fields-grid">
            <input
              type="text"
              placeholder="College Name (optional)"
              value={collegeName}
              onChange={(event) => setCollegeName(event.currentTarget.value)}
            />
            <input
              type="text"
              placeholder="Event Name (optional)"
              value={eventName}
              onChange={(event) => setEventName(event.currentTarget.value)}
            />
          </div>
        </article>

        <article className="selection-card status-card" aria-live="polite">
          <p className="entry-count">{entryCount} entries detected</p>
          {showEmptyInputWarning ? (
            <p className="file-error">Please upload a CSV or paste cleaned data to continue.</p>
          ) : null}
          {errorMessage ? <p className="file-error">{errorMessage}</p> : null}
          <div className="data-input-actions">
            <button type="button" className="primary-action-button" onClick={handleContinue} disabled={!canContinue}>
              Open Editor
            </button>
          </div>
        </article>
      </div>
    </section>
  );
};

export default DataInput;
