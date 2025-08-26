import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  priority?: boolean;
}

export const LazyImage = ({
  src,
  alt,
  className,
  placeholderSrc,
  onLoad,
  onError,
  sizes,
  priority = false
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before the image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate optimized image URL (if using a CDN like Supabase Storage)
  const getOptimizedSrc = (originalSrc: string, width?: number) => {
    // For Supabase Storage, you can add transform parameters
    if (originalSrc.includes('supabase.co/storage')) {
      const url = new URL(originalSrc);
      if (width) {
        url.searchParams.set('width', width.toString());
        url.searchParams.set('quality', '80');
      }
      return url.toString();
    }
    return originalSrc;
  };

  return (
    <div 
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded" />
          )}
        </div>
      )}

      {/* Main Image */}
      {(isInView || priority) && !hasError && (
        <img
          src={getOptimizedSrc(src)}
          alt={alt}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded" />
            <span className="text-xs">Failed to load</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for image preloading
export const useImagePreloader = (imageUrls: string[]) => {
  useEffect(() => {
    const preloadImages = imageUrls.map(url => {
      const img = new Image();
      img.src = url;
      return img;
    });

    return () => {
      preloadImages.forEach(img => {
        img.src = '';
      });
    };
  }, [imageUrls]);
};