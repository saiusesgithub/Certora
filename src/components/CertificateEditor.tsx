import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import CanvasEditor from "./CanvasEditor";
import FieldCard from "./FieldCard";
import type { EditorField, EditorPageData, TemplateSelectionResult } from "./editorTypes";

type CertificateEditorProps = {
  template: TemplateSelectionResult | null;
  data: EditorPageData | null;
  onGenerateMore: () => void;
};

const generatingMessages = [
  "Aligning pixels and printing dreams...",
  "Crafting certificates, one name at a time...",
  "Almost there... just making it perfect.",
  "Good things take milliseconds here.",
];

const createInitialFields = (data: EditorPageData | null): EditorField[] => {
  const firstName = data?.dataEntries[0] ?? "First Name";

  return [
    {
      id: "name",
      kind: "name",
      title: "Name",
      text: firstName,
      x: 180,
      y: 220,
      fontSize: 48,
      fontFamily: "Playfair Display",
      fill: "#000000",
      align: "center",
      bold: true,
      locked: false,
      visible: true,
    },
    {
      id: "college",
      kind: "college",
      title: "College",
      text: data?.collegeName || "",
      x: 180,
      y: 300,
      fontSize: 26,
      fontFamily: "Montserrat",
      fill: "#000000",
      align: "center",
      bold: false,
      locked: false,
      visible: Boolean(data?.collegeName.trim()),
    },
    {
      id: "event",
      kind: "event",
      title: "Event",
      text: data?.eventName || "",
      x: 180,
      y: 360,
      fontSize: 24,
      fontFamily: "Poppins",
      fill: "#000000",
      align: "center",
      bold: false,
      locked: false,
      visible: Boolean(data?.eventName.trim()),
    },
  ];
};

