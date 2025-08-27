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
  | 'inappropriate_photos'
  | 'incomplete_information'
  | 'age_requirements'
  | 'duplicate_application'
  | 'quality_standards'
  | 'terms_violation'
  | 'other';

const REJECTION_REASONS = {
  inappropriate_photos: "Inappropriate photos",
  incomplete_information: "Incomplete information",
  age_requirements: "Does not meet age requirements",
  duplicate_application: "Duplicate application",
  quality_standards: "Does not meet quality standards",
  terms_violation: "Terms violation",
  other: "Other reason"
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