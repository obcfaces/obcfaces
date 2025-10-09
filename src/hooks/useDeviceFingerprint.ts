import { useEffect, useState } from 'react';
import { saveDeviceFingerprint, getDeviceFingerprint } from '@/utils/fingerprint';
import { supabase } from '@/integrations/supabase/client';

export function useDeviceFingerprint() {
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        // Получаем текущего пользователя
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        // Сохраняем fingerprint
        const fpId = await saveDeviceFingerprint(user.id);
        setFingerprintId(fpId);
        
        // Получаем полные данные fingerprint
        const fullFingerprintData = await getDeviceFingerprint();
        
        // Получаем IP адрес
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        // Определяем метод входа (OAuth или email)
        const loginMethod = user.app_metadata?.provider || 'email';
        
        console.log('📱 Saving fingerprint for user:', { userId: user.id, loginMethod, fpId });
        
        // Вызываем edge function для полного логирования и сохранения данных
        const { error } = await supabase.functions.invoke('auth-login-tracker', {
          body: {
            userId: user.id,
            loginMethod,
            ipAddress: ipData.ip,
            userAgent: navigator.userAgent,
            fingerprintId: fpId,
            fingerprintData: fullFingerprintData
          }
        });
        
        if (error) {
          console.error('Error calling auth-login-tracker:', error);
        } else {
          console.log('✅ Successfully logged fingerprint data for user');
        }
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
