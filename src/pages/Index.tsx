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
  console.log('Index component начинает рендер');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#e8f4fd', 
      minHeight: '400px',
      border: '2px solid #0066cc'
    }}>
      <h2 style={{ color: '#0066cc', fontSize: '20px', marginBottom: '15px' }}>
        Index Компонент - Мобильный Тест
      </h2>
      
      <div style={{ marginBottom: '15px' }}>
        <p style={{ color: '#333', marginBottom: '5px' }}>
          ✅ React компонент загружен
        </p>
        <p style={{ color: '#333', marginBottom: '5px' }}>
          ✅ Стили применены
        </p>
        <p style={{ color: '#333', marginBottom: '5px' }}>
          ✅ JavaScript работает
        </p>
      </div>
      
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '10px' }}>
          Диагностическая информация:
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li style={{ color: '#666', marginBottom: '5px' }}>
            User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}
          </li>
          <li style={{ color: '#666', marginBottom: '5px' }}>
            Текущий URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
          </li>
          <li style={{ color: '#666', marginBottom: '5px' }}>
            Время загрузки: {new Date().toLocaleString()}
          </li>
        </ul>
      </div>
      
      <button 
        onClick={() => alert('Кнопка работает!')}
        style={{
          marginTop: '15px',
          padding: '10px 20px',
          backgroundColor: '#0066cc',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Тест интерактивности
      </button>
    </div>
  );
};

export default Index;
