/**
 * Contest Feature Types
 * Unified data contracts for all contest-related components
 */

export interface Contestant {
  participant_id: string;
  user_id: string;
  first_name: string;
  display_name: string;
  age: number;
  city: string;
  country: string;
  photo_1_url: string;
  photo_2_url: string;
  final_rank?: number;
  total_votes: number;
  average_rating: number;
  height_cm?: number;
  weight_kg?: number;
  marital_status?: string;
  has_children?: boolean;
}

export interface RatingStat {
  participant_id: string;
  average_rating: number;
  total_votes: number;
}

export type LocaleCC = string; // "ph" | "id" | "vn" | "kz" ...
export type LocaleLang = string; // "en" | "ru" | "es" | "id" ...

export interface LocaleTuple {
  lang: LocaleLang;
  cc: LocaleCC;
}

export interface ContestFilters {
  country?: string;
  gender?: string;
  category?: string;
  ageMin?: number;
  ageMax?: number;
  maritalStatus?: string;
  hasChildren?: boolean;
  heightMin?: number;
  heightMax?: number;
  weightMin?: number;
  weightMax?: number;
}

export interface WeekInterval {
  start: Date;
  end: Date;
  weekNumber: number;
  year: number;
}

export interface ContestantWithStats extends Contestant {
  stats: RatingStat;
}
