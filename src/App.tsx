import { useState } from 'react'
import DataInput from './DataInput'
import CanvasEditorPage from './CanvasEditorPage'
import Landing from './Landing'
import TemplateSelection from './TemplateSelection'

function App() {
  const [page, setPage] = useState<'landing' | 'templates' | 'data' | 'editor'>(
    'landing',
  )
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [eventName, setEventName] = useState('')

  if (page === 'editor') {
    return (
      <CanvasEditorPage
        templateFile={templateFile}
        pastedText={pastedText}
        collegeName={collegeName}
        eventName={eventName}
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
