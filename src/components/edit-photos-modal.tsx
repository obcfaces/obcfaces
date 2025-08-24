import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EditPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoto1?: string;
  currentPhoto2?: string;
  onUpdate?: () => void;
}

export function EditPhotosModal({ 
  isOpen, 
  onClose, 
  currentPhoto1, 
  currentPhoto2,
  onUpdate 
}: EditPhotosModalProps) {
  const [photo1File, setPhoto1File] = useState<File | null>(null);
  const [photo2File, setPhoto2File] = useState<File | null>(null);
  const [photo1Preview, setPhoto1Preview] = useState<string | null>(null);
  const [photo2Preview, setPhoto2Preview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhoto1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto1File(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto1Preview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoto2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto2File(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto2Preview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File, photoNumber: 1 | 2): Promise<string | null> => {
    try {
      console.log(`📤 Starting upload for photo ${photoNumber}:`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user for upload');
        return null;
      }

      console.log('👤 User authenticated for upload:', user.id);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/photo_${photoNumber}.${fileExt}`;
      
      console.log(`📁 Uploading to path: ${fileName}`);
      console.log(`🪣 Bucket: contest-photos`);

      const { error: uploadError } = await supabase.storage
        .from('contest-photos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) {
        console.error(`❌ Upload error for photo ${photoNumber}:`, uploadError);
        toast({ 
          title: "Ошибка загрузки",
          description: `Не удалось загрузить фото ${photoNumber}: ${uploadError.message}`,
          variant: "destructive"
        });
        throw uploadError;
      }

      console.log(`✅ Upload successful for photo ${photoNumber}`);
      
      const { data } = supabase.storage
        .from('contest-photos')
        .getPublicUrl(fileName);
      
      // Add cache-busting timestamp to ensure new image loads immediately
      const finalUrl = `${data.publicUrl}?t=${Date.now()}`;
      console.log(`🔗 Generated public URL with cache busting: ${finalUrl}`);
      
      console.log(`✅ Photo ${photoNumber} upload result: ${finalUrl}`);
      return finalUrl;
    } catch (error) {
      console.error(`❌ Error uploading photo ${photoNumber}:`, error);
      toast({ 
        title: "Ошибка",
        description: `Произошла ошибка при загрузке фото ${photoNumber}`,
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSave = async () => {
    console.log('🔄 Starting photo save process...');
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User authenticated:', user?.id);
      if (!user) {
        console.log('❌ User not authenticated');
        toast({ description: "Не авторизован" });
        return;
      }

      console.log('📸 Initial photo URLs:', {
        photo1Url: currentPhoto1,
        photo2Url: currentPhoto2
      });

      let photo1Url = currentPhoto1;
      let photo2Url = currentPhoto2;

      // Upload new photos if selected
      if (photo1File) {
        console.log('⬆️ Uploading photo 1...');
        photo1Url = await uploadPhoto(photo1File, 1);
        if (!photo1Url) {
          console.log('❌ Photo 1 upload failed');
          toast({ description: "Ошибка загрузки первого фото" });
          return;
        }
        console.log('✅ Photo 1 uploaded successfully:', photo1Url);
      }

      if (photo2File) {
        console.log('⬆️ Uploading photo 2...');
        photo2Url = await uploadPhoto(photo2File, 2);
        if (!photo2Url) {
          console.log('❌ Photo 2 upload failed');
          toast({ description: "Ошибка загрузки второго фото" });
          return;
        }
        console.log('✅ Photo 2 uploaded successfully:', photo2Url);
      }

      console.log('📸 Final photo URLs before saving:', {
        photo1Url,
        photo2Url
      });

      // Update profile with new photo URLs
      const updateData: any = {};
      if (photo1Url) {
        updateData.photo_1_url = photo1Url;
      }
      if (photo2Url) {
        updateData.photo_2_url = photo2Url;
      }

      console.log('💾 Updating profile with URLs:', updateData);

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('❌ Profile update error:', error);
        toast({ 
          title: "Ошибка обновления профиля",
          description: `Не удалось обновить профиль: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }

      console.log('✅ Profile updated successfully');

      // Также обновляем данные в weekly_contest_participants если пользователь участвует
      try {
        const { data: participantData } = await supabase
          .from('weekly_contest_participants')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (participantData) {
          console.log('📋 Updating weekly contest participant data...');
          const existingData = (participantData.application_data as Record<string, any>) || {};
          const updatedApplicationData = {
            ...existingData,
            photo1_url: photo1Url,
            photo2_url: photo2Url
          };

          const { error: participantError } = await supabase
            .from('weekly_contest_participants')
            .update({
              application_data: updatedApplicationData
            })
            .eq('user_id', user.id);

          if (participantError) {
            console.error('❌ Participant update error:', participantError);
            toast({ 
              title: "Предупреждение",
              description: "Профиль обновлен, но не удалось обновить данные участника конкурса",
              variant: "destructive"
            });
          } else {
            console.log('✅ Weekly contest participant updated successfully');
          }
        }
      } catch (participantUpdateError) {
        console.error('❌ Error updating participant data:', participantUpdateError);
      }

      toast({ description: "Фотографии обновлены!" });
      
      // Reset state
      setPhoto1File(null);
      setPhoto2File(null);
      setPhoto1Preview(null);
      setPhoto2Preview(null);
      
      // Force component refresh and close modal
      onUpdate?.();
      onClose();
      console.log('🏁 Photo save process completed');
    } catch (error) {
      console.error('❌ Error updating photos:', error);
      toast({ 
        title: "Ошибка",
        description: "Произошла ошибка при обновлении фотографий",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto1Preview = () => {
    setPhoto1File(null);
    setPhoto1Preview(null);
  };

  const removePhoto2Preview = () => {
    setPhoto2File(null);
    setPhoto2Preview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать фотографии</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Photo 1 */}
          <div className="space-y-2">
            <Label htmlFor="photo1" className="text-sm font-medium">
              Первое фото (лицо и плечи)
            </Label>
            
            <div className="relative">
              {photo1Preview || currentPhoto1 ? (
                <div className="relative">
                  <img
                    src={photo1Preview || currentPhoto1}
                    alt="Photo 1 preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  {photo1Preview && (
                    <button
                      onClick={removePhoto1Preview}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Выберите фото</p>
                  </div>
                </div>
              )}
              
              <input
                id="photo1"
                type="file"
                accept="image/*"
                onChange={handlePhoto1Change}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Photo 2 */}
          <div className="space-y-2">
            <Label htmlFor="photo2" className="text-sm font-medium">
              Второе фото (в полный рост)
            </Label>
            
            <div className="relative">
              {photo2Preview || currentPhoto2 ? (
                <div className="relative">
                  <img
                    src={photo2Preview || currentPhoto2}
                    alt="Photo 2 preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  {photo2Preview && (
                    <button
                      onClick={removePhoto2Preview}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Выберите фото</p>
                  </div>
                </div>
              )}
              
              <input
                id="photo2"
                type="file"
                accept="image/*"
                onChange={handlePhoto2Change}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={uploading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={uploading || (!photo1File && !photo2File)}
            >
              {uploading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}