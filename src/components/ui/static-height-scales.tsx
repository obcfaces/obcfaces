import React from 'react';

export default function StaticHeightScales() {
  // Generate cm values from 130 to 200
  const cmValues = Array.from({ length: 71 }, (_, i) => 130 + i);
  
  // Generate ft/in values from 4'3" to 6'7" (approximately 130cm to 200cm)
  const ftInValues = [];
  for (let totalInches = 51; totalInches <= 79; totalInches++) { // 4'3" to 6'7"
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    ftInValues.push(`${feet}'${inches}"`);
  }

  return (
    <div className="border rounded-lg bg-background p-4 shadow-sm">
      <div className="text-sm font-medium text-center mb-3 text-muted-foreground">
        Static Height Scales: cm (left) vs ft/in (right)
      </div>
      
      <div className="grid grid-cols-2 gap-0">
        {/* CM Scale - Left */}
        <div className="border-r border-border pr-4">
          <div className="text-xs font-semibold text-center mb-2 text-muted-foreground">
            Centimeters
          </div>
          <div className="space-y-1">
            {cmValues.map((cm) => (
              <div 
                key={`cm-${cm}`} 
                className="text-sm text-center py-0.5 text-foreground font-mono"
                style={{ lineHeight: '1.6' }}
              >
                {cm} cm
              </div>
            ))}
          </div>
        </div>

        {/* FT/IN Scale - Right */}
        <div className="pl-4">
          <div className="text-xs font-semibold text-center mb-2 text-muted-foreground">
            Feet / Inches
          </div>
          <div className="space-y-1">
            {ftInValues.map((ftIn, index) => (
              <div 
                key={`ftin-${index}`} 
                className="text-sm text-center py-0.5 text-foreground font-mono"
                style={{ lineHeight: '1.6' }}
              >
                {ftIn}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-center text-muted-foreground">
        Use this reference to compare metric and imperial height measurements
      </div>
    </div>
  );
}