import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
import { 
  Calendar, FileText, UserCog, Eye, Edit, Check, X, Trash2, 
  RotateCcw, Copy, Facebook, Minus, AlertCircle, Trophy, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import cityTimezones from 'city-timezones';
import { AdminPhotoModal } from '@/components/admin-photo-modal';
import { RejectReasonModal, REJECTION_REASONS } from '@/components/reject-reason-modal';
import { VotersModal } from '@/components/voters-modal';
import { ContestParticipationModal } from '@/components/contest-participation-modal';
import { ApplicationEditHistory } from '@/components/ApplicationEditHistory';
import { ExpandableApplicationHistory } from '@/components/ExpandableApplicationHistory';

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
  status: string;
  submitted_at: string;
  approved_at?: string;
  rejected_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  rejection_reason_type?: string;
  reviewed_by?: string;
  deleted_at?: string;
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
  is_active: boolean;
  admin_status?: string;
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
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalImages, setPhotoModalImages] = useState<string[]>([]);
  const [photoModalIndex, setPhotoModalIndex] = useState(0);
  const [photoModalName, setPhotoModalName] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [applicationToReject, setApplicationToReject] = useState<{ id: string; name: string } | null>(null);
  const [votersModalOpen, setVotersModalOpen] = useState(false);
  const [selectedParticipantForVoters, setSelectedParticipantForVoters] = useState<{ id: string; name: string } | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [weeklyContestFilter, setWeeklyContestFilter] = useState<string>('this week');
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
  const [participantFilters, setParticipantFilters] = useState<{ [key: string]: string }>({});
   const [pastWeekParticipants, setPastWeekParticipants] = useState<any[]>([]);
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
  const [dailyStats, setDailyStats] = useState<Array<{ day_name: string; vote_count: number; like_count: number }>>([]);
  const [dailyApplicationStats, setDailyApplicationStats] = useState<Array<{ day_name: string; new_count: number; approved_count: number }>>([]);
  const [dailyRegistrationStats, setDailyRegistrationStats] = useState<Array<{ day_name: string; registration_count: number; verified_count: number }>>([]);
  const [selectedDay, setSelectedDay] = useState<{ day: number; type: 'new' | 'approved' } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log('Admin component rendering, statusFilter:', statusFilter);

  useEffect(() => {
    checkAdminAccess();
    fetchUserRoles();
    fetchDailyStats();
    fetchDailyApplicationStats();
    fetchDailyRegistrationStats();
    
    // Set up real-time subscriptions for automatic updates
    const contestAppsChannel = supabase
      .channel('contest-applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contest_applications'
        },
        (payload) => {
          console.log('Contest applications changed:', payload);
          // Refresh contest applications and stats
          fetchContestApplications();
          fetchDailyApplicationStats();
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contestAppsChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(ratingsChannel);
    };
  }, []);

  // Recalculate application stats when contestApplications change
  useEffect(() => {
    if (contestApplications.length > 0) {
      fetchDailyApplicationStats();
      fetchDailyStats(); // Also refresh daily voting stats
    }
  }, [contestApplications]);

  // Handle Weekly Contest participants filtering with async rating fetching
  useEffect(() => {
    const filterWeeklyParticipants = async () => {
      if (weeklyContestFilter === 'approve') {
        // Get approved applications
        const approvedApps = contestApplications
          .filter(app => app.status === 'approved')
          .filter((app, index, arr) => arr.findIndex(a => a.user_id === app.user_id) === index);

        // Get weekly participants with "pending" status
        const pendingParticipants = weeklyParticipants.filter(participant => {
          const adminStatus = participant.admin_status || participantFilters[participant.id];
          return adminStatus === 'pending';
        });

        // Combine both approved applications and pending participants
        const allParticipants = [...approvedApps, ...pendingParticipants];

        const participantsWithRatings = await Promise.all(
          allParticipants.map(async (item) => {
            // Handle both application and participant data structures
            const isFromApplication = 'application_data' in item && item.application_data;
            const appData = isFromApplication ? item.application_data : item.application_data || {};
            const userId = item.user_id;
            
            try {
              const { data: ratingStats } = await supabase
                .rpc('get_user_rating_stats', { target_user_id: userId });
              
              return {
                id: isFromApplication ? `app-${item.id}` : item.id,
                user_id: userId,
                application_data: appData,
                average_rating: ratingStats?.[0]?.average_rating || 0,
                total_votes: ratingStats?.[0]?.total_votes || 0,
                final_rank: null,
                fromApplication: isFromApplication
              };
            } catch (error) {
              console.error('Error fetching rating stats:', error);
              return {
                id: isFromApplication ? `app-${item.id}` : item.id,
                user_id: userId,
                application_data: appData,
                average_rating: 0,
                total_votes: 0,
                final_rank: null,
                fromApplication: isFromApplication
              };
            }
          })
        );

        setFilteredWeeklyParticipants(participantsWithRatings);
      } else if (weeklyContestFilter === 'reject') {
        // Get rejected applications that should not appear in other sections
        const rejectedApps = contestApplications
          .filter(app => app.status === 'rejected')
          .filter((app, index, arr) => arr.findIndex(a => a.user_id === app.user_id) === index);

        const rejectedParticipantsWithRatings = await Promise.all(
          rejectedApps.map(async (app) => {
            const appData = app.application_data || {};
            
            try {
              const { data: ratingStats } = await supabase
                .rpc('get_user_rating_stats', { target_user_id: app.user_id });
              
              return {
                id: `rejected-${app.id}`,
                user_id: app.user_id,
                application_data: appData,
                average_rating: ratingStats?.[0]?.average_rating || 0,
                total_votes: ratingStats?.[0]?.total_votes || 0,
                final_rank: null,
                fromApplication: true,
                status: 'rejected'
              };
            } catch (error) {
              console.error('Error fetching rating stats:', error);
              return {
                id: `rejected-${app.id}`,
                user_id: app.user_id,
                application_data: appData,
                average_rating: 0,
                total_votes: 0,
                final_rank: null,
                fromApplication: true,
                status: 'rejected'
              };
            }
          })
        );

        setFilteredWeeklyParticipants(rejectedParticipantsWithRatings);
      } else if (weeklyContestFilter === 'this week') {
        // Get current Monday for comparison
        const now = new Date();
        const currentMonday = new Date(now);
        const dayOfWeek = now.getDay();
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        currentMonday.setDate(now.getDate() - daysSinceMonday);
        currentMonday.setHours(0, 0, 0, 0);

        // Filter participants who are from current week OR have 'this week' status manually set
        const filteredByStatus = weeklyParticipants.filter(participant => {
          const adminStatus = participant.admin_status || participantFilters[participant.id] || (participant.final_rank ? 'this week' : 'approve');
          
          // Exclude if manually set to 'pending'
          if (adminStatus === 'pending') {
            return false;
          }
          
          // Include if manually set to 'this week'
          if (adminStatus === 'this week') {
            return true;
          }

          // Also include participants created this week if not set to pending
          const createdDate = new Date(participant.created_at);
          const participantMonday = new Date(createdDate);
          const participantDayOfWeek = createdDate.getDay();
          const participantDaysSinceMonday = participantDayOfWeek === 0 ? 6 : participantDayOfWeek - 1;
          participantMonday.setDate(createdDate.getDate() - participantDaysSinceMonday);
          participantMonday.setHours(0, 0, 0, 0);
          
          return participantMonday.getTime() >= currentMonday.getTime();
        });

        // Remove duplicates based on user_id
        const uniqueParticipants = filteredByStatus.filter((participant, index, arr) => 
          arr.findIndex(p => p.user_id === participant.user_id) === index
        );
        
        setFilteredWeeklyParticipants(uniqueParticipants);
      } else {
        const filtered = weeklyParticipants.filter(participant => {
          const index = weeklyParticipants.findIndex(p => p.user_id === participant.user_id);
          return weeklyParticipants.indexOf(participant) === index;
        });
        setFilteredWeeklyParticipants(filtered);
      }
    };

    filterWeeklyParticipants();
  }, [weeklyContestFilter, contestApplications, weeklyParticipants, participantFilters]);

  // Handle Past Week participants filtering  
  useEffect(() => {
    const filterPastWeekParticipants = () => {
      // Get current Monday for comparison
      const now = new Date();
      const currentMonday = new Date(now);
      const dayOfWeek = now.getDay();
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      currentMonday.setDate(now.getDate() - daysSinceMonday);
      currentMonday.setHours(0, 0, 0, 0);

      // Filter participants who are from previous weeks (not current week)
      const pastParticipants = weeklyParticipants.filter(participant => {
        const createdDate = new Date(participant.created_at);
        const participantMonday = new Date(createdDate);
        const participantDayOfWeek = createdDate.getDay();
        const participantDaysSinceMonday = participantDayOfWeek === 0 ? 6 : participantDayOfWeek - 1;
        participantMonday.setDate(createdDate.getDate() - participantDaysSinceMonday);
        participantMonday.setHours(0, 0, 0, 0);
        
        // Only include participants from previous weeks
        return participantMonday.getTime() < currentMonday.getTime();
      }).map(participant => ({
        ...participant,
        weekInterval: getParticipantWeekInterval(participant)
      }));

      setPastWeekParticipants(pastParticipants);
    };

    filterPastWeekParticipants();
  }, [weeklyParticipants, participantFilters]);

  // Helper function to determine week interval for participant
  const getParticipantWeekInterval = (participant: any) => {
    // If participant has final_rank, they were a finalist in their week
    if (participant.final_rank) {
      return `Week ${participant.final_rank === 1 ? 'Winner' : 'Finalist'} - ${formatWeekInterval(participant.created_at)}`;
    }
    
    // Otherwise, assign based on creation date
    const createdDate = new Date(participant.created_at);
    return formatWeekInterval(createdDate);
  };

  // Helper function to format week interval
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
      setDailyStats(data || []);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const fetchDailyApplicationStats = async () => {
    try {
      const currentDate = new Date();
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const stats = [];
      
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
      
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(weekStart);
        dayStart.setDate(weekStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);
        
        // Count new applications for this day (only first-time users)
        const newCount = Array.from(userApplications.values()).filter(userApps => {
          const firstApp = userApps[0]; // First application from this user
          const appDate = new Date(firstApp.submitted_at);
          return appDate >= dayStart && appDate < dayEnd;
        }).length;
        
        // Count approved applications for this day (by reviewed_at date, only first-time users)
        const approvedCount = Array.from(userApplications.values()).filter(userApps => {
          const firstApp = userApps[0]; // First application from this user
          if (firstApp.status !== 'approved' || !firstApp.reviewed_at) return false;
          const approvedDate = new Date(firstApp.reviewed_at);
          return approvedDate >= dayStart && approvedDate < dayEnd;
        }).length;
        
        stats.push({
          day_name: daysOfWeek[i],
          new_count: newCount,
          approved_count: approvedCount
        });
      }
      
      setDailyApplicationStats(stats);
    } catch (error) {
      console.error('Error calculating daily application stats:', error);
    }
  };

  const fetchDailyRegistrationStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_daily_registration_stats');
      if (error) throw error;
      setDailyRegistrationStats(data || []);
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
          if (app.status !== 'approved' || !app.reviewed_at) return false;
          const approvedDate = new Date(app.reviewed_at);
          return approvedDate >= dayStart && approvedDate < dayEnd;
        });
    }
  };

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        sessionStorage.setItem('redirectPath', '/admin');
        navigate('/auth');
        return;
      }

      setUser(session.user);

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const hasAdminRole = roles?.some(r => r.role === 'admin');
      
      if (!hasAdminRole) {
        toast({
          title: "Access Denied",
          description: "You don't have admin permissions",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchProfiles();
      fetchUserRoles();
      fetchContestApplications();
      fetchWeeklyContests();
      fetchWeeklyParticipants();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

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
    const { data, error } = await supabase
      .from('contest_applications')
      .select('*')
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch contest applications",
        variant: "destructive"
      });
      return;
    }

    setContestApplications(data || []);
  };

  const fetchDeletedApplications = async () => {
    const { data, error } = await supabase
      .from('contest_applications')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error fetching deleted applications:', error);
      return [];
    }

    return data || [];
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
      const { data, error } = await supabase
        .rpc('get_weekly_participants_by_admin_status', { weeks_offset: 0 });

      if (error) {
        console.error('Error fetching weekly participants:', error);
        return;
      }

      // Transform the data to match the interface
      const participants = data?.map((item: any) => ({
        id: item.participant_id,
        contest_id: item.contest_id,
        user_id: item.user_id,
        application_data: {
          first_name: item.first_name,
          last_name: item.last_name,
          age: item.age,
          country: item.country,
          state: item.state,
          city: item.city,
          height_cm: item.height_cm,
          weight_kg: item.weight_kg,
          gender: item.gender,
          marital_status: item.marital_status,
          has_children: item.has_children,
          photo1_url: item.photo_1_url,
          photo2_url: item.photo_2_url
        },
        final_rank: item.final_rank,
        total_votes: item.total_votes,
        average_rating: item.average_rating,
        created_at: item.contest_start_date,
        is_active: true,
        admin_status: item.admin_status || 'this week'
      })) || [];

      setWeeklyParticipants(participants);
    } catch (error) {
      console.error('Error in fetchWeeklyParticipants:', error);
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

  const reviewApplication = async (applicationId: string, newStatus: string, rejectionData?: { reasonTypes: string[], notes: string }) => {
    const application = contestApplications.find(app => app.id === applicationId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentTime = new Date().toISOString();
      
      console.log('Updating application:', applicationId, 'to status:', newStatus);
      
      const updateData: any = {
        status: newStatus,
        reviewed_at: currentTime,
        reviewed_by: user?.id,
        ...(newStatus === 'approved' && { approved_at: currentTime }),
        ...(newStatus === 'rejected' && { 
          rejected_at: currentTime,
          rejection_reason_types: rejectionData?.reasonTypes || null,
          notes: rejectionData?.notes || null
        })
      };
      
      const { data, error } = await supabase
        .from('contest_applications')
        .update(updateData)
        .eq('id', applicationId)
        .select();

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Error",
          description: `Failed to update application status: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Update successful:', data);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return;
    }

    // If user is in weekly contest participants, update admin_status
    const weeklyParticipant = weeklyParticipants.find(p => p.user_id === application?.user_id);
    if (weeklyParticipant) {
      try {
        const { error: updateError } = await supabase
          .from('weekly_contest_participants')
          .update({ admin_status: newStatus === 'approved' ? 'this week' : newStatus })
          .eq('user_id', application.user_id);

        if (updateError) {
          console.error('Error updating weekly participant admin_status:', updateError);
        } else {
          console.log('Successfully updated weekly participant admin_status to:', newStatus === 'approved' ? 'this week' : newStatus);
          // Immediately refresh the data
          fetchWeeklyParticipants();
          fetchContestApplications();
        }
      } catch (error) {
        console.error('Error updating weekly participant:', error);
      }
    }

    // If status is approved, automatically add to weekly contest
    if (newStatus === 'approved' && application) {
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

        // Add participant to weekly contest
        if (contestId) {
          const { error: participantError } = await supabase
            .from('weekly_contest_participants')
            .insert({
              contest_id: contestId,
              user_id: application.user_id,
              application_data: application.application_data
            });

          if (participantError) {
            console.error('Error adding participant to weekly contest:', participantError);
          }
        }
      } catch (error) {
        console.error('Error handling approved status:', error);
      }
    }

    // Only show toast for approvals, not rejections
    if (newStatus === 'approved') {
      toast({
        title: "Success",
        description: "Application approved",
      });
    }

    fetchContestApplications();
    fetchWeeklyParticipants();
  };

  const deleteApplication = async (applicationId: string) => {
    const { error } = await supabase
      .from('contest_applications')
      .update({ deleted_at: new Date().toISOString() })
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          </div>

          <Tabs defaultValue="applications" className="space-y-6">
            {/* Mobile layout: Two rows of tabs */}
            <div className="md:hidden space-y-2">
              {/* First row - secondary tabs */}
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="registrations" className="flex items-center gap-1 text-xs">
                  <UserCog className="w-3 h-3" />
                  Reg
                </TabsTrigger>
                <TabsTrigger value="moderation" className="flex items-center gap-1 text-xs">
                  <Eye className="w-3 h-3" />
                  Moderate
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center gap-1 text-xs">
                  <UserCog className="w-3 h-3" />
                  Role
                </TabsTrigger>
              </TabsList>
              
              {/* Second row - main tabs */}
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="applications" className="flex items-center gap-1 text-xs">
                  <FileText className="w-3 h-3" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex items-center gap-1 text-xs">
                  <Calendar className="w-3 h-3" />
                  This
                </TabsTrigger>
                <TabsTrigger value="pastweek" className="flex items-center gap-1 text-xs">
                  <Trophy className="w-3 h-3" />
                  Past
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Desktop layout - single row */}
            <TabsList className="hidden md:flex">
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Weekly Contests
              </TabsTrigger>
              <TabsTrigger value="pastweek" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Past Week
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Contest Applications
              </TabsTrigger>
              <TabsTrigger value="registrations" className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Регистрации
              </TabsTrigger>
              <TabsTrigger value="moderation" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Profile Moderation
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                User Roles
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
                
                <Select value={weeklyContestFilter} onValueChange={setWeeklyContestFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="this week">This Week</SelectItem>
                    <SelectItem value="next week">Next Week</SelectItem>
                    <SelectItem value="after next week">After Next Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(() => {
                if (filteredWeeklyParticipants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-lg">
                        {weeklyContestFilter === 'approve' 
                          ? 'No approved applications found' 
                          : weeklyContestFilter === 'reject'
                          ? 'No rejected applications found'
                          : 'No weekly contest participants found'}
                      </p>
                    </div>
                  );
                }

                return filteredWeeklyParticipants.map((participant) => {
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
                                    <AvatarImage src={participantProfile?.avatar_url || ''} />
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
                            
                             <Select 
                                value={participant.admin_status || participantFilters[participant.id] || (participant.final_rank ? 'this week' : 'approve')}
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
                                 
                                  // Update the filter state
                                  setParticipantFilters(prev => ({
                                    ...prev,
                                    [participant.id]: value
                                  }));

                                  // Update the database with the new admin_status
                                  const updateParticipantStatus = async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('weekly_contest_participants')
                                         .update({ admin_status: value } as any)
                                        .eq('id', participant.id);
                                      
                                      if (error) {
                                        console.error('Error updating participant status:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to update participant status",
                                          variant: "destructive"
                                        });
                                      } else {
                                        // Refresh the participants data
                                        fetchWeeklyParticipants();
                                      }
                                    } catch (error) {
                                      console.error('Error updating participant status:', error);
                                    }
                                  };

                                  updateParticipantStatus();
                               }}
                             >
                               <SelectTrigger className="w-28 h-6 text-xs">
                                 <SelectValue />
                               </SelectTrigger>
                                <SelectContent className="z-50 bg-background border shadow-md">
                                  <SelectItem value="this week">This Week</SelectItem>
                                  <SelectItem value="next week">Next Week</SelectItem>
                                  <SelectItem value="approve">Approve</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="reject">Reject</SelectItem>
                                </SelectContent>
                             </Select>
                            
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
                                      <AvatarImage src={participantProfile?.avatar_url || ''} />
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
                              <div className="absolute bottom-12 right-13 flex items-center gap-2">
                                 <Select 
                                   value={participant.admin_status || participantFilters[participant.id] || (participant.final_rank ? 'this week' : 'approve')} 
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
                                     
                                      // Update the filter state
                                      setParticipantFilters(prev => ({
                                        ...prev,
                                        [participant.id]: value
                                      }));

                                      // Update the database with the new admin_status
                                      const updateParticipantStatus = async () => {
                                        try {
                                          const { error } = await supabase
                                            .from('weekly_contest_participants')
                                            .update({ admin_status: value } as any)
                                            .eq('id', participant.id);
                                          
                                          if (error) {
                                            console.error('Error updating participant status:', error);
                                            toast({
                                              title: "Error",
                                              description: "Failed to update participant status",
                                              variant: "destructive"
                                            });
                                          } else {
                                            // Refresh the participants data
                                            fetchWeeklyParticipants();
                                          }
                                        } catch (error) {
                                          console.error('Error updating participant status:', error);
                                        }
                                      };

                                      updateParticipantStatus();
                                   }}
                                 >
                                   <SelectTrigger className="w-24 h-7 text-xs">
                                     <SelectValue />
                                   </SelectTrigger>
                                    <SelectContent className="z-50 bg-background border shadow-md">
                                      <SelectItem value="this week">This Week</SelectItem>
                                      <SelectItem value="next week">Next Week</SelectItem>
                                      <SelectItem value="approve">Approve</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="reject">Reject</SelectItem>
                                    </SelectContent>
                                 </Select>
                                
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
                });
              })()}
            </TabsContent>

            <TabsContent value="pastweek" className="space-y-4">
              <div className="mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Past Week Participants</h2>
                  <p className="text-muted-foreground">Participants from previous weeks with their week intervals</p>
                </div>
                
                {/* Week interval filter */}
                <div className="mt-4">
                  <Select 
                    value={selectedWeekOffset?.toString() || 'all'} 
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setSelectedWeekOffset(null);
                      } else {
                        setSelectedWeekOffset(parseInt(value));
                      }
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select week interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All weeks</SelectItem>
                      {Array.from(new Set(pastWeekParticipants.map(p => p.weekInterval)))
                        .sort((a, b) => b.localeCompare(a))
                        .map((interval, index) => (
                          <SelectItem key={interval} value={index.toString()}>
                            {interval}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {(() => {
                if (pastWeekParticipants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-lg">No past week participants found</p>
                    </div>
                  );
                }

                const filteredPastParticipants = selectedWeekOffset !== null && selectedWeekOffset !== undefined
                  ? pastWeekParticipants.filter((_, index) => {
                      const intervals = Array.from(new Set(pastWeekParticipants.map(p => p.weekInterval)))
                        .sort((a, b) => b.localeCompare(a));
                      const targetInterval = intervals[selectedWeekOffset];
                      return pastWeekParticipants[index].weekInterval === targetInterval;
                    })
                  : pastWeekParticipants;

                return filteredPastParticipants.map((participant) => {
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
                                    <AvatarImage src={participantProfile?.avatar_url || ''} />
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
                              {participantProfile?.city || appData.city} {participantProfile?.country || appData.country}
                            </div>
                            
                            {/* Expanded information */}
                            {expandedDesktopItems.has(participant.id) && (
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
                          </div>

                          {/* Right side actions */}
                          <div className="w-[20ch] flex-shrink-0 p-4 flex flex-col gap-2">
                            <div className="text-xs text-muted-foreground">
                              <div className="font-semibold mb-1">Week:</div>
                              <div className="bg-muted p-1 rounded text-center text-xs">
                                {participant.weekInterval}
                              </div>
                              {participant.final_rank && (
                                <div className="mt-1 p-1 bg-primary/10 rounded text-center text-xs">
                                  <div className="font-semibold text-primary">
                                    {participant.final_rank === 1 ? '🏆' : `🏅 #${participant.final_rank}`}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Status change date with reviewer login - desktop */}
                             <div 
                               className="text-lg font-bold text-blue-600 cursor-pointer hover:text-blue-700"
                               onClick={() => {
                                 setSelectedParticipantForVoters({ 
                                   id: participant.user_id, 
                                   name: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` 
                                 });
                                 setVotersModalOpen(true);
                               }}
                             >
                               {participant.total_votes || 0} • ★ {(participant.average_rating || 0).toFixed(1)}
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
                                      <AvatarImage src={participantProfile?.avatar_url || ''} />
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
                              
                              {/* Week interval filter positioned at bottom */}
                              <div className="absolute bottom-12 right-13 flex flex-col items-end gap-1">
                                <div className="text-xs text-muted-foreground">
                                  <div className="bg-muted p-1 rounded text-center text-xs">
                                    {participant.weekInterval.split(' - ')[0]}
                                  </div>
                                  {participant.final_rank && (
                                    <div className="mt-1 p-1 bg-primary/10 rounded text-center text-xs">
                                      <div className="font-semibold text-primary">
                                        {participant.final_rank === 1 ? '🏆' : `#${participant.final_rank}`}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                 {/* Rating with votes */}
                                 <div 
                                   className="text-lg font-bold text-blue-600 cursor-pointer hover:text-blue-700"
                                   onClick={() => {
                                     setSelectedParticipantForVoters({ 
                                       id: participant.user_id, 
                                       name: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` 
                                     });
                                     setVotersModalOpen(true);
                                   }}
                                 >
                                   {participant.total_votes || 0} • ★ {(participant.average_rating || 0).toFixed(1)}
                                 </div>
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

            <TabsContent value="applications" className="space-y-4 -mx-2 md:mx-0">

              {/* Applications Stats Dashboard */}
              <div className="mb-6 px-0 md:px-6">
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="text-xs">
                      new applications: {dailyApplicationStats.reduce((sum, stat) => sum + (stat.new_count || 0), 0)}, 
                      approved: {dailyApplicationStats.reduce((sum, stat) => sum + (stat.approved_count || 0), 0)}
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
                              {stat.new_count}
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
                              {stat.approved_count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs pt-1 border-t border-border/50">
                      {contestApplications.filter(app => app.status === 'pending').length} pending, {' '}
                      {contestApplications.filter(app => app.status === 'approved').length} approved, {' '}
                      {contestApplications.filter(app => app.status === 'rejected').length} rejected
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
                                       value={application.status} 
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
                                          reviewApplication(application.id, newStatus);
                                        }}
                                     >
                                        <SelectTrigger 
                                           className={`w-24 ${
                                             application.status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
                                             application.status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                             ''
                                           }`}
                                        >
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="approved">Approved</SelectItem>
                                          <SelectItem value="rejected">Rejected</SelectItem>
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
                                                value={application.status}
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
                                                   reviewApplication(application.id, newStatus);
                                                 }}
                                              >
                                                 <SelectTrigger 
                                                    className={`w-24 h-7 text-xs ${
                                                      application.status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
                                                      application.status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                                      ''
                                                    }`}
                                                 >
                                                  <SelectValue />
                                                </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="pending">Pending</SelectItem>
                                                   <SelectItem value="approved">Approved</SelectItem>
                                                   <SelectItem value="rejected">Rejected</SelectItem>
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

              {/* Status Filter */}
              <div className="mb-6 px-0 md:px-6">
                <div className="flex gap-4 items-center justify-start">
                  <div className="flex flex-col gap-2">
                     <Select 
                      value={statusFilter} 
                      onValueChange={setStatusFilter}
                    >
                       <SelectTrigger 
                        className={`w-20 md:w-32 ${
                          statusFilter === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
                          statusFilter === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                          ''
                        }`}
                      >
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background border shadow-md">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    {statusFilter !== 'all' && (
                      <p className="text-xs text-muted-foreground">
                        Filter: {statusFilter}
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
                  console.log('Filtering applications, statusFilter:', statusFilter);
                  const filteredApplications = (showDeletedApplications ? deletedApplications : contestApplications)
                    .filter((application) => {
                      const appData = application.application_data || {};
                      if (countryFilter !== 'all' && appData.country !== countryFilter) return false;
                      if (genderFilter !== 'all' && appData.gender !== genderFilter) return false;
                      if (statusFilter !== 'all' && application.status !== statusFilter) return false;
                      
                      // Don't show applications in the cards section if the user is already in "this week" (but show if they have "pending" status)
                      const weeklyParticipant = weeklyParticipants.find(participant => 
                        participant.user_id === application.user_id
                      );
                      if (weeklyParticipant && weeklyParticipant.admin_status !== 'pending') {
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

                   return uniqueApplications.map((application) => {
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
                                          // If user is in weekly contest participants, show admin_status as the status
                                          const weeklyParticipant = weeklyParticipants.find(p => p.user_id === application.user_id);
                                          return weeklyParticipant ? weeklyParticipant.admin_status : application.status;
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
                                          reviewApplication(application.id, newStatus);
                                        }}
                                     >
                                       <SelectTrigger 
                                          className={`w-[60%] h-7 text-xs ${
                                            application.status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
                                            application.status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                            ''
                                          }`}
                                       >
                                         <SelectValue />
                                       </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="approved">Approved</SelectItem>
                                          <SelectItem value="rejected">Rejected</SelectItem>
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
                                               value={application.status}
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
                                                  reviewApplication(application.id, newStatus);
                                                }}
                                             >
                                                <SelectTrigger 
                                                   className={`w-24 h-7 text-xs ${
                                                     application.status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
                                                     application.status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                                     ''
                                                   }`}
                                                >
                                                 <SelectValue />
                                               </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="pending">Pending</SelectItem>
                                                  <SelectItem value="approved">Approved</SelectItem>
                                                  <SelectItem value="rejected">Rejected</SelectItem>
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
        {application.status === 'rejected' && ((application as any).rejection_reason_types || application.rejection_reason) && (
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
                                               <AvatarImage src={prevUserProfile?.avatar_url || ''} />
                                               <AvatarFallback className="text-xs">
                                                 {prevAppData.first_name?.charAt(0) || 'U'}
                                               </AvatarFallback>
                                             </Avatar>
                                             <span className="text-sm font-semibold whitespace-nowrap">
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
                                                value={prevApp.status} 
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
                                                   reviewApplication(prevApp.id, newStatus);
                                                 }}
                                              >
                                                <SelectTrigger 
                                                   className={`w-[60%] h-7 text-xs ${
                                                     prevApp.status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
                                                     prevApp.status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                                     ''
                                                   }`}
                                                >
                                                  <SelectValue />
                                                </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="pending">Pending</SelectItem>
                                                   <SelectItem value="approved">Approved</SelectItem>
                                                   <SelectItem value="rejected">Rejected</SelectItem>
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
                                                 const statusDate = prevApp.reviewed_at || prevApp.approved_at || prevApp.rejected_at || prevApp.submitted_at;
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
                                                        <AvatarImage src={prevUserProfile?.avatar_url || ''} />
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
                                                        value={prevApp.status}
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
                                                           reviewApplication(prevApp.id, newStatus);
                                                         }}
                                                      >
                                                         <SelectTrigger 
                                                            className={`w-24 h-7 text-xs ${
                                                              prevApp.status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
                                                              prevApp.status === 'rejected' ? 'bg-red-100 border-red-500 text-red-700' :
                                                              ''
                                                            }`}
                                                         >
                                                          <SelectValue />
                                                        </SelectTrigger>
                                                         <SelectContent>
                                                           <SelectItem value="pending">Pending</SelectItem>
                                                           <SelectItem value="approved">Approved</SelectItem>
                                                           <SelectItem value="rejected">Rejected</SelectItem>
                                                         </SelectContent>
                                                      </Select>
                                                      
                                                       {/* Admin login with expandable date */}
                                                        <div className="text-xs text-muted-foreground -mt-[5px]">
                                                          {(() => {
                                                            const statusDate = prevApp.reviewed_at || prevApp.approved_at || prevApp.rejected_at || prevApp.submitted_at;
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
                                     {prevApp.status === 'rejected' && ((prevApp as any).rejection_reason_types || prevApp.rejection_reason) && (
                                       <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-b-lg -mt-1">
                                          <div className="space-y-1 text-xs leading-tight">
                                            {(prevApp as any).rejection_reason_types && (prevApp as any).rejection_reason_types.length > 0 && (
                                              <div className="text-destructive/80">
                                                {/* Always show date and admin info if available */}
                                                {(prevApp.rejected_at || prevApp.reviewed_at) && (
                                                   <TooltipProvider>
                                                     <Tooltip>
                                                       <TooltipTrigger asChild>
                                                         <span className="text-black font-medium cursor-help">
                                                           {new Date(prevApp.rejected_at || prevApp.reviewed_at).toLocaleDateString('en-GB', { 
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
                                                           {new Date(prevApp.rejected_at || prevApp.reviewed_at).toLocaleDateString('en-GB', { 
                                                             day: 'numeric', 
                                                             month: 'short',
                                                             year: 'numeric'
                                                           }).toLowerCase()}{' '}
                                                           {new Date(prevApp.rejected_at || prevApp.reviewed_at).toLocaleTimeString('en-GB', {
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
                                                {(prevApp as any).rejection_reason_types
                                                  .filter((type: string) => type && REJECTION_REASONS[type as keyof typeof REJECTION_REASONS])
                                                  .map((type: string) => REJECTION_REASONS[type as keyof typeof REJECTION_REASONS])
                                                  .join(', ')}
                </div>
                                            )}
                                            {prevApp.rejection_reason && prevApp.rejection_reason.trim() && !isReasonDuplicate(prevApp.rejection_reason, (prevApp as any).rejection_reason_types) && (
                                              <div className="text-destructive/70">
                                                <span className="font-medium">Additional comments:</span> {prevApp.rejection_reason}
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
                   });
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
                        verified: {dailyRegistrationStats.reduce((sum, stat) => sum + (stat.verified_count || 0), 0)}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {dailyRegistrationStats.map((stat, index) => (
                          <div key={index} className="text-center p-1 bg-background rounded">
                            <div className="font-medium text-xs">{stat.day_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {stat.registration_count}-{stat.verified_count}
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
                         {/* Registration date badge in top left corner without padding */}
                         <Badge 
                           variant="outline" 
                           className="absolute top-0 left-0 text-xs bg-background/50 backdrop-blur-sm font-normal rounded-none rounded-br-md"
                         >
                           {new Date(profile.created_at).toLocaleDateString('en-GB', { 
                             day: 'numeric', 
                             month: 'short' 
                           })}
                         </Badge>
                         
                         <div className="flex items-center justify-between pt-4">
                           <div className="flex items-center gap-3">
                             <Avatar>
                               <AvatarImage src={profile.avatar_url || ''} />
                               <AvatarFallback>
                                 {profile.display_name?.charAt(0) || profile.first_name?.charAt(0) || 'U'}
                               </AvatarFallback>
                             </Avatar>
                              <div>
                                {/* Role selector, verified badge, and verify button in one row above name */}
                                <div className="flex items-center gap-2 mb-1">
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
                                    <SelectContent className="bg-background border shadow-md z-50">
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

              {/* Profile Moderation Tab */}
              <TabsContent value="moderation" className="space-y-4">
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Profile Moderation</h3>
                  <p className="text-muted-foreground">This section is under development</p>
                  <p className="text-sm text-muted-foreground mt-2">Features for moderating user profiles will be available here</p>
                </div>
              </TabsContent>

              {/* User Roles Tab */}
              <TabsContent value="roles" className="space-y-4">
                <div className="text-center py-12">
                  <UserCog className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">User Roles Management</h3>
                  <p className="text-muted-foreground">This section is under development</p>
                  <p className="text-sm text-muted-foreground mt-2">Features for managing user roles and permissions will be available here</p>
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
                   
                   // Update the corresponding application status to rejected
                   if (participant.user_id) {
                     const { data: applications } = await supabase
                       .from('contest_applications')
                       .select('id')
                       .eq('user_id', participant.user_id)
                       .eq('status', 'approved')
                       .order('created_at', { ascending: false })
                       .limit(1);
                     
                     if (applications && applications.length > 0) {
                       await reviewApplication(applications[0].id, 'rejected', { reasonTypes, notes });
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
                            .from('contest_applications')
                            .update({
                              application_data: editingApplicationData.application_data
                            })
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
    </>
  );
};

export default Admin;