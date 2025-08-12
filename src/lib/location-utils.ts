import { City } from "country-state-city";

const normalize = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, "").replace(/[-_']/g, "");

// Region -> Provinces (normalized). Kept concise but covers all PH regions and provinces.
const PH_REGION_TO_PROVINCES: Record<string, string[]> = {
  nationalcapitalregion: ["metromanila", "manila", "ncr", "kalakhangmaynila"],
  ilocosregion: ["ilocosnorte", "ilocossur", "launion", "pangasinan"],
  cagayanvalley: ["batanes", "cagayan", "isabela", "nuevavizcaya", "quirino"],
  cordilleraadministrativeregion: ["abra", "apayao", "benguet", "ifugao", "kalinga", "mountainprovince"],
  centralluzon: ["aurora", "bataan", "bulacan", "nuevaecija", "pampanga", "tarlac", "zambales"],
  calabarzon: ["cavite", "laguna", "batangas", "rizal", "quezon"],
  mimaropa: ["occidentalmindoro", "orientalmindoro", "marinduque", "romblon", "palawan"],
  bicolregion: ["albay", "camarinesnorte", "camarinessage", "catanduanes", "masbate", "sorsogon", "camarinnessur"],
  westernvisayas: ["aklan", "antique", "capiz", "guimaras", "iloilo", "negrosoccidental"],
  centralvisayas: ["bohol", "cebu", "negrosoriental", "siquijor"],
  easternvisayas: ["biliran", "easternsamar", "leyte", "northernsamar", "samar", "southernleyte"],
  zamboangapeninsula: ["zamboangadelnorte", "zamboangadelsur", "zamboangasibugay"],
  northernmindanao: ["bukidnon", "camiguin", "lanaodelnorte", "misamisoccidental", "misamisoriental"],
  davaoregion: ["davaodeoro", "davaodelnorte", "davaodelsur", "davaooccidental", "davaooriental", "compostelavalley"],
  soccsksargen: ["cotabato", "southcotabato", "sultankudarat", "sarangani"],
  caraga: ["agusandelnorte", "agusandelsur", "dinagatislands", "surigaodelnorte", "surigaodelsur"],
  bangsamoroautonomousregioninmuslimmindanao: ["basilan", "lanaodelsur", "maguindanaundelnorte", "maguindanaudelsur", "sulu", "tawi-tawi", "maguindanao"],
};

// Build reverse lookup: province -> region
const PH_PROVINCE_TO_REGION: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [region, provs] of Object.entries(PH_REGION_TO_PROVINCES)) {
    for (const p of provs) map[p] = region;
  }
  // common synonyms and legacy names
  map["ncr"] = "nationalcapitalregion";
  map["metromanila"] = "nationalcapitalregion";
  map["manila"] = "nationalcapitalregion";
  map["compostelavalley"] = "davaoregion";
  map["maguindanao"] = "bangsamoroautonomousregioninmuslimmindanao";
  return map;
})();

export function getCitiesForLocation(countryCode: string | null, stateCode: string | null, stateName?: string) {
  if (!countryCode || !stateCode) return [] as ReturnType<typeof City.getCitiesOfState>;

  // 1) Direct lookup
  const byState = City.getCitiesOfState(countryCode, stateCode);
  if (byState.length) return byState;

  // 2) Broad fallbacks
  const all = City.getCitiesOfCountry(countryCode);
  const code = normalize(stateCode);
  const name = normalize(stateName);

  const targets = new Set<string>([code]);
  if (name) targets.add(name);

  // 3) Philippines-specific: map province -> region synonym
  if (countryCode === "PH") {
    // if state is a province, add its region; if it's a region, keep as-is
    const regionFromProv = PH_PROVINCE_TO_REGION[name] || PH_PROVINCE_TO_REGION[code];
    if (regionFromProv) targets.add(regionFromProv);

    // also add shortened variants without the word "region"
    for (const t of Array.from(targets)) {
      if (t.endsWith("region")) targets.add(t.replace("region", ""));
    }
  }

  // 4) Try strict equals on normalized stateCode field
  let res = all.filter((c) => targets.has(normalize(c.stateCode)));
  if (res.length) return res;

  // 5) As a last resort, try includes match (helps with variants like "Region VII - Central Visayas")
  res = all.filter((c) => {
    const sc = normalize(c.stateCode);
    return Array.from(targets).some((t) => sc.includes(t));
  });
  return res;
}
