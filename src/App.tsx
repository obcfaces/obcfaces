import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Simple components  
const TopBar = () => (
  <header className="bg-white border-b border-border px-4 py-2">
    <nav className="max-w-6xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
          obc
        </div>
      </div>
      <a href="/auth" className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:bg-primary/90 transition-colors">
        Войти
      </a>
    </nav>
  </header>
);

const Index = () => {
  console.log('[INDEX] Full site with UI components');
  
  return (
    <>
      <Helmet>
        <title>OBC Faces of Philippines - Global Online Beauty Contest</title>
        <meta name="description" content="Global Online Beauty & Model Contest. Natural. Honest. Voted by People. Upload your photos and try to win!" />
        <link rel="canonical" href="/" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <TopBar />
        
        <main className="container mx-auto px-0">
          <Tabs defaultValue="this-week" className="w-full">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
              <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                <TabsList className="grid w-fit grid-cols-2 bg-muted/30">
                  <TabsTrigger value="this-week" className="text-sm">THIS WEEK</TabsTrigger>
                  <TabsTrigger value="winners" className="text-sm">WINNERS</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="this-week" className="mt-0">
              <div className="container mx-auto px-4 py-8">
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
                      <div key={index} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                          <span className="text-4xl">📸</span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-1">{contestant.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {contestant.city}, Philippines
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex text-yellow-400">
                                ★★★★★
                              </div>
                              <span className="text-sm">{contestant.rating}</span>
                            </div>
                            <button className="text-red-500 hover:text-red-600 transition-colors">
                              ♥ {Math.floor(Math.random() * 50) + 10}
                            </button>
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
              </div>
            </TabsContent>

            <TabsContent value="winners" className="mt-0">
              <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto text-center">
                  <h1 className="text-3xl font-bold mb-2">WINNER</h1>
                  <p className="text-muted-foreground mb-8">18 - 24 August 2025</p>
                  
                  <div className="bg-card rounded-lg border border-border overflow-hidden max-w-md mx-auto">
                    <div className="aspect-[3/4] bg-muted flex items-center justify-center relative">
                      <span className="text-6xl">📸</span>
                      <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded font-bold">
                        🏆 WINNER
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">Maria Santos</h3>
                      <p className="text-muted-foreground mb-4">Cebu, Philippines</p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-green-700 font-semibold">+ 5000 PhP</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
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
  console.log('[APP] Full site with Helmet and UI components');
  
  return (
    <HelmetProvider>
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
    </HelmetProvider>
  );
};

export default App;