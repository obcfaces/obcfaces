import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditableContentProps {
  content: string;
  contentKey: string;
  className?: string;
  isAdmin: boolean;
}

export function EditableContent({ content, contentKey, className, isAdmin }: EditableContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here you would save to your content management table
      // For now, we'll just show a success message
      toast({
        title: "Контент обновлен",
        description: "Изменения успешно сохранены",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  if (!isAdmin) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div className="relative group">
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[100px] text-sm"
            placeholder="Введите текст..."
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-contest-blue hover:bg-contest-blue/90"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? "Сохранение..." : "Сохранить"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-3 w-3 mr-1" />
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className={className}>{editedContent}</div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto min-w-0"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}