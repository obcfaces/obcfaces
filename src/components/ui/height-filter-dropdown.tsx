import React, { useState, useMemo } from "react";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  onSelect?: (value: { system: "cm" | "imperial"; label: string }) => void;
  value?: string;
  className?: string;
};

export default function HeightFilterDropdown({ onSelect, value, className }: Props) {
  // Диапазоны
  const CM_MIN = 130;
  const CM_MAX = 200;
  
  // Масштаб для визуализации (пиксели на см)
  const PX_PER_CM = 8;
  const PX_PER_INCH = PX_PER_CM * 2.54; // 1 дюйм = 2.54 см
  
  // Высота контейнера с отступами
  const PAD = 24;
  const innerHeight = (CM_MAX - CM_MIN) * PX_PER_CM + PAD * 2;

  // Генерируем данные
  const cmTicks = useMemo(() => 
    Array.from({ length: (CM_MAX - CM_MIN) + 1 }, (_, i) => CM_MIN + i), []
  );

  const inchTicks = useMemo(() => {
    const inches = [];
    // Начинаем с дюйма, который соответствует CM_MIN
    const startInch = Math.floor(CM_MIN / 2.54);
    const endInch = Math.ceil(CM_MAX / 2.54);
    
    for (let inch = startInch; inch <= endInch; inch++) {
      inches.push(inch);
    }
    return inches;
  }, []);

  const toFtIn = (totalInches: number) => {
    const ft = Math.floor(totalInches / 12);
    const inch = totalInches % 12;
    return `${ft}'${inch}"`;
  };

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue.includes("см")) {
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
      <SelectContent className="w-[320px]">
        <div className="p-3">
          <div 
            className="relative h-[400px] overflow-y-auto bg-background rounded-xl"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {/* Контейнер для абсолютного позиционирования */}
            <div 
              className="relative"
              style={{ height: innerHeight, paddingTop: PAD, paddingBottom: PAD }}
            >
              {/* Сантиметры - левая сторона */}
              {cmTicks.map((cm) => {
                const y = (cm - CM_MIN) * PX_PER_CM;
                return (
                  <div
                    key={`cm-${cm}`}
                    className="absolute right-[calc(50%+8px)] pr-2 -translate-y-1/2 cursor-pointer select-none text-[14px] font-medium whitespace-nowrap hover:text-primary"
                    style={{ top: y }}
                    onClick={() => handleValueChange(`${cm} см`)}
                    title={`${cm} см`}
                  >
                    {cm}
                  </div>
                );
              })}

              {/* Центральная линия */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

              {/* Дюймы - правая сторона */}
              {inchTicks.map((inch) => {
                const y = (inch * 2.54 - CM_MIN) * PX_PER_CM; // позиция в см, конвертированная в пиксели
                const ftIn = toFtIn(inch);
                return (
                  <div
                    key={`in-${inch}`}
                    className="absolute left-[calc(50%+8px)] pl-2 -translate-y-1/2 cursor-pointer select-none text-[14px] font-medium whitespace-nowrap hover:text-primary"
                    style={{ top: y }}
                    onClick={() => handleValueChange(ftIn)}
                    title={ftIn}
                  >
                    {ftIn}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Подсказка */}
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Scale ruler: cm on left, ft/in on right
          </div>
        </div>
      </SelectContent>
    </Select>
  );
}