import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from '@/utils/performance';
import { Helmet } from 'react-helmet-async';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { MiniStars } from '@/components/mini-stars';
import { 
  Calendar, FileText, UserCog, Eye, Edit, Check, X, Trash2, 
  RotateCcw, Copy, Facebook, Minus, AlertCircle, Trophy, ChevronDown, ChevronUp, Shield, Info
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import cityTimezones from 'city-timezones';
import { AdminPhotoModal } from '@/components/admin-photo-modal';
import { RejectReasonModal, REJECTION_REASONS } from '@/components/reject-reason-modal';
import { VotersModal } from '@/components/voters-modal';
import { NextWeekVotersModal } from '@/components/next-week-voters-modal';
import { ContestParticipationModal } from '@/components/contest-participation-modal';
import { ApplicationEditHistory } from '@/components/ApplicationEditHistory';
import { ExpandableApplicationHistory } from '@/components/ExpandableApplicationHistory';
import { WeeklyTransitionButton } from '@/components/WeeklyTransitionButton';
import { WinnerContentManager } from '@/components/admin/WinnerContentManager';
import { ParticipantStatusHistory } from '@/components/admin/ParticipantStatusHistory';
import { ParticipantStatusHistoryModal } from '@/components/admin/ParticipantStatusHistoryModal';

// Unified status type for participants - all 9 statuses
type ParticipantStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'pre next week' | 'this week' | 'next week' | 'next week on site' | 'past';

// Helper function to check if rejection reason is a duplicate of predefined reasons
const isReasonDuplicate = (rejectionReason: string, reasonTypes: string[]) => {
  if (!rejectionReason || !reasonTypes || reasonTypes.length === 0) return false;
  
  const predefinedReasons = reasonTypes
    .filter(type => type && REJECTION_REASONS[type as keyof typeof REJECTION_REASONS])
    .map(type => REJECTION_REASONS[type as keyof typeof REJECTION_REASONS]);
    
  // Check if rejection reason contains all predefined reasons (in any order, with any separator)
  const normalizedRejectionReason = rejectionReason.toLowerCase().replace(/[;,]\s*/g, '|');
  const normalizedPredefined = predefinedReasons.map(r => r.toLowerCase()).join('|');
  
  return normalizedRejectionReason === normalizedPredefined || 
         predefinedReasons.every(reason => rejectionReason.includes(reason));
};

// =============================================
// ЦЕНТРАЛЬНАЯ СИСТЕМА ОПРЕДЕЛЕНИЯ НЕДЕЛЬНЫХ ИНТЕРВАЛОВ
// =============================================

/**
 * Получить временную зону столицы страны
 */
const getCountryCapitalTimezone = (countryCode: string): string => {
  const timezones: { [key: string]: string } = {
    'PH': 'Asia/Manila',     // Philippines
    'US': 'America/New_York', // United States
    'RU': 'Europe/Moscow',   // Russia
    'GB': 'Europe/London',   // United Kingdom
    'DE': 'Europe/Berlin',   // Germany
    'FR': 'Europe/Paris',    // France
    'ES': 'Europe/Madrid',   // Spain
    'IT': 'Europe/Rome',     // Italy
    // Добавить другие страны по необходимости
  };
  
  return timezones[countryCode] || 'UTC';
};

/**
 * ГЛАВНАЯ ФУНКЦИЯ: Получить правильный интервал недели (понедельник-воскресенье)
 * для заданной даты в указанной стране
 */
const getStrictWeekInterval = (date: Date, countryCode: string = 'PH'): { start: Date, end: Date, formatted: string } => {
  const timezone = getCountryCapitalTimezone(countryCode);
  
  // Конвертировать дату в временную зону страны
  const localDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  
  // Найти понедельник этой недели (ISO week - понедельник = 1, воскресенье = 0)
  const dayOfWeek = localDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Если воскресенье, то -6, иначе 1 - день недели
  
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  // Форматирование: dd/mm - dd/mm/yy - используем правильный год события
  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
  const formatYear = (d: Date) => String(d.getFullYear()).slice(-2);
  
  const formatted = `${formatDate(monday)}-${formatDate(sunday)}/${formatYear(sunday)}`;
  
  // Remove console logs for performance
  // console.log(`STRICT WEEK CALCULATION: Input: ${date.toISOString()}, Country: ${countryCode}, Timezone: ${timezone}`);
  // console.log(`STRICT WEEK RESULT: Monday: ${monday.toISOString()}, Sunday: ${sunday.toISOString()}, Formatted: ${formatted}`);
  
  return {
    start: monday,
    end: sunday,
    formatted
  };
};

/**
 * Получить текущую неделю для страны
 */
const getCurrentWeekInterval = (countryCode: string = 'PH') => {
  return getStrictWeekInterval(new Date(), countryCode);
};

/**
 * Получить неделю N недель назад
 */
const getPastWeekInterval = (weeksAgo: number, countryCode: string = 'PH') => {
  // Правильные интервалы для 2025 года
  const intervals = {
    1: { start: new Date('2025-09-22'), end: new Date('2025-09-28'), formatted: '22/09-28/09/25' },
    2: { start: new Date('2025-09-15'), end: new Date('2025-09-21'), formatted: '15/09-21/09/25' },
    3: { start: new Date('2025-09-08'), end: new Date('2025-09-14'), formatted: '08/09-14/09/25' },
    4: { start: new Date('2025-09-01'), end: new Date('2025-09-07'), formatted: '01/09-07/09/25' }
  };
  return intervals[weeksAgo as keyof typeof intervals] || intervals[1];
};

/**
 * Получить неделю N недель вперед
 */
const getFutureWeekInterval = (weeksAhead: number, countryCode: string = 'PH') => {
  // Правильные интервалы для 2025 года
  const intervals = {
    1: { start: new Date('2025-10-06'), end: new Date('2025-10-12'), formatted: '06/10-12/10/25' },
    2: { start: new Date('2025-10-13'), end: new Date('2025-10-19'), formatted: '13/10-19/10/25' },
    3: { start: new Date('2025-10-20'), end: new Date('2025-10-26'), formatted: '20/10-26/10/25' }
  };
  return intervals[weeksAhead as keyof typeof intervals] || intervals[1];
};

/**
 * Получить week_interval для admin_status (динамически на основе текущей даты)
 */
const getWeekIntervalForStatus = (adminStatus: string): string => {
  const currentWeek = getCurrentWeekInterval('PH');
  const nextWeek = getFutureWeekInterval(1, 'PH');
  const pastWeek = getPastWeekInterval(1, 'PH');
  
  const statusMapping: { [key: string]: string } = {
    'this week': currentWeek.formatted,
    'next week': nextWeek.formatted,
    'next week on site': nextWeek.formatted,
    'pre next week': nextWeek.formatted,
    'past': pastWeek.formatted,
  };
  
  return statusMapping[adminStatus] || currentWeek.formatted;
};

/**
 * Получить список доступных интервалов недель начиная с текущей недели
 */
const getAvailableWeekIntervals = () => {
  const intervals = [];
  const currentDate = new Date();
  
  // Добавляем текущую неделю и следующие недели
  for (let i = 0; i < 12; i++) {
    const weekDate = new Date(currentDate);
    weekDate.setDate(currentDate.getDate() + (i * 7));
    const weekInterval = getStrictWeekInterval(weekDate, 'PH');
    
    intervals.push({
      value: weekInterval.formatted,
      label: weekInterval.formatted
    });
  }
  
  // Добавляем прошлые недели
  for (let i = 1; i <= 8; i++) {
    const weekDate = new Date(currentDate);
    weekDate.setDate(currentDate.getDate() - (i * 7));
    const weekInterval = getStrictWeekInterval(weekDate, 'PH');
    
    intervals.unshift({
      value: weekInterval.formatted,
      label: weekInterval.formatted
    });
  }
  
  return intervals;
};

// Helper function to get dynamic past week filters based on actual data
const createDynamicPastWeekFilters = () => {
  // Используем правильные статические интервалы для 2025 года
  const staticWeeks = [
    '29/09-05/10/25', // 1 week ago
    '22/09-28/09/25', // 2 weeks ago  
    '15/09-21/09/25', // 3 weeks ago
    '08/09-14/09/25', // 4 weeks ago
    '01/09-07/09/25', // 5 weeks ago
    '18/08-24/08/25'  // 6 weeks ago
  ];
  
  // Не нужен console.log здесь - будет логировать один раз при создании
  
  // Return static weeks already sorted
  const sortedWeeks = staticWeeks;
  
  // Create filters for each week
  const filters: Array<{ id: string; label: string; mobileLabel: string; weekInterval?: string }> = [
    { id: 'all', label: 'All Past Weeks', mobileLabel: 'All Past' }
  ];
  
  let weekCounter = 1;
  sortedWeeks.forEach(week => {
    const filterLabel = weekCounter <= 2 
      ? `${weekCounter} week${weekCounter === 1 ? '' : 's'} ago (${week})`
      : `${weekCounter} weeks ago (${week})`;
    
    const mobileLabel = weekCounter <= 2 
      ? `${weekCounter} week${weekCounter === 1 ? '' : 's'} ago`
      : `${weekCounter} weeks ago`;
    
    filters.push({
      id: `past week ${weekCounter}`,
      label: filterLabel,
      mobileLabel: mobileLabel,
      weekInterval: week
    });
    
    weekCounter++;
  });
  
  return filters;
};



// Helper function to get date intervals for past weeks

interface UserRole {
  user_id: string;
  role: string;
}

interface ProfileData {
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
  city?: string;
  state?: string;
  country?: string;
  gender?: string;
  marital_status?: string;
  has_children?: boolean;
  weight_kg?: number;
  height_cm?: number;
  photo_1_url?: string;
  photo_2_url?: string;
}

interface ContestApplication {
  id: string;
  user_id: string;
  application_data: any;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  deleted_at?: string;
  is_active: boolean;
  notes?: string;
  admin_status?: 'pending' | 'rejected' | 'pre next week' | 'this week' | 'next week' | 'next week on site' | 'past';
}

interface WeeklyContest {
  id: string;
  week_start_date: string;
  week_end_date: string;
  status: string;
  title: string;
  winner_id?: string;
  created_at: string;
  updated_at: string;
}

interface WeeklyContestParticipant {
  id: string;
  contest_id: string;
  user_id: string;
  application_data?: any;
  final_rank: number | null;
  total_votes?: number;
  average_rating?: number;
  created_at?: string;
  contest_start_date?: string; // Add this field for filtering by week
  is_active: boolean;
  admin_status?: string;
  participant_status?: string; // Add participant_status field
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
  status_week_history?: any;
  status_history?: any;
  week_interval?: string;
}


const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [contestApplications, setContestApplications] = useState<ContestApplication[]>([]);
  const [deletedApplications, setDeletedApplications] = useState<ContestApplication[]>([]);
  const [showDeletedApplications, setShowDeletedApplications] = useState(false);
  const [weeklyContests, setWeeklyContests] = useState<WeeklyContest[]>([]);
  const [weeklyParticipants, setWeeklyParticipants] = useState<WeeklyContestParticipant[]>([]);
  const [selectedContest, setSelectedContest] = useState<string | null>(null);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<string | null>('all');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalImages, setPhotoModalImages] = useState<string[]>([]);
  const [photoModalIndex, setPhotoModalIndex] = useState(0);
  const [photoModalName, setPhotoModalName] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [applicationToReject, setApplicationToReject] = useState<{ id: string; name: string } | null>(null);
  const [votersModalOpen, setVotersModalOpen] = useState(false);
  const [selectedParticipantForVoters, setSelectedParticipantForVoters] = useState<{ id: string; name: string } | null>(null);
  const [nextWeekVotersModalOpen, setNextWeekVotersModalOpen] = useState(false);
  const [selectedParticipantForNextWeekVoters, setSelectedParticipantForNextWeekVoters] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('all');
  const [allSectionStatusFilter, setAllSectionStatusFilter] = useState<string>('all');
  const [filteredWeeklyParticipants, setFilteredWeeklyParticipants] = useState<any[]>([]);
  const [selectedUserApplications, setSelectedUserApplications] = useState<string | null>(null);
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApplicationData, setEditingApplicationData] = useState<any>(null);
  const [showParticipationModal, setShowParticipationModal] = useState(false);
  const [editingParticipantData, setEditingParticipantData] = useState<any>(null);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editHistoryApplicationId, setEditHistoryApplicationId] = useState<string | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [applicationToDelete, setApplicationToDelete] = useState<{ id: string; name: string } | null>(null);
  const [expandedMobileItems, setExpandedMobileItems] = useState<Set<string>>(new Set());
  const [expandedDesktopItems, setExpandedDesktopItems] = useState<Set<string>>(new Set());
  const [expandedStatusHistory, setExpandedStatusHistory] = useState<Set<string>>(new Set());
  const [participantFilters, setParticipantFilters] = useState<{ [key: string]: string }>({});
  const [pastWeekParticipants, setPastWeekParticipants] = useState<any[]>([]);
  const [pastWeekFilter, setPastWeekFilter] = useState<string>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [applicationCurrentPage, setApplicationCurrentPage] = useState(1);
  const [participantCurrentPage, setParticipantCurrentPage] = useState(1);
  const [pastCurrentPage, setPastCurrentPage] = useState(1);
  const [pastWeekIntervalFilter, setPastWeekIntervalFilter] = useState<string>('all'); // Новый фильтр для интервалов недель
   const [expandedAdminDates, setExpandedAdminDates] = useState<Set<string>>(new Set());
   const [adminDatePopup, setAdminDatePopup] = useState<{ show: boolean; date: string; admin: string; applicationId: string }>({ 
     show: false, date: '', admin: '', applicationId: '' 
   });
   const [applicationHistory, setApplicationHistory] = useState<any[]>([]);
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [verifyingUsers, setVerifyingUsers] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [userRoleMap, setUserRoleMap] = useState<{ [key: string]: string }>({});
  const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<{ id: string; name: string; newRole: string } | null>(null);
  const [assigningRoles, setAssigningRoles] = useState<Set<string>>(new Set());
  const [showWinnerContentModal, setShowWinnerContentModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<{ participantId: string; userId: string; name: string } | null>(null);
  const [nextWeekFilter, setNextWeekFilter] = useState<string>('all'); // Новый фильтр для next week
  const [nextWeekParticipants, setNextWeekParticipants] = useState<any[]>([]);
  const [preNextWeekFilter, setPreNextWeekFilter] = useState<string>('all'); // Фильтр для pre next week
  const [preNextWeekParticipants, setPreNextWeekParticipants] = useState<any[]>([]);
  
  // Фильтры admin_status для всех вкладок
  const [preStatusFilter, setPreStatusFilter] = useState<string>('all');
  const [nextStatusFilter, setNextStatusFilter] = useState<string>('all');
  const [thisStatusFilter, setThisStatusFilter] = useState<string>('all');
  const [pastStatusFilter, setPastStatusFilter] = useState<string>('all');
  const [regStatusFilter, setRegStatusFilter] = useState<string>('all');
  const [winStatusFilter, setWinStatusFilter] = useState<string>('all');
  const [dailyStats, setDailyStats] = useState<Array<{ day_name: string; vote_count: number; like_count: number }>>([]);
  const [dailyApplicationStats, setDailyApplicationStats] = useState<Array<{ day_name: string; total_applications: number; approved_applications: number; day_of_week: number; sort_order: number }>>([]);
  const [dailyRegistrationStats, setDailyRegistrationStats] = useState<Array<{ day_name: string; registration_count: number; day_of_week: number; sort_order: number }>>([]);
  const [nextWeekDailyStats, setNextWeekDailyStats] = useState<Array<{ day_name: string; like_count: number; dislike_count: number; total_votes: number }>>([]);
  const [selectedDay, setSelectedDay] = useState<{ day: number; type: 'new' | 'approved' } | null>(null);
  const [nextWeekApplicationsCount, setNextWeekApplicationsCount] = useState<{ total: number; next_week: number }>({ total: 0, next_week: 0 });
  const [cardSectionStats, setCardSectionStats] = useState<{ newApplications: number; movedToNextWeek: number; new_applications_count: number; moved_to_next_week_count: number }>({ newApplications: 0, movedToNextWeek: 0, new_applications_count: 0, moved_to_next_week_count: 0 });
  const [showAllCards, setShowAllCards] = useState(false);
  const [pendingPastChanges, setPendingPastChanges] = useState<{ [participantId: string]: { admin_status?: string; week_interval?: string } }>({});
  const [statusHistoryModalOpen, setStatusHistoryModalOpen] = useState(false);
  const [selectedStatusHistory, setSelectedStatusHistory] = useState<{ participantId: string; participantName: string; statusHistory: any } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log('Admin component rendering, adminStatusFilter:', adminStatusFilter);

  // Centralized function to update participant status with history
  const updateParticipantStatusWithHistory = async (
    participantId: string,
    newStatus: ParticipantStatus,
    participantName: string
  ): Promise<{ success: boolean; error?: any }> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'No authenticated user' };
      }

      // Get week interval for the status
      const weekInterval = getWeekIntervalForStatus(newStatus);
      
      // Get current participant data to update status_history
      const { data: currentParticipant, error: fetchError } = await supabase
        .from('weekly_contest_participants')
        .select('status_history')
        .eq('id', participantId)
        .single();

      if (fetchError) {
        console.error('Error fetching current participant:', fetchError);
        return { success: false, error: fetchError };
      }

      // Parse existing status_history or create new one
      let statusHistory: any = {};
      try {
        statusHistory = typeof currentParticipant.status_history === 'string' 
          ? JSON.parse(currentParticipant.status_history) 
          : (currentParticipant.status_history || {});
      } catch (e) {
        console.error('Error parsing status_history:', e);
        statusHistory = {};
      }

      // Add new status to history
      statusHistory[newStatus] = {
        changed_at: new Date().toISOString(),
        changed_by: user.id,
        changed_by_email: user.email,
        week_interval: weekInterval,
        timestamp: new Date().toISOString()
      };

      // Update participant with new status and history
      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({ 
          admin_status: newStatus as any,
          week_interval: weekInterval,
          status_history: statusHistory
        } as any)
        .eq('id', participantId);

      if (updateError) {
        console.error('Error updating participant status:', updateError);
        return { success: false, error: updateError };
      }

      console.log(`✅ Successfully updated ${participantName} (${participantId}) to ${newStatus} with interval ${weekInterval}`);
      return { success: true };

    } catch (error) {
      console.error('Unexpected error in updateParticipantStatusWithHistory:', error);
      return { success: false, error };
    }
  };

  // Temporarily disable memoization to fix infinite recursion
  const getDynamicPastWeekFilters = createDynamicPastWeekFilters();

  useEffect(() => {
    console.log('useEffect: Admin component useEffect started');
    
    const initAdmin = async () => {
      try {
        await checkAdminAccess();
        // After admin access is confirmed, load additional stats
        const results = await Promise.allSettled([
          fetchDailyStats(),
          fetchDailyApplicationStats(),
          fetchDailyRegistrationStats(),
          fetchNextWeekParticipants(),
          fetchPreNextWeekParticipants(),
          fetchNextWeekDailyStats(),
          fetchNextWeekApplicationsCount(),
          fetchCardSectionStats()
        ]);
        
        // Log any failures
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const functionNames = [
              'fetchDailyStats', 'fetchDailyApplicationStats', 'fetchDailyRegistrationStats',
              'fetchNextWeekParticipants', 'fetchPreNextWeekParticipants', 
              'fetchNextWeekDailyStats', 'fetchNextWeekApplicationsCount', 'fetchCardSectionStats'
            ];
            console.error(`initAdmin: ${functionNames[index]} failed:`, result.reason);
          }
        });
        
        console.log('initAdmin: Additional data loading completed');
      } catch (error) {
        console.error('useEffect: Error in Admin initialization:', error);
      }
    };
    
    initAdmin();
    
    
    // ОТКЛЮЧЕНО: realtime subscriptions для предотвращения автоматических обновлений статусов
    /*
    const contestAppsChannel = supabase
      .channel('contest-applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_contest_participants'
        },
        (payload) => {
          console.log('Contest applications changed:', payload);
          // Refresh contest applications and stats
          fetchContestApplications();
          fetchDailyApplicationStats();
          fetchNextWeekApplicationsCount();
          fetchCardSectionStats();
        }
      )
      .subscribe();

    const votesChannel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes'
        },
        (payload) => {
          console.log('Votes changed:', payload);
          // Refresh daily voting stats
          fetchDailyStats();
        }
      )
      .subscribe();

    const ratingsChannel = supabase
      .channel('ratings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ratings'
        },
        (payload) => {
          console.log('Ratings changed:', payload);
          // Refresh daily voting stats
          fetchDailyStats();
          fetchNextWeekDailyStats();
        }
      )
      .subscribe();

    const weeklyParticipantsChannel = supabase
      .channel('weekly-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_contest_participants'
        },
        (payload) => {
          console.log('Weekly contest participants changed:', payload);
          // Refresh card section stats and other related data
          fetchCardSectionStats();
          fetchWeeklyParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contestAppsChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(ratingsChannel);
      supabase.removeChannel(weeklyParticipantsChannel);
    };
    */
  }, []);

  // Recalculate application stats when contestApplications change
  useEffect(() => {
    if (contestApplications.length > 0) {
      fetchDailyApplicationStats();
      fetchDailyStats(); // Also refresh daily voting stats
    }
  }, [contestApplications]);

  // Handle Weekly Contest participants filtering - simplified to use only admin_status
  useEffect(() => {
    const filterWeeklyParticipants = async () => {
      console.log('Filtering by admin_status:', adminStatusFilter);
      
      // For weekly section (This Week), show only "this week" status by default
      // If specific status filter is selected, show that status instead
      const filteredByStatus = adminStatusFilter === 'all' 
        ? weeklyParticipants.filter(p => p.admin_status === 'this week')
        : weeklyParticipants.filter(p => p.admin_status === adminStatusFilter);

      // Remove duplicates based on user_id
      const uniqueParticipants = filteredByStatus.filter((participant, index, arr) => 
        arr.findIndex(p => p.user_id === participant.user_id) === index
      );
      
      // Sort participants by rating
      const sortedParticipants = uniqueParticipants.sort((a, b) => {
        if (a.final_rank && !b.final_rank) return -1;
        if (!a.final_rank && b.final_rank) return 1;
        if (a.final_rank && b.final_rank) return a.final_rank - b.final_rank;
        
        const ratingA = Number(a.average_rating) || 0;
        const ratingB = Number(b.average_rating) || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        
        const votesA = Number(a.total_votes) || 0;
        const votesB = Number(b.total_votes) || 0;
        return votesB - votesA;
      });

      setFilteredWeeklyParticipants(sortedParticipants);
    };

    filterWeeklyParticipants();
  }, [adminStatusFilter, weeklyParticipants]);

  // Handle Past Week participants filtering  
  useEffect(() => {
  const filterPastWeekParticipants = async () => {
      try {
        console.log('=== FILTERING PAST WEEK PARTICIPANTS ===');
        console.log('All weekly participants:', weeklyParticipants.length);
        
        // Filter participants with 'past' admin_status and group by week intervals from status_week_history
        const pastParticipants = weeklyParticipants.filter(participant => {
          const adminStatus = participant.admin_status || 'this week';
          
          console.log(`Participant ${participant.id}:`, {
            name: `${participant.application_data?.first_name || ''} ${participant.application_data?.last_name || ''}`.trim(),
            adminStatus,
            status_week_history: (participant as any).status_week_history
          });
          
          // Include only participants with 'past' status - don't include 'this week'
          return adminStatus === 'past';
        });

        // Load rating stats for each participant (past and this week) - использовать данные из weekly_contest_participants
        const pastParticipantsWithRatings = pastParticipants.map((participant) => {
          // Используем данные, которые уже есть в weekly_contest_participants
          return {
            ...participant,
            average_rating: participant.average_rating || 0,
            total_votes: participant.total_votes || 0,
            weekInterval: getParticipantWeekInterval(participant)
          };
        });
        
        // Sort past participants by rating (highest to lowest)
        const sortedPastParticipants = pastParticipantsWithRatings.sort((a, b) => {
          // Sort by final_rank first (winners at top)
          if (a.final_rank && !b.final_rank) return -1;
          if (!a.final_rank && b.final_rank) return 1;
          if (a.final_rank && b.final_rank) return a.final_rank - b.final_rank;
          
          // Then by average_rating (highest first)
          const ratingA = Number(a.average_rating) || 0;
          const ratingB = Number(b.average_rating) || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          
          // Finally by total_votes (highest first)
          const votesA = Number(a.total_votes) || 0;
          const votesB = Number(b.total_votes) || 0;
          return votesB - votesA;
        });
        
        console.log('Filtered past week participants:', sortedPastParticipants.length);
        console.log('Past participants admin statuses:', sortedPastParticipants.map(p => p.admin_status));
        
        setPastWeekParticipants(sortedPastParticipants);
        
      } catch (error) {
        console.error('Error in filterPastWeekParticipants:', error);
        setPastWeekParticipants([]);
      }
    };

    filterPastWeekParticipants();
  }, [weeklyParticipants, participantFilters, pastWeekFilter]);

  // Helper function to determine week interval for participant based on admin_status and status_week_history  
  const getParticipantWeekInterval = (participant: any) => {
    const adminStatus = participant.admin_status || 'this week';
    
    // If participant has week_interval from database, use it first
    if (participant.week_interval) {
      return participant.week_interval;
    }
    
    // Handle old "week-YYYY-MM-DD" format statuses - convert to proper intervals
    if (adminStatus && adminStatus.startsWith('week-2025-09-')) {
      // Extract date from status like "week-2025-09-23"
      const dateMatch = adminStatus.match(/week-2025-09-(\d+)/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        // Map specific week ranges for September 2025
        if (day >= 29 || day <= 5) return '29/09-05/10/25'; // Current week spans Sept 29 - Oct 5
        if (day >= 22 && day <= 28) return '22/09-28/09/25'; // Last week
        if (day >= 15 && day <= 21) return '15/09-21/09/25'; // 2 weeks ago
        if (day >= 8 && day <= 14) return '08/09-14/09/25';  // 3 weeks ago
        if (day >= 1 && day <= 7) return '01/09-07/09/25';   // 4 weeks ago
      }
    }
    
    // Map admin_status to correct week dates for 2025
    switch (adminStatus) {
      case 'this week':
        return '29/09-05/10/25'; // Current actual week  
      case 'next week':
      case 'next week on site':
        return '06/10-12/10/25'; // Next week
      case 'past':
        // For 'past' status, use status_week_history to determine week interval
        return '22/09-28/09/25'; // Default to 1 week ago if no specific interval
      case 'pending':
        return '29/09-05/10/25'; // Same as current week for pending apps
      default:
        return '29/09-05/10/25'; // Default to current week
    }
  };

  // Helper function to get corresponding past week filter based on interval
  const getCorrespondingPastWeekFilter = (interval: string) => {
    const dynamicFilters = getDynamicPastWeekFilters;
    const matchingFilter = dynamicFilters.find(f => f.weekInterval === interval);
    return matchingFilter?.id || 'all';
  };

  // Update pastWeekFilter when pastWeekIntervalFilter changes
  useEffect(() => {
    if (pastWeekIntervalFilter !== 'all') {
      const correspondingFilter = getCorrespondingPastWeekFilter(pastWeekIntervalFilter);
      if (correspondingFilter !== pastWeekFilter) {
        setPastWeekFilter(correspondingFilter);
      }
    }
  }, [pastWeekIntervalFilter]);

  // Helper function to get participant display info with winner indication
  const getParticipantDisplayInfo = (participant: any) => {
    const appData = participant.application_data || {};
    const name = `${appData.first_name || ''} ${appData.last_name || ''}`.trim();
    const weekInterval = getParticipantWeekInterval(participant);
    
    if (participant.final_rank === 1) {
      return `🏆 WINNER - ${name} - Week: ${weekInterval}`;
    } else if (participant.final_rank) {
      return `🥈 FINALIST - ${name} - Week: ${weekInterval}`;  
    } else {
      return `${name} - Week: ${weekInterval}`;
    }
  };

  // Helper function to format week interval (fallback)
  const formatWeekInterval = (date: Date | string) => {
    const d = new Date(date);
    const monday = new Date(d);
    const dayOfWeek = d.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(d.getDate() - daysSinceMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return `${monday.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })} - ${sunday.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  const handleEmailVerification = async (userId: string) => {
    try {
      setVerifyingUsers(prev => new Set(prev).add(userId));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/verify-user-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify email');
      }

      // Update the profile with verification info locally for immediate UI update
      setProfiles(prev => prev.map(profile => 
        profile.id === userId 
          ? { 
              ...profile, 
              email_confirmed_at: new Date().toISOString(),
              email_verified_by: user.id,
              email_verified_by_email: user.email
            }
          : profile
      ));

      toast({
        title: "Success",
        description: "User email verified successfully",
      });

      // Refresh the profiles to show updated verification status
      setTimeout(() => fetchProfiles(), 1000);
    } catch (error: any) {
      console.error('Error verifying email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify user email",
        variant: "destructive"
      });
    } finally {
      setVerifyingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRoleChange = (userId: string, userName: string, newRole: string) => {
    if (newRole === 'admin') {
      setRoleChangeUser({ id: userId, name: userName, newRole });
      setShowRoleConfirmModal(true);
    } else {
      assignUserRole(userId, newRole);
    }
  };

  const assignUserRole = async (userId: string, role: string) => {
    try {
      setAssigningRoles(prev => new Set(prev).add(userId));

      // Сначала удаляем существующие роли пользователя
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Если роль не 'usual', добавляем новую роль
      if (role !== 'usual') {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert([{ 
            user_id: userId, 
            role: role as 'admin' | 'moderator' | 'user'
          }]);

        if (insertError) throw insertError;
      }

      // Обновляем локальное состояние
      setUserRoleMap(prev => ({
        ...prev,
        [userId]: role
      }));

      toast({
        title: "Success",
        description: `User role updated to ${role === 'usual' ? 'usual user' : role}`,
      });

      // Обновляем данные
      fetchUserRoles();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive"
      });
    } finally {
      setAssigningRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const confirmRoleChange = () => {
    if (roleChangeUser) {
      assignUserRole(roleChangeUser.id, roleChangeUser.newRole);
      setShowRoleConfirmModal(false);
      setRoleChangeUser(null);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_daily_voting_stats');
      if (error) throw error;
      
      // Ensure proper ordering: Monday to Sunday
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const sortedData = (data || []).sort((a, b) => {
        return dayOrder.indexOf(a.day_name) - dayOrder.indexOf(b.day_name);
      });
      
      setDailyStats(sortedData);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const fetchDailyApplicationStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_daily_application_stats');
      
      if (error) {
        console.error('Error fetching daily application stats:', error);
        return;
      }

      // Ensure proper ordering: Monday to Sunday
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const sortedData = (data || []).sort((a, b) => {
        return dayOrder.indexOf(a.day_name) - dayOrder.indexOf(b.day_name);
      });

      setDailyApplicationStats(sortedData);
    } catch (error) {
      console.error('Error in fetchDailyApplicationStats:', error);
    }
  };

  const fetchDailyRegistrationStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_daily_registration_stats');
      if (error) throw error;
      
      // Ensure proper ordering: Monday to Sunday
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const sortedData = (data || []).sort((a, b) => {
        return dayOrder.indexOf(a.day_name) - dayOrder.indexOf(b.day_name);
      });
      
      setDailyRegistrationStats(sortedData);
    } catch (error) {
      console.error('Error fetching daily registration stats:', error);
    }
  };


  const getUsersForDay = (dayIndex: number, type: 'new' | 'approved') => {
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + dayIndex);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    
    // Group all applications by user_id to find first-time users
    const userApplications = new Map<string, any[]>();
    contestApplications.forEach(app => {
      if (!userApplications.has(app.user_id)) {
        userApplications.set(app.user_id, []);
      }
      userApplications.get(app.user_id)!.push(app);
    });
    
    // Sort applications by submitted_at for each user to find first application
    userApplications.forEach(apps => {
      apps.sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
    });
    
    if (type === 'new') {
      return Array.from(userApplications.values())
        .map(userApps => userApps[0]) // Get first application
        .filter(app => {
          const appDate = new Date(app.submitted_at);
          return appDate >= dayStart && appDate < dayEnd;
        });
    } else {
      return Array.from(userApplications.values())
        .map(userApps => userApps[0]) // Get first application
        .filter(app => {
          if (!['this week', 'next week', 'past'].includes(app.admin_status) || !app.reviewed_at) return false;
          const approvedDate = new Date(app.reviewed_at);
          return approvedDate >= dayStart && approvedDate < dayEnd;
        });
    }
  };

  const checkAdminAccess = async () => {
    try {
      console.log('checkAdminAccess: Starting...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('checkAdminAccess: Session retrieved', !!session?.user);
      
      if (!session?.user) {
        console.log('checkAdminAccess: No user, redirecting to /auth');
        sessionStorage.setItem('redirectPath', '/admin');
        navigate('/auth');
        setLoading(false);
        return;
      }

      setUser(session.user);
      console.log('checkAdminAccess: User set, checking roles...');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      let roles;
      let rolesError;
      
      try {
        const result = await Promise.race([
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .limit(1),
          timeoutPromise
        ]);
        roles = (result as any).data;
        rolesError = (result as any).error;
      } catch (error) {
        console.error('checkAdminAccess: Timeout or error fetching roles', error);
        toast({
          title: "Error",
          description: "Failed to check admin permissions (timeout)",
          variant: "destructive"
        });
        navigate('/');
        setLoading(false);
        return;
      }

      console.log('checkAdminAccess: Roles fetched', roles, rolesError);

      if (rolesError) {
        console.error('checkAdminAccess: Error fetching roles', rolesError);
        toast({
          title: "Error",
          description: "Failed to check admin permissions",
          variant: "destructive"
        });
        navigate('/');
        setLoading(false);
        return;
      }

      const hasAdminRole = roles?.some(r => r.role === 'admin');
      console.log('checkAdminAccess: Has admin role?', hasAdminRole);
      
      if (!hasAdminRole) {
        toast({
          title: "Access Denied",
          description: "You don't have admin permissions",
          variant: "destructive"
        });
        navigate('/');
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      console.log('checkAdminAccess: Admin access granted, loading base data...');
      
      // Load essential data first (using allSettled to handle individual failures)
      const results = await Promise.allSettled([
        fetchProfiles(),
        fetchUserRoles(),
        fetchContestApplications(),
        fetchWeeklyContests(),
        fetchWeeklyParticipants()
      ]);
      
      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const functionNames = ['fetchProfiles', 'fetchUserRoles', 'fetchContestApplications', 'fetchWeeklyContests', 'fetchWeeklyParticipants'];
          console.error(`checkAdminAccess: ${functionNames[index]} failed:`, result.reason);
        }
      });
      
      console.log('checkAdminAccess: Base data loading completed');
      
    } catch (error) {
      console.error('checkAdminAccess: Unexpected error', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      console.log('checkAdminAccess: Setting loading to false');
      setLoading(false);
    }
  };

  // Function to get status background color
  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'pre next week':
        return 'bg-purple-100 dark:bg-purple-900';
      case 'next week':
        return 'bg-[hsl(var(--status-next-week))]';
      case 'next week on site':
        return 'bg-[hsl(var(--status-next-week-on-site))]';
      case 'this week':
        return 'bg-[hsl(var(--status-this-week))]';
      case 'past':
        return 'bg-[hsl(var(--status-past))]';
      default:
        return '';
    }
  };

  // DEPRECATED: Use updateParticipantStatusWithHistory instead
  // Keeping for reference but should not be used
  const debounceStatusUpdate = useCallback(
    debounce(async (participantId: string, newStatus: ParticipantStatus, participantName: string = 'Unknown') => {
      try {
        // Use centralized function instead
        const result = await updateParticipantStatusWithHistory(participantId, newStatus, participantName);
        
        if (!result.success) {
          toast({
            title: "Error",
            description: "Failed to update participant status",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: `Participant status updated to ${newStatus}`,
          });
          fetchWeeklyParticipants();
        }
      } catch (error) {
        console.error('Error in debounced status update:', error);
      }
    }, 300),
    []
  );

  // DEPRECATED: Use updateParticipantStatusWithHistory instead
  const optimizedStatusUpdate = useCallback(async (participantId: string, newStatus: ParticipantStatus, participantName: string = 'Unknown') => {
    try {
      // Use centralized function instead
      const result = await updateParticipantStatusWithHistory(participantId, newStatus, participantName);
      
      if (!result.success) {
        toast({
          title: "Error",
          description: "Failed to update participant status",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Participant status updated to ${newStatus}`,
        });
        fetchWeeklyParticipants();
      }
    } catch (error) {
      console.error('Error in optimized status update:', error);
    }
  }, []);

  const fetchProfiles = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive"
      });
      return;
    }

    const { data: authData, error: authError } = await supabase
      .rpc('get_user_auth_data_admin');

    if (authError) {
      console.warn('Failed to fetch auth data:', authError);
    }

    const profilesWithAuth = (profilesData || []).map(profile => {
      const userAuthData = authData?.find(auth => auth.user_id === profile.id);
      
      return {
        ...profile,
        auth_provider: userAuthData?.auth_provider || 'unknown',
        email: userAuthData?.email || null,
        facebook_data: userAuthData?.facebook_data || null,
        last_sign_in_at: userAuthData?.last_sign_in_at || null,
        email_confirmed_at: userAuthData?.email_confirmed_at || null
      };
    });

    setProfiles(profilesWithAuth);
  };

  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (error) {
      console.error('Error fetching user roles:', error);
      return;
    }

    setUserRoles(data || []);
    
    // Создаем мапу ролей для быстрого доступа
    const roleMap: { [key: string]: string } = {};
    (data || []).forEach(userRole => {
      roleMap[userRole.user_id] = userRole.role;
    });
    setUserRoleMap(roleMap);
  };

  const fetchContestApplications = async () => {
    console.log('Fetching contest applications...');
    // Query unified table for application statuses
    const { data, error } = await supabase
      .from('weekly_contest_participants')
      .select('*')
      .in('admin_status', ['pending', 'approved', 'under_review', 'rejected', 'this week', 'next week', 'past'] as any)
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching contest applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contest applications",
        variant: "destructive"
      });
      return;
    }

    // Map admin_status to "status" field for compatibility
    const processedData = (data || []).map((app: any) => ({
      ...app,
      status: app.admin_status, // Use admin_status as status
      submitted_at: app.submitted_at || app.created_at
    })) as any;

    console.log('Fetched contest applications:', processedData?.length, 'applications');
    setContestApplications(processedData);
  };

  const fetchDeletedApplications = async () => {
    const { data, error } = await supabase
      .from('weekly_contest_participants')
      .select('*')
      .in('admin_status', ['pending', 'approved', 'under_review', 'rejected', 'this week', 'next week', 'past'] as any)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error fetching deleted applications:', error);
      return [];
    }

    return (data || []).map((app: any) => ({
      ...app,
      status: app.admin_status,
      submitted_at: app.submitted_at || app.created_at
    })) as any;
  };

  const fetchWeeklyContests = async () => {
    const { data, error } = await supabase
      .from('weekly_contests')
      .select('*')
      .order('week_start_date', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch weekly contests",
        variant: "destructive"
      });
      return;
    }

    setWeeklyContests(data || []);
  };

  const fetchWeeklyParticipants = async () => {
    try {
      console.log('Fetching weekly participants from database...');
      
      // Fetch participants for current week and past 3 weeks using optimized RPC function
      const weekOffsets = [0, -1, -2, -3];
      const results = await Promise.allSettled(
        weekOffsets.map(offset => 
          supabase.rpc('get_weekly_contest_participants_admin', { weeks_offset: offset })
        )
      );

      // Combine all participants from all weeks
      const allParticipants: any[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          console.log(`Loaded ${result.value.data.length} participants for week offset ${weekOffsets[index]}`);
          allParticipants.push(...result.value.data);
        } else {
          console.error(`Error loading participants for week offset ${weekOffsets[index]}:`, result);
        }
      });

      // IMPORTANT: Also fetch ALL participants with 'past' status to ensure we get everyone
      const { data: pastParticipantsData, error: pastError } = await supabase
        .from('weekly_contest_participants')
        .select(`
          id,
          contest_id,
          user_id,
          admin_status,
          week_interval,
          status_week_history,
          status_history,
          final_rank,
          total_votes,
          average_rating,
          is_active,
          created_at,
          application_data
        `)
        .eq('admin_status', 'past');

      if (pastError) {
        console.error('Error loading past participants:', pastError);
      } else if (pastParticipantsData) {
        console.log(`Loaded ${pastParticipantsData.length} participants with 'past' status`);
        
        // Transform past participants to match RPC format
        const transformedPastParticipants = pastParticipantsData.map((item: any) => {
          const appData = item.application_data || {};
          return {
            participant_id: item.id,
            contest_id: item.contest_id,
            user_id: item.user_id,
            first_name: appData.first_name || '',
            last_name: appData.last_name || '',
            age: appData.age || null,
            country: appData.country || '',
            state: appData.state || '',
            city: appData.city || '',
            height_cm: appData.height_cm || null,
            weight_kg: appData.weight_kg || null,
            gender: appData.gender || '',
            marital_status: appData.marital_status || '',
            has_children: appData.has_children || false,
            photo_1_url: appData.photo1_url || appData.photo_1_url || '',
            photo_2_url: appData.photo2_url || appData.photo_2_url || '',
            avatar_url: appData.avatar_url || '',
            final_rank: item.final_rank,
            total_votes: item.total_votes || 0,
            average_rating: item.average_rating || '0',
            status_assigned_date: item.created_at,
            contest_start_date: item.created_at,
            is_active: item.is_active,
            admin_status: item.admin_status,
            status_week_history: item.status_week_history || {},
            status_history: item.status_history || {},
            week_interval: item.week_interval
          };
        });
        
        // Merge with existing participants, avoiding duplicates
        const existingIds = new Set(allParticipants.map(p => p.participant_id));
        transformedPastParticipants.forEach(p => {
          if (!existingIds.has(p.participant_id)) {
            allParticipants.push(p);
          }
        });
      }

      console.log('Total participants loaded (including past):', allParticipants.length);

      // Transform RPC result to match our interface
      const participants = allParticipants.map((item: any) => ({
        id: item.participant_id,
        contest_id: item.contest_id,
        user_id: item.user_id,
        application_data: {
          first_name: item.first_name || '',
          last_name: item.last_name || '',
          age: item.age || null,
          country: item.country || '',
          state: item.state || '',
          city: item.city || '',
          height_cm: item.height_cm || null,
          weight_kg: item.weight_kg || null,
          gender: item.gender || '',
          marital_status: item.marital_status || '',
          has_children: item.has_children || false,
          photo1_url: item.photo_1_url || '',
          photo2_url: item.photo_2_url || '',
          avatar_url: item.avatar_url || ''
        },
        final_rank: item.final_rank,
        total_votes: item.total_votes || 0,
        average_rating: parseFloat(item.average_rating || '0'),
        created_at: item.contest_start_date || item.status_assigned_date,
        contest_start_date: item.contest_start_date,
        is_active: item.is_active,
        admin_status: item.admin_status || 'pending',
        status_week_history: item.status_week_history || {},
        status_history: item.status_history || {},
        week_interval: item.week_interval
      }));

      console.log('Admin statuses distribution:', 
        participants.reduce((acc: any, p: any) => {
          acc[p.admin_status] = (acc[p.admin_status] || 0) + 1;
          return acc;
        }, {}));

      setWeeklyParticipants(participants);
      console.log('Set weeklyParticipants, current adminStatusFilter:', adminStatusFilter);
    } catch (error) {
      console.error('Error in fetchWeeklyParticipants:', error);
    }
  };

  // Новая функция для загрузки участников next week с интервалами
  const fetchNextWeekParticipants = async () => {
    try {
      console.log('Fetching next week participants...');
      
      // Get ALL participants with next week or next week on site status directly from table
      const { data: nextWeekData, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .in('admin_status', ['next week', 'next week on site'])
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching next week participants:', error);
        throw error;
      }
      
      console.log('Fetched next week participants:', nextWeekData?.length || 0);
      setNextWeekParticipants(nextWeekData || []);
    } catch (error) {
      console.error('Error in fetchNextWeekParticipants:', error);
    }
  };

  // Функция для загрузки участников pre next week
  const fetchPreNextWeekParticipants = async () => {
    try {
      console.log('Fetching pre next week participants...');
      
      // Get ALL participants with pre next week status directly from table
      const { data: preNextWeekData, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'pre next week')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching pre next week participants:', error);
        throw error;
      }

      console.log('Fetched pre next week participants:', preNextWeekData?.length || 0);
      setPreNextWeekParticipants(preNextWeekData || []);
    } catch (error) {
      console.error('Error in fetchPreNextWeekParticipants:', error);
    }
  };

  const fetchNextWeekApplicationsCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_next_week_applications_count');
      
      if (error) {
        console.error('Error fetching next week applications count:', error);
        return;
      }

      if (data && data.length > 0) {
        setNextWeekApplicationsCount({
          total: Number(data[0].total_applications || 0),
          next_week: Number(data[0].next_week_applications || 0)
        });
      }
    } catch (error) {
      console.error('Error in fetchNextWeekApplicationsCount:', error);
    }
  };

  const fetchCardSectionStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_card_section_stats');
      
      if (error) {
        console.error('Error fetching card section stats:', error);
        return;
      }

      if (data && data.length > 0) {
        setCardSectionStats({
          newApplications: Number(data[0].new_applications_count || 0),
          movedToNextWeek: Number(data[0].moved_to_next_week_count || 0),
          new_applications_count: Number(data[0].new_applications_count || 0),
          moved_to_next_week_count: Number(data[0].moved_to_next_week_count || 0)
        });
      }
    } catch (error) {
      console.error('Error in fetchCardSectionStats:', error);
    }
  };


  const fetchNextWeekDailyStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_next_week_daily_stats');
      
      if (error) {
        console.error('Error fetching next week daily stats:', error);
        return;
      }

      // Ensure proper ordering: Monday to Sunday
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const sortedData = (data || []).sort((a, b) => {
        return dayOrder.indexOf(a.day_name) - dayOrder.indexOf(b.day_name);
      });

      setNextWeekDailyStats(sortedData);
    } catch (error) {
      console.error('Error in fetchNextWeekDailyStats:', error);
    }
  };


  // Helper function to get the next Monday based on timezone
  const getNextMondayForCountry = (country: string) => {
    try {
      // Get timezone for the country
      const cityLookup = cityTimezones.lookupViaCity('Manila'); // Default to Philippines timezone
      const timezone = Array.isArray(cityLookup) && cityLookup.length > 0 ? cityLookup[0].timezone : 'Asia/Manila';
      
      // Get current date in the target timezone
      const now = new Date();
      const targetDate = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
      
      // Calculate next Monday
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek); // Days to next Monday
      
      const nextMonday = new Date(targetDate);
      nextMonday.setDate(targetDate.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);
      
      return nextMonday.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (error) {
      console.error('Error calculating next Monday:', error);
      // Fallback: calculate next Monday in local time
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);
      return nextMonday.toISOString().split('T')[0];
    }
  };

  const reviewApplication = async (applicationId: string, newStatus: ParticipantStatus, rejectionData?: { reasonTypes: string[], notes: string }) => {
    const application = contestApplications.find(app => app.id === applicationId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentTime = new Date().toISOString();
      
      console.log('Reviewing application:', applicationId, 'with status:', newStatus);
      console.log('Application data:', application);
      
      // Update only metadata in contest_applications
      const updateData: any = {
        reviewed_at: currentTime,
        reviewed_by: user?.id,
        ...(newStatus === 'rejected' && { 
          notes: rejectionData?.notes || null
        })
      };

      // Update weekly_contest_participants (unified table)
      const { error: appError } = await supabase
        .from('weekly_contest_participants')
        .update(updateData)
        .eq('id', applicationId);

      if (appError) {
        console.error('Database error:', appError);
        toast({
          title: "Error",
          description: `Failed to update application: ${appError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Application metadata updated successfully');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return;
    }

    // If user is in weekly contest participants, update admin_status with history
    const weeklyParticipant = weeklyParticipants.find(p => p.user_id === application?.user_id);
    if (weeklyParticipant) {
      try {
        const participantName = `${application?.application_data?.first_name || ''} ${application?.application_data?.last_name || ''}`.trim();
        
        const result = await updateParticipantStatusWithHistory(
          weeklyParticipant.id,
          newStatus,
          participantName
        );

        if (result.success) {
          console.log('Successfully updated weekly participant admin_status to:', newStatus);
          // Immediately refresh the data
          fetchWeeklyParticipants();
          fetchContestApplications();
        } else {
          console.error('Error updating weekly participant admin_status:', result.error);
        }
      } catch (error) {
        console.error('Error updating weekly participant:', error);
      }
    }

    // If status is this week/next week, automatically add to weekly contest if not already there
    if ((newStatus === 'this week' || newStatus === 'next week') && application) {
      try {
        const appData = typeof application.application_data === 'string' 
          ? JSON.parse(application.application_data) 
          : application.application_data;
        
        const nextMondayDate = getNextMondayForCountry(appData.country || 'PH');
        const nextSundayDate = new Date(nextMondayDate);
        nextSundayDate.setDate(nextSundayDate.getDate() + 6);
        
        // Check if weekly contest exists for next Monday
        let { data: existingContest } = await supabase
          .from('weekly_contests')
          .select('id')
          .eq('week_start_date', nextMondayDate)
          .single();

        let contestId = existingContest?.id;

        // Create contest if it doesn't exist
        if (!contestId) {
          const { data: newContest, error: contestError } = await supabase
            .from('weekly_contests')
            .insert({
              title: `Contest ${new Date(nextMondayDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}-${nextSundayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
              week_start_date: nextMondayDate,
              week_end_date: nextSundayDate.toISOString().split('T')[0],
              status: 'active'
            })
            .select('id')
            .single();

          if (contestError) {
            console.error('Error creating weekly contest:', contestError);
          } else {
            contestId = newContest.id;
          }
        }

        // Add participant to weekly contest (check if already exists)
        if (contestId) {
          const { data: existingParticipant } = await supabase
            .from('weekly_contest_participants')
            .select('id')
            .eq('user_id', application.user_id)
            .eq('contest_id', contestId)
            .single();

          if (!existingParticipant) {
            const { error: participantError } = await supabase
              .from('weekly_contest_participants')
              .insert([{
                contest_id: contestId,
                user_id: application.user_id,
                application_data: application.application_data,
                admin_status: newStatus
              }]);

            if (participantError) {
              console.error('Error adding participant to weekly contest:', participantError);
            }
          } else {
            // Update existing participant's admin_status with history
            const participantName = `${application?.application_data?.first_name || ''} ${application?.application_data?.last_name || ''}`.trim();
            
            const result = await updateParticipantStatusWithHistory(
              existingParticipant.id,
              newStatus,
              participantName
            );

            if (!result.success) {
              console.error('Error updating participant admin_status:', result.error);
            }
          }
        }
      } catch (error) {
        console.error('Error handling approved/next status:', error);
      }
    }

    console.log('Refreshing data after status change...');
    fetchContestApplications();
    fetchWeeklyParticipants();
  };

  const deleteApplication = async (applicationId: string) => {
    const { error } = await supabase
      .from('weekly_contest_participants')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', applicationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Application deleted",
    });

    fetchContestApplications();
  };

  const openPhotoModal = (photos: string[], index: number, name: string) => {
    setPhotoModalImages(photos);
    setPhotoModalIndex(index);
    setPhotoModalName(name);
    setPhotoModalOpen(true);
  };

  const assignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `Role ${role} assigned successfully`,
    });

    fetchUserRoles();
  };

  const removeRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Role removed successfully",
    });

    fetchUserRoles();
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter(r => r.user_id === userId).map(r => r.role);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Admin Panel - Moderation</title>
        <meta name="description" content="Admin panel for moderating user profiles and managing roles" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 md:px-6">
        <div className="max-w-7xl md:mx-auto px-2 md:px-6">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <WeeklyTransitionButton />
          </div>

          <Tabs defaultValue="applications" className="space-y-6">
            {/* Mobile layout: Single row with all tabs */}
            <div className="md:hidden">
              <TabsList className="grid grid-cols-8 w-full">
                <TabsTrigger value="applications" className="text-xs">
                  New
                </TabsTrigger>
                <TabsTrigger value="prenextweek" className="text-xs">
                  Pre
                </TabsTrigger>
                <TabsTrigger value="nextweek" className="text-xs">
                  Next
                </TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs">
                  This
                </TabsTrigger>
                <TabsTrigger value="pastweek" className="text-xs">
                  Past
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="registrations" className="text-xs">
                  Reg
                </TabsTrigger>
                <TabsTrigger value="winnercontent" className="text-xs">
                  Win
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Desktop layout - single row */}
            <TabsList className="hidden md:flex">
              <TabsTrigger value="applications">
                New
              </TabsTrigger>
              <TabsTrigger value="prenextweek">
                Pre
              </TabsTrigger>
              <TabsTrigger value="nextweek">
                Next
              </TabsTrigger>
              <TabsTrigger value="weekly">
                This
              </TabsTrigger>
              <TabsTrigger value="pastweek">
                Past
              </TabsTrigger>
              <TabsTrigger value="all">
                All
              </TabsTrigger>
              <TabsTrigger value="registrations">
                Reg
              </TabsTrigger>
              <TabsTrigger value="winnercontent">
                Win
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="space-y-4">
              <div className="mb-6">
                {/* Compact stats line */}
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="text-xs">
                      votes: {filteredWeeklyParticipants.reduce((sum, p) => sum + (p.total_votes || 0), 0)}, 
                      likes: {dailyStats.reduce((sum, stat) => sum + (stat.like_count || 0), 0)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {dailyStats.map((stat, index) => (
                        <div key={index} className="text-center p-1 bg-background rounded">
                          <div className="font-medium text-xs">{stat.day_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {stat.vote_count}-{stat.like_count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Select value={adminStatusFilter} onValueChange={(value) => {
                  setAdminStatusFilter(value);
                  setParticipantCurrentPage(1);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-popover border shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pre next week">Pre Next Week</SelectItem>
                    <SelectItem value="next week">Next Week</SelectItem>
                    <SelectItem value="next week on site">Next Week On Site</SelectItem>
                    <SelectItem value="this week">This Week</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(() => {
                if (filteredWeeklyParticipants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-lg">
                        {adminStatusFilter === 'pending' 
                          ? 'No pending applications found' 
                          : adminStatusFilter === 'rejected'
                          ? 'No rejected applications found'
                          : 'No weekly contest participants found'}
                      </p>
                    </div>
                  );
                }

                // Calculate pagination for weekly participants
                const totalParticipants = filteredWeeklyParticipants.length;
                const totalParticipantPages = Math.ceil(totalParticipants / itemsPerPage);
                const participantStartIndex = (participantCurrentPage - 1) * itemsPerPage;
                const participantEndIndex = participantStartIndex + itemsPerPage;
                const paginatedParticipants = filteredWeeklyParticipants.slice(participantStartIndex, participantEndIndex);

                return (
                  <>
                    {paginatedParticipants.map((participant) => {
                  const participantProfile = profiles.find(p => p.id === participant.user_id);
                  const appData = participant.application_data || {};
                  
                  return (
                    <Card key={participant.id} className="overflow-hidden relative h-[149px]">
                      <CardContent className="p-0">
                        {/* Desktop layout */}
                        <div className="hidden md:flex">
                          {/* Photos section - 2 columns */}
                          <div className="flex gap-px w-[25ch] flex-shrink-0">
                            {(participantProfile?.photo_1_url || appData.photo1_url) && (
                              <div className="w-1/2">
                                <img 
                                  src={participantProfile?.photo_1_url || appData.photo1_url} 
                                  alt="Portrait" 
                                  className="w-full h-[149px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 0, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              </div>
                            )}
                            {(participantProfile?.photo_2_url || appData.photo2_url) && (
                              <div className="w-1/2 relative">
                                <img 
                                  src={participantProfile?.photo_2_url || appData.photo2_url} 
                                  alt="Full length" 
                                  className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 1, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                                {/* User avatar positioned in top right corner */}
                                <div className="absolute top-2 right-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                                    <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || participantProfile?.avatar_url || ''} />
                                    <AvatarFallback className="text-xs">
                                      {(participantProfile?.first_name || appData.first_name)?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Main info section */}
                          <div className="w-[50ch] flex-shrink-0 flex-1 min-w-0 p-4">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-xs font-semibold whitespace-nowrap">
                                 {new Date().getFullYear() - (appData.birth_year || new Date().getFullYear() - (participantProfile?.age || 25))} {participantProfile?.first_name || appData.first_name} {participantProfile?.last_name || appData.last_name}
                               </span>
                               {/* Статус участника с деталями */}
                               {(() => {
                                 const currentStatus = participant.admin_status || 'pending';
                                 const statusInfo = participant.status_history && 
                                   Object.entries(participant.status_history).find(([status]) => status === currentStatus);
                                 
                                 const statusDate = statusInfo && statusInfo[1] && (statusInfo[1] as any)?.changed_at ? 
                                   new Date((statusInfo[1] as any).changed_at).toLocaleDateString('ru-RU', {
                                     day: '2-digit', 
                                     month: 'short'
                                   }) : '';
                                   
                                 const weekInterval = statusInfo && statusInfo[1] && (statusInfo[1] as any)?.changed_at ? 
                                   getStrictWeekInterval(new Date((statusInfo[1] as any).changed_at), 'PH').formatted : '';
                                 
                                 return (
                                   <div className={`px-2 py-1 rounded text-xs font-medium ${
                                     currentStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                     currentStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                     currentStatus === 'this week' ? 'bg-blue-100 text-blue-700' :
                                     currentStatus === 'next week' ? 'bg-purple-100 text-purple-700' :
                                     currentStatus === 'past' ? 'bg-gray-100 text-gray-700' :
                                     'bg-yellow-100 text-yellow-700'
                                   }`}>
                                     {currentStatus.toUpperCase()}
                                     {statusDate && <div className="text-xs opacity-80">📅 {statusDate}</div>}
                                     {weekInterval && <div className="text-xs opacity-80">📊 {weekInterval}</div>}
                                   </div>
                                 );
                               })()}
                             </div>
                            
                            <div 
                              className="text-xs text-muted-foreground mb-1"
                            >
                              {participantProfile?.city || appData.city} {participantProfile?.country || appData.country}
                            </div>
                            
                            {/* Always show full information - like mobile version */}
                            <div className="text-xs text-muted-foreground mb-1 space-y-0 leading-none">
                              <div>{(participantProfile?.weight_kg || appData.weight_kg)}kg, {(participantProfile?.height_cm || appData.height_cm)}cm</div>
                              <div>{participantProfile?.marital_status || appData.marital_status}, {(participantProfile?.has_children || appData.has_children) ? 'Has kids' : 'No kids'}</div>
                              <div className="flex items-center gap-1">
                                <span>
                                  {participantProfile?.email 
                                    ? (participantProfile.email.length > 7 ? `${participantProfile.email.substring(0, 7)}...` : participantProfile.email)
                                    : 'No email'
                                  }
                                </span>
                                {participantProfile?.email && (
                                  <Copy 
                                    className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                    onClick={() => navigator.clipboard.writeText(participantProfile.email)}
                                  />
                                )}
                              </div>
                               <div 
                                 className="text-lg font-bold text-blue-600 cursor-pointer hover:text-blue-700"
                                 onClick={() => {
                                   setSelectedParticipantForVoters({
                                     id: participant.id,
                                     name: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`
                                   });
                                   setVotersModalOpen(true);
                                 }}
                               >
                                {participant.total_votes || 0} • ★ {(participant.average_rating || 0).toFixed(1)}
                                </div>
                             </div>
                            
                            <div className="flex-1"></div>
                          </div>

                            {/* Right side actions */}
                          <div className="w-[20ch] flex-shrink-0 p-4 flex flex-col gap-2">
                            {/* Edit button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="p-1 h-6 w-6"
                              onClick={() => {
                                setEditingParticipantData(participant);
                                setShowEditModal(true);
                              }}
                              title="Edit Application"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                             <div className="flex items-center gap-1">
                             <Select 
                                value={participant.admin_status || 'this week'}
                               onValueChange={(value) => {
                                 if (value === 'reject') {
                                   // Open reject modal for this participant
                                   setApplicationToReject({
                                     id: participant.id,
                                     name: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`
                                   });
                                   setRejectModalOpen(true);
                                   return;
                                 }
                                 
                                   // Update the database with the new admin_status directly
                                    const updateStatus = async () => {
                                      const result = await updateParticipantStatusWithHistory(
                                        participant.id,
                                        value as ParticipantStatus,
                                        `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`
                                      );

                                      if (!result.success) {
                                        toast({
                                          title: "Error",
                                          description: "Failed to update participant status",
                                          variant: "destructive"
                                        });
                                        // Error occurred, data will be refreshed from DB
                                      } else {
                                        // Successfully updated - refresh data from server
                                        fetchWeeklyParticipants();
                                      }
                                    };

                                   updateStatus();
                               }}
                             >
                                     <SelectTrigger className={`w-28 h-6 text-xs ${getStatusBackgroundColor(participant.admin_status || 'this week')}`}>
                                       <SelectValue />
                                </SelectTrigger>
                                          <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                             <SelectItem value="pending">Pending</SelectItem>
                                             <SelectItem value="approved">Approved</SelectItem>
                                             <SelectItem value="rejected">Rejected</SelectItem>
                                             <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                             <SelectItem value="this week">This Week</SelectItem>
                                             <SelectItem value="next week">Next Week</SelectItem>
                                             <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                             <SelectItem value="past">Past</SelectItem>
                                          </SelectContent>
                              </Select>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 h-6 w-6 hover:bg-accent"
                                onClick={() => {
                                  setSelectedStatusHistory({
                                    participantId: participant.id,
                                    participantName: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`,
                                    statusHistory: participant.status_history
                                  });
                                  setStatusHistoryModalOpen(true);
                                }}
                                title="View Status History"
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {/* Status change date with reviewer login - desktop */}
                            <div 
                              className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                              onClick={() => {
                                setSelectedParticipantForVoters({
                                  id: participant.id,
                                  name: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`
                                });
                                setVotersModalOpen(true);
                              }}
                            >
                              {`${(participant.average_rating || 0).toFixed(1)} (${participant.total_votes || 0})`}
                            </div>
                          </div>
                        </div>

                        {/* Mobile layout - horizontal with full width */}
                        <div className="md:hidden">
                          <div className="flex w-full">
                            {/* Photos section - left side */}
                            <div className="flex gap-px w-[50vw] flex-shrink-0">
                              {(participantProfile?.photo_1_url || appData.photo1_url) && (
                                <div className="w-1/2">
                                  <img 
                                    src={participantProfile?.photo_1_url || appData.photo1_url} 
                                    alt="Portrait" 
                                    className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => openPhotoModal([
                                      participantProfile?.photo_1_url || appData.photo1_url, 
                                      participantProfile?.photo_2_url || appData.photo2_url
                                    ].filter(Boolean), 0, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                  />
                                </div>
                              )}
                              {(participantProfile?.photo_2_url || appData.photo2_url) && (
                                <div className="w-1/2 relative">
                                  <img 
                                    src={participantProfile?.photo_2_url || appData.photo2_url} 
                                    alt="Full length" 
                                    className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => openPhotoModal([
                                      participantProfile?.photo_1_url || appData.photo1_url, 
                                      participantProfile?.photo_2_url || appData.photo2_url
                                    ].filter(Boolean), 1, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                  />
                                  {/* User avatar positioned in top right corner */}
                                  <div className="absolute top-2 right-2">
                                    <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                                      <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || participantProfile?.avatar_url || ''} />
                                      <AvatarFallback className="text-xs">
                                        {(participantProfile?.first_name || appData.first_name)?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Information section - right side */}
                            <div className="w-[50vw] flex-shrink-0 pl-2 flex flex-col h-48 relative">
                              <div className="flex items-center gap-2 mb-1 mt-1">
                                <span className="text-xs font-semibold whitespace-nowrap">
                                  {new Date().getFullYear() - (appData.birth_year || new Date().getFullYear() - (participantProfile?.age || 25))} {participantProfile?.first_name || appData.first_name} {participantProfile?.last_name || appData.last_name}
                                </span>
                              </div>
                              
                              <div 
                                className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => {
                                  const newExpanded = new Set(expandedMobileItems);
                                  if (expandedMobileItems.has(participant.id)) {
                                    newExpanded.delete(participant.id);
                                  } else {
                                    newExpanded.add(participant.id);
                                  }
                                  setExpandedMobileItems(newExpanded);
                                }}
                              >
                                {participantProfile?.city || appData.city} {participantProfile?.country || appData.country}
                              </div>
                              
                              {/* Expanded information */}
                              {expandedMobileItems.has(participant.id) && (
                                <div className="text-xs text-muted-foreground mb-1 space-y-0 leading-none">
                                  <div>{(participantProfile?.weight_kg || appData.weight_kg)}kg, {(participantProfile?.height_cm || appData.height_cm)}cm</div>
                                  <div>{participantProfile?.marital_status || appData.marital_status}, {(participantProfile?.has_children || appData.has_children) ? 'Has kids' : 'No kids'}</div>
                                  <div className="flex items-center gap-1">
                                    <span>
                                      {participantProfile?.email 
                                        ? (participantProfile.email.length > 7 ? `${participantProfile.email.substring(0, 7)}...` : participantProfile.email)
                                        : 'No email'
                                      }
                                    </span>
                                    {participantProfile?.email && (
                                      <Copy 
                                        className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                        onClick={() => navigator.clipboard.writeText(participantProfile.email)}
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex-1"></div>
                              
                              {/* Status filter positioned at bottom */}
                              <div className="absolute bottom-12 right-0 flex items-center gap-1">
                                  <Select 
                                    value={participant.admin_status || 'this week'}
                                    onValueChange={(value) => {
                                     if (value === 'reject') {
                                       // Open reject modal for this participant
                                       setApplicationToReject({
                                         id: participant.id,
                                         name: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`
                                       });
                                       setRejectModalOpen(true);
                                       return;
                                     }
                                     
                                       // Update the database with the new admin_status directly
                                        const updateStatus = async () => {
                                          const result = await updateParticipantStatusWithHistory(
                                            participant.id,
                                            value as ParticipantStatus,
                                            `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`
                                          );

                                          if (!result.success) {
                                            toast({
                                              title: "Error",
                                              description: "Failed to update participant status",
                                              variant: "destructive"
                                            });
                                            // Error occurred, data will be refreshed from DB
                                          } else {
                                            // Successfully updated - refresh data from server
                                            fetchWeeklyParticipants();
                                          }
                                        };

                                      updateStatus();
                                   }}
                                 >
                                   <SelectTrigger className="w-24 h-7 text-xs">
                                     <SelectValue />
                                   </SelectTrigger>
                                                <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                                   <SelectItem value="pending">Pending</SelectItem>
                                                   <SelectItem value="approved">Approved</SelectItem>
                                                   <SelectItem value="rejected">Rejected</SelectItem>
                                                   <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                                   <SelectItem value="this week">This Week</SelectItem>
                                                   <SelectItem value="next week">Next Week</SelectItem>
                                                   <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                                   <SelectItem value="past">Past</SelectItem>
                                               </SelectContent>
                                  </Select>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-0 h-7 w-7 hover:bg-accent"
                                    onClick={() => {
                                      setSelectedStatusHistory({
                                        participantId: participant.id,
                                        participantName: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`,
                                        statusHistory: participant.status_history
                                      });
                                      setStatusHistoryModalOpen(true);
                                    }}
                                    title="View Status History"
                                  >
                                    <Info className="w-4 h-4" />
                                  </Button>
                                 
                                 {/* Rating with votes */}
                                <div 
                                  className="text-xs text-muted-foreground -mt-[5px] cursor-pointer hover:text-foreground"
                                  onClick={() => {
                                    setSelectedParticipantForVoters({
                                      id: participant.id,
                                      name: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`
                                    });
                                    setVotersModalOpen(true);
                                  }}
                                >
                                  {`${(participant.average_rating || 0).toFixed(1)} (${participant.total_votes || 0})`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {/* Pagination for participants */}
                {totalParticipantPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setParticipantCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={participantCurrentPage === 1}
                    >
                      Предыдущая
                    </Button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: totalParticipantPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === participantCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setParticipantCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setParticipantCurrentPage(prev => Math.min(prev + 1, totalParticipantPages))}
                      disabled={participantCurrentPage === totalParticipantPages}
                    >
                      Следующая
                    </Button>
                  </div>
                )}
                </>
              );
              })()}
            </TabsContent>

            <TabsContent value="prenextweek" className="space-y-4">
              <div className="mb-6">
                {/* Фильтр по admin_status */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Admin Status Filter:</Label>
                  <Select value={preStatusFilter} onValueChange={setPreStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pre next week">Pre Next Week</SelectItem>
                      <SelectItem value="next week">Next Week</SelectItem>
                      <SelectItem value="next week on site">Next Week On Site</SelectItem>
                      <SelectItem value="this week">This Week</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Фильтр по неделям для pre next week */}
                <div className="mb-4 flex gap-4">
                  <Select value={preNextWeekFilter} onValueChange={setPreNextWeekFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All weeks</SelectItem>
                      {/* Динамические недели на основе данных */}
                      {Array.from(new Set(preNextWeekParticipants.map(p => p.week_interval))).map(interval => (
                        <SelectItem key={interval} value={interval}>{interval}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h2 className="text-xl font-semibold">Pre Next Week Participants</h2>
                  <p className="text-muted-foreground">Participants queued for upcoming weeks</p>
                </div>
              </div>
              
              {(() => {
                // Фильтруем участников по admin_status и неделе
                const filteredParticipants = preNextWeekParticipants.filter(p => {
                  const statusMatch = preStatusFilter === 'all' || p.admin_status === preStatusFilter;
                  const weekMatch = preNextWeekFilter === 'all' || p.week_interval === preNextWeekFilter;
                  return statusMatch && weekMatch;
                });
                
                if (filteredParticipants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      No participants found for selected week filter
                    </div>
                  );
                }
                
                return filteredParticipants.map((participant) => {
                  const participantProfile = profiles.find(p => p.id === participant.user_id);
                  const appData = participant.application_data || {};
                  
                  return (
                    <Card key={participant.participant_id} className="overflow-hidden relative h-[149px]">
                      <CardContent className="p-0">
                        {/* Desktop layout */}
                        <div className="hidden md:flex">
                          {/* Photos section - 2 columns */}
                          <div className="flex gap-px w-[25ch] flex-shrink-0">
                            {(participantProfile?.photo_1_url || appData.photo1_url) && (
                              <div className="w-1/2">
                                <img 
                                  src={participantProfile?.photo_1_url || appData.photo1_url} 
                                  alt="Portrait" 
                                  className="w-full h-[149px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 0, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              </div>
                            )}
                            {(participantProfile?.photo_2_url || appData.photo2_url) && (
                              <div className="w-1/2 relative">
                                <img 
                                  src={participantProfile?.photo_2_url || appData.photo2_url} 
                                  alt="Full length" 
                                  className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 1, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                                <div className="absolute top-2 right-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                                    <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || participantProfile?.avatar_url || ''} />
                                    <AvatarFallback className="text-xs">
                                      {(participantProfile?.first_name || appData.first_name)?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Content section */}
                          <div className="flex-1 p-3 flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="space-y-1">
                                  <h3 className="font-semibold text-sm truncate">
                                    {participantProfile?.display_name || `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` || 'Unnamed participant'}
                                  </h3>
                                  
                                  <div className="text-xs text-muted-foreground space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span>{participant.age || 'Unknown'} лет</span>
                                      <span>•</span>
                                      <span>{participant.city || 'Unknown'}, {participant.country || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>{participant.height_cm || 'Unknown'}см</span>
                                      <span>•</span>
                                      <span>{participant.weight_kg || 'Unknown'}кг</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        Week: {participant.week_interval}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Status controls */}
                              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                <Select 
                                  value={participant.admin_status || 'pre next week'}
                                  onValueChange={async (value) => {
                                    try {
                                      if (!participant.participant_id) {
                                        toast({
                                          title: "Error",
                                          description: "No participant ID found",
                                          variant: "destructive",
                                        });
                                        return;
                                      }

                                      const participantName = participant.display_name || 
                                        `${participant.first_name || 'Unknown'} ${participant.last_name || ''}`;
                                      
                                      const result = await updateParticipantStatusWithHistory(
                                        participant.participant_id,
                                        value as ParticipantStatus,
                                        participantName
                                      );

                                      if (!result.success) {
                                        toast({
                                          title: "Error",
                                          description: "Failed to update participant status",
                                          variant: "destructive",
                                        });
                                      } else {
                                        await fetchPreNextWeekParticipants();
                                        toast({
                                          title: "Success",
                                          description: "Participant status updated successfully",
                                        });
                                      }
                                    } catch (error) {
                                      console.error('Error updating participant status:', error);
                                      toast({
                                        title: "Error",
                                        description: "An unexpected error occurred",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pre next week')}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                       <SelectItem value="pending">Pending</SelectItem>
                                       <SelectItem value="approved">Approved</SelectItem>
                                       <SelectItem value="rejected">Rejected</SelectItem>
                                       <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                       <SelectItem value="this week">This Week</SelectItem>
                                       <SelectItem value="next week">Next Week</SelectItem>
                                       <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                       <SelectItem value="past">Past</SelectItem>
                                     </SelectContent>
                                </Select>
                                <Button 
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    setSelectedStatusHistory({
                                      participantId: participant.participant_id,
                                      participantName: participant.display_name || `${participant.first_name} ${participant.last_name}`,
                                      statusHistory: participant.status_history
                                    });
                                    setStatusHistoryModalOpen(true);
                                  }}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile layout */}
                        <div className="md:hidden flex flex-col h-full">
                          <div className="flex-1 p-3 flex gap-3">
                            <div className="flex flex-col gap-1 w-20 flex-shrink-0">
                              {(participantProfile?.photo_1_url || appData.photo1_url) && (
                                <img 
                                  src={participantProfile?.photo_1_url || appData.photo1_url} 
                                  alt="Portrait" 
                                  className="w-full h-16 object-cover rounded cursor-pointer"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 0, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              )}
                              {(participantProfile?.photo_2_url || appData.photo2_url) && (
                                <img 
                                  src={participantProfile?.photo_2_url || appData.photo2_url} 
                                  alt="Full length" 
                                  className="w-full h-16 object-cover rounded cursor-pointer"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 1, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <h3 className="font-semibold text-sm truncate mb-1">
                                  {participantProfile?.display_name || `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` || 'Unnamed'}
                                </h3>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  <div>{participant.age || 'Unknown'} лет</div>
                                  <div>{participant.city || 'Unknown'}, {participant.country || 'Unknown'}</div>
                                  <div>{participant.height_cm || 'Unknown'}см, {participant.weight_kg || 'Unknown'}кг</div>
                                  <Badge variant="outline" className="text-xs px-1 py-0 mt-1">
                                    Week: {participant.week_interval}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                <Select 
                                  value={participant.admin_status || 'pre next week'} 
                                  onValueChange={async (value) => {
                                    const participantName = participantProfile?.display_name || 
                                      `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`;
                                    
                                    const result = await updateParticipantStatusWithHistory(
                                      participant.participant_id,
                                      value as ParticipantStatus,
                                      participantName
                                    );

                                    if (!result.success) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to update participant status",
                                        variant: "destructive",
                                      });
                                    } else {
                                      await fetchPreNextWeekParticipants();
                                      toast({
                                        title: "Success",
                                        description: "Participant status updated successfully",
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pre next week')}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                     <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                       <SelectItem value="pending">Pending</SelectItem>
                                       <SelectItem value="approved">Approved</SelectItem>
                                       <SelectItem value="rejected">Rejected</SelectItem>
                                       <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                       <SelectItem value="this week">This Week</SelectItem>
                                       <SelectItem value="next week">Next Week</SelectItem>
                                       <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                       <SelectItem value="past">Past</SelectItem>
                                     </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </TabsContent>

            <TabsContent value="nextweek" className="space-y-4">
              <div className="mb-6">
                {/* Фильтр по admin_status */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Admin Status Filter:</Label>
                  <Select value={nextStatusFilter} onValueChange={setNextStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pre next week">Pre Next Week</SelectItem>
                      <SelectItem value="next week">Next Week</SelectItem>
                      <SelectItem value="next week on site">Next Week On Site</SelectItem>
                      <SelectItem value="this week">This Week</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Фильтр по неделям для next week */}
                <div className="mb-4 flex gap-4">
                  <Select value={nextWeekFilter} onValueChange={setNextWeekFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All weeks</SelectItem>
                      <SelectItem value="current">Current week only</SelectItem>
                      {/* Динамические недели на основе данных */}
                      {Array.from(new Set(nextWeekParticipants.map(p => p.week_interval))).map(interval => (
                        <SelectItem key={interval} value={interval}>{interval}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stats for next week */}
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between items-center">
                      <span>likes: {nextWeekDailyStats.reduce((sum, day) => sum + day.like_count, 0)}, dislikes: {nextWeekDailyStats.reduce((sum, day) => sum + day.dislike_count, 0)}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {nextWeekDailyStats.map((day) => (
                        <div key={day.day_name} className="bg-background p-2 rounded text-center">
                          <div className="font-medium">{day.day_name}</div>
                          <div>
                            <span className="text-green-600">{day.like_count}</span>
                            <span>-</span>
                            <span className="text-red-600">{day.dislike_count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold">Next Week Participants</h2>
                  <p className="text-muted-foreground">Participants scheduled for next week's contest</p>
                </div>
              </div>
              
              {(() => {
                // Фильтруем участников по admin_status и неделе
                const filteredParticipants = nextWeekParticipants.filter(p => {
                  const statusMatch = nextStatusFilter === 'all' || p.admin_status === nextStatusFilter;
                  let weekMatch = true;
                  if (nextWeekFilter === 'all') {
                    weekMatch = true;
                  } else if (nextWeekFilter === 'current') {
                    // Показываем только текущую неделю
                    const currentWeekStart = new Date();
                    const currentDay = currentWeekStart.getDay();
                    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
                    currentWeekStart.setDate(currentWeekStart.getDate() + mondayOffset);
                    weekMatch = p.status_assigned_date >= currentWeekStart.toISOString().split('T')[0];
                  } else {
                    weekMatch = p.week_interval === nextWeekFilter;
                  }
                  return statusMatch && weekMatch;
                });
                
                if (filteredParticipants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      No participants found for selected week filter
                    </div>
                  );
                }
                
                return filteredParticipants.map((participant) => {
                  const participantProfile = profiles.find(p => p.id === participant.user_id);
                  const appData = participant.application_data || {};
                  
                  return (
                    <Card key={participant.participant_id} className="overflow-hidden relative h-[149px]">
                      <CardContent className="p-0">
                        {/* Desktop layout */}
                        <div className="hidden md:flex">
                          {/* Photos section - 2 columns */}
                          <div className="flex gap-px w-[25ch] flex-shrink-0">
                            {(participantProfile?.photo_1_url || appData.photo1_url) && (
                              <div className="w-1/2">
                                <img 
                                  src={participantProfile?.photo_1_url || appData.photo1_url} 
                                  alt="Portrait" 
                                  className="w-full h-[149px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 0, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              </div>
                            )}
                            {(participantProfile?.photo_2_url || appData.photo2_url) && (
                              <div className="w-1/2 relative">
                                <img 
                                  src={participantProfile?.photo_2_url || appData.photo2_url} 
                                  alt="Full length" 
                                  className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 1, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                                {/* User avatar positioned in top right corner */}
                                <div className="absolute top-2 right-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                                    <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || participantProfile?.avatar_url || ''} />
                                    <AvatarFallback className="text-xs">
                                      {(participantProfile?.first_name || appData.first_name)?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Content section - takes remaining space */}
                          <div className="flex-1 p-3 flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                {/* Name and basic info */}
                                <div className="space-y-1">
                                  <h3 className="font-semibold text-sm truncate">
                                    {participantProfile?.display_name || `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` || 'Unnamed participant'}
                                  </h3>
                                  
                                   {/* Basic details row */}
                                   <div className="text-xs text-muted-foreground space-y-0.5">
                                     <div className="flex items-center gap-2 flex-wrap">
                                       <span>{participant.age || 'Unknown'} лет</span>
                                       <span>•</span>
                                       <span>{participant.city || 'Unknown'}, {participant.country || 'Unknown'}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <span>{participant.height_cm || 'Unknown'}см</span>
                                       <span>•</span>
                                       <span>{participant.weight_kg || 'Unknown'}кг</span>
                                     </div>
                                      {/* Интервал недели */}
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs px-1 py-0">
                                          Week: {participant.week_interval}
                                        </Badge>
                                      </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Status controls */}
                               <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                    <Select 
                                      value={participant.admin_status || 'next week'}
                                      onValueChange={async (value) => {
                                        try {
                                          if (!participant.participant_id) {
                                            console.error('participant.participant_id is falsy:', participant.participant_id);
                                            toast({
                                              title: "Error",
                                              description: "No participant ID found",
                                              variant: "destructive",
                                            });
                                            return;
                                          }

                                          const participantName = participant.display_name || 
                                            `${participant.first_name || 'Unknown'} ${participant.last_name || ''}`;
                                          
                                          const result = await updateParticipantStatusWithHistory(
                                            participant.participant_id,
                                            value as ParticipantStatus,
                                            participantName
                                          );

                                          if (!result.success) {
                                            toast({
                                              title: "Error",
                                              description: "Failed to update participant status",
                                              variant: "destructive",
                                            });
                                          } else {
                                            await fetchNextWeekParticipants();
                                            toast({
                                              title: "Success",
                                              description: "Participant status updated successfully",
                                            });
                                          }
                                        } catch (error) {
                                          console.error('Error updating participant status:', error);
                                          toast({
                                            title: "Error",
                                            description: "An unexpected error occurred",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                >
                                   <SelectTrigger className={`w-24 h-7 text-xs ${getStatusBackgroundColor(participant.admin_status || 'next week')}`}>
                                     <SelectValue />
                                  </SelectTrigger>
                                           <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                               <SelectItem value="pending">Pending</SelectItem>
                                               <SelectItem value="approved">Approved</SelectItem>
                                               <SelectItem value="rejected">Rejected</SelectItem>
                                               <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                               <SelectItem value="this week">This Week</SelectItem>
                                               <SelectItem value="next week">Next Week</SelectItem>
                                               <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                               <SelectItem value="past">Past</SelectItem>
                                           </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                              {/* Bottom row - Like/dislike counts only */}
                              <div className="flex items-center justify-between mt-auto pt-2">
                                <div className="text-xs text-muted-foreground flex items-center gap-3">
                                  <button
                                    className="flex items-center gap-1 text-green-600 hover:underline cursor-pointer"
                                    onClick={() => {
                                      const participantName = participantProfile?.display_name || `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` || 'Unnamed';
                                      console.log('Opening NextWeekVotersModal for likes:', participantName);
                                      setSelectedParticipantForNextWeekVoters(participantName);
                                      setNextWeekVotersModalOpen(true);
                                    }}
                                  >
                                    <span className="font-medium">{participant.like_count || 0}</span>
                                  </button>
                                  <button
                                    className="flex items-center gap-1 text-red-600 hover:underline cursor-pointer"
                                    onClick={() => {
                                      const participantName = participantProfile?.display_name || `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` || 'Unnamed';
                                      console.log('Opening NextWeekVotersModal for dislikes:', participantName);
                                      setSelectedParticipantForNextWeekVoters(participantName);
                                      setNextWeekVotersModalOpen(true);
                                    }}
                                  >
                                    <span className="font-medium">{participant.dislike_count || 0}</span>
                                  </button>
                                </div>
                              </div>
                          </div>
                        </div>
                        
                        {/* Mobile layout */}
                        <div className="md:hidden flex">
                          {/* Photos section - compact */}
                          <div className="flex gap-px w-[20ch] flex-shrink-0">
                            {(participantProfile?.photo_1_url || appData.photo1_url) && (
                              <div className="w-1/2">
                                <img 
                                  src={participantProfile?.photo_1_url || appData.photo1_url} 
                                  alt="Portrait" 
                                  className="w-full h-[149px] object-contain cursor-pointer"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 0, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              </div>
                            )}
                            {(participantProfile?.photo_2_url || appData.photo2_url) && (
                              <div className="w-1/2 relative">
                                <img 
                                  src={participantProfile?.photo_2_url || appData.photo2_url} 
                                  alt="Full length" 
                                  className="w-full h-[149px] object-cover cursor-pointer"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 1, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                                <div className="absolute top-2 right-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                                    <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || participantProfile?.avatar_url || ''} />
                                    <AvatarFallback className="text-xs">
                                      {(participantProfile?.first_name || appData.first_name)?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Content - mobile */}
                          <div className="flex-1 p-2 text-xs space-y-1">
                            <div className="font-medium truncate">
                              {participantProfile?.display_name || `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` || 'Unnamed'}
                            </div>
                            <div className="text-muted-foreground space-y-0.5">
                              <div>{participantProfile?.age || appData.age}л, {participantProfile?.city || appData.city}</div>
                              <div>{participantProfile?.height_cm || appData.height_cm}см, {participantProfile?.weight_kg || appData.weight_kg}кг</div>
                            </div>
                              <div className="flex items-center justify-between pt-1">
                                <div className="text-muted-foreground flex items-center gap-2">
                                  <button
                                    className="flex items-center gap-1 text-green-600 hover:underline cursor-pointer"
                                    onClick={() => {
                                      const participantName = participantProfile?.display_name || `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` || 'Unnamed';
                                      console.log('Opening NextWeekVotersModal for likes (mobile):', participantName);
                                      setSelectedParticipantForNextWeekVoters(participantName);
                                      setNextWeekVotersModalOpen(true);
                                    }}
                                  >
                                    <span className="font-medium">{participant.like_count || 0}</span>
                                  </button>
                                  <button
                                    className="flex items-center gap-1 text-red-600 hover:underline cursor-pointer"
                                    onClick={() => {
                                      const participantName = participantProfile?.display_name || `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` || 'Unnamed';
                                      console.log('Opening NextWeekVotersModal for dislikes (mobile):', participantName);
                                      setSelectedParticipantForNextWeekVoters(participantName);
                                      setNextWeekVotersModalOpen(true);
                                    }}
                                  >
                                    <span className="font-medium">{participant.dislike_count || 0}</span>
                                  </button>
                                </div>
                                <Select 
                                 value={participant.admin_status || 'next week on site'} 
                                 onValueChange={async (value) => {
                                    const participantName = participantProfile?.display_name || 
                                      `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`;
                                    
                                    const result = await updateParticipantStatusWithHistory(
                                      participant.id,
                                      value as ParticipantStatus,
                                      participantName
                                    );

                                    if (!result.success) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to update participant status",
                                        variant: "destructive",
                                      });
                                    } else {
                                      await fetchWeeklyParticipants();
                                      toast({
                                        title: "Success",
                                        description: "Participant status updated successfully",
                                      });
                                    }
                                  }}
                              >
                                 <SelectTrigger className={`w-16 h-6 text-xs ${getStatusBackgroundColor(participant.admin_status || 'next week on site')}`}>
                                   <SelectValue />
                                </SelectTrigger>
                                         <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                             <SelectItem value="pending">Pending</SelectItem>
                                             <SelectItem value="approved">Approved</SelectItem>
                                             <SelectItem value="rejected">Rejected</SelectItem>
                                             <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                             <SelectItem value="this week">This Week</SelectItem>
                                             <SelectItem value="next week">Next Week</SelectItem>
                                             <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                             <SelectItem value="past">Past</SelectItem>
                                         </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </TabsContent>

            <TabsContent value="pastweek" className="space-y-4">
              <div className="mb-6">
                {/* Stats display - mobile and desktop */}
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    {/* Mobile stats - larger and bold with / separator */}
                    <div className="md:hidden text-base font-bold mb-2">
                      votes: {weeklyParticipants.filter(p => p.admin_status === 'past').reduce((sum, p) => sum + (p.total_votes || 0), 0)} / likes: {(() => {
                        // Calculate total likes for past participants
                        const pastParticipants = weeklyParticipants.filter(p => p.admin_status === 'past');
                        return pastParticipants.reduce((sum, p) => {
                          // If participant has status_history with like counts, sum them
                          const statusHistory = p.status_history || {};
                          let likeCount = 0;
                          Object.values(statusHistory).forEach((entry: any) => {
                            if (entry?.like_count) likeCount += entry.like_count;
                          });
                          return sum + likeCount;
                        }, 0);
                      })()}
                    </div>
                    
                    {/* Desktop stats - original style */}
                    <div className="hidden md:block text-xs">
                      votes: {weeklyParticipants.filter(p => p.admin_status === 'past').reduce((sum, p) => sum + (p.total_votes || 0), 0)}, 
                      likes: {(() => {
                        const pastParticipants = weeklyParticipants.filter(p => p.admin_status === 'past');
                        return pastParticipants.reduce((sum, p) => {
                          const statusHistory = p.status_history || {};
                          let likeCount = 0;
                          Object.values(statusHistory).forEach((entry: any) => {
                            if (entry?.like_count) likeCount += entry.like_count;
                          });
                          return sum + likeCount;
                        }, 0);
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Фильтр по admin_status */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Admin Status Filter:</Label>
                  <Select value={pastStatusFilter} onValueChange={setPastStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select admin status" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pre next week">Pre Next Week</SelectItem>
                      <SelectItem value="next week">Next Week</SelectItem>
                      <SelectItem value="next week on site">Next Week On Site</SelectItem>
                      <SelectItem value="this week">This Week</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold">Past Week Participants</h2>
                  <p className="text-muted-foreground">Участники из прошлых недель с правильными статусами</p>
                </div>
                
                {/* Past week filter */}
                <div className="mt-4 space-y-4">
                  {/* Фильтр по статусу/неделям */}
                  {(() => {
                    // Get dynamic filters based on available data - использукм мемоизированный результат
                    const dynamicFilters = getDynamicPastWeekFilters;
                    
                    // Calculate participant counts for each filter
                    const filterCounts = dynamicFilters.map(filter => {
                      if (filter.id === 'all') {
                        const count = weeklyParticipants.filter(p => p.admin_status === 'past').length;
                        return { ...filter, count };
                      }
                      
                      const count = weeklyParticipants.filter(p => 
                        p.admin_status === 'past' && p.week_interval === filter.weekInterval
                      ).length;
                      return { ...filter, count };
                    });
                    
                    return (
                      <>
                        {/* Desktop filters */}
                        <div className="hidden md:flex gap-2 flex-wrap">
                          {filterCounts.map((filter) => {
                            // Extract the week label and date range
                            const match = filter.label.match(/^(.+?)\s*\((.+?)\)$/);
                            const weekLabel = match ? match[1] : filter.label;
                            const dateRange = match ? match[2] : null;
                            
                            return (
                              <div key={filter.id} className="flex items-center gap-1">
                                <Button
                                  variant={pastWeekFilter === filter.id ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setPastWeekFilter(filter.id)}
                                  className="gap-2"
                                >
                                  {weekLabel}
                                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                                    {filter.count}
                                  </Badge>
                                </Button>
                                {dateRange && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{dateRange}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            );
                          })}
                          <Button
                            variant={showAllCards ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setShowAllCards(!showAllCards);
                              setPastCurrentPage(1); // Reset pagination when toggling К button
                            }}
                            className="ml-2"
                          >
                            К
                          </Button>
                        </div>
                        
                        {/* Mobile filters */}
                         <div className="md:hidden grid grid-cols-2 gap-2">
                          {filterCounts.map((filter) => {
                            // Extract the week label and date range for mobile
                            const match = filter.mobileLabel.match(/^(.+?)\s*\((.+?)\)$/);
                            const weekLabel = match ? match[1] : filter.mobileLabel;
                            const dateRange = filter.weekInterval || (match ? match[2] : null);
                            
                            return (
                              <div key={filter.id} className="flex items-center gap-1">
                                <Button
                                  variant={pastWeekFilter === filter.id ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setPastWeekFilter(filter.id)}
                                  className="text-xs flex-1 gap-1"
                                >
                                  {weekLabel}
                                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                                    {filter.count}
                                  </Badge>
                                </Button>
                                {dateRange && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{dateRange}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            );
                          })}
                          <Button
                            variant={showAllCards ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setShowAllCards(!showAllCards);
                              setPastCurrentPage(1); // Reset pagination when toggling К button
                            }}
                            className="text-xs col-span-2"
                          >
                            К - Все карточки
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                  
                  {/* Фильтр по интервалам недель */}
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-2 block">Фильтр по интервалам недель:</Label>
                    <Select value={pastWeekIntervalFilter} onValueChange={setPastWeekIntervalFilter}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Выберите интервал недели" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-popover border shadow-lg">
                        <SelectItem value="all">Все интервалы</SelectItem>
                        {getAvailableWeekIntervals().map((interval) => (
                          <SelectItem key={interval.value} value={interval.value}>
                            {interval.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Winner Content Manager Button */}
                  <div className="border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Find winner from current filtered participants
                        const winner = pastWeekParticipants.find(p => p.final_rank === 1);
                        if (winner) {
                          const appData = winner.application_data || {};
                          setSelectedWinner({
                            participantId: winner.id,
                            userId: winner.user_id,
                            name: `${appData.first_name} ${appData.last_name}`
                          });
                          setShowWinnerContentModal(true);
                        } else {
                          toast({
                            title: "Победительница не найдена",
                            description: "В текущем фильтре нет победительницы",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="gap-2"
                    >
                      <Trophy className="h-4 w-4" />
                      Управление контентом победительницы
                    </Button>
                  </div>
                </div>
              </div>
              
              {(() => {
                // Debug: show all available admin statuses
                console.log('All admin statuses available:', 
                  [...new Set(weeklyParticipants.map(p => p.admin_status))]);
                
                // Declare participantsToShow outside conditional blocks
                let participantsToShow = [];
                
                // If "К" button is active, show ALL participants from the entire site
                if (showAllCards) {
                  const allParticipants = [...weeklyParticipants];
                  
                  // Also include all contest applications as participants
                  const applicationParticipants = contestApplications.map(app => {
                    const profile = profiles.find(p => p.id === app.user_id);
                    return {
                      id: `app-${app.id}`,
                      user_id: app.user_id,
                      application_data: app.application_data,
                      admin_status: app.admin_status,
                      participant_status: app.admin_status,
                      status_history: {},
                      status_week_history: {},
                      week_interval: getParticipantWeekInterval({ admin_status: app.admin_status }),
                      created_at: app.submitted_at,
                      contest_id: null,
                      final_rank: null,
                      total_votes: 0,
                      average_rating: 0,
                      is_active: app.deleted_at === null
                    };
                  });
                  
                  participantsToShow = [...allParticipants, ...applicationParticipants];
                  console.log('Showing ALL cards:', participantsToShow.length);
                } else {
                  // Use all weekly participants with 'past' status for filtering
                  // This ensures we get all past participants from database with their week_interval
                  participantsToShow = weeklyParticipants.filter(p => {
                    const status = p.admin_status || 'this week';
                    return status === 'past';
                  });
                  
                  console.log('Past participants to show:', participantsToShow.length);
                  console.log('Past participants with intervals:', participantsToShow.map(p => ({ 
                    name: `${p.application_data?.first_name} ${p.application_data?.last_name}`,
                    interval: p.week_interval 
                  })));
                }
                
                // Apply past week filter based on week intervals and admin_status
                const filteredByWeek = participantsToShow.filter(participant => {
                  // Фильтр по admin_status
                  const adminStatus = participant.admin_status || 'this week';
                  const statusMatch = pastStatusFilter === 'all' || adminStatus === pastStatusFilter;
                  
                  // When showAllCards is active, show all participants without filtering
                  if (showAllCards) {
                    return true;
                  }
                  
                  if (!statusMatch) return false;
                  
                  // When a specific interval is selected from dropdown, use it
                  if (pastWeekIntervalFilter !== 'all') {
                    const participantInterval = participant.week_interval || getParticipantWeekInterval(participant);
                    const hasCorrectInterval = participantInterval === pastWeekIntervalFilter;
                    return hasCorrectInterval && statusMatch;
                  }
                  
                  // When 'All Past Weeks' is selected, show all past participants
                  if (pastWeekFilter === 'all') {
                    return statusMatch;
                  }
                  
                  // For week-specific filters (1 week ago, 2 weeks ago, etc.)
                  const dynamicFilters = getDynamicPastWeekFilters;
                  const selectedFilter = dynamicFilters.find(f => f.id === pastWeekFilter);
                  
                  if (!selectedFilter?.weekInterval) {
                    return false;
                  }
                  
                  // Match participant's week_interval with the selected filter's weekInterval
                  const targetWeekInterval = selectedFilter.weekInterval;
                  const participantInterval = participant.week_interval || getParticipantWeekInterval(participant);
                  
                  // Return true if intervals match AND status is 'past'
                  return participantInterval === targetWeekInterval && adminStatus === 'past';
                });
                
                if (filteredByWeek.length === 0) {
                  return (
                     <div className="text-center py-8 text-muted-foreground">
                       <p className="text-lg">Нет участников для выбранного периода</p>
                        <p className="text-xs mt-2 text-muted-foreground/70">
                          Фильтр: {pastWeekFilter}, всего участников: {filteredByWeek.length}
                        </p>
                        <p className="text-xs mt-1 text-muted-foreground/70">
                          Участники со статусом 'past': {filteredByWeek.filter(p => (p.admin_status || participantFilters[p.id]) === 'past').length}
                        </p>
                     </div>
                  );
                }

                // Apply pagination for Past section when showAllCards is active
                const totalPastParticipants = filteredByWeek.length;
                const totalPastPages = Math.ceil(totalPastParticipants / itemsPerPage);
                const pastStartIndex = (pastCurrentPage - 1) * itemsPerPage;
                const pastEndIndex = pastStartIndex + itemsPerPage;
                const paginatedPastParticipants = showAllCards ? filteredByWeek.slice(pastStartIndex, pastEndIndex) : filteredByWeek;

                return (
                  <>
                    {paginatedPastParticipants.map((participant) => {
                  const participantProfile = profiles.find(p => p.id === participant.user_id);
                  const appData = participant.application_data || {};
                  
                  // Debug logs removed for performance
                  
                  return (
                    <Card key={participant.id} className="overflow-hidden relative mx-0 rounded-lg h-[149px]">
                      <CardContent className="p-0">
                        {/* Desktop layout */}
                        <div className="hidden md:flex md:overflow-visible">
                          {/* Column 1: Photos (25ch) */}
                          <div className="w-[25ch] flex-shrink-0 p-0">
                            <div className="flex gap-px">
                              {(participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url) && (
                                <div className="w-full">
                                  <img 
                                src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url}
                                    alt="Portrait"
                                    className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => openPhotoModal([
                                      participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                                      participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                                    ].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                  />
                                </div>
                              )}
                              {(participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url) && (
                                <div className="w-full">
                                  <img 
                                    src={participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url} 
                                    alt="Full length"
                                    className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => openPhotoModal([
                                      participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                                      participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                                    ].filter(Boolean), 1, `${appData.first_name} ${appData.last_name}`)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Column 2: Information (25ch) */}
                          <div className="w-[25ch] flex-shrink-0 p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url || participantProfile?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {appData.first_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                               <span className="text-sm font-semibold whitespace-nowrap flex items-center gap-1">
                                  {participant.final_rank === 1 && <span className="text-yellow-500">🏆</span>}
                                  {participant.final_rank > 1 && <span className="text-slate-500">🥈</span>}
                                  {appData.first_name} {appData.last_name} {appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : ''}
                                </span>
                            </div>
                            
                            <div 
                              className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors"
                              onClick={() => {
                                const newExpanded = new Set(expandedDesktopItems);
                                if (expandedDesktopItems.has(participant.id)) {
                                  newExpanded.delete(participant.id);
                                } else {
                                  newExpanded.add(participant.id);
                                }
                                setExpandedDesktopItems(newExpanded);
                              }}
                            >
                              {appData.city} {appData.state} {appData.country}
                            </div>
                            
                            {/* Expanded information - desktop */}
                            {expandedDesktopItems.has(participant.id) && (
                              <div className="text-xs text-muted-foreground mb-1">
                                {appData.weight_kg}kg • {appData.height_cm}cm • {appData.gender} • {appData.birth_year} • {appData.marital_status} • {appData.has_children ? 'Has children' : 'No children'}
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground mb-1">
                              {participantProfile?.email && (
                                <div className="flex items-center gap-1">
                                  <span 
                                    className="cursor-pointer" 
                                    title={participantProfile.email}
                                  >
                                    {participantProfile.email.length > 25 ? `${participantProfile.email.substring(0, 25)}...` : participantProfile.email}
                                  </span>
                                  <Copy 
                                    className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                    onClick={() => navigator.clipboard.writeText(participantProfile.email)}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Phone and Social Media */}
                            <div className="text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const phone = appData.phone?.country && appData.phone?.number 
                                    ? `${appData.phone.country} ${appData.phone.number}` 
                                    : 'Not provided';
                                  return <span>{phone}</span>;
                                })()}
                                {appData.facebook_url && (
                                  <a
                                    href={appData.facebook_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    FB
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                      
                          {/* Column 3: Status History (40ch) - горизонтальное отображение для past */}
                          <div className="w-[40ch] flex-shrink-0 p-2">
                            <div className="text-xs h-32 overflow-y-auto">
                              <div className="flex flex-wrap gap-2">
                                 {/* Show all statuses horizontally, sorted by changed_at (newest first) */}
                                 {participant.status_history && Object.keys(participant.status_history).length > 0 ? (
                                   (() => {
                                      // Valid admin_status values only
                                      const validAdminStatuses = ['this week', 'next week', 'next week on site', 'past'];
                                     
                                     // Sort all status entries by changed_at (newest first) and filter only valid admin statuses
                                     const sortedEntries = Object.entries(participant.status_history)
                                       .filter(([status, info]) => validAdminStatuses.includes(status) && info && status) // Only valid admin statuses
                                       .sort((a: any, b: any) => new Date(b[1]?.changed_at || 0).getTime() - new Date(a[1]?.changed_at || 0).getTime());
                                     
                                     // Group statuses by name to find previous occurrences
                                     const statusOccurrences = new Map<string, any[]>();
                                      sortedEntries.forEach(([status, info]) => {
                                        if (info && status) { // Добавляем проверку на null
                                          if (!statusOccurrences.has(status)) {
                                            statusOccurrences.set(status, []);
                                          }
                                          statusOccurrences.get(status)!.push(info);
                                        } // Закрываем проверку на null
                                      });
                                    
                                     return sortedEntries.map(([status, info]: [string, any], index: number) => {
                                       // Skip null or empty entries
                                       if (!info || !status) return null;
                                     
                                       // Формат даты и времени когда статус был поставлен
                                       const changedAt = info?.changed_at ? 
                                         new Date(info.changed_at).toLocaleDateString('ru-RU', {
                                           day: '2-digit',
                                           month: 'short',
                                           year: '2-digit',
                                           hour: '2-digit',
                                           minute: '2-digit'
                                         }).replace(',', '') : 
                                         '';

                                        // Получить правильный интервал недели (понедельник-воскресенье)
                                        const weekInterval = (() => {
                                          if (info?.changed_at) {
                                            const statusDate = new Date(info.changed_at);
                                            return getStrictWeekInterval(statusDate, 'PH').formatted;
                                          }
                                          return participant.week_interval || '29/09-05/10/25'; // Fallback на участника
                                        })();

                                       // Информация об админе который поставил статус
                                       const changedBy = info?.changed_by || info?.reviewed_by || '';
                                       const adminInfo = changedBy ? `👤${changedBy.slice(0, 8)}` : '';

                                       // Краткая причина изменения
                                       const changeReason = info?.change_reason ? 
                                         ` (${info.change_reason.slice(0, 20)}${info.change_reason.length > 20 ? '...' : ''})` : '';
                                       
                                       const isCurrentStatus = status === participant.admin_status;
                                       
                                        return (
                                          <div key={index} className={`inline-flex flex-col p-2 rounded-lg text-xs border mr-2 mb-2 ${
                                            isCurrentStatus ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium' : 
                                            'bg-gray-50 border-gray-200 text-gray-600'
                                          }`} style={{minWidth: '120px'}}>
                                            <div className="font-bold text-center mb-1">{status.toUpperCase()}</div>
                                            <div className="text-xs text-center space-y-1">
                                              <div>📅 {changedAt}</div>
                                              <div>📊 {weekInterval}</div>
                                              {adminInfo && <div>{adminInfo}</div>}
                                            </div>
                                          </div>
                                      );
                                     });
                                   })()
                                ) : (
                                  // Fallback for when there's no status_history but we have current status
                                  <div className="bg-yellow-100 p-1 rounded border text-xs font-medium text-gray-700 flex-shrink-0">
                                    {participant.admin_status} - {(() => {
                                      if (participant.week_interval) {
                                        return participant.week_interval;
                                      }
                                      return 'нет интервала';
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                           {/* Column 4: Voting stats and actions (20ch) */}
                           <div className="w-[20ch] flex-shrink-0 p-4 flex flex-col justify-between">
                             {/* Status and Week interval controls */}
                              <div className="text-xs text-muted-foreground mb-2 space-y-2">
                                {/* Status selector */}
                                <div>
                                  <div className="font-semibold mb-1">Status:</div>
                                   <Select 
                                     value={pendingPastChanges[participant.id]?.admin_status ?? participant.admin_status ?? 'past'}
                                     onValueChange={(newStatus) => {
                                       setPendingPastChanges(prev => ({
                                         ...prev,
                                         [participant.id]: {
                                           ...prev[participant.id],
                                           admin_status: newStatus
                                         }
                                       }));
                                     }}
                                  >
                                     <SelectTrigger className={`w-full h-6 text-xs ${getStatusBackgroundColor(pendingPastChanges[participant.id]?.admin_status ?? participant.admin_status ?? 'past')}`}>
                                       <SelectValue />
                                    </SelectTrigger>
                                         <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                             <SelectItem value="pending">Pending</SelectItem>
                                             <SelectItem value="approved">Approved</SelectItem>
                                             <SelectItem value="rejected">Rejected</SelectItem>
                                             <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                             <SelectItem value="this week">This Week</SelectItem>
                                             <SelectItem value="next week">Next Week</SelectItem>
                                             <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                             <SelectItem value="past">Past</SelectItem>
                                          </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Week interval selector */}
                                <div>
                                  <div className="font-semibold mb-1">Week Interval:</div>
                                  <Select 
                                    value={pendingPastChanges[participant.id]?.week_interval ?? participant.week_interval ?? ''}
                                    onValueChange={(newInterval) => {
                                      setPendingPastChanges(prev => ({
                                        ...prev,
                                        [participant.id]: {
                                          ...prev[participant.id],
                                          week_interval: newInterval
                                        }
                                      }));
                                    }}
                                  >
                                    <SelectTrigger className="w-full h-6 text-xs">
                                      <SelectValue placeholder="Select week" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                      {getAvailableWeekIntervals().map((interval) => (
                                        <SelectItem key={interval.value} value={interval.value}>
                                          {interval.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Save button - always visible */}
                                <Button
                                  size="sm"
                                  className="w-full h-7 text-xs"
                                  disabled={!pendingPastChanges[participant.id]}
                                  onClick={async () => {
                                    try {
                                      const changes = pendingPastChanges[participant.id];
                                      const participantName = `${appData.first_name || ''} ${appData.last_name || ''}`.trim();
                                      
                                      // CRITICAL FIX: Use updateParticipantStatusWithHistory to properly save changes
                                      if (changes.admin_status && changes.admin_status !== participant.admin_status) {
                                        const result = await updateParticipantStatusWithHistory(
                                          participant.id,
                                          changes.admin_status as ParticipantStatus,
                                          participantName
                                        );
                                        
                                        if (!result.success) {
                                          console.error('Error updating participant status:', result.error);
                                          toast({
                                            title: "Error",
                                            description: "Failed to update participant status",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                      }
                                      
                                      // If only week_interval changed (not admin_status), update it separately
                                      if (changes.week_interval && changes.week_interval !== participant.week_interval && 
                                          (!changes.admin_status || changes.admin_status === participant.admin_status)) {
                                        const { error } = await supabase
                                          .from('weekly_contest_participants')
                                          .update({ week_interval: changes.week_interval })
                                          .eq('id', participant.id);
                                        
                                        if (error) {
                                          console.error('Error updating week interval:', error);
                                          toast({
                                            title: "Error",
                                            description: "Failed to update week interval",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                      }
                                      
                                      toast({
                                        title: "Saved",
                                        description: "Changes saved successfully with history",
                                      });
                                      setPendingPastChanges(prev => {
                                        const updated = { ...prev };
                                        delete updated[participant.id];
                                        return updated;
                                      });
                                      fetchWeeklyParticipants();
                                    } catch (error) {
                                      console.error('Error updating participant:', error);
                                      toast({
                                        title: "Error",
                                        description: "An unexpected error occurred",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Сохранить
                                </Button>
                               
                               {participant.final_rank && (
                                  <div className="mt-2 p-2 bg-primary/10 rounded text-center text-xs space-y-2">
                                    <div className="font-semibold text-primary">
                                      {participant.final_rank === 1 ? '🏆 Winner' : `🏅 Rank #${participant.final_rank}`}
                                    </div>
                                    {participant.final_rank === 1 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full h-7 text-xs gap-1"
                                        onClick={() => {
                                          setSelectedWinner({
                                            participantId: participant.id,
                                            userId: participant.user_id,
                                            name: `${appData.first_name} ${appData.last_name}`
                                          });
                                          setShowWinnerContentModal(true);
                                        }}
                                      >
                                        <Trophy className="h-3 w-3" />
                                        Контент
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            
                            {/* Winner Content Manager - только для победительниц */}
                            {participant.final_rank === 1 && (
                              <div className="col-span-full p-4 border-t">
                                <WinnerContentManager
                                  participantId={participant.id}
                                  userId={participant.user_id}
                                  participantName={`${appData.first_name} ${appData.last_name}`}
                                />
                              </div>
                            )}
                            
                            {/* Voting stats */}
                            <div 
                              className="text-lg font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors text-center"
                              onClick={() => {
                                setSelectedParticipantForVoters({ 
                                  id: participant.user_id, 
                                  name: `${appData.first_name} ${appData.last_name}` 
                                });
                                setVotersModalOpen(true);
                              }}
                              title="Click to view voters"
                            >
                              {Number.isInteger(participant.total_votes) ? participant.total_votes : 0} votes
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MiniStars rating={Number.isFinite(participant.average_rating) ? Number(participant.average_rating) : 0} />
                                <span>{Number.isFinite(participant.average_rating) ? Number(participant.average_rating).toFixed(1) : '0.0'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile layout */}
                        <div className="md:hidden flex">
                          {/* Photos section */}
                          <div className="w-24 flex-shrink-0">
                            {(participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url) && (
                              <img 
                                src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url}
                                alt="Portrait" 
                                className="w-full h-[149px] object-cover rounded-l-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openPhotoModal([
                                  participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                                  participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                                ].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                              />
                            )}
                          </div>
                          
                          {/* Info section - mobile */}
                          <div className="flex-1 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-5 w-5 flex-shrink-0">
                                <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url || participantProfile?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {appData.first_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-semibold">
                                {appData.first_name} {appData.last_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : ''}
                              </span>
                            </div>
                            
                            <div 
                              className="text-xs text-muted-foreground mb-2 cursor-pointer"
                              onClick={() => {
                                const newExpanded = new Set(expandedMobileItems);
                                if (expandedMobileItems.has(participant.id)) {
                                  newExpanded.delete(participant.id);
                                } else {
                                  newExpanded.add(participant.id);
                                }
                                setExpandedMobileItems(newExpanded);
                              }}
                            >
                              {appData.city}, {appData.country}
                            </div>
                            
                            {/* Week interval - mobile */}
                            <div className="text-xs text-muted-foreground mb-2">
                              <span className="font-semibold">Week: </span>
                              <span className="bg-muted px-2 py-1 rounded text-xs">
                                {participant.week_interval || getParticipantWeekInterval(participant)}
                              </span>
                              {participant.final_rank && (
                                <span className="ml-2 bg-primary/10 px-2 py-1 rounded text-xs text-primary font-semibold">
                                  {participant.final_rank === 1 ? '🏆' : `#${participant.final_rank}`}
                                </span>
                              )}
                            </div>
                            
                            {/* Expanded mobile info */}
                            {expandedMobileItems.has(participant.id) && (
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>{appData.weight_kg}kg • {appData.height_cm}cm • {appData.gender}</div>
                                <div>{appData.marital_status} • {appData.has_children ? 'Has children' : 'No children'}</div>
                                {participantProfile?.email && (
                                  <div className="flex items-center gap-1">
                                    <span>{participantProfile.email.length > 20 ? `${participantProfile.email.substring(0, 20)}...` : participantProfile.email}</span>
                                    <Copy className="h-3 w-3 cursor-pointer" onClick={() => navigator.clipboard.writeText(participantProfile.email)} />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Status debug info - mobile */}
                            <div className="mt-2 text-xs bg-yellow-100 p-2 rounded border">
                              <div className="text-gray-700">
                                 {participant.admin_status} - {(() => {
                                   // Use correct interval mapping based on status
                                   switch (participant.admin_status) {
                                     case 'this week':
                                       return '29/09-05/10/25';
                                     case 'next week':
                                     case 'next week on site':
                                       return '06/10-12/10/25';
                                      case 'past':
                                        return '22/09-28/09/25';
                                     default:
                                       return participant.week_interval || '29/09-05/10/25';
                                   }
                                 })()}
                              </div>
                              {participant.status_history && Object.keys(participant.status_history).length > 0 && (
                                <div className="text-gray-600">
                                   {(() => {
                                      // Valid admin_status values only 
                                      const validAdminStatuses = ['this week', 'next week', 'next week on site', 'past'];
                                      
                                      const prevStatuses = Object.entries(participant.status_history)
                                        .filter(([status, info]: [string, any]) => validAdminStatuses.includes(status) && info && status) // Only valid admin statuses
                                        .sort((a: any, b: any) => new Date(b[1]?.changed_at || 0).getTime() - new Date(a[1]?.changed_at || 0).getTime())
                                        .filter(([status, info]: [string, any]) => status !== participant.admin_status);
                                    
                                     return prevStatuses.map(([status, info]: [string, any], index: number) => {
                                       // Use correct interval mapping for previous statuses too
                                       const interval = (() => {
                                         switch (status) {
                                           case 'this week':
                                             return '29/09-05/10/25';
                                           case 'next week':
                                           case 'next week on site':
                                             return '06/10-12/10/25';
                                            case 'past':
                                              return '22/09-28/09/25';
                                           default:
                                             return 'нет интервала';
                                         }
                                       })();
                                      return (
                                        <div key={index}>
                                          {status} - {interval}
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </div>

                            {/* Voting stats - mobile */}
                            <div 
                              className="mt-2 text-sm font-bold text-blue-600 cursor-pointer"
                              onClick={() => {
                                setSelectedParticipantForVoters({ 
                                  id: participant.user_id, 
                                  name: `${appData.first_name} ${appData.last_name}` 
                                });
                                setVotersModalOpen(true);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span>{Number.isInteger(participant.total_votes) ? participant.total_votes : 0} votes</span>
                                <div className="flex items-center gap-1">
                                  <MiniStars rating={Number.isFinite(participant.average_rating) ? Number(participant.average_rating) : 0} />
                                  <span>{Number.isFinite(participant.average_rating) ? Number(participant.average_rating).toFixed(1) : '0.0'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })};
                
                {/* Pagination for Past section when К button is active */}
                {showAllCards && totalPastPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPastCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={pastCurrentPage === 1}
                    >
                      Предыдущая
                    </Button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(totalPastPages, 10) }, (_, i) => {
                        // Show first 5 pages, current page vicinity, and last 5 pages
                        const page = i + 1;
                        if (totalPastPages <= 10) {
                          return (
                            <Button
                              key={page}
                              variant={page === pastCurrentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPastCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        }
                        return null;
                      })}
                      
                      {totalPastPages > 10 && (
                        <>
                          {[1, 2, 3].map(page => (
                            <Button
                              key={page}
                              variant={page === pastCurrentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPastCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          ))}
                          
                          {pastCurrentPage > 4 && <span className="text-muted-foreground px-2">...</span>}
                          
                          {pastCurrentPage > 3 && pastCurrentPage < totalPastPages - 2 && (
                            <Button
                              variant="default"
                              size="sm"
                              className="w-8 h-8 p-0"
                            >
                              {pastCurrentPage}
                            </Button>
                          )}
                          
                          {pastCurrentPage < totalPastPages - 3 && <span className="text-muted-foreground px-2">...</span>}
                          
                          {[totalPastPages - 2, totalPastPages - 1, totalPastPages].map(page => (
                            <Button
                              key={page}
                              variant={page === pastCurrentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPastCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          ))}
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPastCurrentPage(prev => Math.min(prev + 1, totalPastPages))}
                      disabled={pastCurrentPage === totalPastPages}
                    >
                      Следующая
                    </Button>
                  </div>
                )}
                
                {/* Show pagination info when К button is active */}
                {showAllCards && totalPastParticipants > itemsPerPage && (
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    Показано {pastStartIndex + 1}-{Math.min(pastEndIndex, totalPastParticipants)} из {totalPastParticipants} участников
                  </div>
                )}
                </>
              );
              })()}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">All Participants</h2>
                
                {/* Status Filter - Admin Status Only */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Admin Status Filter:</Label>
                  <Select value={allSectionStatusFilter} onValueChange={setAllSectionStatusFilter}>
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Select admin status" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pre next week">Pre Next Week</SelectItem>
                      <SelectItem value="next week">Next Week</SelectItem>
                      <SelectItem value="next week on site">Next Week On Site</SelectItem>
                      <SelectItem value="this week">This Week</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {(() => {
                // Combine all participants from weeklyParticipants and contestApplications
                const allParticipants = [...weeklyParticipants];
                
                // Add contest applications as participants
                const applicationParticipants = contestApplications.map(app => {
                  const profile = profiles.find(p => p.id === app.user_id);
                  return {
                    id: `app-${app.id}`,
                    user_id: app.user_id,
                    application_data: app.application_data,
                    admin_status: app.admin_status,
                    participant_status: app.admin_status,
                    status_history: {},
                    status_week_history: {},
                    week_interval: getParticipantWeekInterval({ admin_status: app.admin_status }),
                    created_at: app.submitted_at,
                    contest_id: null,
                    final_rank: null,
                    total_votes: 0,
                    average_rating: 0,
                    is_active: app.deleted_at === null
                  };
                });
                
                const combinedParticipants = [...allParticipants, ...applicationParticipants];
                
                // Apply status filter
                const filteredParticipants = allSectionStatusFilter === 'all' 
                  ? combinedParticipants 
                  : combinedParticipants.filter(p => p.admin_status === allSectionStatusFilter);
                
                if (filteredParticipants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-lg">Нет участников с выбранным статусом</p>
                    </div>
                  );
                }

                return (
                  <>
                    {filteredParticipants.map((participant) => {
                      const participantProfile = profiles.find(p => p.id === participant.user_id);
                      const appData = participant.application_data || {};
                      
                      return (
                        <Card key={participant.id} className="overflow-hidden relative mx-0 rounded-lg h-[149px]">
                          <CardContent className="p-0">
                            {/* Desktop layout */}
                            <div className="hidden md:flex md:overflow-visible">
                              {/* Column 1: Photos (25ch) */}
                              <div className="w-[25ch] flex-shrink-0 p-0">
                                <div className="flex gap-px">
                                  {(participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url) && (
                                    <div className="w-full">
                                      <img 
                                        src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url}
                                        alt="Portrait"
                                        className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => openPhotoModal([
                                          participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                                          participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                                        ].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                      />
                                    </div>
                                  )}
                                  {(participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url) && (
                                    <div className="w-full">
                                      <img 
                                        src={participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url} 
                                        alt="Full length"
                                        className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => openPhotoModal([
                                          participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                                          participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                                        ].filter(Boolean), 1, `${appData.first_name} ${appData.last_name}`)}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Column 2: Information (25ch) */}
                              <div className="w-[25ch] flex-shrink-0 p-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarImage src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url || participantProfile?.avatar_url || ''} />
                                    <AvatarFallback className="text-xs">
                                      {appData.first_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-semibold whitespace-nowrap flex items-center gap-1">
                                    {participant.final_rank === 1 && <span className="text-yellow-500">🏆</span>}
                                    {participant.final_rank > 1 && <span className="text-slate-500">🥈</span>}
                                    {appData.first_name} {appData.last_name} {appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : ''}
                                  </span>
                                </div>
                                
                                <div className="text-xs text-muted-foreground mb-1">
                                  {appData.city} {appData.state} {appData.country}
                                </div>

                                <div className="text-xs text-muted-foreground mb-1">
                                  {participantProfile?.email && (
                                    <div className="flex items-center gap-1">
                                      <span 
                                        className="cursor-pointer" 
                                        title={participantProfile.email}
                                      >
                                        {participantProfile.email.substring(0, 15)}...
                                      </span>
                                      <Copy 
                                        className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                        onClick={() => navigator.clipboard.writeText(participantProfile.email || '')}
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                  <Select 
                                    value={participant.admin_status || 'pending'}
                                    onValueChange={(value) => {
                                      const updateStatus = async () => {
                                        const result = await updateParticipantStatusWithHistory(
                                          participant.id,
                                          value as ParticipantStatus,
                                          `${appData.first_name} ${appData.last_name}`
                                        );

                                        if (!result.success) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to update participant status",
                                            variant: "destructive"
                                          });
                                        } else {
                                          fetchWeeklyParticipants();
                                          fetchContestApplications();
                                        }
                                      };

                                      updateStatus();
                                    }}
                                  >
                                    <SelectTrigger className={`w-28 h-6 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pending')}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                      <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                         <SelectItem value="pending">Pending</SelectItem>
                                         <SelectItem value="approved">Approved</SelectItem>
                                         <SelectItem value="rejected">Rejected</SelectItem>
                                         <SelectItem value="pending">Pending</SelectItem>
                                         <SelectItem value="approved">Approved</SelectItem>
                                         <SelectItem value="rejected">Rejected</SelectItem>
                                         <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                         <SelectItem value="this week">This Week</SelectItem>
                                         <SelectItem value="next week">Next Week</SelectItem>
                                         <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                         <SelectItem value="past">Past</SelectItem>
                                       </SelectContent>
                                  </Select>
                                  
                                  <div 
                                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                                    onClick={() => {
                                      setSelectedParticipantForVoters({
                                        id: participant.id,
                                        name: `${appData.first_name} ${appData.last_name}`
                                      });
                                      setVotersModalOpen(true);
                                    }}
                                  >
                                    {`${(participant.average_rating || 0).toFixed(1)} (${participant.total_votes || 0})`}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Mobile layout */}
                            <div className="md:hidden">
                              <div className="flex w-full">
                                {/* Photos section */}
                                <div className="flex gap-px w-[50vw] flex-shrink-0">
                                  {(participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url) && (
                                    <div className="w-1/2">
                                      <img 
                                        src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url} 
                                        alt="Portrait" 
                                        className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => openPhotoModal([
                                          participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                                          participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                                        ].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                      />
                                    </div>
                                  )}
                                  {(participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url) && (
                                    <div className="w-1/2">
                                      <img 
                                        src={participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url} 
                                        alt="Full length" 
                                        className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => openPhotoModal([
                                          participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                                          participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                                        ].filter(Boolean), 1, `${appData.first_name} ${appData.last_name}`)}
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Information section */}
                                <div className="w-[50vw] flex-shrink-0 pl-2 flex flex-col h-48 relative">
                                  <div className="flex items-center gap-2 mb-1 mt-1">
                                    <span className="text-xs font-semibold whitespace-nowrap">
                                      {appData.first_name} {appData.last_name}
                                    </span>
                                  </div>
                                  
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {appData.city} {appData.country}
                                  </div>
                                  
                                  <div className="flex-1"></div>
                                  
                                  {/* Status filter */}
                                  <div className="absolute bottom-12 right-0 flex items-center gap-1">
                                    <Select 
                                      value={participant.admin_status || 'pending'}
                                      onValueChange={(value) => {
                                        const updateStatus = async () => {
                                          const result = await updateParticipantStatusWithHistory(
                                            participant.id,
                                            value as ParticipantStatus,
                                            `${appData.first_name} ${appData.last_name}`
                                          );

                                          if (!result.success) {
                                            toast({
                                              title: "Error",
                                              description: "Failed to update participant status",
                                              variant: "destructive"
                                            });
                                          } else {
                                            fetchWeeklyParticipants();
                                            fetchContestApplications();
                                          }
                                        };

                                        updateStatus();
                                      }}
                                    >
                                      <SelectTrigger className="w-24 h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                        <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                           <SelectItem value="pending">Pending</SelectItem>
                                           <SelectItem value="approved">Approved</SelectItem>
                                           <SelectItem value="rejected">Rejected</SelectItem>
                                           <SelectItem value="pending">Pending</SelectItem>
                                           <SelectItem value="approved">Approved</SelectItem>
                                           <SelectItem value="rejected">Rejected</SelectItem>
                                           <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                           <SelectItem value="this week">This Week</SelectItem>
                                           <SelectItem value="next week">Next Week</SelectItem>
                                           <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                           <SelectItem value="past">Past</SelectItem>
                                         </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="applications" className="space-y-4 -mx-2 md:mx-0">

              {/* Status Filter */}
              <div className="mb-4 px-0 md:px-6">
                <Label className="text-sm font-medium mb-2 block">Admin Status Filter:</Label>
                <Select value={adminStatusFilter} onValueChange={(value) => {
                  setAdminStatusFilter(value);
                  setApplicationCurrentPage(1);
                }}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-popover border shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pre next week">Pre Next Week</SelectItem>
                    <SelectItem value="next week">Next Week</SelectItem>
                    <SelectItem value="next week on site">Next Week On Site</SelectItem>
                    <SelectItem value="this week">This Week</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Applications Stats Dashboard */}
              <div className="mb-6 px-0 md:px-6">
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground space-y-2">
                     <div className="text-xs">
                       new applications: {dailyApplicationStats.reduce((sum, day) => sum + day.total_applications, 0)} - {dailyApplicationStats.reduce((sum, day) => sum + day.approved_applications, 0)}, 
                       approved: {cardSectionStats.moved_to_next_week_count || cardSectionStats.movedToNextWeek}
                     </div>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {dailyApplicationStats.map((stat, index) => (
                        <div key={index} className="text-center p-1 bg-background rounded">
                          <div className="font-medium text-xs">{stat.day_name}</div>
                          <div className="text-xs text-muted-foreground flex justify-center gap-1">
                            <span 
                              className={`cursor-pointer hover:text-blue-600 ${
                                selectedDay?.day === index && selectedDay?.type === 'new' ? 'text-blue-600 font-semibold' : ''
                              }`}
                              onClick={() => {
                                if (selectedDay?.day === index && selectedDay?.type === 'new') {
                                  setSelectedDay(null);
                                } else {
                                  setSelectedDay({ day: index, type: 'new' });
                                }
                              }}
                            >
                              {stat.total_applications}
                            </span>
                            <span>-</span>
                            <span 
                              className={`cursor-pointer hover:text-green-600 ${
                                selectedDay?.day === index && selectedDay?.type === 'approved' ? 'text-green-600 font-semibold' : ''
                              }`}
                              onClick={() => {
                                if (selectedDay?.day === index && selectedDay?.type === 'approved') {
                                  setSelectedDay(null);
                                } else {
                                  setSelectedDay({ day: index, type: 'approved' });
                                }
                              }}
                            >
                              {stat.approved_applications}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs pt-1 border-t border-border/50">
                      {/* Подсчет только по admin_status */}
                      {weeklyParticipants.filter(p => p.admin_status === 'pending').length} pending, {' '}
                      {weeklyParticipants.filter(p => ['this week', 'next week', 'past'].includes(p.admin_status)).length} approved, {' '}
                      {weeklyParticipants.filter(p => p.admin_status === 'rejected').length} rejected
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Day Users */}
              {selectedDay && (
                <div className="mb-6 px-0 md:px-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">
                      {selectedDay.type === 'new' ? 'New users' : 'Approved users'} for {dailyApplicationStats[selectedDay.day]?.day_name}
                    </h3>
                    <div className="space-y-4">
                      {getUsersForDay(selectedDay.day, selectedDay.type).map((application) => {
                        const appData = application.application_data || {};
                        const userProfile = profiles.find(p => p.id === application.user_id);
                        const userApplicationCount = contestApplications.filter(app => app.user_id === application.user_id).length;
                        
                        return (
                          <div key={application.id}>
                            <Card className="overflow-hidden relative rounded-none border-l-0 border-r-0 md:rounded-lg md:border-l md:border-r h-[149px]">
                              {/* Edit button in bottom left corner */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingParticipantData(application);
                                  setShowParticipationModal(true);
                                }}
                                className="absolute bottom-0 left-0 z-20 p-1 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background"
                                title="Edit Application"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              {/* Application count badge */}
                              {userApplicationCount > 1 && (
                                <div 
                                  className="absolute top-0 left-0 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-br cursor-pointer hover:bg-blue-600 transition-colors"
                                  onClick={() => setSelectedUserApplications(
                                    selectedUserApplications === application.user_id ? null : application.user_id
                                  )}
                                >
                                  {userApplicationCount}
                                </div>
                              )}
                             
                              <CardContent className="p-0">
                                {/* Desktop layout */}
                                <div className="hidden md:flex md:overflow-visible">
                                  {/* Column 1: Photos (25ch) */}
                                  <div className="w-[25ch] flex-shrink-0 p-0">
                                    <div className="flex gap-px">
                                      {appData.photo1_url && (
                                        <div className="w-full">
                                          <img 
                                            src={appData.photo1_url} 
                                            alt="Portrait" 
                                            className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                          />
                                        </div>
                                      )}
                                      {appData.photo2_url && (
                                        <div className="w-full">
                                          <img 
                                            src={appData.photo2_url} 
                                            alt="Full length" 
                                            className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 1, `${appData.first_name} ${appData.last_name}`)}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Column 2: Information (25ch) */}
                                  <div className="w-[25ch] flex-shrink-0 p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Avatar className="h-6 w-6 flex-shrink-0">
                                        <AvatarImage src={userProfile?.avatar_url || ''} />
                                        <AvatarFallback className="text-xs">
                                          {appData.first_name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-semibold whitespace-nowrap">
                                        {appData.first_name} {appData.last_name} {new Date().getFullYear() - appData.birth_year}
                                      </span>
                                    </div>
                                    
                                     <div 
                                       className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors"
                                       onClick={() => {
                                         const newExpanded = new Set(expandedDesktopItems);
                                         if (expandedDesktopItems.has(application.id)) {
                                           newExpanded.delete(application.id);
                                         } else {
                                           newExpanded.add(application.id);
                                         }
                                         setExpandedDesktopItems(newExpanded);
                                       }}
                                     >
                                       {appData.city} {appData.state} {appData.country}
                                     </div>
                                     
                                     {/* Expanded information - desktop */}
                                     {expandedDesktopItems.has(application.id) && (
                                       <div className="text-xs text-muted-foreground mb-1">
                                         {appData.weight_kg}kg • {appData.height_cm}cm • {appData.gender} • {appData.birth_year} • {appData.marital_status} • {appData.has_children ? 'Has children' : 'No children'}
                                       </div>
                                     )}

                                    <div className="text-xs text-muted-foreground mb-1">
                                      {userProfile?.email && (
                                        <div className="flex items-center gap-1">
                                          <span 
                                            className="cursor-pointer" 
                                            title={userProfile.email}
                                          >
                                            {userProfile.email.length > 25 ? `${userProfile.email.substring(0, 25)}...` : userProfile.email}
                                          </span>
                                          <Copy 
                                            className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                            onClick={() => navigator.clipboard.writeText(userProfile.email)}
                                          />
                                        </div>
                                      )}
                                    </div>

                                    {/* Phone and Social Media */}
                                    <div className="text-xs text-muted-foreground mb-3">
                                      <div className="flex items-center gap-2">
                                        {(() => {
                                          const phone = appData.phone?.country && appData.phone?.number 
                                            ? `${appData.phone.country} ${appData.phone.number}` 
                                            : 'Not provided';
                                          return <span>{phone}</span>;
                                        })()}
                                        {appData.facebook_url && (
                                          <a
                                            href={appData.facebook_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            <Facebook className="h-3 w-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                   {/* Column 3: Status Button (20ch) - только для десктопа */}
                                    <div className="w-[20ch] flex-shrink-0 p-4 pl-0 flex flex-col gap-2 -mt-[20px]">
                                     {/* Status dropdown at the top - desktop */}
                                     <Select 
                                       value={application.admin_status} 
                                         onValueChange={(newStatus) => {
                                           console.log('Status change requested:', newStatus, 'for application:', application.id);
                                           if (newStatus === 'delete') {
                                             setApplicationToDelete({ 
                                               id: application.id, 
                                               name: `${appData.first_name} ${appData.last_name}` 
                                             });
                                             setShowDeleteConfirmModal(true);
                                             return;
                                           }
                                           if (newStatus === 'rejected') {
                                             setApplicationToReject({ 
                                               id: application.id, 
                                               name: `${appData.first_name} ${appData.last_name}` 
                                             });
                                             setRejectModalOpen(true);
                                             return;
                                           }
                                           console.log('Calling reviewApplication for status:', newStatus);
                                            reviewApplication(application.id, newStatus as ParticipantStatus);
                                         }}
                                     >
                                        <SelectTrigger 
                                           className={`w-24 ${
                                             ['this week', 'next week', 'past'].includes(application.admin_status) ? 'bg-green-100 border-green-500 text-green-700' :
                                             application.admin_status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                             ''
                                           }`}
                                        >
                                          <SelectValue />
                                        </SelectTrigger>
                                          <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                             <SelectItem value="pending">Pending</SelectItem>
                                             <SelectItem value="approved">Approved</SelectItem>
                                             <SelectItem value="rejected">Rejected</SelectItem>
                                             <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                             <SelectItem value="this week">This Week</SelectItem>
                                             <SelectItem value="next week">Next Week</SelectItem>
                                             <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                             <SelectItem value="past">Past</SelectItem>
                                          </SelectContent>
                                     </Select>
                                     
                                     {/* Admin info and date at the bottom */}
                                     <div 
                                       className="text-xs text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors"
                                       onClick={async () => {
                                         try {
                                           const { data: history } = await supabase
                                             .from('contest_application_history')
                                             .select('*')
                                             .eq('application_id', application.id)
                                             .order('created_at', { ascending: true });

                                           const uniqueHistory = (history || []).filter((entry, index, arr) => {
                                             return arr.findIndex(e => 
                                               e.status === entry.status &&
                                               e.created_at === entry.created_at &&
                                               e.changed_by === entry.changed_by
                                             ) === index;
                                           });

                                           const historyWithCurrent = [...uniqueHistory];
                                           if (historyWithCurrent.length === 0) {
                                             historyWithCurrent.unshift({
                                               id: 'system',
                                               application_id: application.id,
                                               application_data: null,
                                               status: 'pending',
                                               notes: '',
                                               rejection_reason_types: [],
                                               created_at: application.submitted_at,
                                               changed_by: '',
                                               change_reason: 'Application submitted'
                                             });
                                           }

                                           setApplicationHistory(historyWithCurrent);
                                           setAdminDatePopup({
                                             show: true,
                                             date: '',
                                             admin: '',
                                             applicationId: application.id
                                           });
                                         } catch (error) {
                                           console.error('Error fetching application history:', error);
                                         }
                                       }}
                                     >
                                       {(() => {
                                         const statusDate = application.reviewed_at || application.approved_at || application.rejected_at || application.submitted_at;
                                         if (statusDate) {
                                           const date = new Date(statusDate);
                                           const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                           const dateStr = date.toLocaleDateString('en-GB', { 
                                             day: 'numeric', 
                                             month: 'short'
                                           }).toLowerCase();
                                          const reviewerEmail = application.reviewed_by && profiles.find(p => p.id === application.reviewed_by)?.email;
                                          const reviewerLogin = reviewerEmail ? reviewerEmail.substring(0, 4) : 'syst';
                                          return (
                                            <>
                                              <span className="text-blue-600">{reviewerLogin}</span>
                                              {` ${time} - ${dateStr}`}
                                            </>
                                          );
                                        }
                                        return '';
                                      })()}
                                    </div>
                                  </div>
                               </div>
                               
                               {/* Mobile layout - horizontal with full width */}
                               <div className="md:hidden">
                                 <div className="flex w-full">
                                   {/* Photos section - left side */}
                                   <div className="flex gap-px w-[50vw] flex-shrink-0">
                                       {appData.photo1_url && (
                                         <div className="w-1/2">
                                           <img 
                                             src={appData.photo1_url} 
                                             alt="Portrait" 
                                             className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                             onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                           />
                                         </div>
                                       )}
                                        {appData.photo2_url && (
                                          <div className="w-1/2 relative">
                                            <img 
                                              src={appData.photo2_url} 
                                              alt="Full length" 
                                              className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                              onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 1, `${appData.first_name} ${appData.last_name}`)}
                                            />
                                            {/* User avatar positioned in top right corner */}
                                            <div className="absolute top-2 right-2">
                                              <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                                                <AvatarImage src={userProfile?.avatar_url || ''} />
                                                <AvatarFallback className="text-xs">
                                                  {appData.first_name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                              </Avatar>
                                            </div>
                                          </div>
                                        )}
                                     </div>
                                     
                                        {/* Information section - right side */}
                                         <div className="w-[50vw] flex-shrink-0 pl-2 flex flex-col h-48 relative">
                                         <div className="flex items-center gap-2 mb-1 mt-1">
                                            <span className="text-xs font-semibold whitespace-nowrap">
                                              {new Date().getFullYear() - appData.birth_year} {appData.first_name} {appData.last_name}
                                            </span>
                                         </div>
                                        
                                          <div 
                                            className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => {
                                              const newExpanded = new Set(expandedMobileItems);
                                              if (expandedMobileItems.has(application.id)) {
                                                newExpanded.delete(application.id);
                                              } else {
                                                newExpanded.add(application.id);
                                              }
                                              setExpandedMobileItems(newExpanded);
                                            }}
                                          >
                                            {appData.city} {appData.country}
                                          </div>
                                         
                                             {/* Expanded information */}
                                              {expandedMobileItems.has(application.id) && (
                                                <div className="text-xs text-muted-foreground mb-1 space-y-0 leading-none">
                                                  <div>{appData.weight_kg}kg, {appData.height_cm}cm</div>
                                                  <div>{appData.marital_status}, {appData.has_children ? 'Has kids' : 'No kids'}</div>
                                                  <div className="flex items-center gap-1">
                                                    <span>
                                                      {userProfile?.email 
                                                        ? (userProfile.email.length > 7 ? `${userProfile.email.substring(0, 7)}...` : userProfile.email)
                                                        : 'No email'
                                                      }
                                                    </span>
                                                    {userProfile?.email && (
                                                      <Copy 
                                                        className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                                        onClick={() => navigator.clipboard.writeText(userProfile.email)}
                                                      />
                                                    )}
                                                  </div>
                                                  <div>
                                                    {(() => {
                                                      const phone = appData.phone?.country && appData.phone?.number 
                                                        ? `${appData.phone.country} ${appData.phone.number}` 
                                                        : 'No phone';
                                                      const facebook = appData.facebook_url ? (
                                                        <a
                                                          href={appData.facebook_url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="text-blue-600 hover:text-blue-800"
                                                        >
                                                          fb
                                                        </a>
                                                      ) : 'no fb';
                                                      return (
                                                        <span>
                                                          {phone} {facebook}
                                                        </span>
                                                      );
                                                    })()}
                                                  </div>
                                                </div>
                                              )}
                                            
                                              <div className="flex-1"></div>
                                           
                                               {/* Status filter positioned at bottom */}
                                               <div className="absolute bottom-12 right-13 flex items-center gap-2">
                                              <Select 
                                                value={application.admin_status}
                                                 onValueChange={(newStatus) => {
                                                   if (newStatus === 'delete') {
                                                     setApplicationToDelete({ 
                                                       id: application.id, 
                                                       name: `${appData.first_name} ${appData.last_name}` 
                                                     });
                                                     setShowDeleteConfirmModal(true);
                                                     return;
                                                   }
                                                   if (newStatus === 'rejected') {
                                                     setApplicationToReject({ 
                                                       id: application.id, 
                                                       name: `${appData.first_name} ${appData.last_name}` 
                                                     });
                                                     setRejectModalOpen(true);
                                                     return;
                                                   }
                                                    reviewApplication(application.id, newStatus as ParticipantStatus);
                                                 }}
                                              >
                                                 <SelectTrigger 
                                                    className={`w-24 h-7 text-xs ${
                                                      ['this week', 'next week', 'past'].includes(application.admin_status) ? 'bg-green-100 border-green-500 text-green-700' :
                                                      application.admin_status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                                      ''
                                                    }`}
                                                 >
                                                  <SelectValue />
                                                </SelectTrigger>
                                                   <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                                      <SelectItem value="pending">Pending</SelectItem>
                                                      <SelectItem value="approved">Approved</SelectItem>
                                                      <SelectItem value="rejected">Rejected</SelectItem>
                                                      <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                                      <SelectItem value="this week">This Week</SelectItem>
                                                      <SelectItem value="next week">Next Week</SelectItem>
                                                      <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                                      <SelectItem value="past">Past</SelectItem>
                                                   </SelectContent>
                                              </Select>
                                              
                                               {/* Admin login with expandable date */}
                                                <div className="text-xs text-muted-foreground -mt-[5px]">
                                                  {(() => {
                                                    const statusDate = application.reviewed_at || application.approved_at || application.rejected_at || application.submitted_at;
                                                    const reviewerEmail = application.reviewed_by && profiles.find(p => p.id === application.reviewed_by)?.email;
                                                    const reviewerLogin = reviewerEmail ? reviewerEmail.substring(0, 3) : 'sys';
                                                    
                                                    const showDatePopup = async () => {
                                                      try {
                                                        const { data: history } = await supabase
                                                          .from('contest_application_history')
                                                          .select('*')
                                                          .eq('application_id', application.id)
                                                          .order('created_at', { ascending: true });

                                                        const uniqueHistory = (history || []).filter((entry, index, arr) => {
                                                          return arr.findIndex(e => 
                                                            e.status === entry.status &&
                                                            e.created_at === entry.created_at &&
                                                            e.changed_by === entry.changed_by
                                                          ) === index;
                                                        });

                                                        const historyWithCurrent = [...uniqueHistory];
                                                        if (historyWithCurrent.length === 0) {
                                                          historyWithCurrent.unshift({
                                                            id: 'system',
                                                            application_id: application.id,
                                                            application_data: null,
                                                            status: 'pending',
                                                            notes: '',
                                                            rejection_reason_types: [],
                                                            created_at: application.submitted_at,
                                                            changed_by: '',
                                                            change_reason: 'Application submitted'
                                                          });
                                                        }

                                                        setApplicationHistory(historyWithCurrent);
                                                        setAdminDatePopup({
                                                          show: true,
                                                          date: '',
                                                          admin: '',
                                                          applicationId: application.id
                                                        });
                                                      } catch (error) {
                                                        console.error('Error fetching application history:', error);
                                                      }
                                                    };
                                                    
                                                    return (
                                                      <span 
                                                        className="text-blue-600 cursor-pointer hover:text-blue-800"
                                                        onClick={showDatePopup}
                                                      >
                                                        {reviewerLogin}
                                                      </span>
                                                    );
                                                  })()}
                                               </div>
                                            </div>
                                       </div>
                                 </div>
                               </div>
                            </CardContent>
                          </Card>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Filter - Admin Status Only */}
              <div className="mb-6 px-0 md:px-6">
                <div className="flex gap-4 items-center justify-start">
                  <div className="flex flex-col gap-2">
                      <Select 
                      value={adminStatusFilter} 
                      onValueChange={(value) => {
                        setAdminStatusFilter(value);
                        setApplicationCurrentPage(1);
                      }}
                    >
                       <SelectTrigger className="w-20 md:w-32">
                        <SelectValue placeholder="Filter by admin status" />
                      </SelectTrigger>
                       <SelectContent className="z-[9999] bg-popover border shadow-lg min-w-[200px]">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="pre next week">Pre Next Week</SelectItem>
                          <SelectItem value="next week">Next Week</SelectItem>
                          <SelectItem value="next week on site">Next Week On Site</SelectItem>
                          <SelectItem value="this week">This Week</SelectItem>
                          <SelectItem value="past">Past</SelectItem>
                       </SelectContent>
                    </Select>
                    {adminStatusFilter !== 'all' && (
                      <p className="text-xs text-muted-foreground">
                        Filter: {adminStatusFilter}
                      </p>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <Button
                      variant={showDeletedApplications ? "default" : "outline"}
                      onClick={async () => {
                        if (!showDeletedApplications) {
                          const deleted = await fetchDeletedApplications();
                          setDeletedApplications(deleted);
                        }
                        setShowDeletedApplications(!showDeletedApplications);
                      }}
                      className="text-xs md:text-sm px-2 md:px-4"
                    >
                      {showDeletedApplications ? 'Show Active' : 'Show Deleted'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-0 md:px-6">
                {(() => {
                  console.log('Filtering applications, adminStatusFilter:', adminStatusFilter);
                  const filteredApplications = (showDeletedApplications ? deletedApplications : contestApplications)
                    .filter((application) => {
                      // Filter by country first
                      const applicationCountry = application.application_data?.country;
                      if (countryFilter !== 'all' && applicationCountry !== countryFilter) return false;
                      
                      // Handle admin_status filtering - использовать напрямую admin_status
                      if (adminStatusFilter !== 'all') {
                        const participant = weeklyParticipants.find(p => p.user_id === application.user_id);
                        if (!participant || participant.admin_status !== adminStatusFilter) return false;
                      }
                      
                      // Exclude "next week" from main card section unless specifically filtering
                      const weeklyParticipant = weeklyParticipants.find(p => p.user_id === application.user_id);
                      if (weeklyParticipant?.admin_status === 'next week' && adminStatusFilter !== 'next week') {
                        return false;
                      }
                      
                      // Exclude "this week" from main card section unless specifically filtering
                      if (weeklyParticipant?.admin_status === 'this week' && adminStatusFilter !== 'this week') {
                        return false;
                      }
                      
                      return true;
                    });
                  
                  const userApplicationsMap = new Map();
                  filteredApplications.forEach(app => {
                    if (!userApplicationsMap.has(app.user_id) || 
                        new Date(app.submitted_at) > new Date(userApplicationsMap.get(app.user_id).submitted_at)) {
                      userApplicationsMap.set(app.user_id, app);
                    }
                  });
                  
                  const uniqueApplications = Array.from(userApplicationsMap.values());
                  
                  if (uniqueApplications.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-lg">No applications found</p>
                      </div>
                    );
                   }

                   // Function to render status badge
                   const getApplicationStatusBadge = (status: string) => {
                     const badgeVariant = status === 'approved' ? 'default' : 
                                         status === 'rejected' ? 'destructive' : 
                                         'secondary';
                     const badgeColor = status === 'approved' ? 'bg-green-100 text-green-700 border-green-500' :
                                       status === 'rejected' ? 'bg-red-100 text-red-700 border-red-500' :
                                       '';
                     
                     return (
                       <Badge variant={badgeVariant} className={badgeColor}>
                         {status.charAt(0).toUpperCase() + status.slice(1)}
                       </Badge>
                     );
                   };

                    // Calculate pagination for applications
                    const totalApplications = uniqueApplications.length;
                    const totalApplicationPages = Math.ceil(totalApplications / itemsPerPage);
                    const applicationStartIndex = (applicationCurrentPage - 1) * itemsPerPage;
                    const applicationEndIndex = applicationStartIndex + itemsPerPage;
                    const paginatedApplications = uniqueApplications.slice(applicationStartIndex, applicationEndIndex);

                    return (
                      <>
                        {paginatedApplications.map((application) => {
                    const appData = typeof application.application_data === 'string' 
                      ? JSON.parse(application.application_data) 
                      : application.application_data;
                    const submittedDate = new Date(application.submitted_at);
                    const userProfile = profiles.find(p => p.id === application.user_id);
                    const userApplicationCount = (showDeletedApplications ? deletedApplications : contestApplications)
                      .filter(app => app.user_id === application.user_id).length;
                   
                    return (
                      <div key={application.id}>
                         <Card className="overflow-hidden relative rounded-none border-l-0 border-r-0 md:rounded-lg md:border-l md:border-r h-[149px]">
                           {/* Edit button in bottom left corner */}
                           {!showDeletedApplications && (
                             <Button
                               size="sm"
                               variant="outline"
                                onClick={() => {
                                  setEditingParticipantData(application);
                                  setShowParticipationModal(true);
                                }}
                               className="absolute bottom-0 left-0 z-20 p-1 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background"
                               title="Edit Application"
                             >
                               <Edit className="w-4 h-4" />
                             </Button>
                           )}
                           
                           {/* Application count badge */}
                           {userApplicationCount > 1 && (
                             <div 
                               className="absolute top-0 left-0 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-br cursor-pointer hover:bg-blue-600 transition-colors"
                               onClick={() => setSelectedUserApplications(
                                 selectedUserApplications === application.user_id ? null : application.user_id
                               )}
                             >
                               {userApplicationCount}
                             </div>
                           )}
                          
                            <CardContent className="p-0">
                              {/* Desktop layout */}
                              <div className="hidden md:flex md:overflow-visible">
                                {/* Column 1: Photos (25ch) */}
                                <div className="w-[25ch] flex-shrink-0 p-0">
                                  <div className="flex gap-px">
                                    {appData.photo1_url && (
                                      <div className="w-full">
                                        <img 
                                          src={appData.photo1_url} 
                                          alt="Portrait" 
                                          className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                        />
                                      </div>
                                    )}
                                    {appData.photo2_url && (
                                      <div className="w-full">
                                        <img 
                                          src={appData.photo2_url} 
                                          alt="Full length" 
                                          className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 1, `${appData.first_name} ${appData.last_name}`)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Column 2: Information (25ch) */}
                                <div className="w-[25ch] flex-shrink-0 p-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                      <AvatarImage src={userProfile?.avatar_url || ''} />
                                      <AvatarFallback className="text-xs">
                                        {appData.first_name?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-semibold whitespace-nowrap">
                                      {appData.first_name} {appData.last_name} {new Date().getFullYear() - appData.birth_year}
                                    </span>
                                  </div>
                                  
                                   <div 
                                     className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors"
                                     onClick={() => {
                                       const newExpanded = new Set(expandedDesktopItems);
                                       if (expandedDesktopItems.has(application.id)) {
                                         newExpanded.delete(application.id);
                                       } else {
                                         newExpanded.add(application.id);
                                       }
                                       setExpandedDesktopItems(newExpanded);
                                     }}
                                   >
                                     {appData.city} {appData.state} {appData.country}
                                   </div>
                                   
                                   {/* Expanded information - desktop */}
                                   {expandedDesktopItems.has(application.id) && (
                                     <div className="text-xs text-muted-foreground mb-1">
                                       {appData.weight_kg}kg • {appData.height_cm}cm • {appData.gender} • {appData.birth_year} • {appData.marital_status} • {appData.has_children ? 'Has children' : 'No children'}
                                     </div>
                                   )}

                                  <div className="text-xs text-muted-foreground mb-1">
                                    {userProfile?.email && (
                                      <div className="flex items-center gap-1">
                                        <span 
                                          className="cursor-pointer" 
                                          title={userProfile.email}
                                        >
                                          {userProfile.email.length > 25 ? `${userProfile.email.substring(0, 25)}...` : userProfile.email}
                                        </span>
                                        <Copy 
                                          className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                          onClick={() => navigator.clipboard.writeText(userProfile.email)}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Phone and Social Media */}
                                  <div className="text-xs text-muted-foreground mb-3">
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const phone = appData.phone?.country && appData.phone?.number 
                                          ? `${appData.phone.country} ${appData.phone.number}` 
                                          : 'Not provided';
                                        return <span>{phone}</span>;
                                      })()}
                                      {appData.facebook_url && (
                                        <a
                                          href={appData.facebook_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800"
                                        >
                                          <Facebook className="h-3 w-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                 {/* Column 3: Status Button (20ch) - только для десктопа */}
                                  <div className="w-[20ch] flex-shrink-0 p-4 pl-0 flex flex-col gap-2 -mt-[20px]">
                                   {/* Status dropdown at the top - desktop */}
                                   {!showDeletedApplications && (
                                      <Select 
                                        value={(() => {
                                           // Используем только admin_status
                                           const weeklyParticipant = weeklyParticipants.find(p => p.user_id === application.user_id);
                                           return weeklyParticipant ? weeklyParticipant.admin_status : 'pending';
                                         })()} 
                                        onValueChange={(newStatus) => {
                                          if (newStatus === 'delete') {
                                            const appData = typeof application.application_data === 'string' 
                                              ? JSON.parse(application.application_data) 
                                              : application.application_data;
                                            setApplicationToDelete({ 
                                              id: application.id, 
                                              name: `${appData.firstName} ${appData.lastName}` 
                                            });
                                            setShowDeleteConfirmModal(true);
                                            return;
                                          }
                                          if (newStatus === 'rejected') {
                                            const appData = typeof application.application_data === 'string' 
                                              ? JSON.parse(application.application_data) 
                                              : application.application_data;
                                            setApplicationToReject({ 
                                              id: application.id, 
                                              name: `${appData.firstName} ${appData.lastName}` 
                                            });
                                            setRejectModalOpen(true);
                                            return;
                                          }
                                          reviewApplication(application.id, newStatus as ParticipantStatus);
                                        }}
                                     >
                                        <SelectTrigger 
                                           className={`w-[60%] h-7 text-xs ${
                                             (() => {
                                               const participant = weeklyParticipants.find(p => p.user_id === application.user_id);
                                               const status = participant ? participant.admin_status : 'pending';
                                               return status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
                                                      status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' : '';
                                             })()
                                           }`}
                                       >
                                         <SelectValue />
                                       </SelectTrigger>
                                           <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                              <SelectItem value="pending">Pending</SelectItem>
                                              <SelectItem value="approved">Approved</SelectItem>
                                              <SelectItem value="rejected">Rejected</SelectItem>
                                              <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                              <SelectItem value="next week">Next Week</SelectItem>
                                              <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                              <SelectItem value="this week">This Week</SelectItem>
                                              <SelectItem value="past">Past</SelectItem>
                                            </SelectContent>
                                     </Select>
                                   )}
                                   
                                   {/* Status change date with reviewer login - desktop */}
                                    <div 
                                      className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                                      onClick={() => {
                                        setEditHistoryApplicationId(application.id);
                                        setShowEditHistory(true);
                                      }}
                                    >
                                      {(() => {
                                        const statusDate = application.reviewed_at || application.approved_at || application.rejected_at || application.submitted_at;
                                        if (statusDate) {
                                          const date = new Date(statusDate);
                                          const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                          const dateStr = date.toLocaleDateString('en-GB', { 
                                            day: 'numeric', 
                                            month: 'short'
                                          }).toLowerCase();
                                         const reviewerEmail = application.reviewed_by && profiles.find(p => p.id === application.reviewed_by)?.email;
                                         const reviewerLogin = reviewerEmail ? reviewerEmail.substring(0, 4) : 'syst';
                                         return (
                                           <>
                                             <span className="text-blue-600">{reviewerLogin}</span>
                                             {` ${time} - ${dateStr}`}
                                           </>
                                         );
                                       }
                                       return '';
                                     })()}
                                   </div>
                                 </div>
                              </div>
                              
                              {/* Mobile layout - horizontal with full width */}
                              <div className="md:hidden">
                                <div className="flex w-full">
                                  {/* Photos section - left side */}
                                  <div className="flex gap-px w-[50vw] flex-shrink-0">
                                      {appData.photo1_url && (
                                        <div className="w-1/2">
                                          <img 
                                            src={appData.photo1_url} 
                                            alt="Portrait" 
                                            className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                          />
                                        </div>
                                      )}
                                       {appData.photo2_url && (
                                         <div className="w-1/2 relative">
                                           <img 
                                             src={appData.photo2_url} 
                                             alt="Full length" 
                                             className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                             onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 1, `${appData.first_name} ${appData.last_name}`)}
                                           />
                                           {/* User avatar positioned in top right corner */}
                                           <div className="absolute top-2 right-2">
                                             <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                                               <AvatarImage src={userProfile?.avatar_url || ''} />
                                               <AvatarFallback className="text-xs">
                                                 {appData.first_name?.charAt(0) || 'U'}
                                               </AvatarFallback>
                                             </Avatar>
                                           </div>
                                         </div>
                                       )}
                                    </div>
                                    
                                       {/* Information section - right side */}
                                        <div className="w-[50vw] flex-shrink-0 pl-2 flex flex-col h-48 relative">
                                        <div className="flex items-center gap-2 mb-1 mt-1">
                                           <span className="text-xs font-semibold whitespace-nowrap">
                                             {new Date().getFullYear() - appData.birth_year} {appData.first_name} {appData.last_name}
                                           </span>
                                        </div>
                                       
                                         <div 
                                           className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors"
                                           onClick={() => {
                                             const newExpanded = new Set(expandedMobileItems);
                                             if (expandedMobileItems.has(application.id)) {
                                               newExpanded.delete(application.id);
                                             } else {
                                               newExpanded.add(application.id);
                                             }
                                             setExpandedMobileItems(newExpanded);
                                           }}
                                         >
                                           {appData.city} {appData.country}
                                         </div>
                                        
                                            {/* Expanded information */}
                                             {expandedMobileItems.has(application.id) && (
                                               <div className="text-xs text-muted-foreground mb-1 space-y-0 leading-none">
                                                 <div>{appData.weight_kg}kg, {appData.height_cm}cm</div>
                                                 <div>{appData.marital_status}, {appData.has_children ? 'Has kids' : 'No kids'}</div>
                                                 <div className="flex items-center gap-1">
                                                   <span>
                                                     {userProfile?.email 
                                                       ? (userProfile.email.length > 7 ? `${userProfile.email.substring(0, 7)}...` : userProfile.email)
                                                       : 'No email'
                                                     }
                                                   </span>
                                                   {userProfile?.email && (
                                                     <Copy 
                                                       className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                                       onClick={() => navigator.clipboard.writeText(userProfile.email)}
                                                     />
                                                   )}
                                                 </div>
                                                 <div>
                                                   {(() => {
                                                     const phone = appData.phone?.country && appData.phone?.number 
                                                       ? `${appData.phone.country} ${appData.phone.number}` 
                                                       : 'No phone';
                                                     const facebook = appData.facebook_url ? (
                                                       <a
                                                         href={appData.facebook_url}
                                                         target="_blank"
                                                         rel="noopener noreferrer"
                                                         className="text-blue-600 hover:text-blue-800"
                                                       >
                                                         fb
                                                       </a>
                                                     ) : 'no fb';
                                                     return (
                                                       <span>
                                                         {phone} {facebook}
                                                       </span>
                                                     );
                                                   })()}
                                                 </div>
                                               </div>
                                             )}
                                           
                                             <div className="flex-1"></div>
                                          
                                              {/* Status filter positioned at bottom */}
                                               {!showDeletedApplications && (
                                                 <div className="absolute bottom-12 right-13 flex items-center gap-2">
                                             <Select 
                                               value={application.admin_status}
                                                onValueChange={(newStatus) => {
                                                  if (newStatus === 'delete') {
                                                    const appData = typeof application.application_data === 'string' 
                                                      ? JSON.parse(application.application_data) 
                                                      : application.application_data;
                                                    setApplicationToDelete({ 
                                                      id: application.id, 
                                                      name: `${appData.firstName} ${appData.lastName}` 
                                                    });
                                                    setShowDeleteConfirmModal(true);
                                                    return;
                                                  }
                                                  if (newStatus === 'rejected') {
                                                    const appData = typeof application.application_data === 'string' 
                                                      ? JSON.parse(application.application_data) 
                                                      : application.application_data;
                                                    setApplicationToReject({ 
                                                      id: application.id, 
                                                      name: `${appData.firstName} ${appData.lastName}` 
                                                    });
                                                    setRejectModalOpen(true);
                                                    return;
                                                  }
                                                  reviewApplication(application.id, newStatus as ParticipantStatus);
                                                }}
                                             >
                                                <SelectTrigger 
                                                   className={`w-24 h-7 text-xs ${
                                                     ['this week', 'next week', 'past'].includes(application.admin_status) ? 'bg-green-100 border-green-500 text-green-700' :
                                                     application.admin_status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                                     ''
                                                   }`}
                                                >
                                                 <SelectValue />
                                               </SelectTrigger>
                                                  <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                                     <SelectItem value="pending">Pending</SelectItem>
                                                     <SelectItem value="approved">Approved</SelectItem>
                                                     <SelectItem value="rejected">Rejected</SelectItem>
                                                     <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                                     <SelectItem value="next week">Next Week</SelectItem>
                                                     <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                                     <SelectItem value="this week">This Week</SelectItem>
                                                     <SelectItem value="past">Past</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                             
                                              {/* Admin login with expandable date */}
                                               <div className="text-xs text-muted-foreground -mt-[5px]">
                                                 {(() => {
                                                   const statusDate = application.reviewed_at || application.approved_at || application.rejected_at || application.submitted_at;
                                                   const reviewerEmail = application.reviewed_by && profiles.find(p => p.id === application.reviewed_by)?.email;
                                                   const reviewerLogin = reviewerEmail ? reviewerEmail.substring(0, 3) : 'sys';
                                                   
                                                   const showDatePopup = async () => {
                                                     try {
                                                       // Fetch application history
                                                       const { data: history } = await supabase
                                                         .from('contest_application_history')
                                                         .select('*')
                                                         .eq('application_id', application.id)
                                                         .order('created_at', { ascending: true });

                                                       // Remove duplicates based on status, created_at, and changed_by
                                                       const uniqueHistory = (history || []).filter((entry, index, arr) => {
                                                         return arr.findIndex(e => 
                                                           e.status === entry.status &&
                                                           e.created_at === entry.created_at &&
                                                           e.changed_by === entry.changed_by
                                                         ) === index;
                                                       });

                                                       // Add system entry as first only if no history exists
                                                       const historyWithCurrent = [...uniqueHistory];
                                                       if (historyWithCurrent.length === 0) {
                                                         historyWithCurrent.unshift({
                                                           id: 'system',
                                                           application_id: application.id,
                                                           application_data: null,
                                                           status: 'pending',
                                                           notes: '',
                                                           rejection_reason_types: [],
                                                           created_at: application.submitted_at,
                                                           changed_by: '',
                                                           change_reason: 'Application submitted'
                                                         });
                                                       }

                                                       setApplicationHistory(historyWithCurrent);
                                                       setAdminDatePopup({
                                                         show: true,
                                                         date: '',
                                                         admin: '',
                                                         applicationId: application.id
                                                       });
                                                     } catch (error) {
                                                       console.error('Error fetching application history:', error);
                                                     }
                                                   };
                                                   
                                                   return (
                                                     <span 
                                                       className="text-blue-600 cursor-pointer hover:text-blue-800"
                                                       onClick={showDatePopup}
                                                     >
                                                       {reviewerLogin}
                                                     </span>
                                                   );
                                                 })()}
                                              </div>
                                           </div>
                                         )}
                                      </div>
                                </div>
                              </div>
                            </CardContent>
                        </Card>
        
         {/* Rejection reason under the card */}
        {(() => {
          const participant = weeklyParticipants.find(p => p.user_id === application.user_id);
          return participant && participant.admin_status === 'rejected';
        })() && ((application as any).rejection_reason_types || application.rejection_reason) && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-b-lg -mt-1">
             <div className="space-y-1 text-xs leading-tight">
               {(application as any).rejection_reason_types && (application as any).rejection_reason_types.length > 0 && (
                 <div className="text-destructive/80">
                   {/* Always show date and admin info if available */}
                   {(application.rejected_at || application.reviewed_at) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-black font-medium cursor-help">
                              {new Date(application.rejected_at || application.reviewed_at).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'short' 
                              }).toLowerCase()}{' '}
                              {application.reviewed_by && profiles.find(p => p.id === application.reviewed_by)?.email ? 
                                profiles.find(p => p.id === application.reviewed_by)?.email?.substring(0, 4) + ' ' : 
                                'unkn '}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {new Date(application.rejected_at || application.reviewed_at).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'short',
                                year: 'numeric'
                              }).toLowerCase()}{' '}
                              {new Date(application.rejected_at || application.reviewed_at).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {application.reviewed_by && profiles.find(p => p.id === application.reviewed_by)?.email && (
                                <><br />Admin: {profiles.find(p => p.id === application.reviewed_by)?.email}</>
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                   )}
                   {(application as any).rejection_reason_types
                     .filter((type: string) => type && REJECTION_REASONS[type as keyof typeof REJECTION_REASONS])
                     .map((type: string) => REJECTION_REASONS[type as keyof typeof REJECTION_REASONS])
                     .join(', ')}
                 </div>
               )}
               {application.rejection_reason && application.rejection_reason.trim() && !isReasonDuplicate(application.rejection_reason, (application as any).rejection_reason_types) && (
                 <div className="text-destructive/70">
                   <span className="font-medium">Additional comments:</span> {application.rejection_reason}
                 </div>
               )}
            </div>
          </div>
        )}
                        
                         {/* Previous applications for this user */}
                         {selectedUserApplications === application.user_id && (
                           <div className="mt-2 space-y-2">
                             {(showDeletedApplications ? deletedApplications : contestApplications)
                               .filter(app => app.user_id === application.user_id && app.id !== application.id)
                               .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                               .map((prevApp) => {
                                 const prevAppData = typeof prevApp.application_data === 'string' 
                                   ? JSON.parse(prevApp.application_data) 
                                   : prevApp.application_data;
                                 const prevSubmittedDate = new Date(prevApp.submitted_at);
                                 const prevUserProfile = profiles.find(p => p.id === prevApp.user_id);
                                 
                                 return (
                                   <Card key={prevApp.id} className="overflow-hidden relative mx-0 rounded-lg bg-muted/30 h-[149px]">
                                     {/* Edit button in bottom left corner */}
                                     {!showDeletedApplications && (
                                       <Button
                                         size="sm"
                                         variant="outline"
                                          onClick={() => {
                                            setEditingParticipantData(prevApp);
                                            setShowParticipationModal(true);
                                          }}
                                         className="absolute bottom-0 left-0 z-20 p-1 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background"
                                         title="Edit Application"
                                       >
                                         <Edit className="w-4 h-4" />
                                       </Button>
                                     )}
                                     
                                     <CardContent className="p-0">
                                       {/* Desktop layout */}
                                       <div className="hidden md:flex md:overflow-visible">
                                         {/* Column 1: Photos (25ch) */}
                                         <div className="w-[25ch] flex-shrink-0 p-0">
                                           <div className="flex gap-px">
                                             {prevAppData.photo1_url && (
                                               <div className="w-full">
                                                 <img 
                                                   src={prevAppData.photo1_url} 
                                                   alt="Portrait" 
                                                   className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                   onClick={() => openPhotoModal([prevAppData.photo1_url, prevAppData.photo2_url].filter(Boolean), 0, `${prevAppData.first_name} ${prevAppData.last_name}`)}
                                                 />
                                               </div>
                                             )}
                                             {prevAppData.photo2_url && (
                                               <div className="w-full">
                                                 <img 
                                                   src={prevAppData.photo2_url} 
                                                   alt="Full length" 
                                                   className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                   onClick={() => openPhotoModal([prevAppData.photo1_url, prevAppData.photo2_url].filter(Boolean), 1, `${prevAppData.first_name} ${prevAppData.last_name}`)}
                                                 />
                                               </div>
                                             )}
                                           </div>
                                         </div>

                                         {/* Column 2: Information (25ch) */}
                                         <div className="w-[25ch] flex-shrink-0 p-4">
                                           <div className="flex items-center gap-2 mb-1">
                                               <Avatar className="h-6 w-6 flex-shrink-0">
                                                 <AvatarImage src={(() => {
                                                   const photoUrl = prevAppData.photo1_url || prevAppData.photo_1_url || prevUserProfile?.avatar_url || '';
                                                   console.log(`Photo URL for ${prevAppData.first_name}: photo1_url=${prevAppData.photo1_url}, photo_1_url=${prevAppData.photo_1_url}, avatar_url=${prevUserProfile?.avatar_url}, final=${photoUrl}`);
                                                   return photoUrl;
                                                 })()} />
                                               <AvatarFallback className="text-xs">
                                                 {prevAppData.first_name?.charAt(0) || 'U'}
                                               </AvatarFallback>
                                             </Avatar>
                                               <span className="text-sm font-semibold whitespace-nowrap flex items-center gap-1">
                                                 {/* Check if this participant is a winner - we'll need to look this up from weekly_contest_participants */}
                                                 {prevAppData.first_name} {prevAppData.last_name} {new Date().getFullYear() - prevAppData.birth_year}
                                               </span>
                                           </div>
                                           
                                           <div 
                                             className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors"
                                             onClick={() => {
                                               const newExpanded = new Set(expandedDesktopItems);
                                               if (expandedDesktopItems.has(prevApp.id)) {
                                                 newExpanded.delete(prevApp.id);
                                               } else {
                                                 newExpanded.add(prevApp.id);
                                               }
                                               setExpandedDesktopItems(newExpanded);
                                             }}
                                           >
                                             {prevAppData.city} {prevAppData.state} {prevAppData.country}
                                           </div>
                                           
                                           {/* Expanded information - desktop */}
                                           {expandedDesktopItems.has(prevApp.id) && (
                                             <div className="text-xs text-muted-foreground mb-1">
                                               {prevAppData.weight_kg}kg • {prevAppData.height_cm}cm • {prevAppData.gender} • {prevAppData.birth_year} • {prevAppData.marital_status} • {prevAppData.has_children ? 'Has children' : 'No children'}
                                             </div>
                                           )}

                                           <div className="text-xs text-muted-foreground mb-1">
                                             {prevUserProfile?.email && (
                                               <div className="flex items-center gap-1">
                                                 <span 
                                                   className="cursor-pointer" 
                                                   title={prevUserProfile.email}
                                                 >
                                                   {prevUserProfile.email.length > 25 ? `${prevUserProfile.email.substring(0, 25)}...` : prevUserProfile.email}
                                                 </span>
                                                 <Copy 
                                                   className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                                   onClick={() => navigator.clipboard.writeText(prevUserProfile.email)}
                                                 />
                                               </div>
                                             )}
                                           </div>

                                           {/* Phone and Social Media */}
                                           <div className="text-xs text-muted-foreground mb-3">
                                             <div className="flex items-center gap-2">
                                               {(() => {
                                                 const phone = prevAppData.phone?.country && prevAppData.phone?.number 
                                                   ? `${prevAppData.phone.country} ${prevAppData.phone.number}` 
                                                   : 'Not provided';
                                                 return <span>{phone}</span>;
                                               })()}
                                               {prevAppData.facebook_url && (
                                                 <a
                                                   href={prevAppData.facebook_url}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="text-blue-600 hover:text-blue-800"
                                                 >
                                                   <Facebook className="h-3 w-3" />
                                                 </a>
                                               )}
                                             </div>
                                           </div>
                                         </div>

                                          {/* Column 3: Status Button (20ch) - только для десктопа */}
                                          <div className="w-[20ch] flex-shrink-0 p-4 pl-0 flex flex-col gap-2">
                                            {/* Status dropdown at the top - desktop */}
                                            {!showDeletedApplications && (
                                              <Select 
                                                value={prevApp.admin_status} 
                                                 onValueChange={(newStatus) => {
                                                   if (newStatus === 'delete') {
                                                     const prevAppData = typeof prevApp.application_data === 'string' 
                                                       ? JSON.parse(prevApp.application_data) 
                                                       : prevApp.application_data;
                                                     setApplicationToDelete({ 
                                                       id: prevApp.id, 
                                                       name: `${prevAppData.first_name} ${prevAppData.last_name}` 
                                                     });
                                                     setShowDeleteConfirmModal(true);
                                                     return;
                                                   }
                                                   if (newStatus === 'rejected') {
                                                     const prevAppData = typeof prevApp.application_data === 'string' 
                                                       ? JSON.parse(prevApp.application_data) 
                                                       : prevApp.application_data;
                                                     setApplicationToReject({ 
                                                       id: prevApp.id, 
                                                       name: `${prevAppData.first_name} ${prevAppData.last_name}` 
                                                     });
                                                     setRejectModalOpen(true);
                                                     return;
                                                   }
                                                    reviewApplication(prevApp.id, newStatus as ParticipantStatus);
                                                 }}
                                              >
                                                <SelectTrigger 
                                                   className={`w-[60%] h-7 text-xs ${
                                                     ['this week', 'next week', 'past'].includes(prevApp.admin_status) ? 'bg-green-100 border-green-500 text-green-700' :
                                                     prevApp.admin_status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                                     ''
                                                   }`}
                                                >
                                                  <SelectValue />
                                                </SelectTrigger>
                                                   <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                                      <SelectItem value="pending">Pending</SelectItem>
                                                      <SelectItem value="approved">Approved</SelectItem>
                                                      <SelectItem value="rejected">Rejected</SelectItem>
                                                      <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                                      <SelectItem value="this week">This Week</SelectItem>
                                                      <SelectItem value="next week">Next Week</SelectItem>
                                                      <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                                      <SelectItem value="past">Past</SelectItem>
                                                    </SelectContent>
                                              </Select>
                                            )}
                                            
                                            {/* Status change date with reviewer login - desktop */}
                                             <div 
                                               className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                                               onClick={() => {
                                                 setEditHistoryApplicationId(prevApp.id);
                                                 setShowEditHistory(true);
                                               }}
                                              >
                                                {(() => {
                                                  const statusDate = prevApp.reviewed_at || prevApp.submitted_at;
                                                  if (statusDate) {
                                                   const date = new Date(statusDate);
                                                   const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                                   const dateStr = date.toLocaleDateString('en-GB', { 
                                                     day: 'numeric', 
                                                     month: 'short'
                                                   }).toLowerCase();
                                                  const reviewerEmail = prevApp.reviewed_by && profiles.find(p => p.id === prevApp.reviewed_by)?.email;
                                                  const reviewerLogin = reviewerEmail ? reviewerEmail.substring(0, 4) : 'syst';
                                                  return (
                                                    <>
                                                      <span className="text-blue-600">{reviewerLogin}</span>
                                                      {` ${time} - ${dateStr}`}
                                                    </>
                                                  );
                                                }
                                                return '';
                                              })()}
                                            </div>
                                          </div>
                                       </div>
                                       
                                       {/* Mobile layout - horizontal with full width */}
                                       <div className="md:hidden">
                                         <div className="flex w-full">
                                           {/* Photos section - left side */}
                                           <div className="flex gap-px w-[50vw] flex-shrink-0">
                                               {prevAppData.photo1_url && (
                                                 <div className="w-1/2">
                                                   <img 
                                                     src={prevAppData.photo1_url} 
                                                     alt="Portrait" 
                                                     className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                     onClick={() => openPhotoModal([prevAppData.photo1_url, prevAppData.photo2_url].filter(Boolean), 0, `${prevAppData.first_name} ${prevAppData.last_name}`)}
                                                   />
                                                 </div>
                                               )}
                                                {prevAppData.photo2_url && (
                                                  <div className="w-1/2 relative">
                                                    <img 
                                                      src={prevAppData.photo2_url} 
                                                      alt="Full length" 
                                                      className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                      onClick={() => openPhotoModal([prevAppData.photo1_url, prevAppData.photo2_url].filter(Boolean), 1, `${prevAppData.first_name} ${prevAppData.last_name}`)}
                                                    />
                                                    {/* User avatar positioned in top right corner */}
                                                    <div className="absolute top-2 right-2">
                                                       <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                                                          <AvatarImage src={(() => {
                                                            const photoUrl = prevAppData.photo1_url || prevAppData.photo_1_url || prevUserProfile?.avatar_url || '';
                                                            console.log(`Avatar photo URL for ${prevAppData.first_name}: photo1_url=${prevAppData.photo1_url}, photo_1_url=${prevAppData.photo_1_url}, avatar_url=${prevUserProfile?.avatar_url}, final=${photoUrl}`);
                                                            return photoUrl;
                                                          })()} />
                                                        <AvatarFallback className="text-xs">
                                                          {prevAppData.first_name?.charAt(0) || 'U'}
                                                        </AvatarFallback>
                                                      </Avatar>
                                                    </div>
                                                  </div>
                                                )}
                                             </div>
                                             
                                               {/* Information section - right side */}
                                               <div className="w-[50vw] flex-shrink-0 pl-2 flex flex-col h-40">
                                                <div className="flex items-center gap-2 mb-1 mt-1">
                                                   <span className="text-xs font-semibold whitespace-nowrap">
                                                     {new Date().getFullYear() - prevAppData.birth_year} {prevAppData.first_name} {prevAppData.last_name}
                                                   </span>
                                                </div>
                                                
                                                 <div 
                                                   className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors"
                                                   onClick={() => {
                                                     const newExpanded = new Set(expandedMobileItems);
                                                     if (expandedMobileItems.has(prevApp.id)) {
                                                       newExpanded.delete(prevApp.id);
                                                     } else {
                                                       newExpanded.add(prevApp.id);
                                                     }
                                                     setExpandedMobileItems(newExpanded);
                                                   }}
                                                 >
                                                   {prevAppData.city} {prevAppData.country}
                                                 </div>
                                                 
                                                  {/* Expanded information */}
                                                  {expandedMobileItems.has(prevApp.id) && (
                                                    <div className="text-xs text-muted-foreground mb-1 space-y-0 leading-none">
                                                      <div>{prevAppData.weight_kg}kg, {prevAppData.height_cm}cm</div>
                                                      <div>{prevAppData.marital_status}, {prevAppData.has_children ? 'Has kids' : 'No kids'}</div>
                                                      <div className="flex items-center gap-1">
                                                        <span>
                                                          {prevUserProfile?.email 
                                                            ? (prevUserProfile.email.length > 7 ? `${prevUserProfile.email.substring(0, 7)}...` : prevUserProfile.email)
                                                            : 'No email'
                                                          }
                                                        </span>
                                                        {prevUserProfile?.email && (
                                                          <Copy 
                                                            className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                                            onClick={() => navigator.clipboard.writeText(prevUserProfile.email)}
                                                          />
                                                        )}
                                                      </div>
                                                      <div>
                                                        {(() => {
                                                          const phone = prevAppData.phone?.country && prevAppData.phone?.number 
                                                            ? `${prevAppData.phone.country} ${prevAppData.phone.number}` 
                                                            : 'No phone';
                                                          const facebook = prevAppData.facebook_url ? (
                                                            <a
                                                              href={prevAppData.facebook_url}
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              className="text-blue-600 hover:text-blue-800"
                                                            >
                                                              fb
                                                            </a>
                                                          ) : 'no fb';
                                                          return (
                                                            <span>
                                                              {phone} {facebook}
                                                            </span>
                                                          );
                                                        })()}
                                                      </div>
                                                    </div>
                                                  )}
                                                  
                                                  <div className="flex-1"></div>
                                                 
                                                 
                                                  {/* Status filter with admin login on the same line */}
                                                   {!showDeletedApplications && (
                                                     <div className="mb-2 flex items-center gap-2">
                                                      <Select 
                                                        value={prevApp.admin_status}
                                                         onValueChange={(newStatus) => {
                                                           if (newStatus === 'delete') {
                                                             const prevAppData = typeof prevApp.application_data === 'string' 
                                                               ? JSON.parse(prevApp.application_data) 
                                                               : prevApp.application_data;
                                                             setApplicationToDelete({ 
                                                               id: prevApp.id, 
                                                               name: `${prevAppData.first_name} ${prevAppData.last_name}` 
                                                             });
                                                             setShowDeleteConfirmModal(true);
                                                             return;
                                                           }
                                                           if (newStatus === 'rejected') {
                                                             const prevAppData = typeof prevApp.application_data === 'string' 
                                                               ? JSON.parse(prevApp.application_data) 
                                                               : prevApp.application_data;
                                                             setApplicationToReject({ 
                                                               id: prevApp.id, 
                                                               name: `${prevAppData.first_name} ${prevAppData.last_name}` 
                                                             });
                                                             setRejectModalOpen(true);
                                                             return;
                                                           }
                                                           reviewApplication(prevApp.id, newStatus as ParticipantStatus);
                                                         }}
                                                      >
                                                         <SelectTrigger 
                                                            className={`w-24 h-7 text-xs ${
                                                              ['this week', 'next week', 'past'].includes(prevApp.admin_status) ? 'bg-green-100 border-green-500 text-green-700' :
                                                              prevApp.admin_status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                                              ''
                                                            }`}
                                                         >
                                                          <SelectValue />
                                                        </SelectTrigger>
                                                           <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                                              <SelectItem value="pending">Pending</SelectItem>
                                                              <SelectItem value="approved">Approved</SelectItem>
                                                              <SelectItem value="rejected">Rejected</SelectItem>
                                                              <SelectItem value="pre next week">Pre Next Week</SelectItem>
                                                              <SelectItem value="this week">This Week</SelectItem>
                                                              <SelectItem value="next week">Next Week</SelectItem>
                                                              <SelectItem value="next week on site">Next Week On Site</SelectItem>
                                                              <SelectItem value="past">Past</SelectItem>
                                                            </SelectContent>
                                                      </Select>
                                                      
                                                        {/* Admin login with expandable date */}
                                                         <div className="text-xs text-muted-foreground -mt-[5px]">
                                                           {(() => {
                                                             const statusDate = prevApp.reviewed_at || prevApp.submitted_at;
                                                             const reviewerEmail = prevApp.reviewed_by && profiles.find(p => p.id === prevApp.reviewed_by)?.email;
                                                            const reviewerLogin = reviewerEmail ? reviewerEmail.substring(0, 3) : 'sys';
                                                            
                                                            return (
                                                              <span 
                                                                className="text-blue-600 cursor-pointer hover:text-blue-800"
                                                                onClick={() => {
                                                                  setEditHistoryApplicationId(prevApp.id);
                                                                  setShowEditHistory(true);
                                                                }}
                                                              >
                                                                {reviewerLogin}
                                                              </span>
                                                            );
                                                          })()}
                                                       </div>
                                                    </div>
                                                  )}
                                               </div>
                                         </div>
                                       </div>
                                       </CardContent>
                                      
                                       {/* Rejection reason under the card for previous applications */}
                                      {prevApp.admin_status === 'rejected' && prevApp.notes && (
                                        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-b-lg -mt-1">
                                           <div className="space-y-1 text-xs leading-tight">
                                             <div className="text-destructive/80">
                                               {/* Always show date and admin info if available */}
                                               {prevApp.reviewed_at && (
                                                  <TooltipProvider>
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
                                                        <span className="text-black font-medium cursor-help">
                                                          {new Date(prevApp.reviewed_at).toLocaleDateString('en-GB', { 
                                                            day: 'numeric', 
                                                            month: 'short' 
                                                          }).toLowerCase()}{' '}
                                                          {prevApp.reviewed_by && profiles.find(p => p.id === prevApp.reviewed_by)?.email ? 
                                                            profiles.find(p => p.id === prevApp.reviewed_by)?.email?.substring(0, 4) + ' ' : 
                                                            'unkn '}
                                                        </span>
                                                      </TooltipTrigger>
                                                      <TooltipContent>
                                                        <p>
                                                          {new Date(prevApp.reviewed_at).toLocaleDateString('en-GB', { 
                                                            day: 'numeric', 
                                                            month: 'short',
                                                            year: 'numeric'
                                                          }).toLowerCase()}{' '}
                                                          {new Date(prevApp.reviewed_at).toLocaleTimeString('en-GB', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                          })}
                                                          {prevApp.reviewed_by && profiles.find(p => p.id === prevApp.reviewed_by)?.email && (
                                                            <><br />Admin: {profiles.find(p => p.id === prevApp.reviewed_by)?.email}</>
                                                          )}
                                                        </p>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  </TooltipProvider>
                                               )}
                                             </div>
                                             {prevApp.notes && prevApp.notes.trim() && (
                                               <div className="text-destructive/70">
                                                 <span className="font-medium">Rejection notes:</span> {prevApp.notes}
                                               </div>
                                              )}
                                           </div>
                                         </div>
                                       )}
                                    </Card>
                                  );
                                })}
                            </div>
                         )}
                        
                       </div>
                     );
                    })}
                        
                        {/* Pagination for applications */}
                        {totalApplicationPages > 1 && (
                          <div className="flex justify-center items-center space-x-2 mt-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setApplicationCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={applicationCurrentPage === 1}
                            >
                              Предыдущая
                            </Button>
                            
                            <div className="flex space-x-1">
                              {Array.from({ length: totalApplicationPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                  key={page}
                                  variant={page === applicationCurrentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setApplicationCurrentPage(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              ))}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setApplicationCurrentPage(prev => Math.min(prev + 1, totalApplicationPages))}
                              disabled={applicationCurrentPage === totalApplicationPages}
                            >
                              Следующая
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
               </div>
              </TabsContent>

              <TabsContent value="registrations" className="space-y-4">
                
                {/* Weekly Registration Stats Dashboard */}
                <div className="mb-6">
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="text-xs">
                        total registrations: {dailyRegistrationStats.reduce((sum, stat) => sum + (stat.registration_count || 0), 0)}, 
                        verified: {profiles.filter(p => p.is_approved).length}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {dailyRegistrationStats.map((stat, index) => (
                          <div key={index} className="text-center p-1 bg-background rounded">
                            <div className="font-medium text-xs">{stat.day_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {stat.registration_count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Combined filters in one row */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={verificationFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVerificationFilter('all')}
                  >
                    All Users
                  </Button>
                  <Button
                    variant={verificationFilter === 'unverified' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVerificationFilter('unverified')}
                  >
                    Unverified
                  </Button>
                  <Button
                    variant={roleFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRoleFilter('all')}
                  >
                    All Roles
                  </Button>
                  <Button
                    variant={roleFilter === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRoleFilter('admin')}
                  >
                    Admin
                  </Button>
                </div>

                <div className="grid gap-4">
                  {profiles
                    .filter(profile => {
                      // Фильтр верификации
                      if (verificationFilter === 'verified') {
                        if (!profile.email_confirmed_at) return false;
                      } else if (verificationFilter === 'unverified') {
                        if (profile.email_confirmed_at) return false;
                      }
                      
                      // Фильтр ролей
                      const userRole = userRoleMap[profile.id] || 'usual';
                      if (roleFilter === 'admin') {
                        return userRole === 'admin';
                      } else if (roleFilter === 'usual') {
                        return userRole === 'usual' || !userRole;
                      }
                      
                      return true;
                    })
                     .map(profile => (
                       <Card key={profile.id} className="p-4 relative overflow-hidden">
                          {/* Registration date badge in top left corner */}
                          <Badge 
                            variant="outline" 
                            className="absolute top-0 left-0 text-xs bg-background/50 backdrop-blur-sm font-normal rounded-none rounded-br-md"
                          >
                            {new Date(profile.created_at).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </Badge>
                          
                          {/* Controls row at top right */}
                          <div className="flex items-center justify-end gap-2 mb-2">
                            <Select
                              value={userRoleMap[profile.id] || 'usual'}
                              onValueChange={(value) => handleRoleChange(
                                profile.id, 
                                profile.display_name || `${profile.first_name} ${profile.last_name}`,
                                value
                              )}
                              disabled={assigningRoles.has(profile.id)}
                            >
                              <SelectTrigger className="w-20 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                               <SelectContent className="z-[9999] bg-popover border shadow-lg">
                                 <SelectItem value="usual">Usual</SelectItem>
                                 <SelectItem value="admin">Admin</SelectItem>
                               </SelectContent>
                            </Select>
                            
                            {profile.email_confirmed_at ? (
                              <Badge variant="default" className="bg-green-100 text-green-700 text-xs">
                                Verified
                              </Badge>
                            ) : (
                              <>
                                <Badge variant="secondary" className="text-xs">
                                  Unverified
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEmailVerification(profile.id)}
                                  disabled={verifyingUsers.has(profile.id)}
                                  className="h-6 px-2 text-xs"
                                >
                                  {verifyingUsers.has(profile.id) ? 'Verifying...' : 'Verify'}
                                </Button>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={profile.avatar_url || ''} />
                                <AvatarFallback>
                                  {profile.display_name?.charAt(0) || profile.first_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {profile.display_name || `${profile.first_name} ${profile.last_name}`}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {profile.email}
                                </div>
                              </div>
                            </div>
            
            {/* Right side - empty now since controls moved above name */}
            <div className="hidden md:flex items-center gap-2">
            </div>
            
            {/* Mobile - empty now since controls moved above name */}
            <div className="block md:hidden">
            </div>
                         </div>
                       </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="winnercontent" className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Управление контентом победителей</h2>
                  <p className="text-muted-foreground">Добавление и редактирование дополнительного контента для карточек победительниц</p>
                </div>

                <div className="space-y-6">
                  {weeklyParticipants
                    .filter(p => p.final_rank === 1) // Show only winners
                    .map(participant => (
                    <div key={participant.id} className="border rounded-lg p-4">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium">
                          {participant.profiles?.first_name} {participant.profiles?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Победительница недели {participant.contest_start_date && new Date(participant.contest_start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <WinnerContentManager 
                        participantId={participant.id}
                        userId={participant.user_id}
                        participantName={`${participant.profiles?.first_name || ''} ${participant.profiles?.last_name || ''}`}
                      />
                    </div>
                  ))}
                  
                  {weeklyParticipants.filter(p => p.final_rank === 1).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Нет победителей для отображения
                    </div>
                  )}
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </div>

      {/* Admin Photo Modal */}
      <AdminPhotoModal
        photos={photoModalImages}
        currentIndex={photoModalIndex}
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        contestantName={photoModalName}
      />

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
         onConfirm={async (reasonTypes, notes) => {
           if (applicationToReject) {
             // Check if this is a weekly contest participant or regular application
             const isWeeklyParticipant = filteredWeeklyParticipants.some(p => p.id === applicationToReject.id);
             
             if (isWeeklyParticipant) {
               // For weekly contest participants, remove them from the contest and reject their application
               const participant = filteredWeeklyParticipants.find(p => p.id === applicationToReject.id);
               if (participant) {
                 try {
                   // Remove from weekly contest
                   const { error: removeError } = await supabase
                     .from('weekly_contest_participants')
                     .update({ is_active: false })
                     .eq('id', participant.id);
                   
                   if (removeError) {
                     console.error('Error removing from weekly contest:', removeError);
                     toast({
                       title: "Error",
                       description: `Failed to remove from weekly contest: ${removeError.message}`,
                       variant: "destructive"
                     });
                     return;
                   }
                    
                    // Update admin_status instead of old status field
                    if (participant.user_id) {
                      const { error: statusUpdateError } = await supabase
                        .from('weekly_contest_participants')
                        .update({ admin_status: 'rejected' })
                        .eq('user_id', participant.user_id)
                        .eq('is_active', true);
                      
                      if (statusUpdateError) {
                        console.error('Error updating admin_status:', statusUpdateError);
                      }
                    }
                   
                   // Remove participant filter
                   setParticipantFilters(prev => {
                     const newFilters = { ...prev };
                     delete newFilters[participant.id];
                     return newFilters;
                   });
                   
                   toast({
                     title: "Success",
                     description: "Participant rejected and moved to Card section",
                   });
                 } catch (error) {
                   console.error('Error rejecting participant:', error);
                   toast({
                     title: "Error",
                     description: "Failed to reject participant",
                     variant: "destructive"
                   });
                 }
               }
             } else {
               // Regular application rejection
               await reviewApplication(applicationToReject.id, 'rejected', { reasonTypes, notes });
              }
              
              setApplicationToReject(null);
              setRejectModalOpen(false);
            }
          }}
       />

       {/* Voters Modal */}
       <VotersModal
         isOpen={votersModalOpen}
         onClose={() => setVotersModalOpen(false)}
         participantId={selectedParticipantForVoters?.id || ''}
         participantName={selectedParticipantForVoters?.name || ''}
       />

       {/* Contest Participation Modal for editing */}
       <ContestParticipationModal 
         isOpen={showParticipationModal}
         onOpenChange={(open) => {
          setShowParticipationModal(open);
          if (!open) {
            setEditingParticipantData(null);
          }
        }}
        editMode={true}
        existingData={editingParticipantData}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete the application for <strong>{applicationToDelete?.name}</strong>?</p>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <Label htmlFor="delete-confirm">Type "DELETE" to confirm:</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowDeleteConfirmModal(false);
                setDeleteConfirmText('');
                setApplicationToDelete(null);
              }}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  if (applicationToDelete && deleteConfirmText === 'DELETE') {
                    deleteApplication(applicationToDelete.id);
                    setShowDeleteConfirmModal(false);
                    setDeleteConfirmText('');
                    setApplicationToDelete(null);
                  }
                }}
              >
                Delete Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Application Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-center">Edit Application</DialogTitle>
          </DialogHeader>
          {editingApplicationData && (
            <ScrollArea className="max-h-[80vh] px-6 pb-6">
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-first-name">First Name *</Label>
                      <Input
                        id="edit-first-name"
                        value={editingApplicationData.application_data?.firstName || ''}
                        onChange={(e) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            firstName: e.target.value
                          }
                        }))}
                        className="mt-1"
                       />
                     </div>
                    <div>
                      <Label htmlFor="edit-last-name">Last Name *</Label>
                      <Input
                        id="edit-last-name"
                        value={editingApplicationData.application_data?.lastName || ''}
                        onChange={(e) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            lastName: e.target.value
                          }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-country">Country *</Label>
                      <Select
                        value={editingApplicationData.application_data?.country || ''}
                        onValueChange={(value) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            country: value
                          }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PH">Philippines</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-state">State/Province *</Label>
                      <Input
                        id="edit-state"
                        value={editingApplicationData.application_data?.state || ''}
                        onChange={(e) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            state: e.target.value
                          }
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-city">City *</Label>
                      <Input
                        id="edit-city"
                        value={editingApplicationData.application_data?.city || ''}
                        onChange={(e) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            city: e.target.value
                          }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-gender">Gender *</Label>
                      <Select
                        value={editingApplicationData.application_data?.gender || ''}
                        onValueChange={(value) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            gender: value
                          }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-age">Age *</Label>
                      <Input
                        id="edit-age"
                        type="number"
                        value={editingApplicationData.application_data?.age || ''}
                        onChange={(e) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            age: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-marital-status">Marital Status</Label>
                      <Select
                        value={editingApplicationData.application_data?.marital_status || ''}
                        onValueChange={(value) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            marital_status: value
                          }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-has-children">Do you have children?</Label>
                      <Select
                        value={editingApplicationData.application_data?.has_children?.toString() || ''}
                        onValueChange={(value) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            has_children: value === 'true'
                          }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Physical Measurements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Physical Measurements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-height">Height (cm) *</Label>
                      <Input
                        id="edit-height"
                        type="number"
                        value={editingApplicationData.application_data?.height || ''}
                        onChange={(e) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            height: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="mt-1"
                        placeholder="e.g. 165"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-weight">Weight (kg) *</Label>
                      <Input
                        id="edit-weight"
                        type="number"
                        value={editingApplicationData.application_data?.weight || ''}
                        onChange={(e) => setEditingApplicationData(prev => ({
                          ...prev,
                          application_data: {
                            ...prev.application_data,
                            weight: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="mt-1"
                        placeholder="e.g. 55"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingApplicationData(null);
                      setEditingApplicationId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    onClick={async () => {
                      if (editingApplicationData && editingApplicationId) {
                        try {
                          const { error } = await supabase
                            .from('weekly_contest_participants')
                            .update({
                              application_data: editingApplicationData.application_data
                            } as any)
                            .eq('id', editingApplicationId);

                          if (error) {
                            toast({
                              title: "Error",
                              description: "Failed to update application",
                              variant: "destructive"
                            });
                          } else {
                            toast({
                              title: "Success",
                              description: "Application updated successfully"
                            });
                            setShowEditModal(false);
                            setEditingApplicationData(null);
                            setEditingApplicationId(null);
                            fetchContestApplications();
                          }
                        } catch (err) {
                          toast({
                            title: "Error",
                            description: "An unexpected error occurred",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Application Edit History */}
      <ApplicationEditHistory
        applicationId={editHistoryApplicationId || ''}
        isOpen={showEditHistory}
        onClose={() => setShowEditHistory(false)}
      />
      {/* Role Change Confirmation Modal */}
      <Dialog open={showRoleConfirmModal} onOpenChange={setShowRoleConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Confirm Admin Role Assignment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              You are about to assign administrator privileges to:
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">{roleChangeUser?.name}</div>
              <div className="text-sm text-muted-foreground">This will grant full administrative access to the system.</div>
            </div>
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
              <strong>Warning:</strong> Administrators have full access to all system functions including user management, contest controls, and sensitive data.
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRoleConfirmModal(false);
                setRoleChangeUser(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRoleChange}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Confirm Admin Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Next Week Voters Modal */}
      <NextWeekVotersModal
        isOpen={nextWeekVotersModalOpen}
        onClose={() => setNextWeekVotersModalOpen(false)}
        participantName={selectedParticipantForNextWeekVoters}
      />

      {/* Winner Content Manager Modal */}
      <Dialog open={showWinnerContentModal} onOpenChange={setShowWinnerContentModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Управление контентом победительницы</DialogTitle>
          </DialogHeader>
          {selectedWinner && (
            <WinnerContentManager
              participantId={selectedWinner.participantId}
              userId={selectedWinner.userId}
              participantName={selectedWinner.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Status History Modal */}
      {selectedStatusHistory && (
        <ParticipantStatusHistoryModal
          isOpen={statusHistoryModalOpen}
          onClose={() => {
            setStatusHistoryModalOpen(false);
            setSelectedStatusHistory(null);
          }}
          participantName={selectedStatusHistory.participantName}
          statusHistory={selectedStatusHistory.statusHistory}
        />
      )}
    </>
  );
};

export default Admin;

