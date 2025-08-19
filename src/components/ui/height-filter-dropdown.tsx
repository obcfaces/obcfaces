import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  onSelect?: (value: { system: "cm" | "imperial"; label: string }) => void;
};

export default function HeightDropdownOneScrollPick({
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false); // поставь false в проде
  const [selected, setSelected] = useState<{system: "cm"|"imperial"; label: string} | null>(null);

  // Диапазоны
  const CM_MIN = 130;
  const CM_MAX = 200;
  const IN_MIN = Math.ceil(CM_MIN / 2.54);   // ≈ 51 (4'3")
  const IN_MAX = Math.floor(CM_MAX / 2.54);  // ≈ 78–79 (до 6'7")

  // Визуальная плотность
  const PX_PER_CM = 12;                 // 1 см = 12 px
  const PX_PER_IN = 2.54 * PX_PER_CM;   // 1"  = 30.48 px
  const PAD = 24;                       // верх/низ внутри скролла
  const innerHeight = (CM_MAX - CM_MIN) * PX_PER_CM + PAD * 2;

  // Данные
  const cmTicks = useMemo(
    () => Array.from({ length: (CM_MAX - CM_MIN) + 1 }, (_, i) => CM_MIN + i),
    []
  );
  const inTicks = useMemo(
    () => Array.from({ length: (IN_MAX - IN_MIN) + 1 }, (_, i) => IN_MIN + i),
    []
  );

  const toFtIn = (totalIn: number) => {
    const ft = Math.floor(totalIn / 12);
    const inch = totalIn % 12;
    return `${ft}'${inch}"`; // можно заменить на `${ft}′${inch}″`
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // центрируем на середину диапазона
  useEffect(() => {
    if (!open || !scrollRef.current) return;
    scrollRef.current.scrollTop = (innerHeight - 360) / 2;
  }, [open, innerHeight]);

  // обработка выбора
  const selectCM = (cm: number) => {
    const payload = { system: "cm" as const, label: `${cm} см` };
    setSelected(payload);
    onSelect?.(payload);
  };
  const selectIN = (inch: number) => {
    const payload = { system: "imperial" as const, label: toFtIn(inch) };
    setSelected(payload);
    onSelect?.(payload);
  };

  // подсветка
  const isSel = (lab: string) => selected?.label === lab;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="px-4 py-2 rounded-xl border bg-white shadow-sm hover:bg-slate-50"
      >
        Select height
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[420px] rounded-2xl border bg-white shadow-lg">
          <div className="p-3">
            {/* общий скролл-контейнер */}
            <div
              ref={scrollRef}
              className="relative h-[360px] overflow-y-auto rounded-xl bg-white"
              style={{ fontVariantNumeric: "tabular-nums" } as React.CSSProperties}
            >
              {/* Контентная плоскость для абсолютного позиционирования меток */}
              <div
                className="relative"
                style={{ height: innerHeight, paddingTop: PAD, paddingBottom: PAD }}
              >
                {/* Левая колонка — сантиметры */}
                {cmTicks.map((cm) => {
                  const y = (cm - CM_MIN) * PX_PER_CM; // точная вертикальная позиция
                  return (
                    <div
                      key={`cm-${cm}`}
                      className={`absolute right-[calc(50%+0.5cm)] pr-3 
                                  -translate-y-1/2 cursor-pointer select-none 
                                  text-[18px] font-semibold whitespace-nowrap
                                  ${isSel(`${cm} см`) ? "text-sky-700" : "text-slate-800"}`}
                      style={{ top: y }}
                      onClick={() => selectCM(cm)}
                      title={`${cm} см`}
                    >
                      {cm}
                    </div>
                  );
                })}

                {/* Правая колонка — футы/дюймы */}
                {inTicks.map((inch) => {
                  const y = (inch - IN_MIN) * PX_PER_IN; // точная вертикальная позиция
                  const lab = toFtIn(inch);
                  return (
                    <div
                      key={`in-${inch}`}
                      className={`absolute left-[calc(50%+0.5cm)] pl-3 
                                  -translate-y-1/2 cursor-pointer select-none 
                                  text-[18px] font-semibold whitespace-nowrap
                                  ${isSel(lab) ? "text-emerald-700" : "text-slate-800"}`}
                      style={{ top: y }}
                      onClick={() => selectIN(inch)}
                      title={lab}
                    >
                      {lab}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* подсказка и выбранное значение */}
            <div className="mt-2 text-xs text-slate-500 text-center">
              One shared scroll. Columns spaced by <b>1&nbsp;cm</b>. Click a value on either side to select.
            </div>
            {selected && (
              <div className="mt-1 text-sm text-center">
                Selected: <span className="font-semibold">{selected.label}</span> ({selected.system})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}