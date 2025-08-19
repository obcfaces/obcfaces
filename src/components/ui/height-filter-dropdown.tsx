import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

type Props = {
  onSelect?: (value: { system: "cm" | "imperial"; label: string }) => void;
  value?: string;
  className?: string;
};

export default function HeightFilterDropdown({ onSelect, value, className }: Props) {
  const [open, setOpen] = useState(false);
  
  // cm: 130..201 (72 элемента)
  const cmValues = Array.from({ length: 72 }, (_, i) => 130 + i);

  // ft/in: 25 элементов равномерно распределенных
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
    if (selectedValue.includes("см")) {
      onSelect?.({ system: "cm", label: selectedValue });
    } else {
      onSelect?.({ system: "imperial", label: selectedValue });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`text-sm justify-between ${className}`}
        >
          {value || "Рост"}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[200px] p-0 pointer-events-auto" onWheel={(e) => e.stopPropagation()}>
        <div className="max-h-[400px] overflow-y-auto pointer-events-auto" style={{ scrollBehavior: 'auto' }}>
          {/* Убираем старую шапку */}
          
          {/* Контент с заголовками над столбцами */}
          <div className="flex gap-4 p-4 pt-2">
          {/* Сантиметры */}
          <div className="flex flex-col min-w-[70px]">
            {/* Заголовок CM точно над столбцом */}
            <div className="text-xs font-medium text-muted-foreground text-center mb-2 sticky top-[60px] bg-popover z-10 py-1">CM</div>
            <div className="space-y-0">
              {cmValues.map((cm) => (
                <div
                  key={`cm-${cm}`}
                  className="text-sm cursor-pointer hover:bg-accent rounded px-3 py-1 text-center h-8 flex items-center justify-center"
                  onClick={() => handleValueChange(`${cm} см`)}
                >
                  {cm} см
                </div>
              ))}
            </div>
          </div>
          
          {/* Футы/дюймы */}
          <div className="flex flex-col relative min-w-[70px]">
            {/* Заголовок FT/IN точно над столбцом */}
            <div className="text-xs font-medium text-muted-foreground text-center mb-2 sticky top-[60px] bg-popover z-10 py-1">FT/IN</div>
            <div className="relative" style={{ height: `${cmValues.length * 32}px` }}>
              {inchList.map((inch, index) => {
                // Крайние позиции фиксированы: 4'3" на 0, 6'7" на 71
                // Остальные равномерно распределены между ними
                const totalInchItems = inchList.length - 1; // 24 интервала между 25 элементами
                const maxPosition = cmValues.length - 1; // позиция 71 (201см)
                const targetPosition = (index / totalInchItems) * maxPosition;
                const topOffset = targetPosition * 32;
                
                return (
                  <div
                    key={`inch-${inch.display}`}
                    className="text-sm cursor-pointer hover:bg-accent rounded px-3 py-1 text-center absolute w-full h-8 flex items-center justify-center"
                    style={{ top: `${topOffset}px` }}
                    onClick={() => handleValueChange(inch.display)}
                  >
                    {inch.display}
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}