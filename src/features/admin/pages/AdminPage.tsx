import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationFirst, PaginationItem, PaginationLast, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { MiniStars } from '@/components/mini-stars';
import { 
  Calendar, FileText, UserCog, Eye, Edit, Check, X, Trash2, 
  RotateCcw, Copy, Facebook, Minus, AlertCircle, Trophy, ChevronDown, ChevronUp, Shield, Info,
  Star, Heart, Loader2, Video, Globe
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import cityTimezones from 'city-timezones';
import { AdminPhotoModal } from '@/components/admin-photo-modal';
import { RejectReasonModal, REJECTION_REASONS } from '@/components/reject-reason-modal';
import { VotersModal } from '@/features/contest/components/VotersModal';
import { NextWeekVotersModal } from '@/features/contest/components/NextWeekVotersModal';
import { ContestParticipationModal } from '@/features/contest/components/ContestParticipationModal';
import { ApplicationEditHistory } from '@/components/ApplicationEditHistory';
import { ExpandableApplicationHistory } from '@/components/ExpandableApplicationHistory';

import { WinnerContentManager } from '../components/WinnerContentManager';
import { ParticipantStatusHistory } from '../components/ParticipantStatusHistory';
import { ParticipantStatusHistoryModal } from '../components/ParticipantStatusHistoryModal';
import { isEmailDomainWhitelisted } from '@/utils/email-whitelist';
import { AdminNewApplicationsTab } from '../components/tabs/AdminNewApplicationsTab';
import { AdminPreNextWeekTab } from '../components/tabs/AdminPreNextWeekTab';
import { AdminNextWeekTab } from '../components/tabs/AdminNextWeekTab';
import { AdminWeeklyTab } from '../components/tabs/AdminWeeklyTab';
import { AdminPastWeekTab } from '../components/tabs/AdminPastWeekTab';
import { AdminAllParticipantsTab } from '../components/tabs/AdminAllParticipantsTab';
import { AdminRegistrationsTab } from '../components/tabs/AdminRegistrationsTab';
import { AdminStatisticsTab } from '../components/tabs/AdminStatisticsTab';
import { BackupTrigger } from '../components/BackupTrigger';
import { WeeklyTransitionSelfCheck } from '../components/WeeklyTransitionSelfCheck';
import { AdminCountryProvider, useAdminCountry } from '@/contexts/AdminCountryContext';
import { CONTEST_COUNTRIES } from '@/types/admin';
import { 
  getWeekIntervalForStatus, 
  getAvailableWeekIntervals, 
  createDynamicPastWeekFilters 
} from '@/utils/weekIntervals';

// Unified status type for participants - only real statuses from DB
type ParticipantStatus = 'pending' | 'rejected' | 'pre next week' | 'this week' | 'next week' | 'past';

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
  admin_status?: 'pending' | 'rejected' | 'pre next week' | 'this week' | 'next week' | 'past';
  status_history?: {
    [key: string]: {
      changed_at?: string;
      [key: string]: any;
    };
  };
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


const AdminContent = () => {
  console.log('[HOOKS DEBUG] AdminContent render started');
  // ALL HOOKS AT THE TOP IN CONSISTENT ORDER - NEVER CHANGE THIS ORDER
  console.log('[HOOKS DEBUG] 1. Calling useNavigate');
  const navigate = useNavigate();
  console.log('[HOOKS DEBUG] 2. Calling useToast');
  const { toast } = useToast();
  console.log('[HOOKS DEBUG] 3. Calling useAdminCountry');
  const { selectedCountry, setSelectedCountry, timezone } = useAdminCountry();
  console.log('[HOOKS DEBUG] 4. Starting useState calls');
  
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const [tabDataLoaded, setTabDataLoaded] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('applications');
  const [statType, setStatType] = useState<'ip' | 'country' | 'device' | 'os' | 'email'>('country');
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [contestApplications, setContestApplications] = useState<ContestApplication[]>([]);
  const [deletedApplications, setDeletedApplications] = useState<ContestApplication[]>([]);
  const [showDeletedApplications, setShowDeletedApplications] = useState(false);
  const [weeklyContests, setWeeklyContests] = useState<WeeklyContest[]>([]);
  const [weeklyParticipants, setWeeklyParticipants] = useState<WeeklyContestParticipant[]>([]);
  const [partialSubmissions, setPartialSubmissions] = useState<any[]>([]);
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
  const [pastWeekIntervalFilter, setPastWeekIntervalFilter] = useState<string>('all');
  
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
  
   const [expandedAdminDates, setExpandedAdminDates] = useState<Set<string>>(new Set());
   const [adminDatePopup, setAdminDatePopup] = useState<{ show: boolean; date: string; admin: string; applicationId: string }>({ 
     show: false, date: '', admin: '', applicationId: '' 
   });
   const [applicationHistory, setApplicationHistory] = useState<any[]>([]);
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [suspiciousEmailFilter, setSuspiciousEmailFilter] = useState<string>('all'); // gmail or other
  const [searchQuery, setSearchQuery] = useState('');
  const [usersWhoVoted, setUsersWhoVoted] = useState<Set<string>>(new Set());
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
  const [userVotingStats, setUserVotingStats] = useState<Record<string, {
    is_regular_voter: boolean;
    voting_week_intervals: string[];
    unique_weeks_count: number;
    total_votes_count: number;
  }>>({});
  const [dailyStats, setDailyStats] = useState<Array<{ day_name: string; vote_count: number; like_count: number }>>([]);
  const [dailyApplicationStats, setDailyApplicationStats] = useState<Array<{ day_name: string; day_date?: string; total_applications: number; approved_applications: number; status_changed_count?: number; rejected_count?: number; day_of_week?: number; sort_order?: number }>>([]);
  const [dailyRegistrationStats, setDailyRegistrationStats] = useState<Array<{ day_name: string; registration_count: number; suspicious_count: number; day_of_week: number; sort_order: number }>>([]);
  const [registrationStatsByType, setRegistrationStatsByType] = useState<Array<{ 
    stat_type: string; 
    mon: number; 
    tue: number; 
    wed: number; 
    thu: number; 
    fri: number; 
    sat: number; 
    sun: number; 
  }>>([]);
  const [nextWeekDailyStats, setNextWeekDailyStats] = useState<Array<{ day_name: string; like_count: number; dislike_count: number; total_votes: number }>>([]);
  const [nextWeekVotesStats, setNextWeekVotesStats] = useState<Record<string, { like_count: number; dislike_count: number }>>({});
  const [selectedDay, setSelectedDay] = useState<{ day: number; type: 'new' | 'approved' } | null>(null);
  const [allApplicationsByDate, setAllApplicationsByDate] = useState<any[]>([]);
  const [selectedNewAppDay, setSelectedNewAppDay] = useState<{ date: string; filter: 'all' | 'approved' | 'rejected' } | null>(null);
  const [selectedRegistrationDay, setSelectedRegistrationDay] = useState<{ dayName: string; showSuspicious: boolean } | null>(null);
  const [selectedRegistrationFilter, setSelectedRegistrationFilter] = useState<{ 
    type: 'all' | 'email_verified' | 'unverified' | 'gmail' | 'facebook' | 'suspicious' | 'maybe_suspicious'; 
    day?: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  } | null>(null);
  const [nextWeekApplicationsCount, setNextWeekApplicationsCount] = useState<number>(0);
  const [cardSectionStats, setCardSectionStats] = useState<{ newApplications: number; movedToNextWeek: number; new_applications_count: number; moved_to_next_week_count: number }>({ newApplications: 0, movedToNextWeek: 0, new_applications_count: 0, moved_to_next_week_count: 0 });
  const [showAllCards, setShowAllCards] = useState(false);
  const [pendingPastChanges, setPendingPastChanges] = useState<{ [participantId: string]: { admin_status?: string; week_interval?: string } }>({});
  const [statusHistoryModalOpen, setStatusHistoryModalOpen] = useState(false);
  const [selectedStatusHistory, setSelectedStatusHistory] = useState<{ participantId: string; participantName: string; statusHistory: any } | null>(null);
  // User activity stats for Reg tab
  const [userActivityStats, setUserActivityStats] = useState<Record<string, { likesCount: number; ratingsCount: number; likes: any[]; ratings: any[] }>>({});
  const [loadingActivity, setLoadingActivity] = useState<Set<string>>(new Set());
  const [isLoadingWeeksFilter, setIsLoadingWeeksFilter] = useState(false);
  const [emailDomainStats, setEmailDomainStats] = useState<Array<{ domain: string; user_count: number }>>([]);
  const [emailDomainVotingStats, setEmailDomainVotingStats] = useState<Array<{ domain: string; user_count: number; total_votes: number; total_likes: number; avg_rating: number }>>([]);
  const [expandedActivity, setExpandedActivity] = useState<Set<string>>(new Set());
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(new Set());
  const [expandedUserActivity, setExpandedUserActivity] = useState<Set<string>>(new Set());
  const [userActivityData, setUserActivityData] = useState<Record<string, any>>({});
  const [expandedIPs, setExpandedIPs] = useState<Set<string>>(new Set());
  const [regPaginationPage, setRegPaginationPage] = useState(1);
  const regItemsPerPage = 20;
  const [expandedMaybeFingerprints, setExpandedMaybeFingerprints] = useState<Set<string>>(new Set());
  const [expandedFingerprints, setExpandedFingerprints] = useState<Set<string>>(new Set());
  console.log('[HOOKS DEBUG] All useState calls completed');
  console.log('[HOOKS DEBUG] 5. Starting useRef call');
  const fetchedStatsRef = useRef<Set<string>>(new Set());
  console.log('[HOOKS DEBUG] All basic hooks completed, moving to useEffect/useCallback/useMemo');
  
  console.log('Admin component rendering, adminStatusFilter:', adminStatusFilter);

  // Ref to track ongoing status updates to prevent concurrent updates
  const statusUpdateInProgress = useRef<Set<string>>(new Set());

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
      week_interval?: string; // Add week_interval to additionalData
    }
  ): Promise<{ success: boolean; error?: any }> => {
    try {
      console.log('🟢 updateParticipantStatusWithHistory called:', { participantId, newStatus, participantName, additionalData });
      
      // Check if update is already in progress for this participant
      if (statusUpdateInProgress.current.has(participantId)) {
        console.log('🟡 STATUS UPDATE ALREADY IN PROGRESS for participant:', participantId, 'Skipping duplicate request');
        return { success: false, error: 'Update already in progress' };
      }
      
      // Mark update as in progress
      statusUpdateInProgress.current.add(participantId);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('🟢 ERROR: No authenticated user');
        return { success: false, error: 'No authenticated user' };
      }
      console.log('🟢 Current user ID:', user.id);

      // Get week interval: use provided one or calculate from status
      const weekInterval = additionalData?.week_interval || getWeekIntervalForStatus(newStatus);
      console.log('🟢 Week interval:', weekInterval, additionalData?.week_interval ? '(provided)' : '(calculated)');
      
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
      console.log('🟢 DETAILED update data:', {
        admin_status: updateData.admin_status,
        week_interval: updateData.week_interval,
        rejection_reason_types: updateData.rejection_reason_types,
        rejection_reason_types_type: typeof updateData.rejection_reason_types,
        rejection_reason: updateData.rejection_reason,
        rejection_reason_type: typeof updateData.rejection_reason
      });

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
    } finally {
      // Always remove from in-progress set
      statusUpdateInProgress.current.delete(participantId);
    }
  };

  // Temporarily disable memoization to fix infinite recursion
  const getDynamicPastWeekFilters = createDynamicPastWeekFilters();

  useEffect(() => {
    console.log('useEffect: Admin component useEffect started');
    
    const initAdmin = async () => {
      try {
        await checkAdminAccess();
      } catch (error) {
        console.error('🔴 initAdmin error:', error);
      }
    };

    initAdmin();
  }, []);

  // Load data for specific tabs when they become active
  useEffect(() => {
    if (!isAdmin || loading) return;

    const loadTabData = async () => {
      // Skip if data already loaded for this tab
      if (tabDataLoaded[activeTab]) {
        console.log(`Tab ${activeTab} data already loaded, skipping...`);
        return;
      }

      setTabLoading(prev => ({ ...prev, [activeTab]: true }));

      try {
        console.log(`Loading data for tab: ${activeTab}`);

        switch (activeTab) {
          case 'applications':
          case 'new':
          case 'new1':
          case 'new-applications':
            await Promise.allSettled([
              fetchContestApplications(),
              fetchWeeklyContests(),
              fetchWeeklyParticipants(),
              fetchPartialSubmissions(),
              fetchDailyApplicationStats()
            ]);
            break;

          case 'registrations':
            await Promise.allSettled([
              fetchProfiles(),
              fetchUserRoles(),
              fetchUsersWhoVoted(),
              fetchDailyRegistrationStats(),
              fetchUserVotingStats(),
              fetchUserActivityData()
            ]);
            break;

          case 'statistics':
          case 'stats':
          case 'stat':
            await Promise.allSettled([
              fetchDailyStats(),
              fetchDailyApplicationStats(),
              fetchDailyRegistrationStats(),
              fetchEmailDomainStats(),
              fetchEmailDomainVotingStats()
            ]);
            break;

          case 'weekly':
          case 'new-weekly':
            await Promise.allSettled([
              fetchWeeklyParticipants(),
              fetchCardSectionStats(),
              fetchNextWeekApplicationsCount(),
              fetchPreNextWeekParticipants(),
              fetchNextWeekDailyStats(),
              fetchDailyStats()
            ]);
            break;

          case 'nextweek':
          case 'new-next-week':
            await Promise.allSettled([
              fetchNextWeekParticipants(),
              fetchNextWeekDailyStats(),
              fetchNextWeekVotesStats()
            ]);
            break;

          case 'prenextweek':
          case 'new-pre-next':
            await fetchPreNextWeekParticipants();
            break;

          case 'pastweek':
          case 'past':
          case 'new-past':
            await fetchWeeklyParticipants();
            break;

          case 'all':
          case 'new-all':
            await fetchWeeklyParticipants();
            break;

          case 'new-registrations':
            await Promise.allSettled([
              fetchProfiles(),
              fetchUserRoles(),
              fetchUsersWhoVoted(),
              fetchDailyRegistrationStats(),
              fetchUserVotingStats(),
              fetchUserActivityData()
            ]);
            break;

          case 'winnercontent':
          case 'new-winner':
            await fetchWeeklyParticipants();
            break;

          case 'new-statistics':
          case 'stat':
            await Promise.allSettled([
              fetchProfiles(),
              fetchUserRoles(),
              fetchUserVotingStats()
            ]);
            break;

          case 'next_week_voting':
            // No specific data loading needed for now
            break;

          default:
            console.log(`Unknown tab: ${activeTab}`);
        }

        setTabDataLoaded(prev => ({ ...prev, [activeTab]: true }));
      } catch (error) {
        console.error(`Error loading data for tab ${activeTab}:`, error);
      } finally {
        setTabLoading(prev => ({ ...prev, [activeTab]: false }));
      }
    };

    loadTabData();
  }, [activeTab, isAdmin, loading]);
    
    
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

  // Removed auto-refresh to prevent constant reloading

  // Re-fetch profiles when switching to 'regular' role filter
  useEffect(() => {
    if (roleFilter === 'regular' && activeTab === 'registrations') {
      console.log('🔵 roleFilter changed to regular, reloading profiles...');
      fetchProfiles();
    }
  }, [roleFilter]);

  // Recalculate application stats when contestApplications change
  useEffect(() => {
    if (contestApplications.length > 0) {
      fetchDailyApplicationStats();
      fetchDailyStats(); // Also refresh daily voting stats
    }
  }, [contestApplications]);

  // Handle Weekly Contest participants filtering - only by admin_status
  useEffect(() => {
    const filterWeeklyParticipants = async () => {
      console.log('Filtering by admin_status:', adminStatusFilter);
      
      // IMPORTANT: For "This Week" tab, show ONLY participants with 'this week' status
      // Filter by admin_status only
      const filteredByStatus = weeklyParticipants.filter(p => 
        p.admin_status === 'this week' && 
        (adminStatusFilter === 'all' || p.admin_status === adminStatusFilter)
      );

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

  // Memoized filtered past participants by week interval
  const filteredPastByInterval = useMemo(() => {
    console.log('🔍 Filtering past participants by interval:', pastWeekIntervalFilter);
    console.log('📋 Total past participants:', pastWeekParticipants.length);
    
    if (pastWeekIntervalFilter === 'all') {
      console.log('✅ Showing all participants');
      return pastWeekParticipants;
    }
    
    const filtered = pastWeekParticipants.filter(participant => {
      const participantInterval = participant.week_interval || getParticipantWeekInterval(participant);
      const matches = participantInterval === pastWeekIntervalFilter;
      
      if (matches) {
        const appData = participant.application_data || {};
        console.log(`✓ Matched participant: ${appData.first_name} ${appData.last_name}, interval: ${participantInterval}, rank: ${participant.final_rank}`);
      }
      
      return matches;
    });
    
    console.log('📊 Filtered count:', filtered.length);
    const winners = filtered.filter(p => p.final_rank === 1);
    console.log('🏆 Winners in filtered list:', winners.map(w => {
      const appData = w.application_data || {};
      return {
        name: `${appData.first_name} ${appData.last_name}`,
        participantId: w.id,
        interval: w.week_interval
      };
    }));
    
    return filtered;
  }, [pastWeekParticipants, pastWeekIntervalFilter]);

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

  // Fetch user activity: how many likes and ratings this user gave to others
  const fetchUserActivity = async (userId: string) => {
    if (loadingActivity.has(userId)) {
      console.log('⏭️ Already loading activity for:', userId);
      return; // Already loading
    }
    
    console.log('🔄 Starting to fetch activity for user:', userId);
    setLoadingActivity(prev => new Set(prev).add(userId));
    
    try {
      // Fetch likes given by this user
      console.log('📍 Fetching likes for user:', userId);
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select(`
          id,
          content_id,
          participant_id,
          created_at
        `)
        .eq('user_id', userId)
        .eq('content_type', 'contest')
        .order('created_at', { ascending: false });

      if (likesError) {
        console.error('❌ Error fetching likes:', likesError);
      } else {
        console.log('✅ Likes fetched:', likesData?.length || 0);
      }

      // Fetch profile data for liked participants WITH their week intervals
      let likesWithProfiles = [];
      if (likesData && likesData.length > 0) {
        const participantIds = likesData
          .map(like => like.participant_id)
          .filter(id => id != null);
        
        console.log(`📋 Processing ${likesData.length} likes, ${participantIds.length} with participant_id`);
        
        if (participantIds.length > 0) {
          // Get profiles
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, display_name, first_name, last_name, avatar_url, photo_1_url, photo_2_url')
            .in('id', participantIds);
          
          // Get participant week intervals from weekly_contest_participants table
          const { data: participantsData, error: participantsError } = await supabase
            .from('weekly_contest_participants')
            .select('id, week_interval, user_id')
            .in('id', participantIds);
          
          if (participantsError) {
            console.error('❌ Error fetching participants data:', participantsError);
          }
          
          const profilesMap = new Map(
            (profilesData || []).map(p => [p.id, p])
          );
          
          const participantsMap = new Map(
            (participantsData || []).map(p => [p.id, p.week_interval])
          );
          
          console.log('📅 Participant week intervals for likes:', Array.from(participantsMap.entries()).slice(0, 5));
          
          // Use participant's week_interval from the table
          likesWithProfiles = likesData.map(like => {
            const weekInterval = like.participant_id ? participantsMap.get(like.participant_id) : null;
            const profile = like.participant_id ? profilesMap.get(like.participant_id) : null;
            
            return {
              ...like,
              profiles: profile,
              week_interval: weekInterval
            };
          }).filter(like => like.profiles && like.week_interval);
          
          console.log(`✅ Likes with week_interval: ${likesWithProfiles.length} of ${likesData.length}`);
        }
      }

      // Fetch ratings given by this user
      console.log('⭐ Fetching ratings for user:', userId);
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('contestant_ratings')
        .select(`
          id,
          rating,
          contestant_name,
          participant_id,
          week_interval,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('❌ Error fetching ratings:', ratingsError);
      } else {
        console.log('✅ Ratings fetched:', ratingsData?.length || 0);
      }

      // Fetch participant profiles for ratings
      let ratingsWithParticipants = [];
      if (ratingsData && ratingsData.length > 0) {
        const participantIds = ratingsData
          .map(rating => rating.participant_id)
          .filter(id => id != null);
        
        console.log(`📋 Processing ${ratingsData.length} ratings, ${participantIds.length} with participant_id`);
        console.log('Participant IDs to fetch:', participantIds);
        
        if (participantIds.length > 0) {
          // Fetch from weekly_contest_participants table
          const { data: participantProfiles, error: profilesError } = await supabase
            .from('weekly_contest_participants')
            .select('id, application_data, user_id')
            .in('id', participantIds);
          
          if (profilesError) {
            console.error('❌ Error fetching participant data:', profilesError);
          }
          
          console.log('Fetched participant data:', participantProfiles?.length || 0);
          console.log('Participants data:', participantProfiles);
          
          const profilesMap = new Map(
            (participantProfiles || []).map(p => {
              const appData = p.application_data as any;
              return [p.id, {
                photo_1_url: appData?.photo1_url || appData?.photo_1_url,
                photo_2_url: appData?.photo2_url || appData?.photo_2_url,
                avatar_url: appData?.avatar_url,
                display_name: appData?.first_name && appData?.last_name 
                  ? `${appData.first_name} ${appData.last_name}`
                  : null
              }];
            })
          );
          
          ratingsWithParticipants = ratingsData.map(rating => {
            const participant = rating.participant_id ? profilesMap.get(rating.participant_id) : null;
            console.log(`Mapping rating for ${rating.contestant_name}:`, {
              participant_id: rating.participant_id,
              found_participant: !!participant,
              photo_1_url: participant?.photo_1_url,
              photo_2_url: participant?.photo_2_url
            });
            return {
              ...rating,
              participant
            };
          });
        } else {
          ratingsWithParticipants = ratingsData.map(rating => ({
            ...rating,
            participant: null
          }));
        }
        
        console.log('Final ratings with participants:', ratingsWithParticipants.map(r => ({
          name: r.contestant_name,
          has_participant: !!r.participant,
          photo: r.participant?.photo_1_url
        })));
      }

      // Для рейтингов вычисляем week_interval по ДАТЕ ГОЛОСОВАНИЯ (created_at)
      const finalRatings = (ratingsWithParticipants || []).map(rating => {
        if (!rating.created_at) return { ...rating, vote_week_interval: null };
        
        // Определяем понедельник недели для даты голосования
        const voteDate = new Date(rating.created_at);
        const dayOfWeek = voteDate.getDay();
        const monday = new Date(voteDate);
        
        // Adjust to Monday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        if (dayOfWeek === 0) {
          monday.setDate(monday.getDate() - 6); // Sunday -> previous Monday
        } else {
          monday.setDate(monday.getDate() - (dayOfWeek - 1)); // Go back to Monday
        }
        
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        
        // Format as DD/MM-DD/MM/YY
        const formatDate = (d: Date) => {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          return `${day}/${month}`;
        };
        
        const formatYear = (d: Date) => String(d.getFullYear()).slice(-2);
        
        const vote_week_interval = `${formatDate(monday)}-${formatDate(sunday)}/${formatYear(sunday)}`;
        
        return {
          ...rating,
          vote_week_interval
        };
      });

      const finalLikes = likesWithProfiles;

      // Collect all unique week intervals from RATINGS based on VOTING DATE
      const allWeekIntervals = new Set<string>();
      finalRatings.forEach(rating => {
        if (rating.vote_week_interval) allWeekIntervals.add(rating.vote_week_interval);
      });

      const uniqueWeeksArray = Array.from(allWeekIntervals);
      console.log('📊 Final stats for user', userId, ':', {
        likesCount: finalLikes.length,
        ratingsCount: finalRatings.length,
        uniqueWeeks: uniqueWeeksArray.length,
        weekIntervals: uniqueWeeksArray
      });
      console.log('📅 Vote weeks for this user:', finalRatings.map(r => ({ 
        voted_at: r.created_at, 
        week: r.vote_week_interval 
      })));

      // Store in BOTH states for compatibility
      const activityData = {
        likesCount: finalLikes.length,
        ratingsCount: finalRatings.length,
        likes: finalLikes,
        ratings: finalRatings,
        uniqueWeeks: uniqueWeeksArray.length,
        weekIntervals: uniqueWeeksArray
      };
      
      setUserActivityStats(prev => ({
        ...prev,
        [userId]: activityData
      }));
      
      setUserActivityData(prev => ({
        ...prev,
        [userId]: activityData
      }));
    } catch (error) {
      console.error('❌ Error fetching user activity:', error);
    } finally {
      setLoadingActivity(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Toggle expanded view for user activity
  const toggleUserActivity = (userId: string) => {
    const isExpanded = expandedActivity.has(userId);
    
    if (isExpanded) {
      setExpandedActivity(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } else {
      setExpandedActivity(prev => new Set(prev).add(userId));
      // Fetch data if not already loaded
      if (!userActivityStats[userId]) {
        fetchUserActivity(userId);
      }
    }
  };

  const handleRoleChange = (userId: string, userName: string, newRole: string) => {
    assignUserRole(userId, newRole);
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
            role: role as 'admin' | 'moderator' | 'suspicious'
          }]);

        if (insertError) throw insertError;
      }

      // Обновляем локальное состояние
      setUserRoleMap(prev => ({
        ...prev,
        [userId]: role
      }));

      const roleDescriptions: Record<string, string> = {
        'usual': 'usual user',
        'suspicious': 'suspicious (cannot vote)',
        'moderator': 'moderator',
        'admin': 'admin'
      };
      
      const roleDescription = roleDescriptions[role] || role;

      toast({
        title: "Success",
        description: `User role updated to ${roleDescription}`,
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
      // Use the same RPC function as registration stats (with Manila timezone)
      const { data, error } = await supabase.rpc('get_daily_application_stats');
      
      if (error) {
        console.error('Error fetching daily application stats:', error);
        return;
      }

      console.log('📊 Daily application stats fetched:', data);
      setDailyApplicationStats(data || []);

    } catch (error) {
      console.error('Error in fetchDailyApplicationStats:', error);
    }
  };

  const fetchDailyRegistrationStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_daily_registration_stats');
      if (error) {
        console.error('Error fetching daily registration stats:', error);
        throw error;
      }
      
      console.log('📊 Daily registration stats fetched:', data);
      
      // Data already contains all needed fields including suspicious_count
      setDailyRegistrationStats(data || []);

      // Fetch new stats by type
      const { data: statsByType, error: statsByTypeError } = await supabase.rpc('get_registration_stats_by_type');
      if (statsByTypeError) {
        console.error('Error fetching registration stats by type:', statsByTypeError);
      } else {
        console.log('📊 Registration stats by type fetched:', statsByType);
        setRegistrationStatsByType(statsByType || []);
      }
    } catch (error) {
      console.error('Error in fetchDailyRegistrationStats:', error);
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
      console.log('checkAdminAccess: Admin access granted');
      
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
      setProfilesLoading(true); // Add loading state
      
      // Check if we need to load regular users specifically
      const needsRegularUsers = roleFilter === 'regular';
      
      let profilesData;
      if (needsRegularUsers) {
        // Get user IDs with 'regular' role
        const { data: regularRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'regular');
        
        const regularUserIds = regularRoles?.map(r => r.user_id) || [];
        console.log('🔵 Loading regular users specifically:', regularUserIds.length);
        
        // Fetch only those profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', regularUserIds)
          .order('created_at', { ascending: false });
        
        profilesData = data;
        if (error) throw error;
      } else {
        // Fetch ALL profiles using pagination to bypass PostgREST 1000 row limit
        console.log('🔵 Fetching ALL profiles from database using pagination...');
        let allProfiles: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allProfiles = [...allProfiles, ...data];
            console.log(`📄 Loaded page ${page + 1}: ${data.length} profiles (total: ${allProfiles.length})`);
            
            // Check if we got a full page - if not, we're done
            if (data.length < pageSize) {
              hasMore = false;
            }
            page++;
          } else {
            hasMore = false;
          }
        }
        
        console.log('✅ Fetched ALL profiles from DB via pagination:', allProfiles.length);
        
        // CRITICAL DEBUG: Check if uspehico user profile is in profiles data
        const uspehProfile = allProfiles.find(p => p.id === '6fae574d-a607-445f-aeb1-8174f8391b5b');
        console.log('🎯 USPEHICO PROFILE IN PROFILES DATA:', uspehProfile ? {
          id: uspehProfile.id?.substring(0, 8),
          firstName: uspehProfile.first_name,
          lastName: uspehProfile.last_name,
          createdAt: uspehProfile.created_at
        } : '❌ NOT FOUND IN PROFILES DATA FROM DB');
        
        profilesData = allProfiles;
      }

      if (!profilesData) {
        toast({
          title: "Error",
          description: "Failed to fetch profiles",
          variant: "destructive"
        });
        return;
      }

      // Fetch ALL auth data with pagination using new paginated function
      console.log('📧 Fetching ALL auth data using pagination...');
      let allAuthData: any[] = [];
      let authPage = 0;
      const authPageSize = 1000;
      let hasMoreAuth = true;

      while (hasMoreAuth) {
        const { data: authBatch, error: authError } = await supabase
          .rpc('get_user_auth_data_admin_paginated', {
            page_number: authPage,
            page_size: authPageSize
          });
        
        if (authError) {
          console.error(`❌ Error fetching auth page ${authPage + 1}:`, authError);
          hasMoreAuth = false;
        } else if (authBatch && authBatch.length > 0) {
          allAuthData = [...allAuthData, ...authBatch];
          console.log(`📧 Loaded auth page ${authPage + 1}: ${authBatch.length} records (total: ${allAuthData.length})`);
          
          if (authBatch.length < authPageSize) {
            hasMoreAuth = false;
          } else {
            authPage++;
          }
        } else {
          hasMoreAuth = false;
        }
      }

      console.log('✅ Fetched ALL auth data via pagination:', allAuthData.length);

      // CRITICAL DEBUG: Check if uspehico user is in auth data
      const uspehAuthUser = allAuthData?.find(a => a.email?.toLowerCase().includes('uspeh'));
      console.log('🎯 USPEHICO USER IN AUTH DATA:', uspehAuthUser ? {
        user_id: uspehAuthUser.user_id?.substring(0, 8),
        email: uspehAuthUser.email,
        auth_provider: uspehAuthUser.auth_provider
      } : '❌ NOT FOUND IN AUTH DATA');
      
      if (allAuthData && allAuthData.length > 0) {
        console.log('📧 Sample auth data:', {
          user_id: allAuthData[0].user_id,
          email: allAuthData[0].email,
          auth_provider: allAuthData[0].auth_provider
        });
      }
      
      const authData = allAuthData;

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

      // Fetch device fingerprints
      const { data: fingerprintsData, error: fingerprintsError } = await supabase
        .from('user_device_fingerprints')
        .select('user_id, fingerprint_id')
        .order('created_at', { ascending: false });

      if (fingerprintsError) {
        console.error('❌ Failed to fetch fingerprints:', fingerprintsError);
      } else {
        console.log('✅ Fingerprints fetched:', fingerprintsData?.length, 'records');
      }

      const profilesWithAuth = (profilesData || []).map(profile => {
        const userAuthData = authData?.find(auth => auth.user_id === profile.id);
        
        // CRITICAL DEBUG: Log when authData is not found
        if (!userAuthData) {
          console.error(`🔴 NO AUTH DATA for profile ${profile.id?.substring(0, 8)}:`, {
            profileId: profile.id,
            authDataLength: authData?.length || 0,
            authDataSample: authData?.slice(0, 2).map(a => a.user_id)
          });
        }
        
        // DEBUG for uspeh email specifically
        if (userAuthData?.email && userAuthData.email.toLowerCase().includes('uspeh')) {
          console.log('🔍 FOUND uspeh user in profilesWithAuth:', {
            profileId: profile.id?.substring(0, 8),
            email: userAuthData.email,
            firstName: profile.first_name,
            lastName: profile.last_name
          });
        }
        
        // Debug logging for missing emails
        const hasAuthData = !!userAuthData;
        const authDataEmail = userAuthData?.email;
        if (!authDataEmail) {
          console.warn(`⚠️ No email for user ${profile.id?.substring(0, 8)}:`, {
            hasAuthData,
            authDataEmail: {
              _type: typeof authDataEmail,
              value: String(authDataEmail)
            },
            fullAuthData: userAuthData
          });
        }
        
        // DEBUG: Specifically check for the user we're looking for
        if (profile.id === '6fae574d-a607-445f-aeb1-8174f8391b5b') {
          console.log('🎯 FOUND TARGET USER in profiles:', {
            profileId: profile.id,
            firstName: profile.first_name,
            hasAuthData: !!userAuthData,
            authDataEmail: authDataEmail,
            fullAuthData: userAuthData
          });
        }
        
        // Get the most recent login log with an IP address for this user
        const userLoginLog = loginLogs
          ?.filter(log => log.user_id === profile.id && log.ip_address)
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        // Get fingerprint for this user
        const userFingerprint = fingerprintsData?.find(fp => fp.user_id === profile.id);
        
        const profileData = {
          ...profile,
          auth_provider: userAuthData?.auth_provider || 'unknown',
          // Email is stored in auth.users only, not in profiles table (security)
          email: authDataEmail || null,
          facebook_data: userAuthData?.facebook_data || null,
          last_sign_in_at: userAuthData?.last_sign_in_at || null,
          email_confirmed_at: userAuthData?.email_confirmed_at || null,
          ip_address: (userLoginLog?.ip_address as string) || null,
          user_agent: (userLoginLog?.user_agent as string) || null,
          // Get country and city from user_metadata (set during registration)
          country: (userAuthData as any)?.user_metadata?.country || profile.country || null,
          city: (userAuthData as any)?.user_metadata?.city || profile.city || null,
          fingerprint_id: userFingerprint?.fingerprint_id || null,
          raw_user_meta_data: (userAuthData as any)?.user_metadata || {},
          provider_data: (userAuthData as any)?.raw_app_meta_data || (userAuthData as any)?.app_metadata || null
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
      
      // CRITICAL DEBUG: Check if uspehico user is in the final array
      const uspehUser = profilesWithAuth.find(p => p.email?.toLowerCase().includes('uspeh'));
      console.log('🎯 USPEHICO USER IN FINAL PROFILES:', uspehUser ? {
        id: uspehUser.id?.substring(0, 8),
        firstName: uspehUser.first_name,
        lastName: uspehUser.last_name,
        email: uspehUser.email
      } : '❌ NOT FOUND IN PROFILES ARRAY');

      console.log('✅ Setting profiles state with', profilesWithAuth.length, 'profiles');
      setProfiles(profilesWithAuth);
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
    } finally {
      setProfilesLoading(false);
    }
  };

  // Fetch email domain statistics
  const fetchEmailDomainStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_email_domain_stats');
      if (error) throw error;
      setEmailDomainStats(data || []);
    } catch (error) {
      console.error('Error fetching email domain stats:', error);
    }
  };

  // Fetch user voting statistics
  const fetchUserVotingStats = async () => {
    try {
      console.log('🔄 Starting to fetch user voting stats...');
      const { data, error } = await supabase
        .from('user_voting_stats')
        .select('user_id, is_regular_voter, voting_week_intervals, unique_weeks_count, total_votes_count');
      
      if (error) {
        console.error('❌ Error fetching user voting stats:', error);
        throw error;
      }
      
      console.log('📊 Raw voting stats data received:', data?.length || 0, 'records');
      
      // Convert to map for easy lookup
      const statsMap: Record<string, any> = {};
      (data || []).forEach(stat => {
        statsMap[stat.user_id] = stat;
      });
      
      setUserVotingStats(statsMap);
      console.log('✅ Voting stats loaded and set to state:', Object.keys(statsMap).length, 'users');
      console.log('📊 Sample voting stat:', data && data.length > 0 ? data[0] : 'No data');
    } catch (error) {
      console.error('❌ Error in fetchUserVotingStats:', error);
    }
  };

  // Fetch email domain voting statistics
  const fetchEmailDomainVotingStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_email_domain_voting_stats');
      if (error) throw error;
      setEmailDomainVotingStats(data || []);
    } catch (error) {
      console.error('Error fetching email domain voting stats:', error);
    }
  };

  // Fetch user activity data (likes given)
  const fetchUserActivityData = async () => {
    try {
      console.log('🔄 Starting to fetch user activity data (likes)...');
      const { data, error } = await supabase
        .from('likes')
        .select('user_id');
      
      if (error) {
        console.error('❌ Error fetching likes data:', error);
        throw error;
      }
      
      console.log('❤️ Raw likes data received:', data?.length || 0, 'records');
      
      // Count likes given by each user
      const likesMap: Record<string, any> = {};
      (data || []).forEach(like => {
        if (!likesMap[like.user_id]) {
          likesMap[like.user_id] = { likes_given: 0 };
        }
        likesMap[like.user_id].likes_given++;
      });
      
      setUserActivityData(likesMap);
      console.log('✅ User activity data loaded and set to state:', Object.keys(likesMap).length, 'users');
      console.log('❤️ Sample activity data:', Object.keys(likesMap).length > 0 ? {
        userId: Object.keys(likesMap)[0],
        likes: likesMap[Object.keys(likesMap)[0]].likes_given
      } : 'No data');
    } catch (error) {
      console.error('❌ Error in fetchUserActivityData:', error);
    }
  };

  // Fetch users who have voted
  const fetchUsersWhoVoted = async () => {
    try {
      const { data, error } = await supabase
        .from('contestant_ratings')
        .select('user_id');

      if (error) {
        console.error('Error fetching users who voted:', error);
        return;
      }

      // Create a Set of unique user IDs who have voted
      const votedUserIds = new Set(data?.map(r => r.user_id).filter(Boolean) || []);
      setUsersWhoVoted(votedUserIds);
      console.log('✅ Users who voted count:', votedUserIds.size);
      console.log('📊 Sample voted user IDs:', Array.from(votedUserIds).slice(0, 5));
    } catch (error) {
      console.error('Error in fetchUsersWhoVoted:', error);
    }
  };

  // Auto-load user activity when "2 w" filter is activated AND profiles are loaded
  useEffect(() => {
    // Только если фильтр активен, есть профили и мы на вкладке registrations
    if (regStatusFilter === '2+weeks' && profiles.length > 0 && activeTab === 'registrations' && !isLoadingWeeksFilter) {
      const alreadyLoadedCount = Object.keys(userActivityStats).length;
      const needToLoad = profiles.length - alreadyLoadedCount;
      
      console.log('🔄 Auto-loading user activity for 2+ weeks filter...', {
        profilesCount: profiles.length,
        alreadyLoaded: alreadyLoadedCount,
        needToLoad: needToLoad
      });
      
      if (needToLoad > 0) {
        setIsLoadingWeeksFilter(true);
        
        // Load activity for all profiles that don't have data yet
        const loadAllActivity = async () => {
          let loadedCount = 0;
          for (const profile of profiles) {
            if (!userActivityStats[profile.id]) {
              await fetchUserActivity(profile.id);
              loadedCount++;
              if (loadedCount % 50 === 0) {
                console.log(`⏳ Loaded ${loadedCount}/${needToLoad} user activities...`);
              }
            }
          }
          setIsLoadingWeeksFilter(false);
          console.log(`✅ Finished loading activity for ${loadedCount} users out of ${profiles.length} total`);
        };
        
        loadAllActivity();
      } else {
        console.log('✅ All user activities already loaded');
      }
    }
  }, [regStatusFilter, profiles, activeTab]);

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

  // Auto-fetch activity stats for visible profiles in Reg tab
  useEffect(() => {
    if (activeTab !== 'new-registrations' || profiles.length === 0 || loading || tabLoading['new-registrations']) {
      return;
    }

    console.log('🔵 Reg tab active, starting auto-fetch for visible profiles');
    
    // Get current page profiles
    const filteredProfiles = profiles.filter(profile => {
      const userRole = userRoleMap[profile.id] || 'usual';
      
      if (roleFilter === 'admin') {
        return userRole === 'admin';
      } else if (roleFilter === 'usual') {
        return userRole === 'usual' || !userRole;
      }

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
    });

    const startIdx = (regPaginationPage - 1) * regItemsPerPage;
    const endIdx = startIdx + regItemsPerPage;
    const paginatedProfiles = filteredProfiles.slice(startIdx, endIdx);
    
    console.log('📄 Visible profiles on current page:', paginatedProfiles.length);
    
    // Delay fetch to avoid race conditions
    const timer = setTimeout(() => {
      paginatedProfiles.forEach(profile => {
        // Check if we need to fetch - directly check the ref values
        if (!loadingActivity.has(profile.id) && !userActivityStats[profile.id]) {
          console.log('📊 Auto-fetching activity for:', profile.id, profile.display_name);
          fetchUserActivity(profile.id);
        } else {
          console.log('⏭️ Skipping fetch for:', profile.id, 'loading:', loadingActivity.has(profile.id), 'hasStats:', !!userActivityStats[profile.id]);
        }
      });
    }, 200);
    
    return () => clearTimeout(timer);
  }, [activeTab, profiles.length, regPaginationPage, roleFilter, searchQuery, verificationFilter, loading]);

  // Auto-fetch activity data when 2+ weeks filter is activated
  useEffect(() => {
    console.log('🔍 2+ Weeks filter check:', {
      regStatusFilter,
      profilesCount: profiles.length,
      activeTab,
      userActivityStatsLoaded: Object.keys(userActivityStats).length,
      shouldFetch: regStatusFilter === '2+weeks' && profiles.length > 0 && activeTab === 'registrations'
    });
    
    if (regStatusFilter === '2+weeks' && profiles.length > 0 && activeTab === 'registrations') {
      console.log('🔄 2+ Weeks filter activated, fetching activity for all users...');
      setIsLoadingWeeksFilter(true);
      
      // Get profiles that need data fetched
      const profilesToFetch = profiles.filter(profile => {
        const hasStats = userActivityStats[profile.id];
        const isLoading = loadingActivity.has(profile.id);
        
        if (!hasStats && !isLoading) {
          console.log(`📊 Need to fetch for user: ${profile.id} (${profile.email})`);
          return true;
        }
        
        if (hasStats) {
          console.log(`⏭️ Already have stats for: ${profile.id} (${profile.email})`);
        }
        if (isLoading) {
          console.log(`⏳ Already loading for: ${profile.id} (${profile.email})`);
        }
        
        return false;
      });
      
      console.log(`🔄 Starting ${profilesToFetch.length} fetches out of ${profiles.length} total profiles...`);
      
      if (profilesToFetch.length > 0) {
        const fetchPromises = profilesToFetch.map(profile => fetchUserActivity(profile.id));
        
        Promise.all(fetchPromises).finally(() => {
          console.log(`✅ All activity data loaded for 2+ weeks filter`);
          setIsLoadingWeeksFilter(false);
        });
      } else {
        console.log(`✅ All data already loaded`);
        setIsLoadingWeeksFilter(false);
      }
    } else {
      setIsLoadingWeeksFilter(false);
    }
  }, [regStatusFilter, profiles.length, activeTab, Object.keys(userActivityStats).length]);

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
    
    // Debug: Check applications for Saturday 11/10
    const saturdayApps = processedData.filter((app: any) => {
      if (!app.submitted_at) return false;
      const appDate = new Date(app.submitted_at).toISOString().split('T')[0];
      return appDate === '2025-10-11';
    });
    
    if (saturdayApps.length > 0) {
      console.log(`🔍 Found ${saturdayApps.length} applications for Saturday 11/10:`, 
        saturdayApps.map(a => ({
          name: `${a.application_data?.first_name} ${a.application_data?.last_name}`,
          submitted_at: a.submitted_at,
          admin_status: a.admin_status,
          deleted_at: a.deleted_at
        }))
      );
    }
    
    setContestApplications(processedData);
  };

  // Load all applications for the selected date when 'all' filter is active
  useEffect(() => {
    if (selectedNewAppDay?.filter === 'all') {
      const loadAllApplicationsForDate = async () => {
        const { data } = await supabase
          .from('weekly_contest_participants')
          .select('*')
          .is('deleted_at', null)
          .order('submitted_at', { ascending: false });
        
        if (data) {
          setAllApplicationsByDate(data);
        }
      };
      
      loadAllApplicationsForDate();
    }
  }, [selectedNewAppDay]);

  const fetchDeletedApplications = async () => {
    const { data, error } = await supabase
      .from('weekly_contest_participants')
      .select('*')
      .in('admin_status', ['pending', 'rejected', 'pre next week', 'this week', 'next week', 'past'] as any)
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

  const fetchPartialSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('partial_contest_submissions')
        .select('*')
        .eq('submitted', false)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching partial submissions:', error);
        return;
      }
      
      setPartialSubmissions(data || []);
    } catch (error) {
      console.error('Error in fetchPartialSubmissions:', error);
    }
  };

  const fetchWeeklyParticipants = async () => {
    try {
      console.log('Fetching weekly participants from database...');
      
      // Fetch participants for next week, current week and past 3 weeks using optimized RPC function
      const weekOffsets = [1, 0, -1, -2, -3];
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
          application_data,
          rejection_reason_types,
          rejection_reason
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
            week_interval: item.week_interval,
            rejection_reason_types: item.rejection_reason_types,
            rejection_reason: item.rejection_reason
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

      // CRITICAL: Also fetch ALL participants with 'this week' status
      const { data: thisWeekData, error: thisWeekError } = await supabase
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
          application_data,
          rejection_reason_types,
          rejection_reason
        `)
        .eq('admin_status', 'this week')
        .is('deleted_at', null);

      if (thisWeekError) {
        console.error('Error loading this week participants:', thisWeekError);
      } else if (thisWeekData) {
        console.log(`Loaded ${thisWeekData.length} participants with 'this week' status`);
        
        // Transform this week participants to match RPC format
        const transformedThisWeek = thisWeekData.map((item: any) => {
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
            week_interval: item.week_interval,
            rejection_reason_types: item.rejection_reason_types,
            rejection_reason: item.rejection_reason
          };
        });
        
        // Merge with existing participants, avoiding duplicates
        const existingIds = new Set(allParticipants.map(p => p.participant_id));
        transformedThisWeek.forEach(p => {
          if (!existingIds.has(p.participant_id)) {
            allParticipants.push(p);
          }
        });
      }

      // CRITICAL: Also fetch ALL pending and rejected participants
      const { data: newApplicationsData, error: newError } = await supabase
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
          application_data,
          rejection_reason_types,
          rejection_reason
        `)
        .in('admin_status', ['pending', 'rejected'])
        .is('deleted_at', null);

      if (newError) {
        console.error('Error loading pending/rejected participants:', newError);
      } else if (newApplicationsData) {
        console.log(`Loaded ${newApplicationsData.length} participants with 'pending' or 'rejected' status`);
        
        // Transform pending/rejected participants to match RPC format
        const transformedNewApplications = newApplicationsData.map((item: any) => {
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
            week_interval: item.week_interval,
            rejection_reason_types: item.rejection_reason_types,
            rejection_reason: item.rejection_reason
          };
        });
        
        // Merge with existing participants, avoiding duplicates
        const existingIds = new Set(allParticipants.map(p => p.participant_id));
        transformedNewApplications.forEach(p => {
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
        week_interval: item.week_interval,
        rejection_reason_types: item.rejection_reason_types,
        rejection_reason: item.rejection_reason
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
      
      // Get ALL participants with next week status - no other filters
      const { data: nextWeekData, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'next week')
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
      
      // Get ALL participants with pre next week status - no other filters
      const { data: preNextWeekData, error } = await supabase
        .from('weekly_contest_participants')
        .select('*')
        .eq('admin_status', 'pre next week')
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

  // Fetch Next Week votes statistics (likes/dislikes per candidate)
  const fetchNextWeekVotesStats = async () => {
    try {
      const { data, error } = await supabase
        .from('next_week_votes')
        .select('candidate_name, vote_type');

      if (error) {
        console.error('Error fetching next week votes stats:', error);
        return;
      }

      // Aggregate votes by candidate name
      const stats: Record<string, { like_count: number; dislike_count: number }> = {};
      
      (data || []).forEach(vote => {
        if (!stats[vote.candidate_name]) {
          stats[vote.candidate_name] = { like_count: 0, dislike_count: 0 };
        }
        if (vote.vote_type === 'like') {
          stats[vote.candidate_name].like_count++;
        } else if (vote.vote_type === 'dislike') {
          stats[vote.candidate_name].dislike_count++;
        }
      });

      console.log('Next week votes stats:', stats);
      setNextWeekVotesStats(stats);
    } catch (error) {
      console.error('Error in fetchNextWeekVotesStats:', error);
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

  // Calculate current time display here to avoid hooks issues
  const getCurrentTimeDisplay = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      weekday: 'short'
    }).formatToParts(now);
    
    const time = `${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}`;
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value?.toLowerCase();
    const year = parts.find(p => p.type === 'year')?.value;
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase();
    
    return `${time} ${day} ${month} ${year} (${weekday})`;
  };

  return (
    <>
      <Helmet>
        <title>Admin Panel - Moderation</title>
        <meta name="description" content="Admin panel for moderating user profiles and managing roles" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 md:px-6">
        <div className="max-w-7xl md:mx-auto px-2 md:px-6">
          {/* Compact Header with Country Filter and Backup */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-3">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-44">
                  <SelectValue>
                    {CONTEST_COUNTRIES.find(c => c.code === selectedCountry) && (
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{CONTEST_COUNTRIES.find(c => c.code === selectedCountry)!.flag}</span>
                        <span className="text-sm">{CONTEST_COUNTRIES.find(c => c.code === selectedCountry)!.name}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CONTEST_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{country.flag}</span>
                        <span>{country.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <BackupTrigger />
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                {timezone}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {getCurrentTimeDisplay()}
              </span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(tab) => {
          console.log('📑 Tab changed to:', tab);
            setActiveTab(tab);
          }} className="space-y-6">
            
            {/* Mobile layout for new tabs */}
            <div className="md:hidden">
              <TabsList className="grid grid-cols-9 w-full gap-1">
                <TabsTrigger value="new-applications" className="text-[11px] px-1 bg-blue-100">
                  New
                </TabsTrigger>
                <TabsTrigger value="new-pre-next" className="text-[11px] px-1 bg-blue-100">
                  Pre
                </TabsTrigger>
                <TabsTrigger value="new-next-week" className="text-[11px] px-1 bg-blue-100">
                  Next
                </TabsTrigger>
                <TabsTrigger value="new-weekly" className="text-[11px] px-1 bg-blue-100">
                  This
                </TabsTrigger>
                <TabsTrigger value="new-past" className="text-[11px] px-1 bg-blue-100">
                  Past
                </TabsTrigger>
                <TabsTrigger value="new-all" className="text-[11px] px-1 bg-blue-100">
                  All
                </TabsTrigger>
                <TabsTrigger value="new-registrations" className="text-[11px] px-1 bg-blue-100">
                  Reg
                </TabsTrigger>
                <TabsTrigger value="new-statistics" className="text-[11px] px-1 bg-blue-100">
                  Stat
                </TabsTrigger>
                <TabsTrigger value="new-winner" className="text-[11px] px-1 bg-blue-100">
                  W
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Desktop layout for new tabs */}
            <TabsList className="hidden md:flex bg-blue-50 gap-1">
              <TabsTrigger value="new-applications" className="bg-blue-100 px-4">
                New1
              </TabsTrigger>
              <TabsTrigger value="new-pre-next" className="bg-blue-100 px-4">
                Pre
              </TabsTrigger>
              <TabsTrigger value="new-next-week" className="bg-blue-100 px-4">
                Next
              </TabsTrigger>
              <TabsTrigger value="new-weekly" className="bg-blue-100 px-4">
                This
              </TabsTrigger>
              <TabsTrigger value="new-past" className="bg-blue-100 px-4">
                Past
              </TabsTrigger>
              <TabsTrigger value="new-all" className="bg-blue-100 px-4">
                All
              </TabsTrigger>
              <TabsTrigger value="new-registrations" className="bg-blue-100 px-4">
                Reg
              </TabsTrigger>
              <TabsTrigger value="new-statistics" className="bg-blue-100 px-4">
                Stat
              </TabsTrigger>
              <TabsTrigger value="new-winner" className="bg-blue-100 px-4">
                W
              </TabsTrigger>
            </TabsList>

            {/* Old Tabs - Don't Use */}
            <div className="border-t pt-4 mt-6 hidden">
              {/* COMMENTED OUT - Testing new tabs first
              <div className="md:hidden">
                <TabsList className="grid grid-cols-6 w-full opacity-50">
                  <TabsTrigger value="new1" className="text-xs">
                    New1
                  </TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs">
                    This
                  </TabsTrigger>
                  <TabsTrigger value="pastweek" className="text-xs">
                    Past
                  </TabsTrigger>
                  <TabsTrigger value="registrations" className="text-xs">
                    Reg
                  </TabsTrigger>
                  <TabsTrigger value="stat" className="text-xs">
                    Stat
                  </TabsTrigger>
                  <TabsTrigger value="winnercontent" className="text-xs">
                    Win
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsList className="hidden md:flex opacity-50">
                <TabsTrigger value="new1">
                  New1
                </TabsTrigger>
                <TabsTrigger value="weekly">
                  This
                </TabsTrigger>
                <TabsTrigger value="pastweek">
                  Past
                </TabsTrigger>
                <TabsTrigger value="registrations">
                  Reg
                </TabsTrigger>
                <TabsTrigger value="stat">
                  Stat
                </TabsTrigger>
                <TabsTrigger value="winnercontent">
                  Win
                </TabsTrigger>
              </TabsList>
              */}
            </div>


            {/* ==================== OLD TABS CONTENT - TEMPORARILY REMOVED FOR TESTING ==================== 
                
                Old tabs (weekly, prenextweek, nextweek, pastweek, all, new1, registrations, stat, winnercontent)
                have been temporarily removed to test new refactored tabs.
                
                Lines 3322-8940 (~5,600 lines) can be restored from git history if needed.
                
            ====================================================================================  */}

            {/* New Refactored Tab Contents */}
            <TabsContent value="new-applications" className="space-y-4">
              <AdminNewApplicationsTab
                loading={tabLoading['new-applications']}
                applications={selectedNewAppDay ? (selectedNewAppDay.filter === 'all' ? allApplicationsByDate : contestApplications).filter(app => {
                  if (!app.submitted_at) return false;
                  
                  // Exclude duplicates: if this user_id already has an entry with a different status, hide this pending one
                  if (app.admin_status === 'pending') {
                    const hasDifferentStatus = weeklyParticipants.some(other => 
                      other.user_id === app.user_id && 
                      other.id !== app.id && 
                      other.admin_status !== 'pending' &&
                      !other.deleted_at
                    );
                    if (hasDifferentStatus) return false;
                  }
                  
                  // Parse dates in UTC for comparison
                  const appDate = new Date(app.submitted_at).toISOString().split('T')[0];
                  
                  const filterDate = selectedNewAppDay.date;
                  
                  // Check if date matches
                  if (appDate !== filterDate) return false;
                  
                  // For 'all' filter, show all applications submitted on this day
                  if (selectedNewAppDay.filter === 'all') {
                    return true;
                  }
                  
                  // Apply filter based on type
                  if (selectedNewAppDay.filter === 'approved') {
                    // Show applications that were CHANGED TO pre/next/this week statuses on this day
                    // Check status_history for these status changes on this day
                    const statusHistory = app.status_history || {};
                    const reservedStatuses = ['pre next week', 'next week', 'this week', 'past'];
                    
                    return reservedStatuses.some(status => {
                      const statusData = statusHistory[status];
                      if (!statusData || !statusData.changed_at) return false;
                      
                      const changedDate = new Date(statusData.changed_at).toISOString().split('T')[0];
                      
                      return changedDate === filterDate;
                    });
                  } else if (selectedNewAppDay.filter === 'rejected') {
                    // Show applications that were CHANGED TO rejected status on this day
                    const statusHistory = app.status_history || {};
                    const rejectedData = statusHistory['rejected'];
                    
                    if (!rejectedData || !rejectedData.changed_at) return false;
                    
                    const changedAtStr = new Date(rejectedData.changed_at).toLocaleString('en-US', {
                      timeZone: 'Asia/Manila',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }).split(',')[0];
                    const [cMonth, cDay, cYear] = changedAtStr.split('/');
                    const changedDate = `${cYear}-${cMonth.padStart(2, '0')}-${cDay.padStart(2, '0')}`;
                    
                    return changedDate === filterDate;
                  }
                  
                  return false;
                }) : contestApplications}
                deletedApplications={deletedApplications}
                showDeleted={showDeletedApplications}
                onToggleDeleted={setShowDeletedApplications}
                onViewPhotos={openPhotoModal}
                onEdit={(participant) => {
                  setEditingParticipantData({
                    ...participant,
                    application_data: participant.application_data,
                  });
                  setShowParticipationModal(true);
                }}
                onApprove={async (participant) => {
                  const appData = participant.application_data || {};
                  const participantName = `${appData.first_name} ${appData.last_name}`;
                  const result = await updateParticipantStatusWithHistory(
                    participant.id,
                    'pre next week',
                    participantName
                  );
                  if (result.success) {
                    toast({
                      title: "Success",
                      description: "Application approved and moved to Pre Next Week",
                    });
                    fetchContestApplications();
                  }
                }}
                onReject={(participant) => {
                  const appData = participant.application_data || {};
                  setApplicationToReject({
                    id: participant.id,
                    name: `${appData.first_name} ${appData.last_name}`
                  });
                  setRejectModalOpen(true);
                }}
                onDelete={async (app) => {
                  const appData = app.application_data || {};
                  const name = `${appData.first_name} ${appData.last_name}`;
                  const { error } = await supabase
                    .from('weekly_contest_participants')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', app.id);
                  if (!error) {
                    toast({
                      title: "Deleted",
                      description: `${name} has been deleted`
                    });
                    fetchContestApplications();
                    const deleted = await fetchDeletedApplications();
                    setDeletedApplications(deleted);
                  }
                }}
                onRestore={async (app) => {
                  const appData = app.application_data || {};
                  const name = `${appData.first_name} ${appData.last_name}`;
                  const { error } = await supabase
                    .from('weekly_contest_participants')
                    .update({ deleted_at: null })
                    .eq('id', app.id);
                  if (!error) {
                    toast({
                      title: "Restored",
                      description: `${name} has been restored`
                    });
                    fetchContestApplications();
                    const deleted = await fetchDeletedApplications();
                    setDeletedApplications(deleted);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="new-pre-next">
              <AdminPreNextWeekTab
                loading={tabLoading['new-pre-next']}
                participants={preNextWeekParticipants}
                onViewPhotos={openPhotoModal}
                onStatusChange={async (participant, newStatus) => {
                  const appData = participant.application_data || {};
                  const participantName = `${appData.first_name} ${appData.last_name}`;
                  const result = await updateParticipantStatusWithHistory(
                    participant.id,
                    newStatus as ParticipantStatus,
                    participantName
                  );
                  if (result.success) {
                    toast({
                      title: "Success",
                      description: "Status updated successfully",
                    });
                    fetchPreNextWeekParticipants();
                  } else {
                    toast({
                      title: "Error",
                      description: "Failed to update status",
                      variant: "destructive",
                    });
                  }
                }}
                onEdit={(participant) => {
                  setEditingParticipantData({
                    id: participant.id,
                    user_id: participant.user_id,
                    application_data: participant.application_data,
                    status: participant.admin_status
                  });
                  setShowParticipationModal(true);
                }}
                onStatusHistory={(participantId, participantName, statusHistory) => {
                  setSelectedStatusHistory({
                    participantId,
                    participantName,
                    statusHistory
                  });
                  setStatusHistoryModalOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="new-next-week">
              <AdminNextWeekTab
                loading={tabLoading['new-next-week']}
                participants={nextWeekParticipants}
                onViewPhotos={openPhotoModal}
                onViewVoters={(participantName) => {
                  setSelectedParticipantForNextWeekVoters(participantName);
                  setNextWeekVotersModalOpen(true);
                }}
                onStatusChange={async (participant, newStatus) => {
                  const appData = participant.application_data || {};
                  const participantName = `${appData.first_name} ${appData.last_name}`;
                  const result = await updateParticipantStatusWithHistory(
                    participant.id,
                    newStatus as ParticipantStatus,
                    participantName
                  );
                  if (result.success) {
                    toast({
                      title: "Success",
                      description: "Status updated successfully",
                    });
                    fetchNextWeekParticipants();
                  } else {
                    toast({
                      title: "Error",
                      description: "Failed to update status",
                      variant: "destructive",
                    });
                  }
                }}
                onEdit={(participant) => {
                  setEditingParticipantData({
                    id: participant.id,
                    user_id: participant.user_id,
                    application_data: participant.application_data,
                    status: participant.admin_status
                  });
                  setShowParticipationModal(true);
                }}
              />
            </TabsContent>

            <TabsContent value="new-weekly">
              <AdminWeeklyTab
                loading={tabLoading['new-weekly']}
                participants={weeklyParticipants}
                statusFilter={adminStatusFilter}
                onStatusFilterChange={setAdminStatusFilter}
                onViewPhotos={openPhotoModal}
                dailyStats={dailyStats}
                onEdit={(participant) => {
                  setEditingParticipantData({
                    id: participant.id,
                    user_id: participant.user_id,
                    application_data: participant.application_data,
                    status: participant.admin_status
                  });
                  setShowParticipationModal(true);
                }}
                onStatusChange={async (participant, newStatus) => {
                  const appData = participant.application_data || {};
                  const participantName = `${appData.first_name} ${appData.last_name}`;
                  const result = await updateParticipantStatusWithHistory(
                    participant.id,
                    newStatus as ParticipantStatus,
                    participantName
                  );
                  if (result.success) {
                    toast({
                      title: "Success",
                      description: "Status updated successfully",
                    });
                    fetchWeeklyParticipants();
                  } else {
                    toast({
                      title: "Error",
                      description: "Failed to update status",
                      variant: "destructive",
                    });
                  }
                }}
                onViewVoters={(participant) => {
                  setSelectedParticipantForVoters(participant);
                  setVotersModalOpen(true);
                }}
                onViewStatusHistory={(participantId, participantName, statusHistory) => {
                  setSelectedStatusHistory({
                    participantId,
                    participantName,
                    statusHistory
                  });
                  setStatusHistoryModalOpen(true);
                }}
                profiles={profiles}
              />
            </TabsContent>

            <TabsContent value="new-past">
              <AdminPastWeekTab
                loading={tabLoading['new-past']}
                participants={weeklyParticipants}
                weekFilters={getDynamicPastWeekFilters}
                selectedWeekFilter={pastWeekFilter}
                onWeekFilterChange={setPastWeekFilter}
                pastWeekIntervalFilter={pastWeekIntervalFilter}
                setPastWeekIntervalFilter={setPastWeekIntervalFilter}
                pastStatusFilter={pastStatusFilter}
                setPastStatusFilter={setPastStatusFilter}
                onViewPhotos={openPhotoModal}
                onEdit={(participant) => {
                  setEditingParticipantData({
                    id: participant.id,
                    user_id: participant.user_id,
                    application_data: participant.application_data,
                    status: participant.admin_status
                  });
                  setShowParticipationModal(true);
                }}
                onStatusChange={async (participant, newStatus) => {
                  const appData = participant.application_data || {};
                  const participantName = `${appData.first_name} ${appData.last_name}`;
                  
                  // Pass week_interval if it exists on the participant object
                  const additionalData = participant.week_interval ? {
                    week_interval: participant.week_interval
                  } : undefined;
                  
                  const result = await updateParticipantStatusWithHistory(
                    participant.id,
                    newStatus as ParticipantStatus,
                    participantName,
                    additionalData
                  );
                  if (result.success) {
                    toast({
                      title: "Success",
                      description: "Status updated successfully",
                    });
                    fetchWeeklyParticipants();
                  } else {
                    toast({
                      title: "Error",
                      description: "Failed to update status",
                      variant: "destructive",
                    });
                  }
                }}
                onViewVoters={(participant) => {
                  setSelectedParticipantForVoters(participant);
                  setVotersModalOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="new-all">
              <AdminAllParticipantsTab
                loading={tabLoading['new-all']}
                participants={weeklyParticipants}
                profiles={profiles}
                onViewPhotos={openPhotoModal}
                onEdit={(participant) => {
                  setEditingParticipantData({
                    id: participant.id,
                    user_id: participant.user_id,
                    application_data: participant.application_data,
                    status: participant.admin_status
                  });
                  setShowEditModal(true);
                }}
                onStatusChange={async (participant, newStatus) => {
                  const appData = participant.application_data || {};
                  const participantName = `${appData.first_name} ${appData.last_name}`;
                  const result = await updateParticipantStatusWithHistory(
                    participant.id,
                    newStatus as ParticipantStatus,
                    participantName
                  );
                  if (result.success) {
                    await fetchWeeklyParticipants();
                  }
                }}
                onViewVoters={(participant) => {
                  setSelectedParticipantForVoters({
                    id: participant.id,
                    name: participant.name
                  });
                  setVotersModalOpen(true);
                }}
                onViewStatusHistory={(participantId, participantName, statusHistory) => {
                  setSelectedStatusHistory({
                    participantId,
                    participantName,
                    statusHistory
                  });
                  setStatusHistoryModalOpen(true);
                }}
                onOpenWinnerModal={(participantId, userId, name) => {
                  setSelectedWinner({ participantId, userId, name });
                  setShowWinnerContentModal(true);
                }}
                getAvailableWeekIntervals={getAvailableWeekIntervals}
              />
            </TabsContent>

            <TabsContent value="new-registrations">
              <AdminRegistrationsTab
                profiles={profiles}
                statusFilter={registrationsStatusFilter}
                onStatusFilterChange={setRegistrationsStatusFilter}
                userRoleMap={userRoleMap}
                userRoles={userRoles}
                userVotingStats={userVotingStats}
                expandedMaybeFingerprints={expandedMaybeFingerprints}
                setExpandedMaybeFingerprints={setExpandedMaybeFingerprints}
                verifyingUsers={verifyingUsers}
                handleEmailVerification={handleEmailVerification}
                handleRoleChange={handleRoleChange}
                expandedUserActivity={expandedUserActivity}
                setExpandedUserActivity={setExpandedUserActivity}
                userActivityData={userActivityData}
                fetchUserActivity={fetchUserActivity}
                loadingActivity={loadingActivity}
                isEmailDomainWhitelisted={isEmailDomainWhitelisted}
                emailDomainStats={emailDomainStats}
                loading={tabLoading['new-registrations'] || profilesLoading}
                onApprove={async (profile) => {
                  const { error } = await supabase
                    .from('profiles')
                    .update({ is_approved: true, moderated_at: new Date().toISOString(), moderated_by: user.id })
                    .eq('id', profile.id);
                  if (!error) {
                    toast({
                      title: "Success",
                      description: "Profile approved",
                    });
                    fetchProfiles();
                  }
                }}
                onReject={async (profile) => {
                  const { error } = await supabase
                    .from('profiles')
                    .update({ is_approved: false, moderated_at: new Date().toISOString(), moderated_by: user.id })
                    .eq('id', profile.id);
                  if (!error) {
                    toast({
                      title: "Success",
                      description: "Profile rejected",
                    });
                    fetchProfiles();
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="new-statistics">
              <AdminStatisticsTab />
            </TabsContent>

            <TabsContent value="new-winner" className="space-y-6">
              {weeklyParticipants
                .filter(p => p.final_rank === 1) // Show only winners
                .sort((a, b) => {
                  // Sort by week_interval descending (newest first)
                  const intervalA = a.week_interval || '';
                  const intervalB = b.week_interval || '';
                  return intervalB.localeCompare(intervalA);
                })
                .map(participant => (
                  <WinnerContentManager 
                    key={participant.id}
                    participantId={participant.id}
                    userId={participant.user_id}
                    participantName={`${participant.profiles?.first_name || ''} ${participant.profiles?.last_name || ''}`}
                  />
              ))}
              
              {weeklyParticipants.filter(p => p.final_rank === 1).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No winners to display
                </div>
              )}
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
        onClose={() => {
          setRejectModalOpen(false);
          setApplicationToReject(null);
        }}
         onConfirm={async (reasonTypes, notes) => {
           if (applicationToReject) {
             console.log('🔴 REJECT MODAL: Starting rejection process', { 
               applicationId: applicationToReject.id, 
               reasonTypes, 
               reasonTypes_type: typeof reasonTypes,
               reasonTypes_isArray: Array.isArray(reasonTypes),
               reasonTypes_value: reasonTypes,
               notes,
               notes_type: typeof notes,
               notes_value: notes
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
                    
                    const additionalData = {
                      rejection_reason_types: reasonTypes,
                      rejection_reason: notes || null,
                      reviewed_at: new Date().toISOString(),
                      reviewed_by: user?.id
                    };
                    
                    console.log('🔴 Calling updateParticipantStatusWithHistory with:', {
                      participantId: participant.id,
                      status: 'rejected',
                      participantName,
                      additionalData: additionalData,
                      additionalData_stringified: JSON.stringify(additionalData, null, 2)
                    });
                    
                    const result = await updateParticipantStatusWithHistory(
                      participant.id,
                      'rejected',
                      participantName,
                      additionalData
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
                  
                  // Close modal and clear state AFTER successful save
                  setRejectModalOpen(false);
                  setApplicationToReject(null);
                  
                  toast({
                    title: "Success",
                    description: `Participant rejected with ${reasonTypes.length} reason(s)`,
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
               
               // Close modal and clear state AFTER successful save
               setRejectModalOpen(false);
               setApplicationToReject(null);
              }
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
        isAdminEdit={true}
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
                      <Label htmlFor="edit-has-children">Have kids?</Label>
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
      {showWinnerContentModal && selectedWinner && (
        <Dialog 
          open={showWinnerContentModal} 
          onOpenChange={(open) => {
            setShowWinnerContentModal(open);
            if (!open) {
              // Reset selected winner when closing modal
              console.log('🔴 Closing modal, resetting selectedWinner');
              setTimeout(() => setSelectedWinner(null), 100);
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Управление контентом победительницы</DialogTitle>
            </DialogHeader>
            <WinnerContentManager
              participantId={selectedWinner.participantId}
              userId={selectedWinner.userId}
              participantName={selectedWinner.name}
            />
          </DialogContent>
        </Dialog>
      )}

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

const Admin = () => {
  return (
    <AdminCountryProvider>
      <AdminContent />
    </AdminCountryProvider>
  );
};

export default Admin;

