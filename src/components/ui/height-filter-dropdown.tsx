import React, { useState } from "react";

export default function HeightFilterDropdown() {
  const [open, setOpen] = useState(false);

  // cm: 130..200 (включительно)
  const cmValues = Array.from({ length: 71 }, (_, i) => 130 + i);

  // ft/in: 4'3" .. 6'7" (шаг 1")
  const inchList: string[] = [];
  for (let ft = 4, inch = 3; !(ft === 6 && inch === 8); ) {
    inchList.push(`${ft}'${inch}"`);
    inch++;
    if (inch === 12) { inch = 0; ft++; }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-xl border bg-background shadow-sm hover:bg-accent"
      >
        Select height
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-[360px] rounded-2xl border bg-popover shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-start gap-6 p-3">
            {/* Левая колонка — см */}
            <div className="max-h-[440px] overflow-y-auto pr-2">
              <ul
                className="
                  m-0 p-0 list-none
                  [font-variant-numeric:tabular-nums] 
                  font-semibold text-foreground
                "
              >
                {cmValues.map((cm) => (
                  <li
                    key={cm}
                    className="whitespace-nowrap text-[18px] text-right pr-2 cursor-pointer hover:bg-accent rounded"
                    style={{ height: 84, lineHeight: "84px" }} // большой шаг
                  >
                    {cm} см
                  </li>
                ))}
              </ul>
            </div>

            {/* вертикальная разделительная линия */}
            <div className="w-px self-stretch bg-border" />

            {/* Правая колонка — ft/in */}
            <div className="max-h-[440px] overflow-y-auto pl-2">
              <ul
                className="
                  m-0 p-0 list-none
                  [font-variant-numeric:tabular-nums] 
                  font-semibold text-foreground
                "
              >
                {inchList.map((v) => (
                  <li
                    key={v}
                    className="whitespace-nowrap text-[18px] text-left pl-2 cursor-pointer hover:bg-accent rounded"
                    style={{ height: 84, lineHeight: "84px" }} // свой шаг, НЕ выравнивать
                  >
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}