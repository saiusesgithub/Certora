export type EditorPageData = {
  templateName: string | null;
  templateType: "image" | "pdf" | null;
  dataEntries: string[];
  inputType: "csv" | "text";
  inputContent: string;
  collegeName: string;
  eventName: string;
};

export type FieldKind = "name" | "college" | "event";

export type FieldAlignment = "left" | "center" | "right";

export type EditorField = {
  id: FieldKind;
  kind: FieldKind;
  title: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  align: FieldAlignment;
  bold: boolean;
  locked: boolean;
  visible: boolean;
};

export type TemplateSelectionResult = {
  file: File;
  type: "image" | "pdf";
};
