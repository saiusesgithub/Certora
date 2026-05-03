import { useEffect, useState } from 'react'
import { Button, CircularProgress, Progress } from '@pikoloo/darwin-ui'
import DataInput from './DataInput'
import CanvasEditorPage from './CanvasEditorPage'
import Landing from './Landing'
import TemplateSelection from './TemplateSelection'

const loadingMessages = [
  'Aligning pixels and printing output...',
  'Crafting certificates, one name at a time...',
  'Replacing manual work with automation...',
  'Finalizing your certificates...',
]

type GenerationState = 'idle' | 'loading' | 'success'

type GenerateField = {
  id: string
  label: string
  x: number
  y: number
  fontSize: number
  color: string
  fontFamily: string
}

type LoadingScreenProps = {
  message: string
  progress: number
  total: number
}

function LoadingScreen({ message, progress, total }: LoadingScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 text-center text-white">
      <section className="flex w-full max-w-md scale-100 flex-col items-center gap-6 opacity-100 transition duration-200">
        <CircularProgress indeterminate size={42} strokeWidth={3} />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">
            Generating your certificates...
          </h1>
          <p className="text-sm text-white/55">{message}</p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <p className="text-xs text-white/45">
            {progress} / {total} certificates generated
          </p>
          <Progress value={progress} max={total} size="sm" glass />
        </div>
      </section>
    </main>
  )
}

type SuccessScreenProps = {
  onDownload: () => void
  onGenerateMore: () => void
}

function SuccessScreen({ onDownload, onGenerateMore }: SuccessScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 text-center text-white">
      <section className="flex flex-col items-center gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold">Certificates Generated</h1>
          <p className="text-sm text-white/55">Your certificates are ready</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            size="lg"
            onClick={onDownload}
          >
            Download ZIP
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => console.log('Open Folder')}
          >
            Open Folder
          </Button>
          <Button variant="secondary" size="lg" onClick={onGenerateMore}>
            Generate More
          </Button>
        </div>
      </section>
    </main>
  )
}

type ErrorScreenProps = {
  message: string
  onBack: () => void
}

function ErrorScreen({ message, onBack }: ErrorScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 text-center text-white">
      <section className="flex max-w-md flex-col items-center gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">Generation Failed</h1>
          <p className="text-sm text-white/55">{message}</p>
        </div>
        <Button variant="secondary" size="lg" onClick={onBack}>
          Back to Editor
        </Button>
      </section>
    </main>
  )
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read template file'))
    reader.readAsDataURL(file)
  })
}

async function getNamesList(csvFile: File | null, pastedText: string) {
  const pastedNames = pastedText
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (pastedNames.length > 0) {
    return pastedNames
  }

  if (!csvFile) {
    return ['Recipient Name']
  }

  const csvText = await csvFile.text()
  return csvText
    .split(/\r?\n/)
    .flatMap((line) => line.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'certificates.zip'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function App() {
  const [page, setPage] = useState<'landing' | 'templates' | 'data' | 'editor'>(
    'landing',
  )
  const [generationState, setGenerationState] =
    useState<GenerationState>('idle')
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [generationTotal, setGenerationTotal] = useState(1)
  const [zipBlob, setZipBlob] = useState<Blob | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [eventName, setEventName] = useState('')

  useEffect(() => {
    if (generationState !== 'loading') {
      return
    }

    const messageTimer = window.setInterval(() => {
      setLoadingMessageIndex((currentIndex) =>
        (currentIndex + 1) % loadingMessages.length,
      )
    }, 2200)

    const progressTimer = window.setInterval(() => {
      setGeneratedCount((currentCount) => {
        if (currentCount >= generationTotal - 1) {
          window.clearInterval(progressTimer)
          return currentCount
        }

        return currentCount + 1
      })
    }, 140)

    return () => {
      window.clearInterval(messageTimer)
      window.clearInterval(progressTimer)
    }
  }, [generationState, generationTotal])

  function resetToLanding() {
    setGenerationState('idle')
    setPage('landing')
    setLoadingMessageIndex(0)
    setGeneratedCount(0)
    setGenerationTotal(1)
    setZipBlob(null)
    setErrorMessage('')
    setTemplateFile(null)
    setCsvFile(null)
    setPastedText('')
    setCollegeName('')
    setEventName('')
  }

  async function generateCertificates(fields: GenerateField[]) {
    if (generationState !== 'idle') {
      return
    }

    setErrorMessage('')
    setLoadingMessageIndex(0)
    setGeneratedCount(0)
    setGenerationState('loading')

    try {
      const names = await getNamesList(csvFile, pastedText)
      const templateData = templateFile ? await fileToDataUrl(templateFile) : ''

      setGenerationTotal(Math.max(1, names.length))

      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templatePath: '',
          templateData,
          fields: fields.map((field) => ({
            type: field.id,
            text: `{{${field.id}}}`,
            x: Math.round(field.x),
            y: Math.round(field.y),
            fontSize: Math.round(field.fontSize),
            color: field.color,
            fontFamily: field.fontFamily,
          })),
          data: names,
          college: collegeName,
          event: eventName,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = errorText || 'Certificate generation failed'

        try {
          const parsedError = JSON.parse(errorText) as { detail?: string }
          message = parsedError.detail || message
        } catch {
          message = errorText || 'Certificate generation failed'
        }

        throw new Error(message)
      }

      const zip = await response.blob()
      setZipBlob(zip)
      setGeneratedCount(Math.max(1, names.length))
      downloadBlob(zip)
      setGenerationState('success')
    } catch (error) {
      setGenerationState('idle')
      setErrorMessage(
        error instanceof Error ? error.message : 'Certificate generation failed',
      )
    }
  }

  function downloadLatestZip() {
    if (zipBlob) {
      downloadBlob(zipBlob)
    }
  }

  if (generationState === 'loading') {
    return (
      <LoadingScreen
        message={loadingMessages[loadingMessageIndex]}
        progress={generatedCount}
        total={generationTotal}
      />
    )
  }

  if (generationState === 'success') {
    return (
      <SuccessScreen
        onDownload={downloadLatestZip}
        onGenerateMore={resetToLanding}
      />
    )
  }

  if (errorMessage) {
    return <ErrorScreen message={errorMessage} onBack={() => setErrorMessage('')} />
  }

  if (page === 'editor') {
    return (
      <CanvasEditorPage
        templateFile={templateFile}
        pastedText={pastedText}
        collegeName={collegeName}
        eventName={eventName}
        onGenerate={generateCertificates}
      />
    )
  }

  if (page === 'data') {
    return (
      <DataInput
        csvFile={csvFile}
        pastedText={pastedText}
        collegeName={collegeName}
        eventName={eventName}
        onCsvFileChange={setCsvFile}
        onPastedTextChange={setPastedText}
        onCollegeNameChange={setCollegeName}
        onEventNameChange={setEventName}
        onContinue={() => setPage('editor')}
      />
    )
  }

  if (page === 'templates') {
    return (
      <TemplateSelection
        onTemplateSelected={(file) => {
          setTemplateFile(file)
          setPage('data')
        }}
      />
    )
  }

  return <Landing onGetStarted={() => setPage('templates')} />
}

export default App
