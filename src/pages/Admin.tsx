import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from '@/utils/performance';
import { Helmet } from 'react-helmet-async';
import { UAParser } from 'ua-parser-js';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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

// Unified status type for participants - only real statuses from DB
type ParticipantStatus = 'pending' | 'rejected' | 'pre next week' | 'this week' | 'next week' | 'next week on site' | 'past';

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
  ip_address?: string | null;
  user_agent?: string | null;
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
  submitted_at?: string; // Add submitted_at field for sorting
  contest_start_date?: string; // Add this field for filtering by week
  is_active: boolean;
  admin_status?: string;
  participant_status?: string; // Add participant_status field
  deleted_at?: string | null; // Add deleted_at field
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


const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');
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
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('all'); // For Weekly tab
  const [registrationsStatusFilter, setRegistrationsStatusFilter] = useState<string>('all'); // For Registrations/New tab
  const [allSectionStatusFilter, setAllSectionStatusFilter] = useState<string>('all');
  const [deletedParticipantsAll, setDeletedParticipantsAll] = useState<any[]>([]);
  const [showDeletedAll, setShowDeletedAll] = useState(false);
  const [deleteConfirmParticipant, setDeleteConfirmParticipant] = useState<{ id: string; name: string } | null>(null);
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
  const [weeklyCurrentPage, setWeeklyCurrentPage] = useState(1);
  const [preNextWeekCurrentPage, setPreNextWeekCurrentPage] = useState(1);
  const [nextWeekCurrentPage, setNextWeekCurrentPage] = useState(1);
  const [allCurrentPage, setAllCurrentPage] = useState(1);
  const [registrationsCurrentPage, setRegistrationsCurrentPage] = useState(1);
  const [pastWeekIntervalFilter, setPastWeekIntervalFilter] = useState<string>('all'); // Новый фильтр для интервалов недель
   const [expandedAdminDates, setExpandedAdminDates] = useState<Set<string>>(new Set());
   const [adminDatePopup, setAdminDatePopup] = useState<{ show: boolean; date: string; admin: string; applicationId: string }>({ 
     show: false, date: '', admin: '', applicationId: '' 
   });
   const [applicationHistory, setApplicationHistory] = useState<any[]>([]);
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
  const [dailyApplicationStats, setDailyApplicationStats] = useState<Array<{ day_name: string; day_date?: string; total_applications: number; approved_applications: number; day_of_week?: number; sort_order?: number }>>([]);
  const [dailyRegistrationStats, setDailyRegistrationStats] = useState<Array<{ day_name: string; registration_count: number; day_of_week: number; sort_order: number }>>([]);
  const [nextWeekDailyStats, setNextWeekDailyStats] = useState<Array<{ day_name: string; like_count: number; dislike_count: number; total_votes: number }>>([]);
  const [selectedDay, setSelectedDay] = useState<{ day: number; type: 'new' | 'approved' } | null>(null);
  const [nextWeekApplicationsCount, setNextWeekApplicationsCount] = useState<number>(0);
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
    participantName: string,
    additionalData?: {
      rejection_reason_types?: string[];
      rejection_reason?: string | null;
      reviewed_at?: string;
      reviewed_by?: string;
    }
  ): Promise<{ success: boolean; error?: any }> => {
    try {
      console.log('🟢 updateParticipantStatusWithHistory called:', { participantId, newStatus, participantName, additionalData });
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('🟢 ERROR: No authenticated user');
        return { success: false, error: 'No authenticated user' };
      }
      console.log('🟢 Current user ID:', user.id);

      // Get week interval for the status
      const weekInterval = getWeekIntervalForStatus(newStatus);
      console.log('🟢 Week interval:', weekInterval);
      
      // Get current participant data to update status_history
      const { data: currentParticipant, error: fetchError } = await supabase
        .from('weekly_contest_participants')
        .select('status_history')
        .eq('id', participantId)
        .single();

      if (fetchError) {
        console.error('🟢 ERROR fetching current participant:', fetchError);
        return { success: false, error: fetchError };
      }
      console.log('🟢 Current participant data:', currentParticipant);

      // Parse existing status_history or create new one
      let statusHistory: any = {};
      try {
        statusHistory = typeof currentParticipant.status_history === 'string' 
          ? JSON.parse(currentParticipant.status_history) 
          : (currentParticipant.status_history || {});
      } catch (e) {
        console.error('🟢 Error parsing status_history:', e);
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
      console.log('🟢 Updated status_history:', statusHistory);

      // Prepare update data
      const updateData: any = {
        admin_status: newStatus as any,
        week_interval: weekInterval,
        status_history: statusHistory
      };

      // Add additional data if provided (for rejection)
      if (additionalData) {
        if (additionalData.rejection_reason_types !== undefined) {
          updateData.rejection_reason_types = additionalData.rejection_reason_types;
        }
        if (additionalData.rejection_reason !== undefined) {
          updateData.rejection_reason = additionalData.rejection_reason;
        }
        if (additionalData.reviewed_at) {
          updateData.reviewed_at = additionalData.reviewed_at;
        }
        if (additionalData.reviewed_by) {
          updateData.reviewed_by = additionalData.reviewed_by;
        }
      }
      console.log('🟢 Final update data:', updateData);

      // Update participant with new status and history
      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update(updateData)
        .eq('id', participantId);

      if (updateError) {
        console.error('🟢 ERROR updating participant status:', updateError);
        return { success: false, error: updateError };
      }

      console.log(`🟢 ✅ Successfully updated ${participantName} (${participantId}) to ${newStatus} with interval ${weekInterval}`);
      return { success: true };

    } catch (error) {
      console.error('🟢 EXCEPTION in updateParticipantStatusWithHistory:', error);
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
  }, []);
    
    
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

  // Auto-refresh profiles every 30 seconds when on registrations tab
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isAdmin && activeTab === 'registrations') {
      intervalId = setInterval(() => {
        console.log('Auto-refreshing profiles...');
        fetchProfiles();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAdmin, activeTab]);

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
        ? weeklyParticipants.filter(p => p.admin_status === 'this week' && !p.deleted_at)
        : weeklyParticipants.filter(p => p.admin_status === adminStatusFilter && !p.deleted_at);

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
        
        // Filter participants with 'past' admin_status (exclude deleted)
        const pastParticipants = weeklyParticipants.filter(participant => {
          const adminStatus = participant.admin_status || 'this week';
          
          console.log(`Participant ${participant.id}:`, {
            name: `${participant.application_data?.first_name || ''} ${participant.application_data?.last_name || ''}`.trim(),
            adminStatus,
            status_history: (participant as any).status_history,
            deleted_at: participant.deleted_at
          });
          
          // Include only participants with 'past' status and not deleted
          return adminStatus === 'past' && !participant.deleted_at;
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

  // Helper function to determine week interval for participant based on admin_status and status_history  
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
        // For 'past' status, use status_history to determine week interval
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
    try {
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
        console.error('❌ Failed to fetch auth data:', authError);
      } else {
        console.log('✅ Auth data fetched:', authData?.length, 'records');
        // Log first record to verify structure
        if (authData && authData.length > 0) {
          console.log('📧 Sample auth data:', {
            user_id: authData[0].user_id,
            email: authData[0].email,
            auth_provider: authData[0].auth_provider
          });
        }
      }

      // Fetch login logs for IP addresses and user agents
      const { data: loginLogs, error: loginError } = await supabase
        .from('user_login_logs')
        .select('user_id, ip_address, user_agent, created_at')
        .order('created_at', { ascending: false });

      if (loginError) {
        console.error('❌ Failed to fetch login logs:', loginError);
      } else {
        console.log('✅ Login logs fetched:', loginLogs?.length, 'records');
        if (loginLogs && loginLogs.length > 0) {
          console.log('📊 Sample login log:', {
            user_id: loginLogs[0].user_id,
            ip_address: loginLogs[0].ip_address,
            user_agent: loginLogs[0].user_agent?.substring(0, 50)
          });
        }
      }

      const profilesWithAuth = (profilesData || []).map(profile => {
        const userAuthData = authData?.find(auth => auth.user_id === profile.id);
        // Get the most recent login log with an IP address for this user
        const userLoginLog = loginLogs
          ?.filter(log => log.user_id === profile.id && log.ip_address)
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        const profileData = {
          ...profile,
          auth_provider: userAuthData?.auth_provider || 'unknown',
          // Email is stored in auth.users only, not in profiles table (security)
          email: userAuthData?.email || null,
          facebook_data: userAuthData?.facebook_data || null,
          last_sign_in_at: userAuthData?.last_sign_in_at || null,
          email_confirmed_at: userAuthData?.email_confirmed_at || null,
          ip_address: (userLoginLog?.ip_address as string) || null,
          user_agent: (userLoginLog?.user_agent as string) || null,
          // Get country and city from user_metadata (set during registration)
          country: (userAuthData as any)?.user_metadata?.country || profile.country || null,
          city: (userAuthData as any)?.user_metadata?.city || profile.city || null
        };
        
        // Log each profile's email for debugging
        if (!profileData.email) {
          console.warn(`⚠️ No email for user ${profile.id?.substring(0, 8)}:`, {
            hasAuthData: !!userAuthData,
            authDataEmail: userAuthData?.email
          });
        }
        
        return profileData;
      });

      console.log('📊 Total profiles with auth data:', profilesWithAuth.length);
      console.log('📧 Profiles with email:', profilesWithAuth.filter(p => p.email).length);
      console.log('⚠️ Profiles without email:', profilesWithAuth.filter(p => !p.email).length);

      setProfiles(profilesWithAuth);
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
    }
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
    // Query unified table ONLY for NEW application statuses (pending, rejected)
    const { data, error } = await supabase
      .from('weekly_contest_participants')
      .select('*')
      .in('admin_status', ['pending', 'rejected'] as any)
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

    // All participants are already in weekly_contest_participants after migration
    const filteredData = (data || []).filter((app: any) => {
      // Show all active participants
      return true;
    });

    // Keep admin_status as-is, no need to map to "status"
    const processedData = filteredData.map((app: any) => ({
      ...app,
      submitted_at: app.submitted_at || app.created_at
    })) as any;

    console.log('Fetched contest applications:', processedData?.length, 'applications');
    setContestApplications(processedData);
  };

  const fetchDeletedApplications = async () => {
    const { data, error } = await supabase
      .from('weekly_contest_participants')
      .select('*')
      .in('admin_status', ['pending', 'rejected', 'pre next week', 'this week', 'next week', 'next week on site', 'past'] as any)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error fetching deleted applications:', error);
      return [];
    }

    return (data || []).map((app: any) => ({
      ...app,
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
          status_history,
          final_rank,
          total_votes,
          average_rating,
          is_active,
          created_at,
          submitted_at,
          deleted_at,
          application_data
        `)
        .eq('admin_status', 'past')
        .is('deleted_at', null);

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
            created_at: item.created_at,
            submitted_at: item.submitted_at,
            deleted_at: item.deleted_at,
            is_active: item.is_active,
            admin_status: item.admin_status,
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
        created_at: item.created_at || item.contest_start_date || item.status_assigned_date,
        submitted_at: item.submitted_at,
        deleted_at: item.deleted_at,
        contest_start_date: item.contest_start_date,
        is_active: item.is_active,
        admin_status: item.admin_status || 'pending',
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
      
      // Fetch deleted participants for "All" tab
      const { data: deletedData } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(50);
      
      if (deletedData) {
        setDeletedParticipantsAll(deletedData);
      }
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
        setNextWeekApplicationsCount(0);
        return;
      }

      // Function returns a bigint directly, not an array
      setNextWeekApplicationsCount(Number(data || 0));
    } catch (error) {
      console.error('Error in fetchNextWeekApplicationsCount:', error);
      setNextWeekApplicationsCount(0);
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
    const currentTime = new Date().toISOString();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Reviewing application:', applicationId, 'with status:', newStatus);
      console.log('Application data:', application);
      
      // Update weekly_contest_participants (unified table after migration)
      const updateData: any = {
        reviewed_at: currentTime,
        reviewed_by: user?.id,
        ...(newStatus === 'rejected' && { 
          notes: rejectionData?.notes || null
        })
      };
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
        
        // Prepare rejection data if status is rejected
        const additionalData = newStatus === 'rejected' && rejectionData ? {
          rejection_reason_types: rejectionData.reasonTypes,
          rejection_reason: rejectionData.notes || null,
          reviewed_at: currentTime,
          reviewed_by: user?.id
        } : undefined;
        
        const result = await updateParticipantStatusWithHistory(
          weeklyParticipant.id,
          newStatus,
          participantName,
          additionalData
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Mobile layout: Single row with all tabs */}
            <div className="md:hidden">
              <TabsList className="grid grid-cols-8 w-full">
                <TabsTrigger value="new1" className="text-xs">
                  New1
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
              <TabsTrigger value="new1">
                New1
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
                  setWeeklyCurrentPage(1);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-popover border shadow-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pre next week">Pre Next Week</SelectItem>
                    <SelectItem value="this week">This Week</SelectItem>
                    <SelectItem value="next week">Next Week</SelectItem>
                    <SelectItem value="next week on site">Next Week On Site</SelectItem>
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
                const participantStartIndex = (weeklyCurrentPage - 1) * itemsPerPage;
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
                                    onClick={() => participantProfile.email && navigator.clipboard.writeText(participantProfile.email)}
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
                                        onClick={() => participantProfile.email && navigator.clipboard.writeText(participantProfile.email)}
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
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setWeeklyCurrentPage(prev => Math.max(prev - 1, 1));
                          }}
                          aria-disabled={weeklyCurrentPage === 1}
                          className={weeklyCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(totalParticipantPages, 7) }, (_, i) => {
                        let pageNumber;
                        if (totalParticipantPages <= 7) {
                          pageNumber = i + 1;
                        } else if (weeklyCurrentPage <= 4) {
                          pageNumber = i + 1;
                        } else if (weeklyCurrentPage >= totalParticipantPages - 3) {
                          pageNumber = totalParticipantPages - 6 + i;
                        } else {
                          pageNumber = weeklyCurrentPage - 3 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setWeeklyCurrentPage(pageNumber);
                              }}
                              isActive={pageNumber === weeklyCurrentPage}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setWeeklyCurrentPage(prev => Math.min(prev + 1, totalParticipantPages));
                          }}
                          aria-disabled={weeklyCurrentPage === totalParticipantPages}
                          className={weeklyCurrentPage === totalParticipantPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
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
                  <Select value={preStatusFilter} onValueChange={(value) => {
                    setPreStatusFilter(value);
                    setPreNextWeekCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                      <SelectItem value="all">All</SelectItem>
                       <SelectItem value="pending">Pending</SelectItem>
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
                  <Select value={preNextWeekFilter} onValueChange={(value) => {
                    setPreNextWeekFilter(value);
                    setPreNextWeekCurrentPage(1);
                  }}>
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
                
                // Пагинация
                const totalItems = filteredParticipants.length;
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                const startIndex = (preNextWeekCurrentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedItems = filteredParticipants.slice(startIndex, endIndex);
                
                return (
                  <>
                    {paginatedItems.map((participant) => {
                  const participantProfile = profiles.find(p => p.id === participant.user_id);
                  const appData = participant.application_data || {};
                  
                  return (
                    <Card key={participant.id} className="overflow-hidden relative h-[149px]">
                      <CardContent className="p-0">
                        {/* Desktop layout */}
                        <div className="hidden md:flex">
                          {/* Photos column - 25% */}
                          <div className="w-[25%] relative flex-shrink-0 bg-muted/30">
                            <div className="grid grid-cols-2 h-full">
                              <div 
                                className="relative cursor-pointer hover:opacity-75 transition-opacity overflow-hidden"
                                onClick={() => {
                                  const appData = participant.application_data || {};
                                  const photos = [
                                    appData.photo1_url || participant.photo_1_url,
                                    appData.photo2_url || participant.photo_2_url
                                  ].filter(Boolean);
                                  if (photos.length > 0) {
                                    openPhotoModal(
                                      photos,
                                      0,
                                      participant.display_name || `${participant.first_name || appData.first_name} ${participant.last_name || appData.last_name}`
                                    );
                                  }
                                }}
                              >
                                {(participant.application_data?.photo1_url || participant.photo_1_url) && (
                                  <img 
                                    src={participant.application_data?.photo1_url || participant.photo_1_url} 
                                    alt="Photo 1" 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div 
                                className="relative cursor-pointer hover:opacity-75 transition-opacity overflow-hidden"
                                onClick={() => {
                                  const appData = participant.application_data || {};
                                  const photos = [
                                    appData.photo1_url || participant.photo_1_url,
                                    appData.photo2_url || participant.photo_2_url
                                  ].filter(Boolean);
                                  if (photos.length > 1) {
                                    openPhotoModal(
                                      photos,
                                      1,
                                      participant.display_name || `${participant.first_name || appData.first_name} ${participant.last_name || appData.last_name}`
                                    );
                                  }
                                }}
                              >
                                {(participant.application_data?.photo2_url || participant.photo_2_url) && (
                                  <img 
                                    src={participant.application_data?.photo2_url || participant.photo_2_url} 
                                    alt="Photo 2" 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Info column - 75% */}
                          <div className="w-[75%] flex items-stretch">
                            {/* Name and basic info - 30% */}
                            <div className="w-[30%] flex flex-col justify-center px-2 border-r">
                              <div className="font-semibold truncate text-sm">
                                {participant.display_name || `${participant.first_name || participant.application_data?.first_name || 'Unknown'} ${participant.last_name || participant.application_data?.last_name || ''}`}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {participant.age || participant.application_data?.age || 'Unknown'} лет • {participant.city || participant.application_data?.city || 'Unknown'}, {participant.state || participant.application_data?.state || 'Unknown'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {participant.height_cm || participant.application_data?.height_cm || 'Unknown'}см • {participant.weight_kg || participant.application_data?.weight_kg || 'Unknown'}кг
                              </div>
                            </div>

                            {/* Week info - 15% */}
                            <div className="w-[15%] flex items-center justify-center px-1 border-r">
                              <div className="text-center">
                                <div className="text-xs font-medium">Week:</div>
                                <div className="text-xs text-muted-foreground">
                                  {participant.week_interval || '-'}
                                </div>
                              </div>
                            </div>

                            {/* Stats - 15% */}
                            <div className="w-[15%] flex items-center justify-center px-1 border-r">
                              <div className="flex gap-3">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600">
                                    {participant.total_votes || 0}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-red-600">
                                    {participant.total_dislikes || 0}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status dropdown - 30% */}
                            <div className="w-[30%] flex items-center justify-center px-2 gap-2">
                              <div className="flex-1">
                                <Select
                                  value={participant.admin_status || 'pre next week'}
                                  onValueChange={async (value) => {
                                    try {
                                      if (!participant.id) {
                                        toast({
                                          title: "Error",
                                          description: "No participant ID found",
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      const participantName = participant.display_name || 
                                        `${participant.first_name || 'Unknown'} ${participant.last_name || ''}`;
                                      
                                      console.log('Pre Next Week: Updating participant:', {
                                        id: participant.id,
                                        name: participantName,
                                        newStatus: value
                                      });
                                      
                                      const result = await updateParticipantStatusWithHistory(
                                        participant.id,
                                        value as ParticipantStatus,
                                        participantName
                                      );

                                      console.log('Pre Next Week: Update result:', result);

                                      if (!result.success) {
                                        console.error('Pre Next Week: Update failed:', result.error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to update participant status",
                                          variant: "destructive",
                                        });
                                      } else {
                                        console.log('Pre Next Week: Update successful, refreshing data...');
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
                                      participantId: participant.id,
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
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPreNextWeekCurrentPage(prev => Math.max(prev - 1, 1));
                              }}
                              aria-disabled={preNextWeekCurrentPage === 1}
                              className={preNextWeekCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 7) {
                              pageNumber = i + 1;
                            } else if (preNextWeekCurrentPage <= 4) {
                              pageNumber = i + 1;
                            } else if (preNextWeekCurrentPage >= totalPages - 3) {
                              pageNumber = totalPages - 6 + i;
                            } else {
                              pageNumber = preNextWeekCurrentPage - 3 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPreNextWeekCurrentPage(pageNumber);
                                  }}
                                  isActive={pageNumber === preNextWeekCurrentPage}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPreNextWeekCurrentPage(prev => Math.min(prev + 1, totalPages));
                              }}
                              aria-disabled={preNextWeekCurrentPage === totalPages}
                              className={preNextWeekCurrentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="nextweek" className="space-y-4">
              <div className="mb-6">
                {/* Фильтр по admin_status */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Admin Status Filter:</Label>
                  <Select value={nextStatusFilter} onValueChange={(value) => {
                    setNextStatusFilter(value);
                    setNextWeekCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                      <SelectItem value="all">All</SelectItem>
                       <SelectItem value="pending">Pending</SelectItem>
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
                  <Select value={nextWeekFilter} onValueChange={(value) => {
                    setNextWeekFilter(value);
                    setNextWeekCurrentPage(1);
                  }}>
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
                
                // Дедупликация: оставляем карточку с максимальным количеством лайков для каждого user_id
                const userIdMap = new Map();
                filteredParticipants.forEach(p => {
                  const existingParticipant = userIdMap.get(p.user_id);
                  if (!existingParticipant || (p.like_count || 0) > (existingParticipant.like_count || 0)) {
                    userIdMap.set(p.user_id, p);
                  }
                });
                const deduplicatedParticipants = Array.from(userIdMap.values());
                
                if (deduplicatedParticipants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      No participants found for selected week filter
                    </div>
                  );
                }
                
                // Пагинация
                const totalItems = deduplicatedParticipants.length;
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                const startIndex = (nextWeekCurrentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedItems = deduplicatedParticipants.slice(startIndex, endIndex);
                
                return (
                  <>
                    {paginatedItems.map((participant) => {
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
                                          if (!participant.id) {
                                            console.error('participant.id is falsy:', participant.id);
                                            toast({
                                              title: "Error",
                                              description: "No participant ID found",
                                              variant: "destructive",
                                            });
                                            return;
                                          }

                                          const participantName = participant.display_name || 
                                            `${participant.first_name || 'Unknown'} ${participant.last_name || ''}`;
                                          
                                          console.log('Next Week: Updating participant:', {
                                            id: participant.id,
                                            name: participantName,
                                            newStatus: value
                                          });
                                          
                                          const result = await updateParticipantStatusWithHistory(
                                            participant.id,
                                            value as ParticipantStatus,
                                            participantName
                                          );

                                          console.log('Next Week: Update result:', result);

                                          if (!result.success) {
                                            console.error('Next Week: Update failed:', result.error);
                                            toast({
                                              title: "Error",
                                              description: "Failed to update participant status",
                                              variant: "destructive",
                                            });
                                          } else {
                                            console.log('Next Week: Update successful, refreshing data...');
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
                    })}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setNextWeekCurrentPage(prev => Math.max(prev - 1, 1));
                              }}
                              aria-disabled={nextWeekCurrentPage === 1}
                              className={nextWeekCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 7) {
                              pageNumber = i + 1;
                            } else if (nextWeekCurrentPage <= 4) {
                              pageNumber = i + 1;
                            } else if (nextWeekCurrentPage >= totalPages - 3) {
                              pageNumber = totalPages - 6 + i;
                            } else {
                              pageNumber = nextWeekCurrentPage - 3 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setNextWeekCurrentPage(pageNumber);
                                  }}
                                  isActive={pageNumber === nextWeekCurrentPage}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setNextWeekCurrentPage(prev => Math.min(prev + 1, totalPages));
                              }}
                              aria-disabled={nextWeekCurrentPage === totalPages}
                              className={nextWeekCurrentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                );
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
                                  {participantProfile.email && (
                                    <>
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
                                    </>
                                  )}
                                  {!participantProfile.email && (
                                    <span className="text-muted-foreground">No email</span>
                                  )}
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
                                  {participantProfile.email && (
                                    <>
                                      <span>{participantProfile.email.length > 20 ? `${participantProfile.email.substring(0, 20)}...` : participantProfile.email}</span>
                                      <Copy className="h-3 w-3 cursor-pointer" onClick={() => navigator.clipboard.writeText(participantProfile.email)} />
                                    </>
                                  )}
                                  {!participantProfile.email && (
                                    <span className="text-muted-foreground">No email</span>
                                  )}
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
                
                {/* Status Statistics */}
                <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Статистика по статусам</h3>
                  <div className="space-y-3">
                    {(() => {
                      const allParticipants = weeklyParticipants.filter(p => !p.deleted_at);
                      const statusCounts = allParticipants.reduce((acc: any, p: any) => {
                        const status = p.admin_status || 'unknown';
                        acc[status] = (acc[status] || 0) + 1;
                        return acc;
                      }, {});

                      const statusOrder = [
                        'pending',
                        'rejected',
                        'pre next week',
                        'next week',
                        'next week on site',
                        'this week',
                        'past'
                      ];

                      const getStatusBadgeVariant = (status: string) => {
                        switch (status) {
                          case 'this week': return 'default';
                          case 'next week':
                          case 'next week on site': return 'secondary';
                          case 'pre next week': return 'outline';
                          case 'pending': return 'outline';
                          case 'rejected': return 'destructive';
                          case 'past': return 'destructive';
                          default: return 'outline';
                        }
                      };

                      return (
                        <>
                          <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                            <span className="font-medium">Всего участниц:</span>
                            <Badge variant="default" className="text-base px-3 py-1">
                              {allParticipants.length}
                            </Badge>
                          </div>
                          {statusOrder.map(status => {
                            const count = statusCounts[status] || 0;
                            return (
                              <div key={status} className="flex items-center justify-between py-2">
                                <Badge variant={getStatusBadgeVariant(status)} className="min-w-[140px]">
                                  {status}
                                </Badge>
                                <span className="font-medium text-lg">{count}</span>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Deleted participants section */}
                {deletedParticipantsAll.length > 0 && (
                  <div className="mb-6 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Deleted Participants ({deletedParticipantsAll.length})
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowDeletedAll(!showDeletedAll)}
                      >
                        {showDeletedAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {showDeletedAll && (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {deletedParticipantsAll.map((participant) => {
                          const appData = participant.application_data || {};
                          return (
                            <div key={participant.id} className="flex items-center justify-between p-2 bg-background rounded border">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={appData.photo1_url || appData.photo_1_url} />
                                  <AvatarFallback>{appData.first_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{appData.first_name} {appData.last_name}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  // Restore participant
                                  const { error } = await supabase
                                    .from('weekly_contest_participants')
                                    .update({ deleted_at: null })
                                    .eq('id', participant.id);
                                  
                                  if (!error) {
                                    setDeletedParticipantsAll(prev => prev.filter(p => p.id !== participant.id));
                                    fetchWeeklyParticipants();
                                    toast({ title: "Restored", description: "Participant has been restored" });
                                  }
                                }}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Status Filter - Admin Status Only */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Admin Status Filter:</Label>
                  <Select value={allSectionStatusFilter} onValueChange={(value) => {
                    setAllSectionStatusFilter(value);
                    setAllCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Select admin status" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-popover border shadow-lg">
                      <SelectItem value="all">All</SelectItem>
                       <SelectItem value="pending">Pending</SelectItem>
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
                // SINGLE SOURCE: Use only weeklyParticipants to avoid duplicates
                const allParticipants = weeklyParticipants.filter(p => !p.deleted_at);
                
                // Sort by updated_at (most recent first)
                const sortedParticipants = [...allParticipants].sort((a, b) => {
                  const dateA = new Date(a.application_data?.updated_at || a.created_at || 0).getTime();
                  const dateB = new Date(b.application_data?.updated_at || b.created_at || 0).getTime();
                  return dateB - dateA;
                });
                
                // Apply admin status filter
                const filteredParticipants = allSectionStatusFilter === 'all' 
                  ? sortedParticipants 
                  : sortedParticipants.filter(p => p.admin_status === allSectionStatusFilter);
                
                if (filteredParticipants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-lg">Нет участников с выбранным статусом</p>
                    </div>
                  );
                }

                // Пагинация
                const totalItems = filteredParticipants.length;
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                const startIndex = (allCurrentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedItems = filteredParticipants.slice(startIndex, endIndex);

                return (
                  <>
                    {paginatedItems.map((participant) => {
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
                                    <div className="w-full relative">
                                      <img 
                                        src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url}
                                        alt="Portrait"
                                        className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => openPhotoModal([
                                          participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                                          participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                                        ].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                      />
                                      {['this week', 'next week', 'next week on site', 'pre next week'].includes(participant.admin_status) && (
                                        <Badge variant="outline" className="absolute top-1 left-1 text-[10px] px-1 py-0 h-4 bg-green-500/90 text-white border-green-600 shadow-sm">
                                          on site
                                        </Badge>
                                      )}
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
                                      {participantProfile.email && (
                                        <>
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
                                        </>
                                      )}
                                      {!participantProfile.email && (
                                        <span className="text-muted-foreground">No email</span>
                                      )}
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
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setDeleteConfirmParticipant({
                                        id: participant.id,
                                        name: `${appData.first_name} ${appData.last_name}`
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
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
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setAllCurrentPage(prev => Math.max(prev - 1, 1));
                              }}
                              aria-disabled={allCurrentPage === 1}
                              className={allCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 7) {
                              pageNumber = i + 1;
                            } else if (allCurrentPage <= 4) {
                              pageNumber = i + 1;
                            } else if (allCurrentPage >= totalPages - 3) {
                              pageNumber = totalPages - 6 + i;
                            } else {
                              pageNumber = allCurrentPage - 3 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setAllCurrentPage(pageNumber);
                                  }}
                                  isActive={pageNumber === allCurrentPage}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setAllCurrentPage(prev => Math.min(prev + 1, totalPages));
                              }}
                              aria-disabled={allCurrentPage === totalPages}
                              className={allCurrentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="new1" className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">New Applications (New1)</h2>
                
                <div className="flex gap-2 items-center mb-4">
                  <Select 
                    value={registrationsStatusFilter} 
                    onValueChange={(value) => {
                      setRegistrationsStatusFilter(value);
                      setRegistrationsCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={countryFilter} 
                    onValueChange={(value) => {
                      setCountryFilter(value);
                      setRegistrationsCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="Philippines">Philippines</SelectItem>
                      <SelectItem value="Russia">Russia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(() => {
                // Фильтруем только НЕ удалённые карточки с pending и rejected
                const filteredByStatus = weeklyParticipants.filter(p => {
                  // Только НЕ удалённые
                  if (p.deleted_at) return false;
                  
                  // Только pending и rejected
                  if (p.admin_status !== 'pending' && p.admin_status !== 'rejected') {
                    return false;
                  }
                  
                  // Фильтр по статусу из dropdown
                  if (registrationsStatusFilter !== 'all' && p.admin_status !== registrationsStatusFilter) {
                    return false;
                  }
                  
                  // Фильтр по стране
                  if (countryFilter !== 'all') {
                    const country = p.application_data?.country;
                    if (country !== countryFilter) return false;
                  }
                  
                  return true;
                });

                // Удаляем дубликаты по user_id
                const uniqueParticipants = filteredByStatus.filter((participant, index, arr) => 
                  arr.findIndex(p => p.user_id === participant.user_id) === index
                );

                // Сортировка по дате регистрации (новые сверху)
                const sortedParticipants = uniqueParticipants.sort((a, b) => {
                  const dateA = new Date(a.submitted_at || a.created_at || 0).getTime();
                  const dateB = new Date(b.submitted_at || b.created_at || 0).getTime();
                  return dateB - dateA;
                });

                if (sortedParticipants.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No new applications found</p>
                    </div>
                  );
                }

                // Пагинация
                const totalItems = sortedParticipants.length;
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                const startIndex = (registrationsCurrentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedItems = sortedParticipants.slice(startIndex, endIndex);

                return (
                  <>
                    {paginatedItems.map(participant => {
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
                                    <div className="w-full relative">
                                      <img 
                                        src={participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url}
                                        alt="Portrait"
                                        className="w-full h-36 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => openPhotoModal([
                                          participantProfile?.photo_1_url || appData.photo1_url || appData.photo_1_url,
                                          participantProfile?.photo_2_url || appData.photo2_url || appData.photo_2_url
                                        ].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                      />
                                      {['this week', 'next week', 'next week on site', 'pre next week'].includes(participant.admin_status) && (
                                        <Badge variant="outline" className="absolute top-1 left-1 text-[10px] px-1 py-0 h-4 bg-green-500/90 text-white border-green-600 shadow-sm">
                                          on site
                                        </Badge>
                                      )}
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
                                      {participantProfile.email && (
                                        <>
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
                                        </>
                                      )}
                                      {!participantProfile.email && (
                                        <span className="text-muted-foreground">No email</span>
                                      )}
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
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setDeleteConfirmParticipant({
                                        id: participant.id,
                                        name: `${appData.first_name} ${appData.last_name}`
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
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
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setRegistrationsCurrentPage(prev => Math.max(prev - 1, 1));
                              }}
                              aria-disabled={registrationsCurrentPage === 1}
                              className={registrationsCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 7) {
                              pageNumber = i + 1;
                            } else if (registrationsCurrentPage <= 4) {
                              pageNumber = i + 1;
                            } else if (registrationsCurrentPage >= totalPages - 3) {
                              pageNumber = totalPages - 6 + i;
                            } else {
                              pageNumber = registrationsCurrentPage - 3 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setRegistrationsCurrentPage(pageNumber);
                                  }}
                                  isActive={pageNumber === registrationsCurrentPage}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setRegistrationsCurrentPage(prev => Math.min(prev + 1, totalPages));
                              }}
                              aria-disabled={registrationsCurrentPage === totalPages}
                              className={registrationsCurrentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                );
              })()}
            </TabsContent>

              <TabsContent value="registrations" className="space-y-4">
                
                {/* Weekly Registration Stats Dashboard */}
                <div className="mb-6">
                  <div className="mb-4 p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-3">
                      total registrations: {dailyRegistrationStats.reduce((sum, stat) => sum + (stat.registration_count || 0), 0)}, verified: {profiles.filter(p => p.email_confirmed_at).length}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {dailyRegistrationStats.map((stat, index) => (
                        <div key={index} className="text-center p-3 bg-background rounded-lg">
                          <div className="font-medium text-sm mb-1">{stat.day_name}</div>
                          <div className="text-2xl font-semibold">
                            {stat.registration_count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Search input */}
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Поиск по имени, email или IP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
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

                      // Фильтр поиска
                      if (searchQuery.trim()) {
                        const query = searchQuery.toLowerCase();
                        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
                        const displayName = (profile.display_name || '').toLowerCase();
                        const email = (profile.email || '').toLowerCase();
                        const ip = (profile.ip_address || '').toLowerCase();
                        
                        return fullName.includes(query) || 
                               displayName.includes(query) || 
                               email.includes(query) || 
                               ip.includes(query);
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
                            {' '}
                            {new Date(profile.created_at).toLocaleTimeString('en-GB', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false
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
                                 {profile.ip_address && (
                                   <div className={`text-xs ${profile.isDuplicateIP ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                     IP: {profile.ip_address}
                                     {profile.isDuplicateIP && ' ⚠️'}
                                   </div>
                                 )}
                                {profile.user_agent && (() => {
                                  const { browser, device, os } = UAParser(profile.user_agent);
                                  
                                  return (
                                    <div className="text-xs text-muted-foreground">
                                      {device.type || 'Desktop'} | {os.name || 'Unknown OS'} {os.version || ''} | {browser.name || 'Unknown'}
                                    </div>
                                  );
                                })()}
                                {(profile.country || profile.city) && (
                                  <div className="text-xs text-muted-foreground">
                                    📍 {profile.city ? `${profile.city}, ` : ''}{profile.country || 'Unknown Country'}
                                  </div>
                                )}
                                {profile.email && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span>{profile.email}</span>
                                    <Copy 
                                      className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                      onClick={() => {
                                        navigator.clipboard.writeText(profile.email || '');
                                        toast({ title: "Copied", description: "Email copied to clipboard" });
                                      }}
                                    />
                                  </div>
                                )}
                                {!profile.email && (
                                  <div className="text-xs text-destructive">
                                    No email - User ID: {profile.id?.substring(0, 8)}
                                  </div>
                                )}
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
             console.log('🔴 REJECT MODAL: Starting rejection process', { 
               applicationId: applicationToReject.id, 
               reasonTypes, 
               notes 
             });
             
             // Check if this is a weekly contest participant or regular application
             const isWeeklyParticipant = filteredWeeklyParticipants.some(p => p.id === applicationToReject.id);
             console.log('🔴 Is weekly participant?', isWeeklyParticipant);
             
             if (isWeeklyParticipant) {
               // For weekly contest participants, remove them from the contest and reject their application
               const participant = filteredWeeklyParticipants.find(p => p.id === applicationToReject.id);
               console.log('🔴 Found participant:', participant);
               
               if (participant) {
                 try {
                    // Get current admin for rejection tracking
                    const { data: { user } } = await supabase.auth.getUser();
                    console.log('🔴 Current user:', user?.id);
                    
                    // Update participant with rejection data using centralized function
                    const participantName = `${participant.application_data?.first_name || ''} ${participant.application_data?.last_name || ''}`.trim();
                    console.log('🔴 Calling updateParticipantStatusWithHistory with:', {
                      participantId: participant.id,
                      status: 'rejected',
                      participantName,
                      additionalData: {
                        rejection_reason_types: reasonTypes,
                        rejection_reason: notes || null,
                        reviewed_at: new Date().toISOString(),
                        reviewed_by: user?.id
                      }
                    });
                    
                    const result = await updateParticipantStatusWithHistory(
                      participant.id,
                      'rejected',
                      participantName,
                      {
                        rejection_reason_types: reasonTypes,
                        rejection_reason: notes || null,
                        reviewed_at: new Date().toISOString(),
                        reviewed_by: user?.id
                      }
                    );
                    
                    console.log('🔴 updateParticipantStatusWithHistory result:', result);
                   
                   if (!result.success) {
                     console.error('🔴 ERROR: Failed to update participant:', result.error);
                     toast({
                       title: "Error",
                       description: `Failed to reject participant: ${result.error}`,
                       variant: "destructive"
                     });
                     return;
                   }
                  
                  console.log('🔴 Refreshing data...');
                  // Refresh data to show updated status
                  await fetchWeeklyParticipants();
                  await fetchContestApplications();
                  console.log('🔴 Data refreshed');
                  
                  // Remove participant filter
                  setParticipantFilters(prev => {
                    const newFilters = { ...prev };
                    delete newFilters[participant.id];
                    return newFilters;
                  });
                  
                  toast({
                    title: "Success",
                    description: "Participant rejected successfully",
                  });
                 } catch (error) {
                   console.error('🔴 EXCEPTION in rejection process:', error);
                   toast({
                     title: "Error",
                     description: "Failed to reject participant",
                     variant: "destructive"
                   });
                 }
               }
             } else {
               console.log('🔴 Not a weekly participant, calling reviewApplication');
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
      
      {/* Delete Confirmation Dialog for All Tab */}
      <AlertDialog open={!!deleteConfirmParticipant} onOpenChange={(open) => !open && setDeleteConfirmParticipant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirmParticipant?.name}</strong>? 
              This participant will be moved to the deleted section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirmParticipant) {
                  const participantToDelete = weeklyParticipants.find(p => p.id === deleteConfirmParticipant.id);
                  
                  const { error } = await supabase
                    .from('weekly_contest_participants')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', deleteConfirmParticipant.id);
                  
                  if (!error && participantToDelete) {
                    // Add to deleted list
                    setDeletedParticipantsAll(prev => [...prev, participantToDelete]);
                    // Refresh data
                    fetchWeeklyParticipants();
                    toast({
                      title: "Deleted",
                      description: `${deleteConfirmParticipant.name} has been moved to deleted section`
                    });
                  } else if (error) {
                    toast({
                      title: "Error",
                      description: "Failed to delete participant",
                      variant: "destructive"
                    });
                  }
                  
                  setDeleteConfirmParticipant(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Admin;

