import { useState } from 'react'
import { useEffect } from 'react'
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
  onGenerateMore: () => void
}

function SuccessScreen({ onGenerateMore }: SuccessScreenProps) {
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
            onClick={() => console.log('Download ZIP')}
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

function App() {
  const [page, setPage] = useState<'landing' | 'templates' | 'data' | 'editor'>(
    'landing',
  )
  const [generationState, setGenerationState] =
    useState<GenerationState>('idle')
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [eventName, setEventName] = useState('')
  const totalCertificates = Math.max(
    1,
    pastedText
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean).length,
  )

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
        if (currentCount >= totalCertificates) {
          window.clearInterval(progressTimer)
          window.setTimeout(() => setGenerationState('success'), 250)
          return currentCount
        }

        return currentCount + 1
      })
    }, 140)

    return () => {
      window.clearInterval(messageTimer)
      window.clearInterval(progressTimer)
    }
  }, [generationState, totalCertificates])

  function resetToLanding() {
    setGenerationState('idle')
    setPage('landing')
    setLoadingMessageIndex(0)
    setGeneratedCount(0)
    setTemplateFile(null)
    setCsvFile(null)
    setPastedText('')
    setCollegeName('')
    setEventName('')
  }

  if (generationState === 'loading') {
    return (
      <LoadingScreen
        message={loadingMessages[loadingMessageIndex]}
        progress={generatedCount}
        total={totalCertificates}
      />
    )
  }

  if (generationState === 'success') {
    return <SuccessScreen onGenerateMore={resetToLanding} />
  }

  if (page === 'editor') {
    return (
      <CanvasEditorPage
        templateFile={templateFile}
        pastedText={pastedText}
        collegeName={collegeName}
        eventName={eventName}
        onGenerate={() => {
          if (generationState !== 'idle') {
            return
          }

          setLoadingMessageIndex(0)
          setGeneratedCount(0)
          setGenerationState('loading')
        }}
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
