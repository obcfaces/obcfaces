// Simplified location utilities for mobile performance
import phRaw from "@/data/philippines-2019v2.json?raw";

const normalize = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, "").replace(/[-_']/g, "");

// Lazily parse large PH dataset once
let PH_DATA: any | null = null;
function getPhData() {
  if (!PH_DATA) {
    try {
      PH_DATA = JSON.parse(phRaw);
    } catch (e) {
      PH_DATA = null;
    }
  }
  return PH_DATA;
}

export function getCitiesForLocation(countryCode: string | null, stateCode: string | null, stateName?: string) {
  if (!countryCode || !stateCode) return [] as Array<{ name: string; countryCode: string; stateCode: string }>;

  // 0) Philippines: use authoritative dataset for province -> cities/municipalities
  if (countryCode === "PH") {
    const ph = getPhData();
    const target = normalize(stateName) || normalize(stateCode);
    const cities: Array<{ name: string }> = [];
    if (ph) {
      for (const region of Object.values<any>(ph)) {
        const provs = region?.province_list ?? {};
        for (const [provName, provData] of Object.entries<any>(provs)) {
          if (normalize(provName) === target) {
            const muni = provData?.municipality_list ?? {};
            for (const cityName of Object.keys(muni)) {
              cities.push({ name: cityName });
            }
            break;
          }
        }
        if (cities.length) break;
      }
    }
    if (cities.length) {
      // Cast to expected shape from country-state-city
      return cities.map((c) => ({
        name: c.name,
        countryCode: "PH",
        stateCode: stateCode,
      })) as any;
    }
    // If not found, fall through to generic logic
  }

  // For other countries, return empty array (simplified for mobile performance)
  return [];
}
