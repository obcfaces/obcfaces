import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface RejectionReason {
  key: string;
  text: string;
  sortOrder: number;
}

interface RejectionReasonsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentReasons: Record<string, string>;
  onSave: (updatedReasons: Record<string, string>) => void;
}

export const RejectionReasonsManagerModal = ({
  isOpen,
  onClose,
  currentReasons,
  onSave,
}: RejectionReasonsManagerModalProps) => {
  const [reasons, setReasons] = useState<RejectionReason[]>([]);
  const [newReason, setNewReason] = useState({ text: "", sortOrder: "" });

  useEffect(() => {
    if (isOpen) {
      // Convert current reasons to array with sort order
      const reasonsArray = Object.entries(currentReasons).map(([key, text], index) => ({
        key,
        text,
        sortOrder: index + 1,
      }));
      setReasons(reasonsArray);
      setNewReason({ text: "", sortOrder: "" });
    }
  }, [isOpen, currentReasons]);

  const handleReasonTextChange = (index: number, newText: string) => {
    const updated = [...reasons];
    updated[index].text = newText;
    setReasons(updated);
  };

  const handleSortOrderChange = (index: number, newOrder: string) => {
    const orderNum = parseInt(newOrder);
    if (isNaN(orderNum) || orderNum < 1) return;

    const updated = [...reasons];
    const oldOrder = updated[index].sortOrder;
    updated[index].sortOrder = orderNum;

    // Shift other items
    updated.forEach((reason, idx) => {
      if (idx !== index) {
        if (orderNum <= oldOrder) {
          // Moving up - shift down items between new and old position
          if (reason.sortOrder >= orderNum && reason.sortOrder < oldOrder) {
            reason.sortOrder += 1;
          }
        } else {
          // Moving down - shift up items between old and new position
          if (reason.sortOrder > oldOrder && reason.sortOrder <= orderNum) {
            reason.sortOrder -= 1;
          }
        }
      }
    });

    // Sort by new order
    updated.sort((a, b) => a.sortOrder - b.sortOrder);
    setReasons(updated);
  };

  const handleDeleteReason = (index: number) => {
    const updated = reasons.filter((_, idx) => idx !== index);
    // Reassign sort orders
    updated.forEach((reason, idx) => {
      reason.sortOrder = idx + 1;
    });
    setReasons(updated);
  };

  const handleAddNewReason = () => {
    if (!newReason.text.trim()) return;

    const orderNum = newReason.sortOrder ? parseInt(newReason.sortOrder) : reasons.length + 1;
    const key = `custom_${Date.now()}`;

    const newReasonObj: RejectionReason = {
      key,
      text: newReason.text,
      sortOrder: orderNum,
    };

    const updated = [...reasons];
    
    // Shift existing reasons if needed
    updated.forEach(reason => {
      if (reason.sortOrder >= orderNum) {
        reason.sortOrder += 1;
      }
    });

    updated.push(newReasonObj);
    updated.sort((a, b) => a.sortOrder - b.sortOrder);
    
    setReasons(updated);
    setNewReason({ text: "", sortOrder: "" });
  };

  const handleSave = () => {
    const updatedReasons: Record<string, string> = {};
    reasons.forEach(reason => {
      updatedReasons[reason.key] = reason.text;
    });
    onSave(updatedReasons);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Rejection Reasons</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2">
          {reasons.map((reason, index) => (
            <div key={reason.key} className="flex items-center gap-2 p-2 border rounded">
              <div className="w-16">
                <Label className="text-xs">Order</Label>
                <Input
                  type="number"
                  min="1"
                  value={reason.sortOrder}
                  onChange={(e) => handleSortOrderChange(index, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Reason Text</Label>
                <Input
                  value={reason.text}
                  onChange={(e) => handleReasonTextChange(index, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteReason(index)}
                className="mt-5 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* New reason row */}
          <div className="flex items-center gap-2 p-2 border border-dashed rounded bg-muted/30">
            <div className="w-16">
              <Label className="text-xs">Order</Label>
              <Input
                type="number"
                min="1"
                placeholder={String(reasons.length + 1)}
                value={newReason.sortOrder}
                onChange={(e) => setNewReason({ ...newReason, sortOrder: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">New Reason</Label>
              <Input
                placeholder="Enter new rejection reason..."
                value={newReason.text}
                onChange={(e) => setNewReason({ ...newReason, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewReason();
                  }
                }}
                className="h-8 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddNewReason}
              disabled={!newReason.text.trim()}
              className="mt-5 h-8"
            >
              Add
            </Button>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
