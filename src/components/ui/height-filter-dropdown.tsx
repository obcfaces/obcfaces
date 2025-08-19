import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  onSelect?: (value: { system: "cm" | "imperial"; label: string }) => void;
  value?: string;
  className?: string;
};

export default function HeightFilterDropdown({ onSelect, value, className }: Props) {
  // cm: 130..200
  const cmValues = Array.from({ length: 71 }, (_, i) => 130 + i);

  // ft/in: точные варианты
  const inchList = [
    "4'3\"", "4'4\"", "4'5\"", "4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"",
    "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"",
    "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\"",
    "6'3\"", "6'4\"", "6'5\"", "6'6\"", "6'7\""
  ];

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue.includes("cm")) {
      onSelect?.({ system: "cm", label: selectedValue });
    } else {
      onSelect?.({ system: "imperial", label: selectedValue });
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className={`text-sm ${className}`}>
        <SelectValue placeholder="Select height" />
      </SelectTrigger>
      <SelectContent>
        <div className="flex justify-center gap-12 p-3">
          {/* Сантиметры */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground text-center mb-2">CM</div>
            {cmValues.map((cm) => (
              <div
                key={`cm-${cm}`}
                className="text-sm cursor-pointer hover:bg-accent rounded px-2 py-1 text-center"
                onClick={() => handleValueChange(`${cm} см`)}
              >
                {cm}
              </div>
            ))}
          </div>
          
          {/* Футы/дюймы */}
          <div className="space-y-0">
            <div className="text-xs font-medium text-muted-foreground text-center mb-2">FT/IN</div>
            {inchList.map((inch, index) => (
              <div
                key={`inch-${inch}`}
                className="text-sm cursor-pointer hover:bg-accent rounded px-2 py-1 text-center"
                style={{ marginBottom: index < inchList.length - 1 ? '4.54px' : '0' }}
                onClick={() => handleValueChange(inch)}
              >
                {inch}
              </div>
            ))}
          </div>
        </div>
      </SelectContent>
    </Select>
  );
}