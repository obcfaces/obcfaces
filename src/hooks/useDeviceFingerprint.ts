import { useEffect, useState } from 'react';
import { saveDeviceFingerprint, getCurrentFingerprint } from '@/utils/fingerprint';
import { supabase } from '@/integrations/supabase/client';

export function useDeviceFingerprint() {
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        // Получаем текущего пользователя
        const { data: { user } } = await supabase.auth.getUser();
        
        // Сохраняем fingerprint
        const fpId = await saveDeviceFingerprint(user?.id);
        setFingerprintId(fpId);
      } catch (error) {
        console.error('Error initializing fingerprint:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initFingerprint();
  }, []);

  return { fingerprintId, isLoading };
}
