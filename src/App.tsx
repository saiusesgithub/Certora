import { useState } from 'react'
import DataInput from './DataInput'
import Landing from './Landing'
import TemplateSelection from './TemplateSelection'

function App() {
  const [page, setPage] = useState<'landing' | 'templates' | 'data'>(
    'landing',
  )

  if (page === 'data') {
    return <DataInput />
  }

  if (page === 'templates') {
    return <TemplateSelection onTemplateSelected={() => setPage('data')} />
  }

  return <Landing onGetStarted={() => setPage('templates')} />
}

export default App
