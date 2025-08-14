import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Simple components
const TopBar = () => (
  <header className="bg-white border-b border-border px-4 py-2">
    <nav className="max-w-6xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
          obc
        </div>
      </div>
      <button className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm">
        Войти
      </button>
    </nav>
  </header>
);

const Index = () => {
  console.log('[INDEX] Full site with Tailwind');
  
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">THIS WEEK</h1>
            <p className="text-muted-foreground mb-1">25 - 31 August 2025</p>
            <p className="text-muted-foreground">Help us choose the winner of the week.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { name: 'Maria Santos', city: 'Cebu', rating: '4.8' },
              { name: 'Anna Cruz', city: 'Manila', rating: '4.5' },
              { name: 'Sofia Reyes', city: 'Davao', rating: '4.2' },
              { name: 'Isabella Garcia', city: 'Quezon', rating: '3.9' },
              { name: 'Camila Torres', city: 'Makati', rating: '3.5' },
              { name: 'Valentina Lopez', city: 'Pasig', rating: '3.1' }
            ].map((contestant, index) => (
              <div key={index} className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                  <span className="text-4xl">📸</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{contestant.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {contestant.city}, Philippines
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      ★★★★★
                    </div>
                    <span className="text-sm">{contestant.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Join the Contest!</h2>
            <p className="text-muted-foreground mb-6">
              Upload your photo and try to win 5000 PhP
            </p>
            <button 
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              onClick={() => alert('Upload works!')}
            >
              📸 Upload Your Photo
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// Simple pages for other routes
const Contest = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Contest Page</h1>
    </div>
  </div>
);

const Auth = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Auth Page</h1>
    </div>
  </div>
);

const Profile = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Profile Page</h1>
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Page Not Found</h1>
    </div>
  </div>
);

const App = () => {
  console.log('[APP] Full site with routing and Tailwind');
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/contest" element={<Contest />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/account" element={<Profile />} />
        <Route path="/privacy" element={<NotFound />} />
        <Route path="/terms" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;