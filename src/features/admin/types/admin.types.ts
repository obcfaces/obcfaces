/**
 * Admin Types
 * TypeScript интерфейсы для админ-панели
 */

import { ALL_COUNTRIES, PRIORITY_LOCALES } from '@/data/locale-config';

export type ParticipantStatus = 'pending' | 'rejected' | 'pre next week' | 'this week' | 'next week' | 'next week on site' | 'past';

export interface ContestCountryConfig {
  code: string;
  name: string;
  flag: string;
  timezone?: string;
  capital?: string;
}

// Use all countries from the locale config
export const CONTEST_COUNTRIES: ContestCountryConfig[] = ALL_COUNTRIES.filter(Boolean);

// Fallback to basic countries if data isn't loaded yet
export const BASIC_COUNTRIES: ContestCountryConfig[] = [
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', timezone: 'Asia/Manila', capital: 'Manila' },
  { code: 'US', name: 'United States', flag: '🇺🇸', timezone: 'America/New_York', capital: 'New York' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', timezone: 'Europe/Moscow', capital: 'Moscow' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', timezone: 'Europe/London', capital: 'London' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', timezone: 'Europe/Berlin', capital: 'Berlin' },
  { code: 'FR', name: 'France', flag: '🇫🇷', timezone: 'Europe/Paris', capital: 'Paris' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', timezone: 'Europe/Madrid', capital: 'Madrid' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', timezone: 'Europe/Rome', capital: 'Rome' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', timezone: 'Asia/Almaty', capital: 'Astana' },
];

export interface UserRole {
  user_id: string;
  role: string;
}

export interface ProfileData {
  id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  auth_provider?: string;
  facebook_data?: any;
  last_sign_in_at?: string;
  created_at: string;
  email_confirmed_at?: string;
  email_verified_by?: string;
  email_verified_by_email?: string;
  is_approved?: boolean | null;
  moderation_notes?: string;
  moderated_by?: string;
  moderated_at?: string;
  bio?: string;
  avatar_url?: string;
  age?: number;
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: string | null;
  city?: string;
  state?: string;
  country?: string;
  isDuplicateIP?: boolean;
  gender?: string;
  marital_status?: string;
  has_children?: boolean;
  weight_kg?: number;
  height_cm?: number;
  photo_1_url?: string;
  photo_2_url?: string;
  raw_user_meta_data?: {
    form_fill_time_seconds?: number;
    [key: string]: any;
  };
  fingerprint_id?: string;
  provider_data?: {
    provider_id?: string;
    [key: string]: any;
  };
}

export interface ContestApplication {
  id: string;
  user_id: string;
  application_data: any;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  deleted_at?: string;
  is_active: boolean;
  notes?: string;
  admin_status?: ParticipantStatus;
  status_history?: any;
}

export interface WeeklyContest {
  id: string;
  week_start_date: string;
  week_end_date: string;
  status: string;
  title: string;
  winner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyContestParticipant {
  id: string;
  contest_id: string;
  user_id: string;
  application_data?: any;
  final_rank: number | null;
  total_votes?: number;
  average_rating?: number;
  created_at?: string;
  submitted_at?: string;
  contest_start_date?: string;
  is_active: boolean;
  admin_status?: string;
  participant_status?: string;
  deleted_at?: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
    age: number;
    city: string;
    country: string;
    photo_1_url: string;
    photo_2_url: string;
    height_cm: number;
    weight_kg: number;
  } | null;
  status_history?: any;
  week_interval?: string;
}

export interface WeekFilter {
  id: string;
  label: string;
  mobileLabel: string;
  weekInterval?: string;
}

export interface AdminModalState {
  photoModal: {
    open: boolean;
    images: string[];
    index: number;
    name: string;
  };
  rejectModal: {
    open: boolean;
    application: { id: string; name: string } | null;
  };
  votersModal: {
    open: boolean;
    participant: { id: string; name: string } | null;
  };
  nextWeekVotersModal: {
    open: boolean;
    participantName: string;
  };
  editModal: {
    open: boolean;
    applicationId: string | null;
    data: any;
  };
  participationModal: {
    open: boolean;
    participantData: any;
  };
  deleteConfirmModal: {
    open: boolean;
    participant: { id: string; name: string } | null;
    confirmText: string;
  };
}
