"use client";

import { useState } from "react";
import GlossaryMagazines from "@/components/GlossaryMagazines";
import GlossaryMagazinesDetail from "@/components/GlossaryMagazinesDetail";

export default function App() {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  const handleArticleClick = (id: number) => {
    setSelectedArticleId(id);
  };

  const handleBackToList = () => {
    setSelectedArticleId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {selectedArticleId === null ? (
        <GlossaryMagazines onArticleClick={handleArticleClick} />
      ) : (
        <GlossaryMagazinesDetail 
          articleId={selectedArticleId} 
          onBack={handleBackToList} 
        />
      )}
    </div>
  );
}