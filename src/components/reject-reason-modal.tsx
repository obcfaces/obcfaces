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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type RejectionReasonType = 
  | 'first_photo_makeup'
  | 'first_photo_id_style'
  | 'first_photo_blurry'
  | 'first_photo_filters'
  | 'second_photo_makeup'
  | 'second_photo_pose'
  | 'second_photo_clothing'
  | 'second_photo_accessories'
  | 'both_photos_quality';

const REJECTION_REASONS = {
  first_photo_makeup: "First photo – No makeup allowed.",
  first_photo_id_style: "First photo – Must look like an ID photo: face straight to the camera, hands together in front.",
  first_photo_blurry: "First photo – Photo is too blurry/low quality.",
  first_photo_filters: "First photo – No filters allowed.",
  second_photo_makeup: "Second photo – No makeup allowed.",
  second_photo_pose: "Second photo – Must show the whole body from head to toe, standing straight, arms at the sides.",
  second_photo_clothing: "Second photo – Wear tight/fitted clothes (swimsuit, fitted shorts, or top). Dresses, skirts, loose tops, or high heels are not allowed.",
  second_photo_accessories: "Second photo – No bags or backpacks.",
  both_photos_quality: "Both photos – The quality is too low."
};

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonType: RejectionReasonType, notes: string) => Promise<void>;
  isLoading?: boolean;
}

export const RejectReasonModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: RejectReasonModalProps) => {
  const [selectedReason, setSelectedReason] = useState<RejectionReasonType | "">("");
  const [notes, setNotes] = useState("");

  const handleConfirm = async () => {
    if (!selectedReason) return;
    
    await onConfirm(selectedReason, notes);
    
    // Reset form
    setSelectedReason("");
    setNotes("");
  };

  const handleClose = () => {
    setSelectedReason("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rejection Reason</DialogTitle>
          <DialogDescription>
            Select the reason for rejecting the application and add a comment if necessary.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Select 
              value={selectedReason} 
              onValueChange={(value: RejectionReasonType) => setSelectedReason(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REJECTION_REASONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={!selectedReason || isLoading}
          >
            {isLoading ? "Rejecting..." : "Reject Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { REJECTION_REASONS };