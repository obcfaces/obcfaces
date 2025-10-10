import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";
import { RejectionReasonsManagerModal } from "./rejection-reasons-manager-modal";

export type RejectionReasonType = 
  | 'first_photo_makeup'
  | 'first_photo_id_style'
  | 'first_photo_blurry'
  | 'first_photo_filters'
  | 'first_photo_collages'
  | 'first_photo_editing'
  | 'second_photo_makeup'
  | 'second_photo_pose'
  | 'second_photo_clothing'
  | 'second_photo_accessories'
  | 'second_photo_filters'
  | 'second_photo_collages'
  | 'second_photo_scaled'
  | 'second_photo_editing'
  | 'both_photos_quality'
  | 'suspicion_not_own_photos'
  | 'wrong_gender_contest';

let REJECTION_REASONS = {
  first_photo_makeup: "First photo – No makeup allowed.",
  first_photo_id_style: "First photo – Must look like an ID photo: face straight to the camera, hands together in front.",
  first_photo_blurry: "First photo – Photo is too blurry/low quality.",
  first_photo_filters: "First photo – No filters or ai allowed.",
  first_photo_collages: "First photo – Collages are not allowed.",
  first_photo_editing: "First photo – Photo editing and filters are not allowed.",
  second_photo_makeup: "Second photo – No makeup allowed.",
  second_photo_pose: "Second photo – Must show the whole body from head to toe, standing straight, arms at the sides.",
  second_photo_clothing: "Second photo – Wear tight/fitted clothes (swimsuit, fitted shorts, or top). Dresses, skirts, loose tops, or high heels are not allowed.",
  second_photo_accessories: "Second photo – No bags or backpacks.",
  second_photo_filters: "Second photo – No filters or ai allowed.",
  second_photo_collages: "Second photo – Collages are not allowed.",
  second_photo_scaled: "Second photo – Scaled photos (e.g., 0.5x zoom) are not allowed.",
  second_photo_editing: "Second photo – Photo editing and filters are not allowed.",
  both_photos_quality: "Both photos – The quality is too low.",
  suspicion_not_own_photos: "Suspicion that the user is not using their own photos.",
  wrong_gender_contest: "You applied for a women's contest – we will open a men's contest soon."
};

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonTypes: RejectionReasonType[], notes: string) => Promise<void>;
  isLoading?: boolean;
}

export const RejectReasonModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: RejectReasonModalProps) => {
  const [selectedReasons, setSelectedReasons] = useState<RejectionReasonType[]>([]);
  const [notes, setNotes] = useState("");
  const [isManageReasonsOpen, setIsManageReasonsOpen] = useState(false);

  const handleReasonToggle = (reasonType: RejectionReasonType, checked: boolean) => {
    if (checked) {
      setSelectedReasons(prev => [...prev, reasonType]);
    } else {
      setSelectedReasons(prev => prev.filter(r => r !== reasonType));
    }
  };

  const handleSaveReasons = (updatedReasons: Record<string, string>) => {
    REJECTION_REASONS = updatedReasons as typeof REJECTION_REASONS;
  };

  const handleConfirm = async () => {
    console.log('🟡 REJECT MODAL: handleConfirm called', { 
      selectedReasonsCount: selectedReasons.length, 
      selectedReasons, 
      notes 
    });
    
    // Allow submission if either reasons are selected OR notes are provided
    if (selectedReasons.length === 0 && !notes.trim()) {
      console.log('🟡 REJECT MODAL: No reasons or notes provided, aborting');
      return;
    }
    
    console.log('🟡 REJECT MODAL: Calling onConfirm callback with data:', { selectedReasons, notes });
    
    try {
      await onConfirm(selectedReasons, notes);
      console.log('🟡 REJECT MODAL: onConfirm completed successfully');
      
      // Reset form only AFTER successful save
      setSelectedReasons([]);
      setNotes("");
    } catch (error) {
      console.error('🟡 REJECT MODAL: Error in onConfirm:', error);
      // Don't reset form if there was an error
    }
  };

  const handleClose = () => {
    setSelectedReasons([]);
    setNotes("");
    onClose();
  };


  console.log('🟢 REJECT MODAL: Rendering, isOpen=', isOpen, 'selectedReasons=', selectedReasons, 'notes=', notes);
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Rejection Reason</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsManageReasonsOpen(true)}
                className="h-8 gap-2"
              >
                <Settings className="h-4 w-4" />
                Edit Reasons
              </Button>
            </DialogTitle>
          </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Rejection Reasons</Label>
            <div className="space-y-3 mt-2 max-h-60 overflow-y-auto">
              {Object.entries(REJECTION_REASONS).map(([key, label]) => (
                <div key={key} className="flex items-start space-x-3">
                  <Checkbox
                    id={key}
                    checked={selectedReasons.includes(key as RejectionReasonType)}
                    onCheckedChange={(checked) => {
                      console.log('🟣 CHECKBOX CHANGED:', key, checked);
                      handleReasonToggle(key as RejectionReasonType, checked as boolean);
                    }}
                    className="mt-1"
                  />
                  <label 
                    htmlFor={key} 
                    className="text-sm font-medium leading-5 cursor-pointer flex-1"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Additional Comments (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information..."
              value={notes}
              onChange={(e) => {
                console.log('🟣 TEXTAREA CHANGED:', e.target.value);
                setNotes(e.target.value);
              }}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🔵 CANCEL CLICKED');
              handleClose();
            }} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={async (e) => {
              console.log('🔵 REJECT BUTTON CLICKED! Event:', e);
              console.log('🔵 selectedReasons:', selectedReasons);
              console.log('🔵 notes:', notes);
              console.log('🔵 isLoading:', isLoading);
              console.log('🔵 Calling handleConfirm...');
              await handleConfirm();
              console.log('🔵 handleConfirm completed');
            }} 
            disabled={(selectedReasons.length === 0 && !notes.trim()) || isLoading}
          >
            {isLoading ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <RejectionReasonsManagerModal
      isOpen={isManageReasonsOpen}
      onClose={() => setIsManageReasonsOpen(false)}
      currentReasons={REJECTION_REASONS}
      onSave={handleSaveReasons}
    />
    </>
  );
};

export { REJECTION_REASONS };