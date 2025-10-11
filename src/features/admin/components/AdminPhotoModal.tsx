import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface AdminPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  contestantName: string;
}

export function AdminPhotoModal({ 
  isOpen, 
  onClose, 
  photos, 
  currentIndex, 
  contestantName 
}: AdminPhotoModalProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Reset activeIndex when currentIndex changes
  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  const nextPhoto = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const downloadPhoto = async () => {
    try {
      const photoUrl = photos[activeIndex];
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or create a default name
      const urlParts = photoUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || `${contestantName}_photo_${activeIndex + 1}.jpg`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  // Touch handlers for swipe functionality
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe left - next photo
      nextPhoto();
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous photo  
      prevPhoto();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-[110] w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Download button */}
      <button
        onClick={downloadPhoto}
        className="absolute right-20 top-4 z-[110] w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
        aria-label="Download photo"
      >
        <Download className="h-6 w-6 text-white" />
      </button>

      {/* Full-screen photo container */}
      <div 
        className="relative w-full h-full flex items-center justify-center bg-black"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Check if current item is video */}
        {photos[activeIndex]?.includes('winner-video.mp4') || photos[activeIndex]?.toLowerCase().includes('.mp4') || photos[activeIndex]?.toLowerCase().includes('.webm') || photos[activeIndex]?.toLowerCase().includes('.mov') ? (
          <video
            src={photos[activeIndex]}
            className="w-full h-full object-contain"
            controls
            autoPlay={false}
            preload="metadata"
            style={{ outline: 'none' }}
          />
        ) : (
          <img
            src={photos[activeIndex]}
            alt={`${contestantName} photo ${activeIndex + 1}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        )}

        {/* Navigation arrows - only show if multiple photos */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[105] text-white hover:text-white/90 transition-colors w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[105] text-white hover:text-white/90 transition-colors w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center"
              aria-label="Next photo"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </>
        )}

        {/* Photo indicators - only show if multiple photos */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to photo ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === activeIndex 
                    ? "bg-white" 
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {activeIndex + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  );
}