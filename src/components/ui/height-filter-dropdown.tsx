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
        {/* Сантиметры */}
        {cmValues.map((cm) => (
          <SelectItem key={`cm-${cm}`} value={`${cm} см`}>
            {cm} cm
          </SelectItem>
        ))}
        {/* Футы/дюймы */}
        {inchList.map((inch) => (
          <SelectItem key={`inch-${inch}`} value={inch}>
            {inch}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}