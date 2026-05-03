import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from 'react-konva'
import type Konva from 'konva'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '@pikoloo/darwin-ui'

type FieldId = 'name' | 'college' | 'event'

type EditorField = {
  id: FieldId
  label: string
  value: string
  optional: boolean
  x: number
  y: number
  fontFamily: string
  fontSize: number
  color: string
  locked: boolean
}

type CanvasEditorPageProps = {
  templateFile: File | null
  pastedText: string
  collegeName: string
  eventName: string
}

type FieldCardProps = {
  field: EditorField
  selected: boolean
  onSelect: (id: FieldId) => void
  onUpdate: (id: FieldId, updates: Partial<EditorField>) => void
  onCenter: (id: FieldId) => void
  onRemove: (id: FieldId) => void
}

const defaultTemplateSize = {
  width: 1100,
  height: 780,
}

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
]

const snapThreshold = 8

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getFieldHeight(field: EditorField) {
  return field.fontSize * 1.2
}

function getFieldWidth(field: EditorField) {
  return Math.max(field.value.length * field.fontSize * 0.55, field.fontSize)
}

function clampFieldPosition(
  field: EditorField,
  updates: Partial<EditorField>,
  bounds = defaultTemplateSize,
) {
  const nextFontSize = updates.fontSize ?? field.fontSize
  const nextHeight = nextFontSize * 1.2
  const nextWidth = getFieldWidth({
    ...field,
    ...updates,
    fontSize: nextFontSize,
  })
  const nextX = updates.x ?? field.x
  const nextY = updates.y ?? field.y

  return {
    ...updates,
    x: clampValue(nextX, 0, Math.max(0, bounds.width - nextWidth)),
    y: clampValue(nextY, 0, Math.max(0, bounds.height - nextHeight)),
  }
}

function getPreviewName(pastedText: string) {
  return (
    pastedText
      .split('\n')
      .map((entry) => entry.trim())
      .find(Boolean) ?? 'Recipient Name'
  )
}

function createInitialFields(
  pastedText: string,
  collegeName: string,
  eventName: string,
) {
  const fields: EditorField[] = [
    {
      id: 'name',
      label: 'Name',
      value: getPreviewName(pastedText),
      optional: false,
      x: 360,
      y: 330,
      fontFamily: 'Georgia',
      fontSize: 46,
      color: '#ffffff',
      locked: false,
    },
  ]

  if (collegeName.trim()) {
    fields.push({
      id: 'college',
      label: 'College',
      value: collegeName.trim(),
      optional: true,
      x: 360,
      y: 410,
      fontFamily: 'Inter',
      fontSize: 24,
      color: '#ffffff',
      locked: false,
    })
  }

  if (eventName.trim()) {
    fields.push({
      id: 'event',
      label: 'Event',
      value: eventName.trim(),
      optional: true,
      x: 360,
      y: 455,
      fontFamily: 'Inter',
      fontSize: 22,
      color: '#ffffff',
      locked: false,
    })
  }

  return fields
}

function useTemplateImage(templateFile: File | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!templateFile || !templateFile.type.startsWith('image/')) {
      return
    }

    const url = URL.createObjectURL(templateFile)
    const nextImage = new window.Image()
    nextImage.onload = () => setImage(nextImage)
    nextImage.src = url

    return () => URL.revokeObjectURL(url)
  }, [templateFile])

  return templateFile?.type.startsWith('image/') ? image : null
}

