import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, Trash, Eye, Crown, Image as ImageIcon, Video, Play, X } from 'lucide-react';
import { CompactCardLayout } from '@/components/CompactCardLayout';
import { getCountryDisplayName } from '@/lib/utils';

interface WinnerContentManagerProps {
  participantId?: string;
  userId?: string;
  participantName?: string;
}

interface WinnerContent {
  id?: string;
  participant_id: string;
  user_id: string;
  payment_proof_url?: string;
  testimonial_video_url?: string;
  testimonial_text?: string;
}

interface ParticipantData {
  id: string;
  user_id: string;
  application_data: {
    firstName: string;
    lastName: string;
    age: number;
    weight: number;
    height: number;
    country: string;
    city: string;
    facePhotoUrl: string;
    fullBodyPhotoUrl: string;
  };
}

export function WinnerContentManager({ 
  participantId, 
  userId, 
  participantName 
}: WinnerContentManagerProps) {
  const [content, setContent] = useState<WinnerContent>({
    participant_id: participantId || '',
    user_id: userId || '',
    payment_proof_url: '',
    testimonial_video_url: '',
    testimonial_text: ''
  });
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('🔄 WinnerContentManager useEffect triggered:', { participantId, userId });
    
    // ВАЖНО: Сначала очищаем старое состояние
    setContent({
      participant_id: participantId || '',
      user_id: userId || '',
      payment_proof_url: '',
      testimonial_video_url: '',
      testimonial_text: ''
    });
    setParticipantData(null);
    
    if (participantId || userId) {
      fetchWinnerContent();
      if (participantId) {
        fetchParticipantData();
      }
    } else {
      console.log('⚠️ No participantId or userId provided');
    }
  }, [participantId, userId]);

  const fetchParticipantData = async () => {
    if (!participantId) return;
    
    try {
      console.log('🔍 Fetching participant data for:', participantId);
      const { data, error } = await supabase
        .from('weekly_contest_participants')
        .select('id, user_id, application_data')
        .eq('id', participantId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        console.log('✅ Participant data loaded:', JSON.stringify(data, null, 2));
        console.log('📋 Application data keys:', Object.keys(data.application_data || {}));
        setParticipantData(data as ParticipantData);
      }
    } catch (error) {
      console.error('❌ Error fetching participant data:', error);
    }
  };

  const fetchWinnerContent = async () => {
    if (!participantId && !userId) return;
    
    setLoading(true);
    try {
      console.log('Fetching winner content for:', { participantId, userId });
      let query = supabase.from('winner_content').select('*');
      
      if (participantId) {
        console.log('Querying by participant_id:', participantId);
        query = query.eq('participant_id', participantId);
      } else if (userId) {
        console.log('Querying by user_id:', userId);
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      console.log('Winner content query result:', { data, error });
      
      if (error) throw error;
      
      if (data) {
        console.log('Setting winner content:', data);
        setContent(data);
      } else {
        console.log('No winner content found, resetting to default');
        setContent({
          participant_id: participantId || '',
          user_id: userId || '',
          payment_proof_url: '',
          testimonial_video_url: '',
          testimonial_text: ''
        });
      }
    } catch (error) {
      console.error('Error fetching winner content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!participantId && !userId) {
      toast({
        title: "Ошибка",
        description: "Не указан ID участника или пользователя",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const contentData = {
        participant_id: participantId || '',
        user_id: userId || '',
        payment_proof_url: content.payment_proof_url || null,
        testimonial_video_url: content.testimonial_video_url || null,
        testimonial_text: content.testimonial_text || null
      };

      if (content.id) {
        // Update existing
        const { error } = await supabase
          .from('winner_content')
          .update(contentData)
          .eq('id', content.id);
          
        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('winner_content')
          .insert(contentData)
          .select()
          .single();
          
        if (error) throw error;
        setContent(data);
      }

      toast({
        title: "Успех",
        description: "Контент победителя сохранен"
      });
    } catch (error) {
      console.error('Error saving winner content:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить контент",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!content.id) return;

    if (!confirm('Вы уверены, что хотите удалить контент победителя?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('winner_content')
        .delete()
        .eq('id', content.id);
        
      if (error) throw error;

      setContent({
        participant_id: participantId || '',
        user_id: userId || '',
        payment_proof_url: '',
        testimonial_video_url: '',
        testimonial_text: ''
      });

      toast({
        title: "Успех",
        description: "Контент победителя удален"
      });
    } catch (error) {
      console.error('Error deleting winner content:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить контент",
        variant: "destructive"
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB for images)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер изображения не должен превышать 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId || participantId}-photo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('winner-content')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('winner-content')
        .getPublicUrl(filePath);

      setContent(prev => ({ ...prev, payment_proof_url: publicUrl }));

      toast({
        title: "Успех",
        description: "Фото успешно загружено"
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фото",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите видео",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 50MB for videos)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер видео не должен превышать 50MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId || participantId}-video-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('winner-content')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('winner-content')
        .getPublicUrl(filePath);

      setContent(prev => ({ ...prev, testimonial_video_url: publicUrl }));

      toast({
        title: "Успех",
        description: "Видео успешно загружено"
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить видео",
        variant: "destructive"
      });
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  if (!participantData) {
    return <div className="p-4">Нет данных участника</div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          Контент победительницы
          {participantName && <span className="text-sm font-normal">({participantName})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview section - всегда показываем */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Предварительный просмотр
          </h4>
          
          {/* Карточка победителя - первый ряд (используем CompactCardLayout) */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="flex h-36 sm:h-40 md:h-44 gap-px relative">
              <div className="relative">
                <img 
                  src={(participantData.application_data as any)?.facePhotoUrl || (participantData.application_data as any)?.photo1_url || ''} 
                  alt="Face"
                  className="w-24 sm:w-28 md:w-32 h-full object-cover"
                />
                <div className="absolute top-0 left-0 bg-black/70 text-white text-xs font-bold min-w-[20px] h-[20px] flex items-center justify-center">
                  1
                </div>
              </div>
              <div className="relative">
                <img 
                  src={(participantData.application_data as any)?.fullBodyPhotoUrl || (participantData.application_data as any)?.photo2_url || ''} 
                  alt="Full body"
                  className="w-24 sm:w-28 md:w-32 h-full object-cover"
                />
              </div>
              <div className="flex-1 p-1 sm:p-2 md:p-3 flex flex-col relative bg-white">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 mr-2">
                    <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">
                      {(participantData.application_data as any)?.firstName || (participantData.application_data as any)?.first_name} {(participantData.application_data as any)?.lastName || (participantData.application_data as any)?.last_name}
                    </h3>
                    <div className="text-xs sm:text-sm text-muted-foreground font-normal">
                      {(participantData.application_data as any)?.age} yo · {(participantData.application_data as any)?.weight || (participantData.application_data as any)?.weight_kg} kg · {(participantData.application_data as any)?.height || (participantData.application_data as any)?.height_cm} cm
                    </div>
                    <div className="text-sm sm:text-base text-contest-blue truncate">
                      {getCountryDisplayName((participantData.application_data as any)?.country || '')} · {(participantData.application_data as any)?.city}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Второй ряд - контент победительницы с загрузкой */}
            <div className="border-t">
              <div className="flex h-36 sm:h-40 md:h-44 gap-px relative">
                {/* Payment proof photo - с кнопкой загрузки и удаления */}
                <div className="relative w-24 sm:w-28 md:w-32 group">
                  {content.payment_proof_url ? (
                    <>
                      <img 
                        src={content.payment_proof_url} 
                        alt="Payment proof" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          size="sm"
                          variant="secondary"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setContent(prev => ({ ...prev, payment_proof_url: '' }))}
                          size="sm"
                          variant="destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div 
                      className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-xs text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <ImageIcon className="h-6 w-6 mb-1" />
                      <span>Фото</span>
                      <span className="text-[10px]">Кликните</span>
                    </div>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Testimonial video - с кнопкой загрузки и удаления */}
                <div className="relative w-24 sm:w-28 md:w-32 group">
                  {content.testimonial_video_url ? (
                    <>
                      <video 
                        src={content.testimonial_video_url}
                        className="w-full h-full object-cover"
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploadingVideo}
                          size="sm"
                          variant="secondary"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setContent(prev => ({ ...prev, testimonial_video_url: '' }))}
                          size="sm"
                          variant="destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {!uploadingVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                          <div className="bg-black/50 rounded-full p-3">
                            <Play className="w-6 h-6 text-white" fill="white" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div 
                      className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-xs text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Video className="h-6 w-6 mb-1" />
                      <span>Видео</span>
                      <span className="text-[10px]">Кликните</span>
                    </div>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>

                {/* Testimonial text - с полем ввода */}
                <div className="flex-1 p-1 sm:p-2 md:p-3 bg-white overflow-auto">
                  <Textarea
                    placeholder="Введите текст отзыва победительницы..."
                    value={content.testimonial_text || ''}
                    onChange={(e) => setContent(prev => ({ ...prev, testimonial_text: e.target.value }))}
                    className="w-full h-full text-xs italic resize-none border-0 focus-visible:ring-0 p-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
          
          {content.id && (
            <Button 
              onClick={handleDelete} 
              variant="destructive"
              size="sm"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
