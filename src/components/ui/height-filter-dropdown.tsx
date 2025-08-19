import React, { useState, useMemo } from "react";

type Props = {
  onSelect?: (value: { system: "cm" | "imperial"; label: string }) => void;
  value?: string;
  className?: string;
};

export default function HeightFilterDropdown({ onSelect, value, className }: Props) {
  const [open, setOpen] = useState(false);

  // Диапазоны
  const CM_MIN = 130;
  const CM_MAX = 200;
  
  // Масштаб для визуализации (пиксели на см)
  const PX_PER_CM = 8;
  
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

  const handleSelect = (system: "cm" | "imperial", label: string) => {
    onSelect?.({ system, label });
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`px-4 py-2 rounded-xl border bg-background shadow-sm hover:bg-accent ${className}`}
      >
        {value || "Select height"}
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-[360px] rounded-2xl border bg-popover shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-start gap-6 p-3">
            {/* Левая колонка — см */}
            <div className="max-h-[440px] overflow-y-auto pr-2 flex-1">
              <div 
                className="relative"
                style={{ height: innerHeight, paddingTop: PAD, paddingBottom: PAD }}
              >
                {cmTicks.map((cm) => {
                  const y = (cm - CM_MIN) * PX_PER_CM;
                  return (
                    <div
                      key={cm}
                      className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-[18px] text-right cursor-pointer hover:bg-accent rounded px-2 py-1 font-semibold text-foreground [font-variant-numeric:tabular-nums]"
                      style={{ top: y }}
                      onClick={() => handleSelect("cm", `${cm} см`)}
                    >
                      {cm} см
                    </div>
                  );
                })}
              </div>
            </div>

            {/* вертикальная разделительная линия */}
            <div className="w-px self-stretch bg-border" />

            {/* Правая колонка — ft/in */}
            <div className="max-h-[440px] overflow-y-auto pl-2 flex-1">
              <div 
                className="relative"
                style={{ height: innerHeight, paddingTop: PAD, paddingBottom: PAD }}
              >
                {inchTicks.map((inch) => {
                  const y = (inch * 2.54 - CM_MIN) * PX_PER_CM; // позиция в см, конвертированная в пиксели
                  const ftIn = toFtIn(inch);
                  return (
                    <div
                      key={inch}
                      className="absolute left-2 -translate-y-1/2 whitespace-nowrap text-[18px] text-left cursor-pointer hover:bg-accent rounded px-2 py-1 font-semibold text-foreground [font-variant-numeric:tabular-nums]"
                      style={{ top: y }}
                      onClick={() => handleSelect("imperial", ftIn)}
                    >
                      {ftIn}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}