function FieldCard({
  field,
  selected,
  onSelect,
  onUpdate,
  onCenter,
  onRemove,
}: FieldCardProps) {
  function updateIntegerValue(key: 'fontSize' | 'x' | 'y', value: string) {
    const parsedValue = Number.parseInt(value, 10)

    if (Number.isFinite(parsedValue)) {
      onUpdate(field.id, clampFieldPosition(field, { [key]: parsedValue }))
    }
  }

  return (
    <Card
      className={[
        'w-full border',
        selected
          ? 'border-blue-400/70 bg-blue-500/[0.06] shadow-[0_0_0_1px_rgba(96,165,250,0.18)]'
          : 'border-white/10',
      ].join(' ')}
      glass
      onClick={() => onSelect(field.id)}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-base">{field.label}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={field.locked ? 'primary' : 'secondary'}
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              onUpdate(field.id, { locked: !field.locked })
            }}
          >
            Lock
          </Button>
          {field.optional ? (
            <button
              type="button"
              aria-label={`Remove ${field.label}`}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-sm leading-none text-white/60 hover:bg-[#ff5f57]/85 hover:text-white"
              onClick={(event) => {
                event.stopPropagation()
                onRemove(field.id)
              }}
            >
              ×
            </button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="flex flex-col gap-2 text-xs text-white/45">
          Font family
          <Select
            value={field.fontFamily}
            options={fontOptions}
            onChange={(event) =>
              onUpdate(field.id, { fontFamily: event.target.value })
            }
          />
        </label>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="flex flex-col gap-2 text-xs text-white/45">
            Font size
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <Input
                inputMode="numeric"
                value={Math.round(field.fontSize)}
                onChange={(event) =>
                  updateIntegerValue('fontSize', event.target.value)
                }
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  onUpdate(field.id, {
                    ...clampFieldPosition(field, {
                      fontSize: Math.max(8, Math.round(field.fontSize) - 10),
                    }),
                  })
                }
              >
                -
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  onUpdate(
                    field.id,
                    clampFieldPosition(field, {
                      fontSize: Math.round(field.fontSize) + 10,
                    }),
                  )
                }
              >
                +
              </Button>
            </div>
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/45">
            Color
            <div className="relative h-10 w-12 overflow-hidden rounded-md border border-white/15 bg-white/[0.03]">
              <span
                className="block h-full w-full"
                style={{ backgroundColor: field.color }}
              />
              <Input
                type="color"
                value={field.color}
                aria-label={`${field.label} color`}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(event) =>
                  onUpdate(field.id, { color: event.target.value })
                }
              />
            </div>
          </label>
        </div>

        <Button variant="secondary" size="sm" onClick={() => onCenter(field.id)}>
          Center
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2 text-xs text-white/45">
            X position
            <Input
              inputMode="numeric"
              value={Math.round(field.x)}
              onChange={(event) => updateIntegerValue('x', event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/45">
            Y position
            <Input
              inputMode="numeric"
              value={Math.round(field.y)}
              onChange={(event) => updateIntegerValue('y', event.target.value)}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

type SidebarPanelProps = {
  fields: EditorField[]
  selectedFieldId: FieldId
  onSelect: (id: FieldId) => void
  onUpdate: (id: FieldId, updates: Partial<EditorField>) => void
  onCenter: (id: FieldId) => void
  onRemove: (id: FieldId) => void
}

function SidebarPanel({
  fields,
  selectedFieldId,
  onSelect,
  onUpdate,
  onCenter,
  onRemove,
}: SidebarPanelProps) {
  return (
    <aside className="flex h-screen w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/10 bg-white/[0.03] p-4">
      <div className="px-1 py-2">
        <h1 className="text-lg font-semibold text-white">Fields</h1>
        <p className="mt-1 text-xs text-white/45">Preview uses first entry</p>
      </div>
      {fields.map((field) => (
        <FieldCard
          key={field.id}
          field={field}
          selected={field.id === selectedFieldId}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onCenter={onCenter}
          onRemove={onRemove}
        />
      ))}
    </aside>
  )
}

type CanvasEditorProps = {
  fields: EditorField[]
  selectedFieldId: FieldId
  templateFile: File | null
  onSelect: (id: FieldId) => void
  onUpdate: (id: FieldId, updates: Partial<EditorField>) => void
  onRegisterTextNode: (id: FieldId, node: Konva.Text | null) => void
  onTemplateSizeChange: (size: typeof defaultTemplateSize) => void
}

function CanvasEditor({
  fields,
  selectedFieldId,
  templateFile,
  onSelect,
  onUpdate,
  onRegisterTextNode,
  onTemplateSizeChange,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const textRefs = useRef<Record<string, Konva.Text | null>>({})
  const [containerSize, setContainerSize] = useState({ width: 900, height: 650 })
  const [zoom, setZoom] = useState(1)
  const [activeGuides, setActiveGuides] = useState({
    vertical: false,
    horizontal: false,
  })
  const templateImage = useTemplateImage(templateFile)

  const templateSize = useMemo(
    () =>
      templateImage
        ? { width: templateImage.width, height: templateImage.height }
        : defaultTemplateSize,
    [templateImage],
  )

  useEffect(() => {
    onTemplateSizeChange(templateSize)
  }, [onTemplateSizeChange, templateSize])

  const scale = Math.min(
    (containerSize.width - 80) / templateSize.width,
    (containerSize.height - 80) / templateSize.height,
  )
  const fitScale = Number.isFinite(scale) && scale > 0 ? scale : 1
  const safeScale = fitScale * zoom
  const offsetX = (containerSize.width - templateSize.width * safeScale) / 2
  const offsetY = (containerSize.height - templateSize.height * safeScale) / 2
  const templateBounds = useMemo(
    () => ({ width: templateSize.width, height: templateSize.height }),
    [templateSize.height, templateSize.width],
  )
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const transformer = transformerRef.current
    const selectedNode = textRefs.current[selectedFieldId]

    if (transformer && selectedNode) {
      transformer.nodes([selectedNode])
      transformer.getLayer()?.batchDraw()
    }
  }, [fields, selectedFieldId])

  function getVisualSize(field: EditorField) {
    const node = textRefs.current[field.id]
    const rect = node?.getClientRect({ skipTransform: true })

    return {
      width: rect?.width ? rect.width / safeScale : getFieldWidth(field),
      height: rect?.height ? rect.height / safeScale : getFieldHeight(field),
    }
  }

  function getSnappedPosition(field: EditorField, x: number, y: number) {
    const fieldSize = getVisualSize(field)

    if (field.locked) {
      return {
        x: clampValue(x, 0, Math.max(0, templateSize.width - fieldSize.width)),
        y: clampValue(y, 0, Math.max(0, templateSize.height - fieldSize.height)),
        vertical: false,
        horizontal: false,
      }
    }

    const fieldCenterX = x + fieldSize.width / 2
    const fieldCenterY = y + fieldSize.height / 2
    const templateCenterX = templateSize.width / 2
    const templateCenterY = templateSize.height / 2
    const snapToVertical = Math.abs(fieldCenterX - templateCenterX) <= snapThreshold
    const snapToHorizontal =
      Math.abs(fieldCenterY - templateCenterY) <= snapThreshold
    const nextX = snapToVertical ? templateCenterX - fieldSize.width / 2 : x
    const nextY = snapToHorizontal ? templateCenterY - fieldSize.height / 2 : y

    return {
      x: clampValue(nextX, 0, Math.max(0, templateSize.width - fieldSize.width)),
      y: clampValue(nextY, 0, Math.max(0, templateSize.height - fieldSize.height)),
      vertical: snapToVertical,
      horizontal: snapToHorizontal,
    }
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#0f0f0f]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <p className="mr-3 text-xs text-white/40">Preview uses first entry</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoom((current) => Math.max(0.5, current - 0.1))}
          >
            -
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setZoom(1)}>
            Fit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoom((current) => Math.min(2, current + 0.1))}
          >
            +
          </Button>
        </div>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1">
        <Stage width={containerSize.width} height={containerSize.height}>
          <Layer>
            {templateImage ? (
              <KonvaImage
                image={templateImage}
                x={offsetX}
                y={offsetY}
                width={templateSize.width * safeScale}
                height={templateSize.height * safeScale}
              />
            ) : (
              <Rect
                x={offsetX}
                y={offsetY}
                width={templateSize.width * safeScale}
                height={templateSize.height * safeScale}
                fill="#181818"
                stroke="#2f2f2f"
                strokeWidth={1}
              />
            )}

            {activeGuides.vertical ? (
              <Line
                points={[
                  offsetX + (templateSize.width / 2) * safeScale,
                  offsetY,
                  offsetX + (templateSize.width / 2) * safeScale,
                  offsetY + templateSize.height * safeScale,
                ]}
                stroke="#3b82f6"
                strokeWidth={1}
                opacity={0.65}
                listening={false}
              />
            ) : null}

            {activeGuides.horizontal ? (
              <Line
                points={[
                  offsetX,
                  offsetY + (templateSize.height / 2) * safeScale,
                  offsetX + templateSize.width * safeScale,
                  offsetY + (templateSize.height / 2) * safeScale,
                ]}
                stroke="#3b82f6"
                strokeWidth={1}
                opacity={0.65}
                listening={false}
              />
            ) : null}

            {fields.map((field) => (
              <Text
                key={field.id}
                ref={(node) => {
                  textRefs.current[field.id] = node
                  onRegisterTextNode(field.id, node)
                }}
                x={offsetX + field.x * safeScale}
                y={offsetY + field.y * safeScale}
                text={field.value}
                fontFamily={field.fontFamily}
                fontSize={field.fontSize * safeScale}
                fill={field.color}
                draggable={!field.locked}
                onClick={() => onSelect(field.id)}
                onTap={() => onSelect(field.id)}
                onDragStart={() => onSelect(field.id)}
                onDragMove={(event) => {
                  const rawX = (event.target.x() - offsetX) / safeScale
                  const rawY = (event.target.y() - offsetY) / safeScale
                  const snappedPosition = getSnappedPosition(field, rawX, rawY)

                  event.target.position({
                    x: offsetX + snappedPosition.x * safeScale,
                    y: offsetY + snappedPosition.y * safeScale,
                  })
                  setActiveGuides({
                    vertical: snappedPosition.vertical,
                    horizontal: snappedPosition.horizontal,
                  })
                }}
                onDragEnd={(event) => {
                  const nextX = (event.target.x() - offsetX) / safeScale
                  const nextY = (event.target.y() - offsetY) / safeScale
                  const snappedPosition = getSnappedPosition(field, nextX, nextY)

                  onUpdate(field.id, {
                    x: Math.round(snappedPosition.x),
                    y: Math.round(snappedPosition.y),
                  })
                  setActiveGuides({
                    vertical: false,
                    horizontal: false,
                  })
                }}
                onTransformEnd={(event) => {
                  const node = event.target as Konva.Text
                  const nextFontSize = Math.max(
                    8,
                    Math.round(field.fontSize * node.scaleX()),
                  )

                  node.scaleX(1)
                  node.scaleY(1)

                  onUpdate(field.id, {
                    ...clampFieldPosition(
                      field,
                      {
                        x: Math.round((node.x() - offsetX) / safeScale),
                        y: Math.round((node.y() - offsetY) / safeScale),
                        fontSize: nextFontSize,
                      },
                      templateBounds,
                    ),
                  })
                }}
              />
            ))}

            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              enabledAnchors={[
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
              ]}
              borderStroke="#3b82f6"
              anchorStroke="#3b82f6"
              anchorFill="#0f0f0f"
              resizeEnabled={!fields.find((field) => field.id === selectedFieldId)?.locked}
              padding={0}
              ignoreStroke
              anchorSize={7}
              borderStrokeWidth={1}
              anchorStrokeWidth={1}
            />
          </Layer>
        </Stage>
      </div>

      <div className="flex justify-center border-t border-white/10 p-5">
        <Button variant="primary" size="lg">
          Generate Certificates
        </Button>
      </div>
    </section>
  )
}

