import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@pikoloo/darwin-ui'

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm" glass>
        <CardHeader>
          <CardTitle>Darwin UI</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input placeholder="Project name" aria-label="Project name" />
          <Button variant="primary">Create project</Button>
        </CardContent>
      </Card>
    </main>
  )
}

export default App
