import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  contestantName: string;
}

export function PhotoModal({ isOpen, onClose, photos, currentIndex, contestantName }: PhotoModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-black/90">
        <div className="relative w-full h-full flex items-center justify-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-4 z-10 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 z-10 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img
            src={photos[activeIndex]}
            alt={`${contestantName} photo ${activeIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
            {activeIndex + 1} / {photos.length}
          </div>

          {photos.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-1">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === activeIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}