function CanvasEditorPage({
  templateFile,
  pastedText,
  collegeName,
  eventName,
}: CanvasEditorPageProps) {
  const textNodesRef = useRef<Record<string, Konva.Text | null>>({})
  const [fields, setFields] = useState(() =>
    createInitialFields(pastedText, collegeName, eventName),
  )
  const [selectedFieldId, setSelectedFieldId] = useState<FieldId>('name')
  const [templateSize, setTemplateSize] = useState(defaultTemplateSize)

  function updateField(id: FieldId, updates: Partial<EditorField>) {
    setFields((currentFields) =>
      currentFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    )
  }

  function removeField(id: FieldId) {
    setFields((currentFields) =>
      currentFields.filter((field) => field.id !== id || !field.optional),
    )
    if (selectedFieldId === id) {
      setSelectedFieldId('name')
    }
  }

  function centerField(id: FieldId) {
    const field = fields.find((currentField) => currentField.id === id)

    if (!field) {
      return
    }

    const node = textNodesRef.current[id]
    const rect = node?.getClientRect({ skipTransform: true })
    const fieldWidth = rect?.width ?? getFieldWidth(field)
    const fieldHeight = rect?.height ?? getFieldHeight(field)

    updateField(id, {
      x: Math.round(templateSize.width / 2 - fieldWidth / 2),
      y: Math.round(templateSize.height / 2 - fieldHeight / 2),
    })
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <SidebarPanel
        fields={fields}
        selectedFieldId={selectedFieldId}
        onSelect={setSelectedFieldId}
        onUpdate={updateField}
        onCenter={centerField}
        onRemove={removeField}
      />
      <CanvasEditor
        fields={fields}
        selectedFieldId={selectedFieldId}
        templateFile={templateFile}
        onSelect={setSelectedFieldId}
        onUpdate={updateField}
        onRegisterTextNode={(id, node) => {
          textNodesRef.current[id] = node
        }}
        onTemplateSizeChange={setTemplateSize}
      />
    </main>
  )
}

export { CanvasEditor, FieldCard, SidebarPanel }
export default CanvasEditorPage
