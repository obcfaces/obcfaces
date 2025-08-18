import React, { useEffect, useMemo, useRef, useState } from "react";

interface HeightRulerProps {
  value?: number; // height in cm
  onChange?: (heightCm: number) => void;
  className?: string;
}

/**
 * Vertical dual-scale height selector — like a ruler
 * - Left: centimeters (1 cm ticks)
 * - Right: feet/inches (1 inch ticks)
 * - Columns scroll independently (not aligned), like two separate rulers
 * - The selected value is the tick closest to the center guide line
 * - Shows live conversion both ways
 */
export default function HeightRuler({ value = 170, onChange, className = "" }: HeightRulerProps) {
  // Ranges
  const CM_MIN = 130; // 4'3"
  const CM_MAX = 220; // 7'3"

  const IN_MIN = 51; // 4'3" in inches
  const IN_MAX = 87; // 7'3" in inches

  // Visual scales (pixels per unit). Tune for density.
  const PX_PER_CM = 8;
  const PX_PER_IN = 12;
  const VIEWPORT = 240; // height of visible ruler window in px

  // Selected values
  const [cmVal, setCmVal] = useState(value);
  const [inVal, setInVal] = useState(Math.round(value / 2.54)); // Convert cm to inches

  // Refs for scroll containers
  const cmRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLDivElement>(null);

  // Build data arrays
  const cmTicks = useMemo(() => {
    return Array.from({ length: CM_MAX - CM_MIN + 1 }, (_, i) => CM_MIN + i);
  }, []);

  const inTicks = useMemo(() => {
    return Array.from({ length: IN_MAX - IN_MIN + 1 }, (_, i) => IN_MIN + i);
  }, []);

  // Centering paddings so the first/last tick can be selected at the guide line
  const cmPad = VIEWPORT / 2;
  const inPad = VIEWPORT / 2;

  // Helpers
  const inchesToFeetIn = (totalIn: number) => {
    const ft = Math.floor(totalIn / 12);
    const inch = totalIn % 12;
    return { ft, inch };
  };

  const cmToInchesRounded = (cm: number) => Math.round(cm / 2.54);
  const inchesToCmRounded = (inch: number) => Math.round(inch * 2.54);

  // Scroll to a particular value so that it sits on the center line
  const scrollToCM = (cm: number) => {
    const node = cmRef.current;
    if (!node) return;
    const offset = (cm - CM_MIN) * PX_PER_CM;
    node.scrollTo({ top: offset - (VIEWPORT / 2 - 1), behavior: "smooth" });
  };

  const scrollToIN = (inch: number) => {
    const node = inRef.current;
    if (!node) return;
    const offset = (inch - IN_MIN) * PX_PER_IN;
    node.scrollTo({ top: offset - (VIEWPORT / 2 - 1), behavior: "smooth" });
  };

  // On mount: center initial values
  useEffect(() => {
    scrollToCM(cmVal);
    scrollToIN(inVal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update from external value prop
  useEffect(() => {
    if (value && value !== cmVal) {
      setCmVal(value);
      setInVal(Math.round(value / 2.54));
      scrollToCM(value);
      scrollToIN(Math.round(value / 2.54));
    }
  }, [value, cmVal]);

  // Update conversions when a value changes (but keep columns independent)
  const cmConverted = useMemo(() => inchesToFeetIn(cmToInchesRounded(cmVal)), [cmVal]);
  const inConverted = useMemo(() => inchesToCmRounded(inVal), [inVal]);

  // Sync selection to scroll position (nearest tick to center)
  const onScrollCM = () => {
    const node = cmRef.current;
    if (!node) return;
    const centerY = node.scrollTop + VIEWPORT / 2;
    const idx = Math.round(centerY / PX_PER_CM);
    const value = Math.min(Math.max(CM_MIN + idx, CM_MIN), CM_MAX);
    setCmVal(value);
    onChange?.(value);
  };

  const onScrollIN = () => {
    const node = inRef.current;
    if (!node) return;
    const centerY = node.scrollTop + VIEWPORT / 2;
    const idx = Math.round(centerY / PX_PER_IN);
    const value = Math.min(Math.max(IN_MIN + idx, IN_MIN), IN_MAX);
    setInVal(value);
    const cmValue = inchesToCmRounded(value);
    setCmVal(cmValue);
    onChange?.(cmValue);
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Conversion Display */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-background border p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Metric</div>
          <div className="text-lg font-semibold">
            {cmVal} cm
          </div>
          <div className="text-xs text-muted-foreground">
            ≈ {cmConverted.ft}'{cmConverted.inch}"
          </div>
        </div>
        <div className="rounded-lg bg-background border p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Imperial</div>
          <div className="text-lg font-semibold">
            {(() => { const { ft, inch } = inchesToFeetIn(inVal); return `${ft}'${inch}"`; })()}
          </div>
          <div className="text-xs text-muted-foreground">≈ {inConverted} cm</div>
        </div>
      </div>

      {/* Rulers */}
      <div className="rounded-xl border bg-gradient-to-b from-muted/30 to-background p-3">
        <div className="grid grid-cols-2 gap-3">
          {/* CM column */}
          <div className="relative">
            <div className="text-xs font-medium text-muted-foreground mb-2 text-center">Centimeters</div>
            <div
              ref={cmRef}
              onScroll={onScrollCM}
              className="relative overflow-y-scroll rounded-lg bg-muted/20 border"
              style={{ height: VIEWPORT }}
            >
              {/* center guide */}
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 z-10">
                <div className="mx-2 h-0.5 bg-primary/70" />
              </div>

              {/* top/bottom paddings */}
              <div style={{ height: cmPad }} />

              {/* ticks */}
              <div>
                {cmTicks.map((v) => {
                  const mod10 = v % 10 === 0;
                  const mod5 = v % 5 === 0 && !mod10;
                  return (
                    <div key={v} className="flex items-center" style={{ height: PX_PER_CM }}>
                      <div
                        className={
                          "bg-foreground " +
                          (mod10 ? "h-0.5 w-8" : mod5 ? "h-0.5 w-6" : "h-px w-3")
                        }
                      />
                      <div className="ml-2 text-foreground text-xs tabular-nums">
                        {v} cm
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ height: cmPad }} />
            </div>
            <div className="mt-2 flex gap-1 justify-center">
              <button
                type="button"
                onClick={() => scrollToCM(Math.max(CM_MIN, cmVal - 1))}
                className="px-2 py-1 rounded bg-background border text-xs hover:bg-muted"
              >-1</button>
              <button
                type="button"
                onClick={() => scrollToCM(Math.min(CM_MAX, cmVal + 1))}
                className="px-2 py-1 rounded bg-background border text-xs hover:bg-muted"
              >+1</button>
            </div>
          </div>

          {/* IN column */}
          <div className="relative">
            <div className="text-xs font-medium text-muted-foreground mb-2 text-center">Feet / Inches</div>
            <div
              ref={inRef}
              onScroll={onScrollIN}
              className="relative overflow-y-scroll rounded-lg bg-muted/20 border"
              style={{ height: VIEWPORT }}
            >
              {/* center guide */}
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 z-10">
                <div className="mx-2 h-0.5 bg-secondary/70" />
              </div>

              <div style={{ height: inPad }} />

              <div>
                {inTicks.map((inch) => {
                  const { ft, inch: i } = inchesToFeetIn(inch);
                  const isFoot = inch % 12 === 0;
                  const isInch = inch % 3 === 0; // Show every 3rd inch for better spacing
                  const label = isFoot ? `${ft}'0"` : isInch ? `${ft}'${i}"` : "";
                  return (
                    <div key={inch} className="flex items-center" style={{ height: PX_PER_IN }}>
                      <div
                        className={
                          "bg-foreground " +
                          (isFoot ? "h-0.5 w-8" : isInch ? "h-0.5 w-6" : "h-px w-3")
                        }
                      />
                      <div className="ml-2 text-foreground text-xs tabular-nums">
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ height: inPad }} />
            </div>
            <div className="mt-2 flex gap-1 justify-center">
              <button
                type="button"
                onClick={() => scrollToIN(Math.max(IN_MIN, inVal - 1))}
                className="px-2 py-1 rounded bg-background border text-xs hover:bg-muted"
              >-1</button>
              <button
                type="button"
                onClick={() => scrollToIN(Math.min(IN_MAX, inVal + 1))}
                className="px-2 py-1 rounded bg-background border text-xs hover:bg-muted"
              >+1</button>
            </div>
          </div>
        </div>

        {/* Footer: instructions */}
        <div className="mt-3 text-xs text-muted-foreground text-center">
          Scroll either ruler to select height. The center line shows your selection.
        </div>
      </div>
    </div>
  );
}
