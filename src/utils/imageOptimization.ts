/**
 * Image optimization utilities with CDN caching
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Optimize Supabase storage image URL with caching
 */
export const optimizeImageUrl = (
  url: string,
  options: ImageOptimizationOptions = {}
): string => {
  if (!url) return url;

  // Skip optimization for non-Supabase URLs
  if (!url.includes('supabase.co/storage') && !url.includes('mlbzdxsumfudrtuuybqn')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    // Set default quality if not specified
    const quality = options.quality || 80;
    const format = options.format || 'webp';

    // Add optimization parameters
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    params.set('quality', quality.toString());
    params.set('format', format);
    params.set('resize', 'cover');

    // Return optimized URL
    return `${urlObj.origin}${urlObj.pathname}?${params.toString()}`;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return url;
  }
};

/**
 * Get responsive image srcset for different screen sizes
 */
export const getResponsiveSrcSet = (
  url: string,
  sizes: number[] = [320, 640, 960, 1280, 1920]
): string => {
  if (!url) return '';

  return sizes
    .map(width => `${optimizeImageUrl(url, { width, quality: 80, format: 'webp' })} ${width}w`)
    .join(', ');
};

/**
 * Preload critical images with caching
 */
export const preloadImage = (url: string, options: ImageOptimizationOptions = {}): void => {
  if (!url || typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = optimizeImageUrl(url, options);
  link.setAttribute('fetchpriority', 'high');

  // Add to head
  document.head.appendChild(link);
};

/**
 * Lazy load image with IntersectionObserver
 */
export const lazyLoadImage = (
  img: HTMLImageElement,
  src: string,
  options: ImageOptimizationOptions = {}
): void => {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver
    img.src = optimizeImageUrl(src, options);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = optimizeImageUrl(src, options);
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.01,
    }
  );

  observer.observe(img);
};

/**
 * Cache image in browser cache
 */
export const cacheImage = async (url: string, options: ImageOptimizationOptions = {}): Promise<void> => {
  if (!('caches' in window)) return;

  try {
    const optimizedUrl = optimizeImageUrl(url, options);
    const cache = await caches.open('images-v1');
    
    // Check if already cached
    const cached = await cache.match(optimizedUrl);
    if (cached) return;

    // Fetch and cache
    const response = await fetch(optimizedUrl);
    if (response.ok) {
      await cache.put(optimizedUrl, response.clone());
    }
  } catch (error) {
    console.error('Error caching image:', error);
  }
};

/**
 * Get optimized thumbnail URL
 */
export const getThumbnailUrl = (url: string, size: number = 150): string => {
  return optimizeImageUrl(url, {
    width: size,
    height: size,
    quality: 70,
    format: 'webp',
  });
};

/**
 * Get optimized full-size URL
 */
export const getFullSizeUrl = (url: string, maxWidth: number = 1920): string => {
  return optimizeImageUrl(url, {
    width: maxWidth,
    quality: 85,
    format: 'webp',
  });
};