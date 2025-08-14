import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<div style={{padding: '20px', textAlign: 'center'}}>404 - Page not found</div>} />
    </Routes>
  </BrowserRouter>
);

export default App;
