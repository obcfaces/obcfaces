import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
};

interface ImageOptimizationRequest {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, width, height, quality = 80, format = 'webp' }: ImageOptimizationRequest = 
      await req.json();

    if (!url) {
      throw new Error('Image URL is required');
    }

    console.log(`🖼️  Optimizing image: ${url}`);
    console.log(`Settings: ${width}x${height}, quality: ${quality}, format: ${format}`);

    // For Supabase Storage URLs, we can use transform parameters
    let optimizedUrl = url;

    if (url.includes('supabase.co/storage')) {
      const urlObj = new URL(url);
      const params = new URLSearchParams();

      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      params.append('quality', quality.toString());
      params.append('format', format);
      
      // Add resize mode
      params.append('resize', 'cover');

      optimizedUrl = `${urlObj.origin}${urlObj.pathname}?${params.toString()}`;
    }

    // Return optimized URL with caching headers
    return new Response(
      JSON.stringify({
        success: true,
        originalUrl: url,
        optimizedUrl,
        params: {
          width,
          height,
          quality,
          format
        }
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'CDN-Cache-Control': 'public, max-age=31536000',
          'Surrogate-Control': 'public, max-age=31536000'
        }
      }
    );

  } catch (error: any) {
    console.error('Error in optimize-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});