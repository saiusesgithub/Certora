import { useMemo, useState } from "react";
import CanvasEditor from "./CanvasEditor";
import FieldCard from "./FieldCard";
import type { EditorField, EditorPageData, TemplateSelectionResult } from "./editorTypes";

type CertificateEditorProps = {
  template: TemplateSelectionResult | null;
  data: EditorPageData | null;
};

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

const CertificateEditor = ({ template, data }: CertificateEditorProps) => {
  const [fields, setFields] = useState<EditorField[]>(() => createInitialFields(data));
  const [selectedFieldId, setSelectedFieldId] = useState<EditorField["id"] | null>("name");
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);

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

  return (
    <section className="editor-page" aria-label="Certificate editor page">
      <aside className="editor-sidebar">
        <div className="selection-card editor-summary-card">
          <h2>Main Editor</h2>
          <p>Template: {template?.file.name ?? "Untitled template"}</p>
          <p>Preview uses first entry from your data</p>
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
          <button type="button" className="primary-action-button generate-button">
            Generate Certificates
          </button>
        </div>
      </main>
    </section>
  );
};

export default CertificateEditor;