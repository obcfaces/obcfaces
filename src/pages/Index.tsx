import { useState, useEffect } from "react";

import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import { NextWeekSection } from "@/components/next-week-section";
import ContestFilters from "@/components/contest-filters";
import AiChat from "@/components/ai-chat";
import type { Category } from "@/components/contest-filters";

const Index = () => {
  console.log('[INDEX] Index page rendering...');
  
  try {
    return (
      <div className="min-h-screen bg-background">
        <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
          <h1 style={{ marginBottom: '20px' }}>OBC Faces of Philippines</h1>
          <p>Loading contest sections...</p>
          
          {/* Простая версия заголовка без сложных компонентов */}
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '20px',
            marginTop: '20px',
            borderRadius: '8px'
          }}>
            <h2>Contest Header Test</h2>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Load your photo and win 5000 Php
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('[INDEX] Error in Index component:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Index Error:</h2>
        <p>{String(error)}</p>
      </div>
    );
  }
};

export default Index;
