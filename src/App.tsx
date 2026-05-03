import { useState } from 'react'
import Landing from './Landing'
import TemplateSelection from './TemplateSelection'

function App() {
  const [page, setPage] = useState<'landing' | 'templates'>('landing')

  if (page === 'templates') {
    return <TemplateSelection />
  }

  return <Landing onGetStarted={() => setPage('templates')} />
}

export default App
