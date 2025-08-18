import { useState, useEffect } from "react";

import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import { NextWeekSection } from "@/components/next-week-section";
import ContestFilters from "@/components/contest-filters";
import AiChat from "@/components/ai-chat";
import { EditableContent } from "@/components/editable-content";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/components/contest-filters";

const Index = () => {
  console.log('Index component loading...');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px', 
      backgroundColor: '#f0f8ff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          color: '#2c5aa0', 
          fontSize: '24px', 
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          🌟 OBC Faces of Philippines
        </h1>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Мобильная версия работает! ✅
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#e8f4f8',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #b8d4ea'
        }}>
          <h2 style={{ color: '#2c5aa0', fontSize: '18px', marginBottom: '10px' }}>
            Навигация:
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{
              padding: '12px',
              backgroundColor: '#2c5aa0',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}>
              🏆 Конкурс
            </button>
            <button style={{
              padding: '12px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}>
              ❓ Как это работает
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
