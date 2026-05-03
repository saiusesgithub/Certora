import { useEffect, useMemo, useRef, useState } from 'react'
import { Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva'
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
type TextAlign = 'left' | 'center' | 'right'

type EditorField = {
  id: FieldId
  label: string
  value: string
  optional: boolean
  x: number
  y: number
  width: number
  fontFamily: string
  fontSize: number
  color: string
  align: TextAlign
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
      width: 380,
      fontFamily: 'Georgia',
      fontSize: 46,
      color: '#ffffff',
      align: 'center',
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
      width: 380,
      fontFamily: 'Inter',
      fontSize: 24,
      color: '#ffffff',
      align: 'center',
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
      width: 380,
      fontFamily: 'Inter',
      fontSize: 22,
      color: '#ffffff',
      align: 'center',
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
  onRemove,
}: FieldCardProps) {
  return (
    <Card
      className={[
        'w-full border',
        selected ? 'border-blue-500/60' : 'border-white/10',
      ].join(' ')}
      glass
      onClick={() => onSelect(field.id)}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-base">{field.label}</CardTitle>
        {field.optional ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              onRemove(field.id)
            }}
          >
            X
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2 text-xs text-white/45">
            Font size
            <Input
              type="number"
              min={8}
              value={field.fontSize}
              onChange={(event) =>
                onUpdate(field.id, {
                  fontSize: Number(event.target.value) || field.fontSize,
                })
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/45">
            Color
            <Input
              type="color"
              value={field.color}
              onChange={(event) =>
                onUpdate(field.id, { color: event.target.value })
              }
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/45">Alignment</p>
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
              <Button
                key={align}
                variant={field.align === align ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onUpdate(field.id, { align })}
              >
                {align}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2 text-xs text-white/45">
            X position
            <Input value={Math.round(field.x)} readOnly />
          </label>
          <label className="flex flex-col gap-2 text-xs text-white/45">
            Y position
            <Input value={Math.round(field.y)} readOnly />
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
  onRemove: (id: FieldId) => void
}

function SidebarPanel({
  fields,
  selectedFieldId,
  onSelect,
  onUpdate,
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
}

function CanvasEditor({
  fields,
  selectedFieldId,
  templateFile,
  onSelect,
  onUpdate,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const textRefs = useRef<Record<string, Konva.Text | null>>({})
  const [containerSize, setContainerSize] = useState({ width: 900, height: 650 })
  const templateImage = useTemplateImage(templateFile)

  const templateSize = useMemo(
    () =>
      templateImage
        ? { width: templateImage.width, height: templateImage.height }
        : defaultTemplateSize,
    [templateImage],
  )

  const scale = Math.min(
    (containerSize.width - 80) / templateSize.width,
    (containerSize.height - 80) / templateSize.height,
  )
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1
  const offsetX = (containerSize.width - templateSize.width * safeScale) / 2
  const offsetY = (containerSize.height - templateSize.height * safeScale) / 2

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

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#0f0f0f]">
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

            {fields.map((field) => (
              <Text
                key={field.id}
                ref={(node) => {
                  textRefs.current[field.id] = node
                }}
                x={offsetX + field.x * safeScale}
                y={offsetY + field.y * safeScale}
                width={field.width * safeScale}
                text={field.value}
                fontFamily={field.fontFamily}
                fontSize={field.fontSize * safeScale}
                fill={field.color}
                align={field.align}
                draggable
                onClick={() => onSelect(field.id)}
                onTap={() => onSelect(field.id)}
                onDragStart={() => onSelect(field.id)}
                onDragEnd={(event) => {
                  onUpdate(field.id, {
                    x: (event.target.x() - offsetX) / safeScale,
                    y: (event.target.y() - offsetY) / safeScale,
                  })
                }}
                onTransformEnd={(event) => {
                  const node = event.target as Konva.Text
                  const nextFontSize = Math.max(
                    8,
                    (field.fontSize * node.scaleY()),
                  )
                  const nextWidth = Math.max(80, field.width * node.scaleX())

                  node.scaleX(1)
                  node.scaleY(1)

                  onUpdate(field.id, {
                    x: (node.x() - offsetX) / safeScale,
                    y: (node.y() - offsetY) / safeScale,
                    width: nextWidth,
                    fontSize: nextFontSize,
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
  const [fields, setFields] = useState(() =>
    createInitialFields(pastedText, collegeName, eventName),
  )
  const [selectedFieldId, setSelectedFieldId] = useState<FieldId>('name')

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

  return (
    <main className="flex h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <SidebarPanel
        fields={fields}
        selectedFieldId={selectedFieldId}
        onSelect={setSelectedFieldId}
        onUpdate={updateField}
        onRemove={removeField}
      />
      <CanvasEditor
        fields={fields}
        selectedFieldId={selectedFieldId}
        templateFile={templateFile}
        onSelect={setSelectedFieldId}
        onUpdate={updateField}
      />
    </main>
  )
}

export { CanvasEditor, FieldCard, SidebarPanel }
export default CanvasEditorPage
