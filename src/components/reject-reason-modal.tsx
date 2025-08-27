import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  applicantName: string;
}

const PREDEFINED_REASONS = [
  "Makeup is not allowed",
  "Incorrect body position or pose", 
  "Poor photo quality",
  "Clothing must be form-fitting",
  "Filters are not allowed"
];

export const RejectReasonModal = ({ isOpen, onClose, onConfirm, applicantName }: RejectReasonModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleReasonChange = (value: string) => {
    if (value === "custom") {
      setShowCustomInput(true);
      setSelectedReason("");
    } else {
      setShowCustomInput(false);
      setSelectedReason(value);
      setCustomReason("");
    }
  };

  const handleConfirm = () => {
    const reason = showCustomInput ? customReason.trim() : selectedReason;
    if (reason) {
      onConfirm(reason);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    setShowCustomInput(false);
    onClose();
  };

  const isValidSelection = showCustomInput ? customReason.trim().length > 0 : selectedReason.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Reject Application
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a reason for rejecting <strong>{applicantName}</strong>'s application:
          </p>

          <RadioGroup value={showCustomInput ? "custom" : selectedReason} onValueChange={handleReasonChange}>
            {PREDEFINED_REASONS.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason} className="text-sm cursor-pointer">
                  {reason}
                </Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="text-sm cursor-pointer">
                Custom reason
              </Label>
            </div>
          </RadioGroup>

          {showCustomInput && (
            <div className="space-y-2">
              <Label htmlFor="customReason" className="text-sm">
                Enter custom reason:
              </Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify the reason for rejection..."
                className="min-h-[80px]"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isValidSelection}
            >
              Reject Application
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};