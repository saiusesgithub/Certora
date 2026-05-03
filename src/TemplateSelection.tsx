import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@pikoloo/darwin-ui'

const acceptedTemplateTypes = '.png,.jpg,.jpeg,.pdf'

function UploadTemplateCard() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSelectedFile(file?: File) {
    if (file) {
      setSelectedFile(file)
    }
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
  }

  function handleDragEnter(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    handleSelectedFile(event.dataTransfer.files[0])
  }

  return (
    <Card className="w-full" glass>
      <CardHeader>
        <CardTitle>Upload Template</CardTitle>
        <CardDescription>
          Upload your certificate design (PNG, JPG, PDF)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          ref={fileInputRef}
          type="file"
          accept={acceptedTemplateTypes}
          className="hidden"
          aria-label="Upload certificate template"
          onChange={(event) => handleSelectedFile(event.target.files?.[0])}
        />
        <button
          type="button"
          className={[
            'flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center transition-colors',
            isDragging
              ? 'border-white/60 bg-white/10 text-white'
              : 'border-white/20 bg-white/[0.03] text-white/65 hover:border-white/35 hover:text-white/80',
          ].join(' ')}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className="text-sm font-medium">
            {isDragging ? 'Drop your template here' : 'Drop your template here'}
          </span>
          <span className="text-xs text-white/45">
            {selectedFile ? selectedFile.name : 'or click to choose a file'}
          </span>
        </button>
      </CardContent>
    </Card>
  )
}

function TemplateGalleryCard() {
  return (
    <Card className="w-full" glass>
      <CardHeader>
        <CardTitle>Explore Template Gallery</CardTitle>
        <CardDescription>Choose from pre-made templates</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" fullWidth>
          Browse Templates
        </Button>
      </CardContent>
    </Card>
  )
}

function TemplateSelection() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="flex w-full max-w-xl flex-col gap-5">
        <UploadTemplateCard />
        <TemplateGalleryCard />
      </section>
    </main>
  )
}

export { TemplateGalleryCard, UploadTemplateCard }
export default TemplateSelection
