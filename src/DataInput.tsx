import { useState } from 'react'
import {
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
  return (
    <Card className="w-full" glass>
      <CardHeader>
        <CardTitle>Upload CSV</CardTitle>
        <CardDescription>Upload a CSV file with your data</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          type="file"
          accept=".csv"
          aria-label="Upload CSV file"
          onChange={(event) => onCsvFileChange(event.target.files?.[0] ?? null)}
        />
        {csvFile ? (
          <p className="text-xs text-white/45">{csvFile.name}</p>
        ) : null}
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
  return (
    <Card className="w-full" glass>
      <CardContent className="flex flex-col gap-4 pt-6">
        <p className="text-sm leading-6 text-white/65">
          Have messy data? Paste your list into ChatGPT or any AI using the
          prompt below, then paste the cleaned result here.
        </p>

        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left text-xs leading-5 text-white/70">
          <code>{cleanupPrompt}</code>
        </pre>

        <Textarea
          value={pastedText}
          onChange={(event) => onPastedTextChange(event.target.value)}
          placeholder="Paste cleaned names here"
          aria-label="Paste cleaned data"
          className="min-h-44"
          resize="vertical"
        />
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
    <Card className="w-full" glass>
      <CardHeader>
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
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="flex w-full max-w-2xl flex-col gap-5">
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
