import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { EditorField } from "./editorTypes";

const GUIDE_THRESHOLD = 8;
const GRID_SIZE = 40;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const CANVAS_PADDING = 24;

type CanvasEditorProps = {
  templateFile: File | null;
  templateType: "image" | "pdf" | null;
  fields: EditorField[];
  selectedFieldId: EditorField["id"] | null;
  onSelectField: (fieldId: EditorField["id"] | null) => void;
  onFieldChange: (fieldId: EditorField["id"], patch: Partial<EditorField>) => void;
  showGrid: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

const useLoadedImage = (file: File | null) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!file) {
      setImage(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const loadedImage = new window.Image();
    loadedImage.onload = () => {
      setImage(loadedImage);
      URL.revokeObjectURL(objectUrl);
    };
    loadedImage.src = objectUrl;

    return () => {
      loadedImage.onload = null;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return image;
};

const snapToGuides = (value: number, guides: number[]) => {
  for (const guide of guides) {
    if (Math.abs(value - guide) <= GUIDE_THRESHOLD) {
      return guide;
    }
  }

  return value;
};

const CanvasEditor = ({
  templateFile,
  templateType,
  fields,
  selectedFieldId,
  onSelectField,
  onFieldChange,
  showGrid,
  zoom,
  onZoomChange,
}: CanvasEditorProps) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const textNodeRefs = useRef<Record<string, Konva.Text | null>>({});
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<Array<{ orientation: "vertical" | "horizontal"; position: number }>>([]);
  const [viewportSize, setViewportSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const templateImage = useLoadedImage(templateType === "image" ? templateFile : null);

  const visibleFields = useMemo(() => fields.filter((field) => field.visible), [fields]);
  const selectedField = visibleFields.find((field) => field.id === selectedFieldId) ?? null;
  const templateSize = useMemo(() => {
    if (templateType === "image" && templateImage) {
      return {
        width: templateImage.naturalWidth,
        height: templateImage.naturalHeight,
      };
    }

    return {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    };
  }, [templateImage, templateType]);

  useEffect(() => {
    const container = stageWrapRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const nextWidth = Math.max(320, Math.floor(entry.contentRect.width));
      const nextHeight = Math.max(320, Math.floor(entry.contentRect.height));
      setViewportSize({ width: nextWidth, height: nextHeight });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const fitScale = useMemo(() => {
    const usableWidth = Math.max(1, viewportSize.width - CANVAS_PADDING * 2);
    const usableHeight = Math.max(1, viewportSize.height - CANVAS_PADDING * 2);
    const widthRatio = usableWidth / templateSize.width;
    const heightRatio = usableHeight / templateSize.height;
    return Math.min(widthRatio, heightRatio);
  }, [templateSize.height, templateSize.width, viewportSize.height, viewportSize.width]);

  const combinedScale = fitScale * zoom;
  const stageOffset = useMemo(
    () => ({
      x: Math.round((viewportSize.width - templateSize.width * combinedScale) / 2),
      y: Math.round((viewportSize.height - templateSize.height * combinedScale) / 2),
    }),
    [combinedScale, templateSize.height, templateSize.width, viewportSize.height, viewportSize.width],
  );

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    const selectedNode = selectedFieldId ? textNodeRefs.current[selectedFieldId] : null;

    if (!transformer || !stage || !selectedNode || !selectedField || selectedField.locked) {
      transformer?.nodes([]);
      transformer?.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes([selectedNode]);
    transformer.getLayer()?.batchDraw();
  }, [selectedField, selectedFieldId]);

  const updateFieldPosition = (field: EditorField, nextX: number, nextY: number) => {
    const snappedX = snapToGuides(nextX, [0, templateSize.width / 2, templateSize.width]);
    const snappedY = snapToGuides(nextY, [0, templateSize.height / 2, templateSize.height]);

    onFieldChange(field.id, { x: snappedX, y: snappedY });
    setGuides([
      ...(Math.abs(snappedX - templateSize.width / 2) <= GUIDE_THRESHOLD
        ? [{ orientation: "vertical" as const, position: templateSize.width / 2 }]
        : []),
      ...(Math.abs(snappedY - templateSize.height / 2) <= GUIDE_THRESHOLD
        ? [{ orientation: "horizontal" as const, position: templateSize.height / 2 }]
        : []),
    ]);
  };

  const handleTransformEnd = (field: EditorField) => {
    const node = textNodeRefs.current[field.id];
    if (!node) {
      return;
    }

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const nextFontSize = Math.max(8, Math.round(field.fontSize * Math.max(scaleX, scaleY)));

    node.scaleX(1);
    node.scaleY(1);
    onFieldChange(field.id, {
      fontSize: nextFontSize,
      x: node.x(),
      y: node.y(),
    });
  };

  return (
    <div className="canvas-editor-shell">
      <div className="canvas-toolbar">
        <button type="button" onClick={() => onZoomChange(Math.max(0.5, Number((zoom - 0.1).toFixed(2))))}>
          Zoom -
        </button>
        <span>{Math.round(combinedScale * 100)}%</span>
        <button type="button" onClick={() => onZoomChange(Math.min(1.5, Number((zoom + 0.1).toFixed(2))))}>
          Zoom +
        </button>
        <button type="button" onClick={() => onZoomChange(1)}>
          Reset
        </button>
        <span className="canvas-note">Preview uses first entry from your data</span>
      </div>

      <div ref={stageWrapRef} className="canvas-stage-wrap">
        <Stage
          ref={stageRef}
          width={viewportSize.width}
          height={viewportSize.height}
          onMouseDown={(event) => {
            if (event.target === event.target.getStage()) {
              onSelectField(null);
            }
          }}
          onTouchStart={(event) => {
            if (event.target === event.target.getStage()) {
              onSelectField(null);
            }
          }}
        >
          <Layer>
            <Rect x={0} y={0} width={viewportSize.width} height={viewportSize.height} fill="#111111" listening={false} />

            <Group x={stageOffset.x} y={stageOffset.y} scaleX={combinedScale} scaleY={combinedScale}>
              {templateType === "image" && templateImage ? (
                <KonvaImage
                  image={templateImage}
                  x={0}
                  y={0}
                  width={templateSize.width}
                  height={templateSize.height}
                  listening={false}
                />
              ) : (
                <>
                  <Rect
                    x={24}
                    y={24}
                    width={templateSize.width - 48}
                    height={templateSize.height - 48}
                    stroke="#2f2f2f"
                    dash={[8, 8]}
                    listening={false}
                  />
                  <Text
                    x={0}
                    y={templateSize.height / 2 - 20}
                    width={templateSize.width}
                    align="center"
                    text={templateType === "pdf" ? "PDF preview placeholder" : "No template loaded"}
                    fill="#8c8c8c"
                    fontSize={18}
                    listening={false}
                  />
                </>
              )}

              {showGrid ? (
                <>
                  {Array.from({ length: Math.ceil(templateSize.width / GRID_SIZE) + 1 }, (_, index) => index * GRID_SIZE).map((value) => (
                    <Line key={`v-${value}`} points={[value, 0, value, templateSize.height]} stroke="#232323" strokeWidth={1} listening={false} />
                  ))}
                  {Array.from({ length: Math.ceil(templateSize.height / GRID_SIZE) + 1 }, (_, index) => index * GRID_SIZE).map((value) => (
                    <Line key={`h-${value}`} points={[0, value, templateSize.width, value]} stroke="#232323" strokeWidth={1} listening={false} />
                  ))}
                </>
              ) : null}

              {guides.map((guide, index) => (
                <Line
                  key={`${guide.orientation}-${guide.position}-${index}`}
                  points={guide.orientation === "vertical" ? [guide.position, 0, guide.position, templateSize.height] : [0, guide.position, templateSize.width, guide.position]}
                  stroke="#61a3ff"
                  strokeWidth={2}
                  dash={[6, 4]}
                  listening={false}
                />
              ))}

              {visibleFields.map((field) => (
                <Text
                  key={field.id}
                  ref={(node) => {
                    textNodeRefs.current[field.id] = node;
                  }}
                  text={field.text}
                  x={field.x}
                  y={field.y}
                  width={420}
                  fontSize={field.fontSize}
                  fontFamily={field.fontFamily}
                  fontStyle={field.bold ? "bold" : "normal"}
                  fill={field.fill}
                  align={field.align}
                  draggable={!field.locked}
                  onClick={() => onSelectField(field.id)}
                  onTap={() => onSelectField(field.id)}
                  onDragStart={() => {
                    onSelectField(field.id);
                    setGuides([]);
                  }}
                  onDragMove={(event) => {
                    const node = event.target as Konva.Text;
                    updateFieldPosition(field, node.x(), node.y());
                  }}
                  onDragEnd={(event) => {
                    const node = event.target as Konva.Text;
                    onFieldChange(field.id, { x: node.x(), y: node.y() });
                    setGuides([]);
                  }}
                  onTransformEnd={() => handleTransformEnd(field)}
                />
              ))}

              <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 30 || newBox.height < 10) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Group>
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default CanvasEditor;
