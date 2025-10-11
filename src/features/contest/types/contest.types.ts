export interface ContestFilters {
  country?: string;
  gender?: 'male' | 'female';
  category?: string;
  ageMin?: number;
  ageMax?: number;
}

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
}

export interface WeekInterval {
  interval: string;
  weeksAgo: number;
}
