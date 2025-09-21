import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export type RejectionReasonType = 
  | 'first_photo_makeup'
  | 'first_photo_id_style'
  | 'first_photo_blurry'
  | 'first_photo_filters'
  | 'second_photo_makeup'
  | 'second_photo_pose'
  | 'second_photo_clothing'
  | 'second_photo_accessories'
  | 'second_photo_filters'
  | 'both_photos_quality';

const REJECTION_REASONS = {
  first_photo_makeup: "First photo – No makeup allowed.",
  first_photo_id_style: "First photo – Must look like an ID photo: face straight to the camera, hands together in front.",
  first_photo_blurry: "First photo – Photo is too blurry/low quality.",
  first_photo_filters: "First photo – No filters or ai allowed.",
  second_photo_makeup: "Second photo – No makeup allowed.",
  second_photo_pose: "Second photo – Must show the whole body from head to toe, standing straight, arms at the sides.",
  second_photo_clothing: "Second photo – Wear tight/fitted clothes (swimsuit, fitted shorts, or top). Dresses, skirts, loose tops, or high heels are not allowed.",
  second_photo_accessories: "Second photo – No bags or backpacks.",
  second_photo_filters: "Second photo – No filters or ai allowed.",
  both_photos_quality: "Both photos – The quality is too low."
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

  const handleReasonToggle = (reasonType: RejectionReasonType, checked: boolean) => {
    if (checked) {
      setSelectedReasons(prev => [...prev, reasonType]);
    } else {
      setSelectedReasons(prev => prev.filter(r => r !== reasonType));
    }
  };

  const handleConfirm = async () => {
    if (selectedReasons.length === 0) return;
    
    await onConfirm(selectedReasons, notes);
    
    // Reset form
    setSelectedReasons([]);
    setNotes("");
  };

  const handleClose = () => {
    setSelectedReasons([]);
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rejection Reason</DialogTitle>
          <DialogDescription>
            Select one or more reasons for rejecting the application and add a comment if necessary.
          </DialogDescription>
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
                    onCheckedChange={(checked) => 
                      handleReasonToggle(key as RejectionReasonType, checked as boolean)
                    }
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
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={selectedReasons.length === 0 || isLoading}
          >
            {isLoading ? "Rejecting..." : "Reject Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { REJECTION_REASONS };