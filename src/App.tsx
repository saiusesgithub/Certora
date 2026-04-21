import { useState } from "react";
import "./App.css";
import DataInput from "./components/DataInput";
import Footer from "./components/Footer";
import Landing from "./components/Landing";
import CertificateEditor from "./components/CertificateEditor";
import TemplateSelection from "./components/TemplateSelection";
import type { EditorPageData, TemplateSelectionResult } from "./components/editorTypes";

type Page = "landing" | "templateSelection" | "dataInput" | "editor";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSelectionResult | null>(null);
  const [editorData, setEditorData] = useState<EditorPageData | null>(null);

  return (
    <main className="app-shell">
      {currentPage === "landing" ? (
        <Landing onGetStarted={() => setCurrentPage("templateSelection")} />
      ) : currentPage === "templateSelection" ? (
        <TemplateSelection
          onTemplateSelected={(template) => {
            setSelectedTemplate(template);
            setCurrentPage("dataInput");
          }}
        />
      ) : currentPage === "dataInput" ? (
        <DataInput
          templateName={selectedTemplate?.file.name ?? null}
          templateType={selectedTemplate?.type ?? null}
          onContinue={(data) => {
            setEditorData(data);
            setCurrentPage("editor");
          }}
        />
      ) : (
        <CertificateEditor
          template={selectedTemplate}
          data={editorData}
          onGenerateMore={() => {
            setSelectedTemplate(null);
            setEditorData(null);
            setCurrentPage("templateSelection");
          }}
        />
      )}
      <Footer />
    </main>
  );
}

export default App;
