import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '@/integrations/supabase/client';

export interface DeviceFingerprintData {
  fingerprint_id: string;
  screen_resolution: string;
  screen_color_depth: number;
  timezone: string;
  timezone_offset: number;
  language: string;
  languages: string[];
  platform: string;
  user_agent: string;
  hardware_concurrency: number;
  device_memory: number | null;
  cookies_enabled: boolean;
  do_not_track: boolean;
  touch_support: boolean;
  canvas_fingerprint: string;
  webgl_vendor: string;
  webgl_renderer: string;
  audio_fingerprint: string;
  installed_fonts: string[];
  ip_address: string | null;
}

// Список популярных шрифтов для проверки
const COMMON_FONTS = [
  'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Times New Roman',
  'Georgia', 'Garamond', 'Courier New', 'Brush Script MT', 'Comic Sans MS',
  'Impact', 'Lucida Sans Unicode', 'Palatino Linotype', 'MS Sans Serif', 'MS Serif'
];

// Получение Canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const text = 'BrowserFingerprint,🎨🔐';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText(text, 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText(text, 4, 17);

    return canvas.toDataURL();
  } catch (e) {
    return '';
  }
}

// Получение WebGL информации
function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { vendor: '', renderer: '' };

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { vendor: '', renderer: '' };

    return {
      vendor: (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '',
      renderer: (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
    };
  } catch (e) {
    return { vendor: '', renderer: '' };
  }
}

// Получение Audio fingerprint
function getAudioFingerprint(): string {
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return '';

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0;
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(0);
    const fingerprint = analyser.frequencyBinCount.toString();
    
    oscillator.stop();
    scriptProcessor.disconnect();
    analyser.disconnect();
    gainNode.disconnect();
    
    return fingerprint;
  } catch (e) {
    return '';
  }
}

// Проверка установленных шрифтов
function detectInstalledFonts(): string[] {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const baselineWidths: { [key: string]: number } = {};
  
  // Измеряем базовые шрифты
  for (const baseFont of baseFonts) {
    ctx.font = `${testSize} ${baseFont}`;
    baselineWidths[baseFont] = ctx.measureText(testString).width;
  }

  const detected: string[] = [];

  // Проверяем каждый шрифт
  for (const font of COMMON_FONTS) {
    let detected_font = false;
    for (const baseFont of baseFonts) {
      ctx.font = `${testSize} '${font}', ${baseFont}`;
      const width = ctx.measureText(testString).width;
      if (width !== baselineWidths[baseFont]) {
        detected_font = true;
        break;
      }
    }
    if (detected_font) {
      detected.push(font);
    }
  }

  return detected;
}

// Получение всех данных fingerprint
export async function getDeviceFingerprint(): Promise<DeviceFingerprintData> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  const webgl = getWebGLInfo();
  const installedFonts = detectInstalledFonts();

  const data: DeviceFingerprintData = {
    fingerprint_id: result.visitorId,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    screen_color_depth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezone_offset: new Date().getTimezoneOffset(),
    language: navigator.language,
    languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
    platform: navigator.platform,
    user_agent: navigator.userAgent,
    hardware_concurrency: navigator.hardwareConcurrency || 0,
    device_memory: (navigator as any).deviceMemory || null,
    cookies_enabled: navigator.cookieEnabled,
    do_not_track: navigator.doNotTrack === '1',
    touch_support: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    canvas_fingerprint: getCanvasFingerprint(),
    webgl_vendor: webgl.vendor,
    webgl_renderer: webgl.renderer,
    audio_fingerprint: getAudioFingerprint(),
    installed_fonts: installedFonts,
    ip_address: null // IP будет определен на сервере
  };

  return data;
}

// Сохранение fingerprint в базу данных
export async function saveDeviceFingerprint(userId?: string): Promise<string | null> {
  try {
    const fingerprintData = await getDeviceFingerprint();

    // Проверяем, существует ли уже такой fingerprint
    const { data: existing } = await supabase
      .from('user_device_fingerprints')
      .select('id, visit_count')
      .eq('fingerprint_id', fingerprintData.fingerprint_id)
      .maybeSingle();

    if (existing) {
      // Обновляем существующий fingerprint
      await supabase
        .from('user_device_fingerprints')
        .update({
          last_seen_at: new Date().toISOString(),
          visit_count: existing.visit_count + 1,
          ...(userId && { user_id: userId })
        })
        .eq('id', existing.id);

      return fingerprintData.fingerprint_id;
    } else {
      // Создаем новый fingerprint
      const { error } = await supabase
        .from('user_device_fingerprints')
        .insert({
          ...fingerprintData,
          user_id: userId || null
        });

      if (error) {
        console.error('Error saving fingerprint:', error);
        return null;
      }

      return fingerprintData.fingerprint_id;
    }
  } catch (error) {
    console.error('Error in saveDeviceFingerprint:', error);
    return null;
  }
}

// Получение fingerprint для текущего устройства
export async function getCurrentFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
}

// Проверка на подозрительную активность (один fingerprint используется многими пользователями)
export async function checkSuspiciousFingerprint(fingerprintId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_device_fingerprints')
    .select('user_id')
    .eq('fingerprint_id', fingerprintId);

  if (error || !data) return false;

  // Если один fingerprint используется более чем 3 пользователями - подозрительно
  const uniqueUsers = new Set(data.map(d => d.user_id).filter(Boolean));
  return uniqueUsers.size > 3;
}
