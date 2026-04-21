import { useState } from "react";
import "./App.css";
import Footer from "./components/Footer";
import Landing from "./components/Landing";
import TemplateSelection from "./components/TemplateSelection";

type Page = "landing" | "templateSelection";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  return (
    <main className="app-shell">
      {currentPage === "landing" ? (
        <Landing onGetStarted={() => setCurrentPage("templateSelection")} />
      ) : (
        <TemplateSelection />
      )}
      <Footer />
    </main>
  );
}

export default App;