const CertificateEditor = ({ template, data, onGenerateMore }: CertificateEditorProps) => {
  const [fields, setFields] = useState<EditorField[]>(() => createInitialFields(data));
  const [selectedFieldId, setSelectedFieldId] = useState<EditorField["id"] | null>("name");
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedZipPath, setGeneratedZipPath] = useState<string | null>(null);
  const [savedZipPath, setSavedZipPath] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  const dataEntries = useMemo(() => data?.dataEntries ?? [], [data]);

  const handleFieldChange = (fieldId: EditorField["id"], patch: Partial<EditorField>) => {
    setFields((currentFields) =>
      currentFields.map((field) => {
        if (field.id !== fieldId) {
          return field;
        }

        return {
          ...field,
          ...patch,
          text: field.kind === "name" ? dataEntries[0] ?? field.text : patch.text ?? field.text,
        };
      }),
    );
  };

  const handleRemoveField = (fieldId: EditorField["id"], showValue: boolean) => {
    setFields((currentFields) =>
      currentFields.map((field) => (field.id === fieldId ? { ...field, visible: showValue } : field)),
    );
    if (selectedFieldId === fieldId && !showValue) {
      setSelectedFieldId(null);
    }
  };

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % generatingMessages.length);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating || progressTotal <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setProgressCurrent((current) => {
        const maxWhileRunning = Math.max(progressTotal - 1, 0);
        return current < maxWhileRunning ? current + 1 : current;
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, [isGenerating, progressTotal]);

  const handleDownloadZip = async () => {
    if (!generatedZipPath) {
      return;
    }

    const savedPath = await invoke<string>("save_zip_to_downloads", {
      zipPath: generatedZipPath,
    });
    setSavedZipPath(savedPath);
  };

  const handleGenerate = async () => {
    if (!template?.file || !data) {
      setGenerationError("Missing template or input data. Please restart generation flow.");
      return;
    }

    setMessageIndex(0);
    setGenerationError(null);
    setGeneratedZipPath(null);
    setSavedZipPath(null);
    setIsComplete(false);
    setProgressTotal(dataEntries.length);
    setProgressCurrent(0);
    setIsGenerating(true);

    try {
      const templateBytes = Array.from(new Uint8Array(await template.file.arrayBuffer()));
      const config = {
        reference_size: {
          width: 1200,
          height: 800,
        },
        fields: fields
          .filter((field) => field.visible)
          .map((field) => ({
            id: field.id,
            template:
              field.kind === "name"
                ? "{{name}}"
                : field.kind === "college"
                  ? "{{college}}"
                  : "{{event}}",
            position: {
              x: field.x,
              y: field.y,
            },
            style: {
              font_size: field.fontSize,
              color: field.fill,
              align: field.align,
              font_path: "",
            },
          })),
      };

      const zipPath = await invoke<string>("generate_certificates", {
        payload: {
          templateFilename: template.file.name,
          templateBytes,
          configJson: JSON.stringify(config),
          inputType: data.inputType,
          inputContent: data.inputContent,
          college: data.collegeName,
          event: data.eventName,
        },
      });

      setGeneratedZipPath(zipPath);
      setProgressCurrent(dataEntries.length);
      setIsComplete(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setGenerationError(`Generation failed: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <section className="generating-screen" aria-label="Generating certificates">
        <div className="generating-content">
          <div className="generating-spinner" aria-hidden="true" />
          <h2>Generating your certificates...</h2>
          <p>{generatingMessages[messageIndex]}</p>
          <p className="progress-count">
            {progressCurrent} / {progressTotal} certificates generated
          </p>
        </div>
      </section>
    );
  }

  if (isComplete) {
    return (
      <section className="generating-screen complete-screen" aria-label="Certificate generation complete">
        <div className="generating-content">
          <h2>Certificates Generated 🎉</h2>
          <p>{savedZipPath ?? generatedZipPath ?? "ZIP path unavailable"}</p>
          <div className="success-actions">
            <button type="button" className="primary-action-button" onClick={handleDownloadZip} disabled={!generatedZipPath}>
              Download ZIP
            </button>
            <button type="button" className="primary-action-button" onClick={onGenerateMore}>
              Generate More Certificates
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="editor-page" aria-label="Certificate editor page">
      <aside className="editor-sidebar">
        <div className="selection-card editor-summary-card">
          <h2>Main Editor</h2>
          <p>Template: {template?.file.name ?? "Untitled template"}</p>
          <p>Preview uses first entry from your data</p>
          {generationError ? <p className="file-error">{generationError}</p> : null}
        </div>

        {fields.map((field) =>
          field.visible ? (
            <FieldCard
              key={field.id}
              field={field}
              showRemove={field.kind !== "name"}
              selected={selectedFieldId === field.id}
              onSelect={() => setSelectedFieldId(field.id)}
              onChange={(patch) => handleFieldChange(field.id, patch)}
              onRemove={() => handleRemoveField(field.id, false)}
            />
          ) : null,
        )}

        {fields.some((field) => !field.visible && field.kind !== "name") ? (
          <article className="selection-card hidden-fields-card">
            <h2>Hidden Optional Fields</h2>
            {fields
              .filter((field) => !field.visible && field.kind !== "name")
              .map((field) => (
                <button key={field.id} type="button" className="hidden-field-button" onClick={() => handleRemoveField(field.id, true)}>
                  Restore {field.title}
                </button>
              ))}
          </article>
        ) : null}

        <div className="editor-sidebar-footer">
          <label className="checkbox-row">
            <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.currentTarget.checked)} />
            Grid toggle
          </label>
        </div>
      </aside>

      <main className="editor-canvas-area">
        <CanvasEditor
          templateFile={template?.file ?? null}
          templateType={template?.type ?? null}
          fields={fields}
          selectedFieldId={selectedFieldId}
          onSelectField={setSelectedFieldId}
          onFieldChange={(fieldId, patch) => {
            setFields((currentFields) =>
              currentFields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
            );
          }}
          showGrid={showGrid}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        <div className="generate-button-wrap">
          <button
            type="button"
            className="primary-action-button generate-button"
            onClick={handleGenerate}
          >
            Generate Certificates
          </button>
        </div>
      </main>
    </section>
  );
};

export default CertificateEditor;