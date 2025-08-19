import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  onSelect?: (value: { system: "kg" | "lbs"; label: string }) => void;
  value?: string;
  className?: string;
};

export default function WeightFilterDropdown({ onSelect, value, className }: Props) {
  // kg: 40..120 (81 элемент)
  const kgValues = Array.from({ length: 81 }, (_, i) => 40 + i);

  // lbs: соответствующие значения в фунтах
  const lbsList = [
    { display: "88 lbs", kg: 40 },
    { display: "92 lbs", kg: 42 },
    { display: "97 lbs", kg: 44 },
    { display: "101 lbs", kg: 46 },
    { display: "106 lbs", kg: 48 },
    { display: "110 lbs", kg: 50 },
    { display: "115 lbs", kg: 52 },
    { display: "119 lbs", kg: 54 },
    { display: "123 lbs", kg: 56 },
    { display: "128 lbs", kg: 58 },
    { display: "132 lbs", kg: 60 },
    { display: "137 lbs", kg: 62 },
    { display: "141 lbs", kg: 64 },
    { display: "146 lbs", kg: 66 },
    { display: "150 lbs", kg: 68 },
    { display: "154 lbs", kg: 70 },
    { display: "159 lbs", kg: 72 },
    { display: "163 lbs", kg: 74 },
    { display: "168 lbs", kg: 76 },
    { display: "172 lbs", kg: 78 },
    { display: "176 lbs", kg: 80 },
    { display: "181 lbs", kg: 82 },
    { display: "185 lbs", kg: 84 },
    { display: "190 lbs", kg: 86 },
    { display: "194 lbs", kg: 88 },
    { display: "198 lbs", kg: 90 },
    { display: "203 lbs", kg: 92 },
    { display: "207 lbs", kg: 94 },
    { display: "212 lbs", kg: 96 },
    { display: "216 lbs", kg: 98 },
    { display: "220 lbs", kg: 100 },
    { display: "225 lbs", kg: 102 },
    { display: "229 lbs", kg: 104 },
    { display: "234 lbs", kg: 106 },
    { display: "238 lbs", kg: 108 },
    { display: "243 lbs", kg: 110 },
    { display: "247 lbs", kg: 112 },
    { display: "251 lbs", kg: 114 },
    { display: "256 lbs", kg: 116 },
    { display: "260 lbs", kg: 118 },
    { display: "264 lbs", kg: 120 }
  ];

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue.includes("кг")) {
      onSelect?.({ system: "kg", label: selectedValue });
    } else {
      onSelect?.({ system: "lbs", label: selectedValue });
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className={`text-sm ${className}`}>
        <SelectValue placeholder="Select weight" />
      </SelectTrigger>
      <SelectContent className="w-auto min-w-[200px]">
        <div className="max-h-[400px] overflow-y-auto">
          {/* Шапка с заголовками */}
          <div className="flex gap-4 p-4 pb-2 bg-white border-b sticky top-0 z-20">
            <div className="text-xs font-medium text-muted-foreground text-center min-w-[50px]">KG</div>
            <div className="text-xs font-medium text-muted-foreground min-w-[60px] pl-2">  LBS</div>
          </div>
          
          {/* Контент */}
          <div className="flex gap-4 p-4 pt-2">
          {/* Килограммы */}
          <div className="flex flex-col">
            <div className="space-y-0">
              {kgValues.map((kg) => (
                <div
                  key={`kg-${kg}`}
                  className="text-sm cursor-pointer hover:bg-accent rounded px-3 py-1 text-center h-8 flex items-center justify-center min-w-[50px] whitespace-nowrap"
                  onClick={() => handleValueChange(`${kg} кг`)}
                >
                  {kg} кг
                </div>
              ))}
            </div>
          </div>
          
          {/* Фунты */}
          <div className="flex flex-col relative">
            <div className="relative" style={{ height: `${kgValues.length * 32}px` }}>
              {lbsList.map((lbs, index) => {
                // Крайние позиции фиксированы: 88 lbs на 40кг, 264 lbs на 120кг
                // Остальные равномерно распределены между ними
                const totalLbsItems = lbsList.length - 1; // 40 интервалов между 41 элементом
                const maxPosition = kgValues.length - 1; // позиция 80 (120кг)
                const targetPosition = (index / totalLbsItems) * maxPosition;
                const topOffset = targetPosition * 32;
                
                return (
                  <div
                    key={`lbs-${lbs.display}`}
                    className="text-sm cursor-pointer hover:bg-accent rounded px-3 py-1 text-center absolute w-full h-8 flex items-center justify-center min-w-[60px] whitespace-nowrap"
                    style={{ top: `${topOffset}px` }}
                    onClick={() => handleValueChange(lbs.display)}
                  >
                    {lbs.display}
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </SelectContent>
    </Select>
  );
}