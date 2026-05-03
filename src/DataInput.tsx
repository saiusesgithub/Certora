import { useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from '@pikoloo/darwin-ui'

const cleanupPrompt = `Clean and format this list of names into a plain list.
Rules:
- One name per line
- No numbering or bullets
- Remove duplicates
- Fix capitalization
- Output ONLY the final list inside a plain text code block`

type CsvUploadCardProps = {
  csvFile: File | null
  onCsvFileChange: (file: File | null) => void
}

function CsvUploadCard({ csvFile, onCsvFileChange }: CsvUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className="mx-auto w-full max-w-[700px]" glass>
      <CardHeader className="gap-2 pb-4">
        <CardTitle>Upload CSV</CardTitle>
        <CardDescription>Upload a CSV file with your data</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          aria-label="Upload CSV file"
          onChange={(event) => onCsvFileChange(event.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm text-white/80">
              {csvFile ? csvFile.name : 'No CSV selected'}
            </p>
            <p className="mt-1 text-xs text-white/40">Accepted format: .csv</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Choose File
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

type PasteDataSectionProps = {
  pastedText: string
  onPastedTextChange: (value: string) => void
}

function PasteDataSection({
  pastedText,
  onPastedTextChange,
}: PasteDataSectionProps) {
  const entryCount = pastedText
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean).length

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(cleanupPrompt)
  }

  return (
    <Card className="mx-auto w-full max-w-[700px]" glass>
      <CardContent className="flex flex-col gap-5 p-6">
        <p className="max-w-2xl text-sm leading-6 text-white/65">
          Have messy data? Paste your list into ChatGPT or any AI using the
          prompt below, then paste the cleaned result here.
        </p>

        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-medium text-white/50">Reusable prompt</p>
            <Button variant="ghost" size="sm" onClick={handleCopyPrompt}>
              Copy Prompt
            </Button>
          </div>
          <pre className="overflow-x-auto text-left text-xs leading-5 text-white/70">
            <code>{cleanupPrompt}</code>
          </pre>
        </div>

        <Textarea
          value={pastedText}
          onChange={(event) => onPastedTextChange(event.target.value)}
          placeholder="Paste cleaned names here"
          aria-label="Paste cleaned data"
          className="min-h-[200px] bg-white/[0.03]"
          resize="vertical"
        />
        {/* Future priority rule: if CSV is uploaded, visually disable textarea; if textarea has content, CSV input is ignored. */}
        <p className="text-xs text-white/40">{entryCount} entries detected</p>
      </CardContent>
    </Card>
  )
}

type OptionalFieldsSectionProps = {
  collegeName: string
  eventName: string
  onCollegeNameChange: (value: string) => void
  onEventNameChange: (value: string) => void
}

function OptionalFieldsSection({
  collegeName,
  eventName,
  onCollegeNameChange,
  onEventNameChange,
}: OptionalFieldsSectionProps) {
  return (
    <Card className="mx-auto w-full max-w-[700px]" glass>
      <CardHeader className="gap-2 pb-4">
        <CardTitle>Optional Fields</CardTitle>
        <CardDescription>Add certificate context if needed</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Input
          value={collegeName}
          onChange={(event) => onCollegeNameChange(event.target.value)}
          placeholder="College Name"
          aria-label="College Name"
        />
        <Input
          value={eventName}
          onChange={(event) => onEventNameChange(event.target.value)}
          placeholder="Event Name"
          aria-label="Event Name"
        />
      </CardContent>
    </Card>
  )
}

function DataInput() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [eventName, setEventName] = useState('')

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="flex w-full max-w-[700px] flex-col gap-7">
        <CsvUploadCard csvFile={csvFile} onCsvFileChange={setCsvFile} />

        <div className="flex items-center justify-center text-xs font-medium text-white/35">
          OR
        </div>

        <PasteDataSection
          pastedText={pastedText}
          onPastedTextChange={setPastedText}
        />

        <OptionalFieldsSection
          collegeName={collegeName}
          eventName={eventName}
          onCollegeNameChange={setCollegeName}
          onEventNameChange={setEventName}
        />
      </section>
    </main>
  )
}

export { CsvUploadCard, OptionalFieldsSection, PasteDataSection }
export default DataInput
