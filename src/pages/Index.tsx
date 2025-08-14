import React from "react";
import { Helmet } from "react-helmet-async";
import TopBar from "@/components/top-bar";

// Import images statically
import contestant1 from "@/assets/contestant-1.jpg";
import contestant2 from "@/assets/contestant-2.jpg";
import contestant3 from "@/assets/contestant-3.jpg";

const Index = () => {
  console.log('[INDEX] Static mobile-friendly version');

  return (
    <>
      <Helmet>
        <title>OBC Faces of Philippines - Global Online Beauty Contest</title>
        <meta name="description" content="Global Online Beauty & Model Contest. Natural. Honest. Voted by People. Upload your photos and try to win!" />
        <link rel="canonical" href="/" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <TopBar />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">THIS WEEK</h1>
              <p className="text-muted-foreground mb-1">25 - 31 August 2025</p>
              <p className="text-muted-foreground">Help us choose the winner of the week.</p>
            </div>

            {/* Simple grid of contestants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Maria Santos", image: contestant1, rating: 4.8 },
                { name: "Anna Cruz", image: contestant2, rating: 4.5 },
                { name: "Sofia Reyes", image: contestant3, rating: 4.2 },
                { name: "Isabella Garcia", image: contestant1, rating: 3.9 },
                { name: "Camila Torres", image: contestant2, rating: 3.5 },
                { name: "Valentina Lopez", image: contestant3, rating: 3.1 }
              ].map((contestant, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden shadow-sm border">
                  <div className="aspect-[3/4] relative">
                    <img 
                      src={contestant.image} 
                      alt={contestant.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{contestant.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Philippines</p>
                    <div className="flex items-center gap-2">
                      <div className="flex text-yellow-400">
                        {"★".repeat(Math.floor(contestant.rating))}
                        {"☆".repeat(5 - Math.floor(contestant.rating))}
                      </div>
                      <span className="text-sm">{contestant.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload section */}
            <div className="mt-12 text-center">
              <div className="bg-primary/5 rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-4">Join the Contest!</h2>
                <p className="text-muted-foreground mb-6">
                  Upload your photo and try to win 5000 PhP
                </p>
                <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  📸 Upload Your Photo
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Index;