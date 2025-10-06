import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, Trash, Eye, Crown, Image as ImageIcon, Video } from 'lucide-react';

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
      console.log('Fetching participant data for:', participantId);
      const { data, error } = await supabase
        .from('weekly_contest_participants')
        .select('id, user_id, application_data')
        .eq('id', participantId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        console.log('Participant data loaded:', data);
        setParticipantData(data as ParticipantData);
      }
    } catch (error) {
      console.error('Error fetching participant data:', error);
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
        {/* Photo Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Фото для победительницы</label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="или введите URL изображения"
              value={content.payment_proof_url || ''}
              onChange={(e) => setContent(prev => ({ ...prev, payment_proof_url: e.target.value }))}
              className="flex-1"
            />
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              variant="outline"
              size="sm"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {uploadingPhoto ? 'Загрузка...' : 'Загрузить'}
            </Button>
          </div>
          {content.payment_proof_url && (
            <img 
              src={content.payment_proof_url} 
              alt="Preview" 
              className="mt-2 w-32 h-32 object-cover rounded"
            />
          )}
        </div>

        {/* Video Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Видео для победительницы</label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="или введите URL видео"
              value={content.testimonial_video_url || ''}
              onChange={(e) => setContent(prev => ({ ...prev, testimonial_video_url: e.target.value }))}
              className="flex-1"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              variant="outline"
              size="sm"
            >
              <Video className="h-4 w-4 mr-2" />
              {uploadingVideo ? 'Загрузка...' : 'Загрузить'}
            </Button>
          </div>
          {content.testimonial_video_url && (
            <video 
              src={content.testimonial_video_url} 
              className="mt-2 w-32 h-32 object-cover rounded"
              controls
            />
          )}
        </div>

        {/* Text */}
        <div>
          <label className="text-sm font-medium mb-2 block">Текст отзыва победительницы</label>
          <Textarea
            placeholder="Введите текст отзыва победительницы..."
            value={content.testimonial_text || ''}
            onChange={(e) => setContent(prev => ({ ...prev, testimonial_text: e.target.value }))}
            rows={4}
          />
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

        {/* Preview section */}
        {(content.payment_proof_url || content.testimonial_video_url || content.testimonial_text) && participantData && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Предварительный просмотр
            </h4>
            
            {/* Full card preview - как на сайте */}
            <div className="border rounded-lg overflow-hidden bg-white">
              {/* First row - реальная карточка победительницы */}
              <div className="flex border-b">
                {/* Face photo */}
                <div className="w-24 sm:w-28 md:w-32 h-32">
                  {participantData.application_data?.facePhotoUrl ? (
                    <img 
                      src={participantData.application_data.facePhotoUrl} 
                      alt="Face" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      Фото лица
                    </div>
                  )}
                </div>
                {/* Full body photo */}
                <div className="w-24 sm:w-28 md:w-32 h-32">
                  {participantData.application_data?.fullBodyPhotoUrl ? (
                    <img 
                      src={participantData.application_data.fullBodyPhotoUrl} 
                      alt="Full body" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-500">
                      Полное фото
                    </div>
                  )}
                </div>
                {/* Info area */}
                <div className="flex-1 p-2 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="font-semibold text-base">
                      {participantData.application_data?.firstName} {participantData.application_data?.lastName}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {participantData.application_data?.age} yo · {participantData.application_data?.weight} kg · {participantData.application_data?.height} cm
                    </div>
                    <div className="text-sm text-contest-blue">
                      {participantData.application_data?.country} · {participantData.application_data?.city}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs text-muted-foreground">
                    <span>👍 Like</span>
                    <span>💬 Comment</span>
                    <span>↗ Share</span>
                  </div>
                </div>
              </div>
              
              {/* Winner content header */}
              <div className="px-4 py-2 bg-gray-50 border-b">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Eye className="w-4 h-4" />
                  <span>Контент победительницы</span>
                </div>
              </div>
              
              {/* Second row - контент победительницы */}
              <div className="flex">
                {/* Payment proof photo - same width as face photo */}
                <div className="w-24 sm:w-28 md:w-32 h-32">
                  {content.payment_proof_url ? (
                    <img 
                      src={content.payment_proof_url} 
                      alt="Payment proof" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                      Фото
                    </div>
                  )}
                </div>
                
                {/* Testimonial video - same width as full body photo */}
                <div className="w-24 sm:w-28 md:w-32 h-32">
                  {content.testimonial_video_url ? (
                    <video 
                      src={content.testimonial_video_url} 
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                      Видео
                    </div>
                  )}
                </div>
                
                {/* Testimonial text - takes remaining space */}
                <div className="flex-1 p-2 flex items-center">
                  {content.testimonial_text ? (
                    <div className="w-full p-2 bg-blue-50 rounded text-sm italic text-gray-700">
                      {content.testimonial_text}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center text-xs text-gray-400">
                      Текст отзыва
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
