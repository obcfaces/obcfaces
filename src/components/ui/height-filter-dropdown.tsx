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

  // ft/in: точные варианты с соответствующими значениями в см
  const inchList = [
    { display: "4'3\"", cm: 130 },
    { display: "4'4\"", cm: 132 },
    { display: "4'5\"", cm: 135 },
    { display: "4'6\"", cm: 137 },
    { display: "4'7\"", cm: 140 },
    { display: "4'8\"", cm: 142 },
    { display: "4'9\"", cm: 145 },
    { display: "4'10\"", cm: 147 },
    { display: "4'11\"", cm: 150 },
    { display: "5'0\"", cm: 152 },
    { display: "5'1\"", cm: 155 },
    { display: "5'2\"", cm: 157 },
    { display: "5'3\"", cm: 160 },
    { display: "5'4\"", cm: 163 },
    { display: "5'5\"", cm: 165 },
    { display: "5'6\"", cm: 168 },
    { display: "5'7\"", cm: 170 },
    { display: "5'8\"", cm: 173 },
    { display: "5'9\"", cm: 175 },
    { display: "5'10\"", cm: 178 },
    { display: "5'11\"", cm: 180 },
    { display: "6'0\"", cm: 183 },
    { display: "6'1\"", cm: 185 },
    { display: "6'2\"", cm: 188 },
    { display: "6'3\"", cm: 191 },
    { display: "6'4\"", cm: 193 },
    { display: "6'5\"", cm: 196 },
    { display: "6'6\"", cm: 198 },
    { display: "6'7\"", cm: 201 }
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
          <div className="relative">
            <div className="text-xs font-medium text-muted-foreground text-center mb-2">FT/IN</div>
            {inchList.map((inch, index) => {
              // Первый элемент (4'3") на позиции 0 (напротив 130см), последний (6'7") на позиции 70*24px (напротив 200см)
              const totalCmRange = 70; // от 130 до 200 см
              const position = (index / (inchList.length - 1)) * totalCmRange * 24; // 24px на 1 см
              return (
                <div
                  key={`inch-${inch.display}`}
                  className="text-sm cursor-pointer hover:bg-accent rounded px-2 py-1 text-center absolute w-full"
                  style={{ top: `${position + 32}px` }} // +32px для заголовка
                  onClick={() => handleValueChange(inch.display)}
                >
                  {inch.display}
                </div>
              );
            })}
            <div style={{ height: `${inchList.length * 2.54 * 40 + 64}px` }} />
          </div>
        </div>
      </SelectContent>
    </Select>
  );
}