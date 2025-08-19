import React, { useEffect, useRef, useState } from "react";

export default function HeightFilterDropdown() {
  const [open, setOpen] = useState(false);

  // cm: 130..200
  const cmValues = Array.from({ length: 71 }, (_, i) => 130 + i);

  // ft/in: 4'3" .. 6'7" (шаг 1")
  const inchList: string[] = [];
  for (let ft = 4, inch = 3; !(ft === 6 && inch === 8); ) {
    // ВАЖНО: без пробелов вокруг апострофа!
    inchList.push(`${ft}'${inch}"`); // или `${ft}′${inch}″`
    inch++;
    if (inch === 12) { inch = 0; ft++; }
  }

  // refs для независимого скролла и стартового сдвига
  const cmRef = useRef<HTMLDivElement>(null);
  const ftRef = useRef<HTMLDivElement>(null);

  // параметры «шкалы»
  const ROW = 84;        // шаг строки (px)
  const OFFSET = ROW/2;  // смещение правой колонки, чтобы не стояло «напротив»

  useEffect(() => {
    // левую оставляем без сдвига
    if (cmRef.current) cmRef.current.scrollTop = 0;
    // правую сдвигаем на половину шага — визуально «две линейки», а не таблица
    if (ftRef.current) ftRef.current.scrollTop = OFFSET;
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="px-4 py-2 rounded-xl border bg-background shadow-sm hover:bg-accent"
      >
        Select height
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[360px] rounded-2xl border bg-popover shadow-lg">
          {/* центральная направляющая поверх двух колонок */}
          <div className="relative">
            <div className="pointer-events-none absolute left-1/2 top-3 bottom-3 w-px bg-border -translate-x-1/2" />

            <div className="flex items-start gap-6 p-3">
              {/* Сантиметры — левая колонка */}
              <div ref={cmRef} className="max-h-[440px] overflow-y-auto pr-2">
                <ul className="m-0 p-0 list-none font-semibold text-foreground [font-variant-numeric:tabular-nums]">
                  {cmValues.map(cm => (
                    <li
                      key={cm}
                      className="whitespace-nowrap text-[18px] text-right pr-2 cursor-pointer hover:bg-accent rounded"
                      style={{ height: ROW, lineHeight: `${ROW}px` }}
                    >
                      {cm} см
                    </li>
                  ))}
                </ul>
              </div>

              {/* Правая колонка — футы/дюймы */}
              <div ref={ftRef} className="max-h-[440px] overflow-y-auto pl-2">
                <ul className="m-0 p-0 list-none font-semibold text-foreground [font-variant-numeric:tabular-nums]">
                  {inchList.map(v => (
                    <li
                      key={v}
                      className="whitespace-nowrap text-[18px] text-left pl-2 cursor-pointer hover:bg-accent rounded"
                      style={{ height: ROW, lineHeight: `${ROW}px` }}
                    >
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}