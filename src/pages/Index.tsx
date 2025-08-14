import { useState } from "react";

const Index = () => {
  console.log('[INDEX] Simple Index rendering');
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          OBC Faces of Philippines
        </h1>
        <p className="text-gray-600 mb-4">
          Mobile version loading test...
        </p>
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold text-blue-800">Contest Info</h2>
          <p className="text-blue-600 text-sm">Global Online Beauty Contest</p>
        </div>
        <button 
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
          onClick={() => alert('Button works on mobile!')}
        >
          Load your photo and win 5000 Php
        </button>
        <div className="mt-4 text-xs text-gray-500">
          React App Version: Mobile Test
        </div>
      </div>
    </div>
  );
};

export default Index;
