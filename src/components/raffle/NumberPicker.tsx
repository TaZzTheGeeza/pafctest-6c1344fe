import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface NumberPickerProps {
  numberRange: number;
  takenNumbers: number[];
  selectedNumbers: number[];
  onSelectionChange: (numbers: number[]) => void;
  maxSelection?: number;
}

const NumberPicker = ({ numberRange, takenNumbers, selectedNumbers, onSelectionChange, maxSelection }: NumberPickerProps) => {
  const [manualInput, setManualInput] = useState("");

  const toggleNumber = (num: number) => {
    if (takenNumbers.includes(num)) return;
    if (selectedNumbers.includes(num)) {
      onSelectionChange(selectedNumbers.filter(n => n !== num));
    } else {
      if (maxSelection && selectedNumbers.length >= maxSelection) return;
      onSelectionChange([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const handleManualAdd = () => {
    const nums = manualInput
      .split(",")
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= numberRange && !takenNumbers.includes(n) && !selectedNumbers.includes(n));

    if (nums.length === 0) return;

    const allowed = maxSelection ? nums.slice(0, maxSelection - selectedNumbers.length) : nums;
    onSelectionChange([...selectedNumbers, ...allowed].sort((a, b) => a - b));
    setManualInput("");
  };

  const removeNumber = (num: number) => {
    onSelectionChange(selectedNumbers.filter(n => n !== num));
  };

  return (
    <div className="space-y-4">
      {/* Manual entry */}
      <div>
        <Label className="text-xs text-muted-foreground">Quick add (comma-separated)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            placeholder="e.g. 7, 14, 21"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
            className="flex-1"
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleManualAdd}>
            Add
          </Button>
        </div>
      </div>

      {/* Selected numbers display */}
      {selectedNumbers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedNumbers.map(num => (
            <Badge key={num} variant="default" className="bg-primary text-primary-foreground gap-1 cursor-pointer" onClick={() => removeNumber(num)}>
              #{num}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Number grid */}
      <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2">
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
          {Array.from({ length: numberRange }, (_, i) => i + 1).map(num => {
            const isTaken = takenNumbers.includes(num);
            const isSelected = selectedNumbers.includes(num);
            return (
              <button
                key={num}
                type="button"
                disabled={isTaken}
                onClick={() => toggleNumber(num)}
                className={cn(
                  "aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-colors border",
                  isTaken && "bg-muted text-muted-foreground/40 border-transparent cursor-not-allowed line-through",
                  isSelected && "bg-primary text-primary-foreground border-primary",
                  !isTaken && !isSelected && "bg-card border-border hover:bg-accent hover:text-accent-foreground cursor-pointer"
                )}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-card border border-border" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted line-through" />
          <span>Taken</span>
        </div>
      </div>
    </div>
  );
};

export default NumberPicker;
