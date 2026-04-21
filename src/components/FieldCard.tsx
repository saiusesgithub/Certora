import type { EditorField, FieldAlignment } from "./editorTypes";

type FieldCardProps = {
  field: EditorField;
  showRemove: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<EditorField>) => void;
  onRemove: () => void;
};

const fontFamilies = ["Segoe UI", "Poppins", "Montserrat", "Playfair Display"];
const alignments: FieldAlignment[] = ["left", "center", "right"];

const FieldCard = ({ field, showRemove, selected, onSelect, onChange, onRemove }: FieldCardProps) => {
  return (
    <article className={`selection-card field-card ${selected ? "is-selected" : ""}`}>
      <div className="field-card-header">
        <button type="button" className="field-title-button" onClick={onSelect}>
          {field.title}
        </button>
        {showRemove ? (
          <button type="button" className="remove-field-button" onClick={onRemove} aria-label={`Remove ${field.title}`}>
            X
          </button>
        ) : null}
      </div>

      <div className="field-controls">
        <label>
          Font family
          <select value={field.fontFamily} onChange={(event) => onChange({ fontFamily: event.currentTarget.value })}>
            {fontFamilies.map((fontFamily) => (
              <option key={fontFamily} value={fontFamily}>
                {fontFamily}
              </option>
            ))}
          </select>
        </label>

        <label>
          Font size
          <input
            type="number"
            min="8"
            max="200"
            value={field.fontSize}
            onChange={(event) => onChange({ fontSize: Number(event.currentTarget.value) || 8 })}
          />
        </label>

        <label>
          Color
          <input type="color" value={field.fill} onChange={(event) => onChange({ fill: event.currentTarget.value })} />
        </label>

        <label>
          Alignment
          <select value={field.align} onChange={(event) => onChange({ align: event.currentTarget.value as FieldAlignment })}>
            {alignments.map((alignment) => (
              <option key={alignment} value={alignment}>
                {alignment}
              </option>
            ))}
          </select>
        </label>

        <div className="position-row">
          <span>Position</span>
          <span>
            X: {Math.round(field.x)} Y: {Math.round(field.y)}
          </span>
        </div>

        <label className="checkbox-row">
          <input type="checkbox" checked={field.bold} onChange={(event) => onChange({ bold: event.currentTarget.checked })} />
          Bold
        </label>

        <label className="checkbox-row">
          <input type="checkbox" checked={field.locked} onChange={(event) => onChange({ locked: event.currentTarget.checked })} />
          Locked
        </label>
      </div>
    </article>
  );
};

export default FieldCard;
