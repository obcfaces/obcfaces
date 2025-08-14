import React from "react";

const Index = () => {
  console.log('[INDEX] Ultra minimal version');
  
  return (
    <div className="min-h-screen bg-white p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          OBC Faces of Philippines
        </h1>
        <p className="text-gray-600">Global Online Beauty Contest</p>
      </header>
      
      <main className="max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            Site Loading Successfully!
          </h2>
          <p className="text-blue-700">
            This is a minimal version to test mobile loading.
          </p>
          <div className="mt-4 space-y-2">
            <div className="bg-white p-3 rounded border">Contest Section 1</div>
            <div className="bg-white p-3 rounded border">Contest Section 2</div>
            <div className="bg-white p-3 rounded border">Contest Section 3</div>
          </div>
        </div>
      </main>
      
      <footer className="text-center mt-8 text-gray-500">
        <p>Mobile test version</p>
      </footer>
    </div>
  );
};

export default Index;