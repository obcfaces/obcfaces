import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, Image, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreatePostModalProps {
  children: React.ReactNode;
  onPostCreated?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  children,
  onPostCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter for images and videos only
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Неподдерживаемые файлы",
        description: "Можно загружать только изображения и видео",
        variant: "destructive"
      });
    }

    // Limit to 10 files max
    if (selectedFiles.length + validFiles.length > 10) {
      toast({
        title: "Слишком много файлов",
        description: "Максимум 10 файлов в одном посте",
        variant: "destructive"
      });
      return;
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Create previews
    const newPreviews = [...previews];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Добавьте медиа",
        description: "Выберите хотя бы одно фото или видео",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Вы должны войти в систему для создания поста");
      }

      // Upload files to Supabase Storage
      const uploadedUrls: string[] = [];
      const mediaTypes: string[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${i}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        mediaTypes.push(file.type.startsWith('video/') ? 'video' : 'image');
      }

      // Create post record
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim() || null,
          media_urls: uploadedUrls,
          media_types: mediaTypes
        });

      if (postError) {
        throw postError;
      }

      toast({
        title: "Пост создан!",
        description: "Ваш пост успешно опубликован"
      });

      // Reset form
      setCaption("");
      setSelectedFiles([]);
      setPreviews([]);
      setIsOpen(false);
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пост. Попробуйте снова.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileType = (file: File) => {
    return file.type.startsWith('video/') ? 'video' : 'image';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Создать пост</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Media Upload Section */}
          <div className="space-y-2">
            <Label>Фото и видео</Label>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-dashed border-2 hover:border-primary/50"
              disabled={isUploading}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload size={24} />
                <span className="text-sm">
                  Выберите фото или видео
                </span>
                <span className="text-xs text-muted-foreground">
                  До 10 файлов
                </span>
              </div>
            </Button>

            {/* Preview Grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      {getFileType(selectedFiles[index]) === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-black/10">
                          <Video size={24} className="text-muted-foreground" />
                          <span className="ml-2 text-xs text-muted-foreground">
                            {selectedFiles[index].name}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption Section */}
          <div className="space-y-2">
            <Label htmlFor="caption">Описание</Label>
            <Textarea
              id="caption"
              placeholder="Напишите что-нибудь о вашем посте..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              disabled={isUploading}
              className="resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isUploading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Публикуем...
              </>
            ) : (
              "Опубликовать"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;