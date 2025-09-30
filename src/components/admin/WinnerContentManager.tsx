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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (participantId || userId) {
      fetchWinnerContent();
    }
  }, [participantId, userId]);

  const fetchWinnerContent = async () => {
    if (!participantId && !userId) return;
    
    setLoading(true);
    try {
      let query = supabase.from('winner_content').select('*');
      
      if (participantId) {
        query = query.eq('participant_id', participantId);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setContent(data);
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

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер файла не должен превышать 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${participantId || userId}-photo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('winner-content')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
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

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер файла не должен превышать 50MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${participantId || userId}-video-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('winner-content')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
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
          Контент победителя
          {participantName && <span className="text-sm font-normal">({participantName})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Фото оплаты</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {uploadingPhoto ? 'Загрузка...' : 'Загрузить фото'}
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          {content.payment_proof_url && (
            <Input
              type="url"
              placeholder="https://example.com/payment-proof.jpg"
              value={content.payment_proof_url || ''}
              onChange={(e) => setContent(prev => ({ ...prev, payment_proof_url: e.target.value }))}
              className="mt-2"
            />
          )}
        </div>

        {/* Video Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Видео-отзыв</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="flex-1"
            >
              <Video className="h-4 w-4 mr-2" />
              {uploadingVideo ? 'Загрузка...' : 'Загрузить видео'}
            </Button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </div>
          {content.testimonial_video_url && (
            <Input
              type="url"
              placeholder="https://example.com/testimonial-video.mp4"
              value={content.testimonial_video_url || ''}
              onChange={(e) => setContent(prev => ({ ...prev, testimonial_video_url: e.target.value }))}
              className="mt-2"
            />
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Текст отзыва</label>
          <Textarea
            placeholder="Введите текст отзыва победителя..."
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
        {(content.payment_proof_url || content.testimonial_video_url || content.testimonial_text) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Предварительный просмотр
            </h4>
            <div className="flex gap-2 h-32">
              {content.payment_proof_url && (
                <img 
                  src={content.payment_proof_url} 
                  alt="Payment proof" 
                  className="w-24 h-full object-cover rounded"
                />
              )}
              {content.testimonial_video_url && (
                <video 
                  src={content.testimonial_video_url} 
                  className="w-24 h-full object-cover rounded"
                  controls={false}
                  muted
                />
              )}
              {content.testimonial_text && (
                <div className="flex-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                  <p className="italic">{content.testimonial_text}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}