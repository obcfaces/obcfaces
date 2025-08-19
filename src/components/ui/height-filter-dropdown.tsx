import React, { useState } from "react";

type Props = {
  onSelect?: (value: { system: "cm" | "imperial"; label: string }) => void;
};

export default function HeightFilterDropdown({ onSelect }: Props) {
  const [open, setOpen] = useState(false);

  // cm: 130..200 (включительно)
  const cmValues = Array.from({ length: 71 }, (_, i) => 130 + i);

  // ft/in: точные варианты как в исходном
  const inchList = [
    "4'3\"", "4'4\"", "4'5\"", "4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"",
    "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"",
    "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\"",
    "6'3\"", "6'4\"", "6'5\"", "6'6\"", "6'7\""
  ];

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
              <ul className="m-0 p-0 list-none [font-variant-numeric:tabular-nums] font-semibold text-foreground">
                {cmValues.map((cm) => (
                  <li
                    key={cm}
                    className="whitespace-nowrap text-[18px] text-right pr-2 cursor-pointer hover:bg-accent rounded"
                    style={{ height: 160, lineHeight: "160px" }} // увеличено в 5 раз (32px * 5 = 160px)
                    onClick={() => onSelect?.({ system: "cm", label: `${cm} см` })}
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
              <ul className="m-0 p-0 list-none [font-variant-numeric:tabular-nums] font-semibold text-foreground">
                {inchList.map((inch) => (
                  <li
                    key={inch}
                    className="whitespace-nowrap text-[18px] text-left pl-2 cursor-pointer hover:bg-accent rounded"
                    style={{ height: 160, lineHeight: "160px" }} // такое же расстояние
                    onClick={() => onSelect?.({ system: "imperial", label: inch })}
                  >
                    {inch}
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