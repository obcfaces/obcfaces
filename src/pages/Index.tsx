import React from "react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🌟 OBC Faces of Philippines
            </h1>
            <p className="text-lg text-gray-600">Global Online Beauty Contest</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Discover Beauty from the Philippines
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Vote for your favorite contestants and be part of the global beauty community
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/contest" 
              className="bg-pink-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-pink-700 transition-colors"
            >
              View Contestants
            </Link>
            <Link 
              to="/auth" 
              className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Join Contest
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-4">👑</div>
            <h3 className="text-xl font-semibold mb-2">Beauty Contest</h3>
            <p className="text-gray-600">Vote for the most beautiful contestants from the Philippines</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2">Rating System</h3>
            <p className="text-gray-600">Rate contestants and see community rankings</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Mobile Friendly</h3>
            <p className="text-gray-600">Optimized for all devices and platforms</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Contest Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-pink-600">50+</div>
              <div className="text-gray-600">Contestants</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">10K+</div>
              <div className="text-gray-600">Votes Cast</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">25</div>
              <div className="text-gray-600">Provinces</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 mb-4">© 2024 OBC Faces of Philippines. All rights reserved.</p>
          <div className="flex justify-center space-x-6">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;