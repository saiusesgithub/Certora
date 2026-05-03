import { useState } from 'react'
import { useEffect } from 'react'
import { Button } from '@pikoloo/darwin-ui'
import DataInput from './DataInput'
import CanvasEditorPage from './CanvasEditorPage'
import Landing from './Landing'
import TemplateSelection from './TemplateSelection'

const loadingMessages = [
  'Aligning pixels and printing dreams...',
  'Crafting certificates, one name at a time...',
  'Almost there... making it perfect.',
  'Bulk magic in progress...',
]

type GenerationState = 'idle' | 'loading' | 'success'

type LoadingScreenProps = {
  message: string
}

function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 text-center text-white">
      <section className="flex flex-col items-center gap-5">
        <div className="flex gap-2">
          <span className="h-2 w-2 rounded-full bg-white/35" />
          <span className="h-2 w-2 rounded-full bg-white/55" />
          <span className="h-2 w-2 rounded-full bg-white/75" />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold">
            Generating your certificates...
          </h1>
          <p className="text-sm text-white/55">{message}</p>
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
          <h1 className="text-4xl font-semibold">Certificates Generated 🎉</h1>
          <p className="text-sm text-white/55">
            Your certificates are ready to download
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            size="lg"
            onClick={() => console.log('Download ZIP')}
          >
            Download ZIP
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

    const successTimer = window.setTimeout(() => {
      setGenerationState('success')
    }, 2800)

    return () => {
      window.clearInterval(messageTimer)
      window.clearTimeout(successTimer)
    }
  }, [generationState])

  function resetToHome() {
    setGenerationState('idle')
    setPage('landing')
    setTemplateFile(null)
    setCsvFile(null)
    setPastedText('')
    setCollegeName('')
    setEventName('')
    setLoadingMessageIndex(0)
  }

  if (generationState === 'loading') {
    return <LoadingScreen message={loadingMessages[loadingMessageIndex]} />
  }

  if (generationState === 'success') {
    return <SuccessScreen onGenerateMore={resetToHome} />
  }

  if (page === 'editor') {
    return (
      <CanvasEditorPage
        templateFile={templateFile}
        pastedText={pastedText}
        collegeName={collegeName}
        eventName={eventName}
        onGenerate={() => {
          setLoadingMessageIndex(0)
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
