import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  console.log("App rendering with basic routing");
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div>
              <h1 className="text-3xl font-bold">Contest App - Recovery Mode</h1>
              <p className="mt-4">The app is running in simplified mode to avoid recursion.</p>
              <p className="mt-2">Contest sections are temporarily disabled.</p>
            </div>
          } />
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
