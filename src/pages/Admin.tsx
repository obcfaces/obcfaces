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
  RotateCcw, Copy, Facebook, Minus, AlertCircle, Trophy, ChevronDown, ChevronUp
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import cityTimezones from 'city-timezones';
import { PhotoModal } from '@/components/photo-modal';
import { RejectReasonModal, REJECTION_REASONS } from '@/components/reject-reason-modal';
import { VotersModal } from '@/components/voters-modal';
import { ContestParticipationModal } from '@/components/contest-participation-modal';
import { ApplicationEditHistory } from '@/components/ApplicationEditHistory';

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
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editHistoryApplicationId, setEditHistoryApplicationId] = useState<string | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [applicationToDelete, setApplicationToDelete] = useState<{ id: string; name: string } | null>(null);
  const [expandedMobileItems, setExpandedMobileItems] = useState<Set<string>>(new Set());
  const [participantFilters, setParticipantFilters] = useState<{ [key: string]: string }>({});
  const [pastWeekParticipants, setPastWeekParticipants] = useState<any[]>([]);
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [verifyingUsers, setVerifyingUsers] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log('Admin component rendering, statusFilter:', statusFilter);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Handle Weekly Contest participants filtering with async rating fetching
  useEffect(() => {
    const filterWeeklyParticipants = async () => {
      if (weeklyContestFilter === 'approve') {
        const approvedApps = contestApplications
          .filter(app => app.status === 'approved')
          .filter((app, index, arr) => arr.findIndex(a => a.user_id === app.user_id) === index);

        const participantsWithRatings = await Promise.all(
          approvedApps.map(async (app) => {
            const appData = app.application_data || {};
            
            try {
              const { data: ratingStats } = await supabase
                .rpc('get_user_rating_stats', { target_user_id: app.user_id });
              
              return {
                id: `app-${app.id}`,
                user_id: app.user_id,
                application_data: appData,
                average_rating: ratingStats?.[0]?.average_rating || 0,
                total_votes: ratingStats?.[0]?.total_votes || 0,
                final_rank: null,
                fromApplication: true
              };
            } catch (error) {
              console.error('Error fetching rating stats:', error);
              return {
                id: `app-${app.id}`,
                user_id: app.user_id,
                application_data: appData,
                average_rating: 0,
                total_votes: 0,
                final_rank: null,
                fromApplication: true
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
          const filterStatus = participantFilters[participant.id] || (participant.final_rank ? 'this week' : 'approve');
          
          // Include if manually set to 'this week'
          if (filterStatus === 'this week') {
            return true;
          }

          // Also include participants created this week
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
        .from('weekly_contest_participants')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching weekly participants:', error);
        return;
      }

      setWeeklyParticipants(data || []);
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

  const reviewApplication = async (applicationId: string, newStatus: string) => {
    const application = contestApplications.find(app => app.id === applicationId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentTime = new Date().toISOString();
      
      console.log('Updating application:', applicationId, 'to status:', newStatus);
      
      const { data, error } = await supabase
        .from('contest_applications')
        .update({
          status: newStatus,
          reviewed_at: currentTime,
          reviewed_by: user?.id,
          ...(newStatus === 'approved' && { approved_at: currentTime }),
          ...(newStatus === 'rejected' && { rejected_at: currentTime })
        })
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

    toast({
      title: "Success",
      description: `Application ${newStatus}`,
    });

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

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage user profiles and roles</p>
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
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Weekly Contest Management</h2>
                  <p className="text-muted-foreground">Manage weekly contests and participants</p>
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
                    <Card key={participant.id} className="overflow-hidden relative">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row md:items-stretch">
                          {/* Photos section */}
                          <div className="flex gap-px md:w-[25ch] md:flex-shrink-0 p-0">
                            {(participantProfile?.photo_1_url || appData.photo1_url) && (
                              <div className="w-24 sm:w-28 md:w-32">
                                <img 
                                  src={participantProfile?.photo_1_url || appData.photo1_url} 
                                  alt="Portrait" 
                                  className="w-full h-36 sm:h-40 md:h-44 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 0, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              </div>
                            )}
                            {(participantProfile?.photo_2_url || appData.photo2_url) && (
                              <div className="w-24 sm:w-28 md:w-32">
                                <img 
                                  src={participantProfile?.photo_2_url || appData.photo2_url} 
                                  alt="Full length" 
                                  className="w-full h-36 sm:h-40 md:h-44 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 1, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              </div>
                            )}
                          </div>

                          {/* Main info section */}
                          <div className="md:w-[50ch] md:flex-shrink-0 flex-1 min-w-0 p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={participantProfile?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {(participantProfile?.first_name || appData.first_name)?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-semibold whitespace-nowrap">
                                {participantProfile?.first_name || appData.first_name} {participantProfile?.last_name || appData.last_name} {participantProfile?.age || (appData.birth_year ? new Date().getFullYear() - appData.birth_year : '')}
                              </span>
                            </div>
                            
                            <div className="text-xs text-muted-foreground mb-1">
                              {participantProfile?.city || appData.city} {participantProfile?.state || appData.state} {participantProfile?.country || appData.country}
                            </div>
                             
                            <div className="text-xs text-muted-foreground mb-1">
                              {(participantProfile?.weight_kg || appData.weight_kg)}kg • {(participantProfile?.height_cm || appData.height_cm)}cm • {participantProfile?.gender || appData.gender}
                            </div>

                            <div className="text-xs text-muted-foreground mb-1">
                              {participantProfile?.marital_status || appData.marital_status} • {(participantProfile?.has_children || appData.has_children) ? 'Has children' : 'No children'}
                            </div>

                            <div className="text-xs text-muted-foreground mb-1">
                              Contest Participant • Rank: {participant.final_rank || 'Unranked'} • Votes: {participant.total_votes || 0}
                            </div>
                          </div>

                          {/* Right side actions */}
                          <div className="p-4 md:w-auto flex flex-col justify-between gap-2">
                            {/* Contest filter dropdown */}
                            <div className="flex flex-col gap-1 mb-2">
                              <Select 
                                value={participantFilters[participant.id] || (participant.final_rank ? 'this week' : 'approve')} 
                                onValueChange={(value) => {
                                  setParticipantFilters(prev => ({
                                    ...prev,
                                    [participant.id]: value
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-28 h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-background border shadow-md">
                                  <SelectItem value="this week">This Week</SelectItem>
                                  <SelectItem value="next week">Next Week</SelectItem>
                                  <SelectItem value="approve">Approve</SelectItem>
                                  <SelectItem value="reject">Reject</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex flex-col gap-1 items-center">
                              <Badge variant={participant.is_active ? 'default' : 'secondary'}>
                                {participant.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <p className="text-xs text-muted-foreground text-center">
                                Rating: {(participant.average_rating || 0).toFixed(1)}
                              </p>
                            </div>
                            <div className="flex gap-1 flex-wrap justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedParticipantForVoters({
                                    id: participant.id,
                                    name: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`
                                  });
                                  setVotersModalOpen(true);
                                }}
                                className="text-xs px-2 py-1 h-7"
                              >
                                <Eye className="w-3 h-3" />
                                <span className="hidden sm:inline ml-1">Voters</span>
                              </Button>
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
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Past Week Participants</h2>
                  <p className="text-muted-foreground">Participants from previous weeks with their week intervals</p>
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

                return pastWeekParticipants.map((participant) => {
                  const participantProfile = profiles.find(p => p.id === participant.user_id);
                  const appData = participant.application_data || {};
                  
                  return (
                    <Card key={participant.id} className="overflow-hidden relative">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row md:items-stretch">
                          {/* Photos section */}
                          <div className="flex gap-px md:w-[25ch] md:flex-shrink-0 p-0">
                            {(participantProfile?.photo_1_url || appData.photo1_url) && (
                              <div className="w-24 sm:w-28 md:w-32">
                                <img 
                                  src={participantProfile?.photo_1_url || appData.photo1_url} 
                                  alt="Portrait" 
                                  className="w-full h-36 sm:h-40 md:h-44 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 0, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              </div>
                            )}
                            {(participantProfile?.photo_2_url || appData.photo2_url) && (
                              <div className="w-24 sm:w-28 md:w-32">
                                <img 
                                  src={participantProfile?.photo_2_url || appData.photo2_url} 
                                  alt="Full length" 
                                  className="w-full h-36 sm:h-40 md:h-44 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPhotoModal([
                                    participantProfile?.photo_1_url || appData.photo1_url, 
                                    participantProfile?.photo_2_url || appData.photo2_url
                                  ].filter(Boolean), 1, `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}`)}
                                />
                              </div>
                            )}
                          </div>

                          {/* Main info section */}
                          <div className="md:w-[50ch] md:flex-shrink-0 flex-1 min-w-0 p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={participantProfile?.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {(participantProfile?.first_name || appData.first_name)?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-semibold whitespace-nowrap">
                                {participantProfile?.first_name || appData.first_name} {participantProfile?.last_name || appData.last_name} {participantProfile?.age || (appData.birth_year ? new Date().getFullYear() - appData.birth_year : '')}
                              </span>
                            </div>
                            
                            <div className="text-xs text-muted-foreground mb-1">
                              {participantProfile?.city || appData.city} {participantProfile?.state || appData.state} {participantProfile?.country || appData.country}
                            </div>
                             
                            <div className="text-xs text-muted-foreground mb-1">
                              {(participantProfile?.weight_kg || appData.weight_kg)}kg • {(participantProfile?.height_cm || appData.height_cm)}cm • {participantProfile?.gender || appData.gender}
                            </div>

                            <div className="text-xs text-muted-foreground mb-1">
                              {participantProfile?.marital_status || appData.marital_status} • {(participantProfile?.has_children || appData.has_children) ? 'Has children' : 'No children'}
                            </div>

                            <div className="text-xs text-muted-foreground mb-1">
                              Past Participant • Rank: {participant.final_rank || 'Unranked'} • Votes: {participant.total_votes || 0}
                            </div>
                          </div>

                          {/* Right side info */}
                          <div className="p-4 md:w-auto flex flex-col justify-between gap-2">
                            <div className="text-xs text-muted-foreground">
                              <div className="font-semibold mb-1">Week participated:</div>
                              <div className="bg-muted p-2 rounded text-center">
                                {participant.weekInterval}
                              </div>
                              {participant.final_rank && (
                                <div className="mt-2 p-2 bg-primary/10 rounded text-center">
                                  <div className="font-semibold text-primary">
                                    {participant.final_rank === 1 ? '🏆 Winner' : `🏅 Finalist #${participant.final_rank}`}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedParticipantForVoters({ 
                                  id: participant.user_id, 
                                  name: `${participantProfile?.first_name || appData.first_name} ${participantProfile?.last_name || appData.last_name}` 
                                });
                                setVotersModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Voters
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Contest Applications</h2>
                  <div className="flex gap-4 items-center">
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
              </div>

              <div className="space-y-4 -mx-4 md:mx-0">
                {(() => {
                  console.log('Filtering applications, statusFilter:', statusFilter);
                  const filteredApplications = (showDeletedApplications ? deletedApplications : contestApplications)
                    .filter((application) => {
                      const appData = application.application_data || {};
                      if (countryFilter !== 'all' && appData.country !== countryFilter) return false;
                      if (genderFilter !== 'all' && appData.gender !== genderFilter) return false;
                      if (statusFilter !== 'all' && application.status !== statusFilter) return false;
                      
                      // Don't show approved applications in the cards section if they were moved to "this week"
                      if (application.status === 'approved') {
                        // Check if this user is already in weekly participants (moved to "this week")
                        const isInWeeklyParticipants = weeklyParticipants.some(participant => 
                          participant.user_id === application.user_id
                        );
                        return !isInWeeklyParticipants;
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
                         <Card className="overflow-hidden relative mx-0 rounded-none md:rounded-lg md:mx-0">
                           {/* Edit button in bottom left corner */}
                           {!showDeletedApplications && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => {
                                 setEditingApplicationId(application.id);
                                 setEditingApplicationData(application);
                                 setShowEditModal(true);
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
                                  
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {appData.city} {appData.state} {appData.country}
                                  </div>
                                  
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {appData.weight_kg}kg • {appData.height_cm}cm • {appData.gender}
                                  </div>

                                  <div className="text-xs text-muted-foreground mb-1">
                                    {appData.marital_status} • {appData.has_children ? 'Has children' : 'No children'}
                                  </div>

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
                                 <div className="w-[20ch] flex-shrink-0 p-4 pl-0 flex flex-col gap-2">
                                   {/* Status dropdown at the top - desktop */}
                                   {!showDeletedApplications && (
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
                                      <div className="w-[50vw] flex-shrink-0 pl-2 flex flex-col h-40">
                                       <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-semibold whitespace-nowrap">
                                            {new Date().getFullYear() - appData.birth_year} {appData.first_name} {appData.last_name}
                                          </span>
                                       </div>
                                       
                                       <div className="text-xs text-muted-foreground mb-2 truncate">
                                         {appData.city} {appData.country}
                                       </div>
                                       
                                       <div className="flex-1"></div>
                                       
                                        {/* Status filter with admin login on the same line */}
                                         {!showDeletedApplications && (
                                           <div className="mb-2 flex items-center gap-2">
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
                                             
                                              {/* Admin login and date on the same line */}
                                              <div className="text-xs text-muted-foreground">
                                                 {(() => {
                                                   const statusDate = application.reviewed_at || application.approved_at || application.rejected_at || application.submitted_at;
                                                   const reviewerEmail = application.reviewed_by && profiles.find(p => p.id === application.reviewed_by)?.email;
                                                   const reviewerLogin = reviewerEmail ? reviewerEmail.substring(0, 3) : 'sys';
                                                   
                                                   if (statusDate) {
                                                     const date = new Date(statusDate);
                                                     const formattedDate = date.toLocaleDateString('en-GB', { 
                                                       day: 'numeric', 
                                                       month: 'short',
                                                       year: 'numeric'
                                                     });
                                                     const time = date.toLocaleTimeString('en-GB', { 
                                                       hour: '2-digit', 
                                                       minute: '2-digit' 
                                                     });
                                                     
                                                     return (
                                                       <>
                                                         <span className="text-blue-600">{reviewerLogin}</span>
                                                         <span> {formattedDate} - {time}</span>
                                                       </>
                                                     );
                                                   }
                                                   
                                                   return <span className="text-blue-600">{reviewerLogin}</span>;
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
                                const prevPhone = prevAppData.phone?.country && prevAppData.phone?.number 
                                  ? { full_number: `${prevAppData.phone.country} ${prevAppData.phone.number}` }
                                  : null;
                                
                                return (
                                  <Card key={prevApp.id} className="overflow-hidden bg-muted/30">
                                    <CardContent className="p-0">
                                      <div className="flex flex-col md:flex-row md:items-stretch">
                                        {/* Photos section */}
                                        <div className="flex gap-px md:w-[25ch] md:flex-shrink-0 p-0">
                                          {prevAppData.photo1_url && (
                                            <div className="w-24 sm:w-28 md:w-32">
                                              <img 
                                                src={prevAppData.photo1_url} 
                                                alt="Portrait" 
                                                className="w-full h-36 sm:h-40 md:h-44 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => openPhotoModal([prevAppData.photo1_url, prevAppData.photo2_url].filter(Boolean), 0, `${prevAppData.first_name} ${prevAppData.last_name}`)}
                                              />
                                            </div>
                                          )}
                                          {prevAppData.photo2_url && (
                                            <div className="w-24 sm:w-28 md:w-32">
                                              <img 
                                                src={prevAppData.photo2_url} 
                                                alt="Full length" 
                                                className="w-full h-36 sm:h-40 md:h-44 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => openPhotoModal([prevAppData.photo1_url, prevAppData.photo2_url].filter(Boolean), 1, `${prevAppData.first_name} ${prevAppData.last_name}`)}
                                              />
                                            </div>
                                          )}
                                        </div>

                                        {/* Main info section */}
                                        <div className="md:w-[50ch] md:flex-shrink-0 flex-1 min-w-0 p-4">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Avatar className="h-6 w-6 flex-shrink-0">
                                              <AvatarImage src={userProfile?.avatar_url || ''} />
                                              <AvatarFallback className="text-xs">
                                                {prevAppData.first_name?.charAt(0) || 'U'}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-semibold whitespace-nowrap">
                                              {prevAppData.first_name} {prevAppData.last_name} {new Date().getFullYear() - prevAppData.birth_year}
                                            </span>
                                          </div>
                                          
                                          <div className="text-xs text-muted-foreground mb-1">
                                            {prevAppData.city} {prevAppData.state} {prevAppData.country}
                                          </div>
                                           
                                          <div className="text-xs text-muted-foreground mb-1">
                                            {prevAppData.weight_kg}kg • {prevAppData.height_cm}cm • {prevAppData.gender}
                                          </div>

                                          <div className="text-xs text-muted-foreground mb-1">
                                            {prevAppData.marital_status} • {prevAppData.has_children ? 'Has children' : 'No children'}
                                          </div>

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

                                          <div className="text-xs text-muted-foreground mb-1">
                                            <div className="flex items-center gap-2">
                                              <span>{prevPhone ? prevPhone.full_number : 'Not provided'}</span>
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

                                        {/* Right side actions */}
                                        <div className="p-4 md:w-auto flex flex-col justify-between gap-2">
                                          <div className="flex flex-col gap-1 items-center">
                                            <p className="text-xs text-muted-foreground text-center">
                                              {prevSubmittedDate.toLocaleDateString('ru-RU')} {prevSubmittedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                          </div>
                                          <div className="flex gap-1 flex-wrap justify-center">
                                            {!showDeletedApplications && (
                                              <>
                                                 <Select 
                                                   value={prevApp.status} 
                                                    onValueChange={(newStatus) => {
                                                      if (newStatus === 'delete') {
                                                        const prevAppData = typeof prevApp.application_data === 'string' 
                                                          ? JSON.parse(prevApp.application_data) 
                                                          : prevApp.application_data;
                                                        setApplicationToDelete({ 
                                                          id: prevApp.id, 
                                                          name: `${prevAppData.firstName} ${prevAppData.lastName}` 
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
                                                          name: `${prevAppData.firstName} ${prevAppData.lastName}` 
                                                        });
                                                        setRejectModalOpen(true);
                                                        return;
                                                      }
                                                      reviewApplication(prevApp.id, newStatus);
                                                    }}
                                                 >
                                                   <SelectTrigger 
                                                      className={`w-28 h-7 text-xs ${
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
                                                      <div className="h-1 border-t border-border my-1"></div>
                                                     <SelectItem 
                                                       value="delete" 
                                                       className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                     >
                                                       🗑️ Delete
                                                     </SelectItem>
                                                   </SelectContent>
                                                 </Select>
                                               </>
                                             )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                       {/* Rejection reason for previous application */}
                                      {prevApp.status === 'rejected' && ((prevApp as any).rejection_reason_types || prevApp.rejection_reason) && (
                                        <div className="p-2 bg-destructive/10 border-t border-destructive/20">
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
                                    </CardContent>
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
              <div className="mb-6">
                <h2 className="text-xl font-semibold">All User Registrations</h2>
                <p className="text-muted-foreground">Complete list of all registered users</p>
              </div>
              
              {/* Verification filters */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={verificationFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerificationFilter('all')}
                >
                  All Users
                </Button>
                <Button
                  variant={verificationFilter === 'verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerificationFilter('verified')}
                >
                  Verified
                </Button>
                <Button
                  variant={verificationFilter === 'not_verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerificationFilter('not_verified')}
                >
                  Not Verified
                </Button>
              </div>
              
              <div className="grid gap-4">
                {profiles
                  .filter((profile) => {
                    if (verificationFilter === 'verified') {
                      return !!profile.email_confirmed_at;
                    } else if (verificationFilter === 'not_verified') {
                      return !profile.email_confirmed_at;
                    }
                    return true; // 'all' case
                  })
                  .map((profile) => (
                  <Card key={profile.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback>
                              {profile.display_name?.charAt(0) || profile.first_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                   <div>
                     <h3 className="font-semibold">
                       {profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name'}
                     </h3>
                     <div className="text-sm text-muted-foreground mb-1">
                       {profile.email && <div>{profile.email}</div>}
                       {profile.country && <div>{profile.country}</div>}
                       <div>
                         {new Date(profile.created_at).toLocaleDateString('en-GB', { 
                           day: 'numeric', 
                           month: 'short', 
                           year: 'numeric' 
                         }).toLowerCase()} - {new Date(profile.created_at).toLocaleTimeString('en-GB', {
                           hour: '2-digit',
                           minute: '2-digit'
                         })}
                       </div>
                     </div>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                     {verifyingUsers.has(profile.id) ? (
                       <div className="flex items-center gap-2">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                         <span className="text-sm text-muted-foreground">Verifying...</span>
                       </div>
                     ) : (
                       <>
                         <Checkbox
                           checked={!!profile.email_confirmed_at}
                           onCheckedChange={async (checked) => {
                             if (checked && !profile.email_confirmed_at) {
                               await handleEmailVerification(profile.id);
                             }
                           }}
                           disabled={!!profile.email_confirmed_at}
                         />
                         <div className="flex flex-col">
                           <span className="text-sm text-muted-foreground">
                             {profile.email_confirmed_at ? 'Verified' : 'verif'}
                           </span>
                           {profile.email_confirmed_at && profile.email_verified_by_email && (
                             <div className="text-xs">
                               <span className="text-black">{profile.email_verified_by_email.substring(0, 5)}</span>
                               <br />
                               <span className="text-blue-600">
                                 {new Date(profile.email_confirmed_at).toLocaleDateString('en-GB', { 
                                   day: 'numeric', 
                                   month: 'short', 
                                   year: 'numeric' 
                                 }).toLowerCase()} - {new Date(profile.email_confirmed_at).toLocaleTimeString('en-GB', {
                                   hour: '2-digit',
                                   minute: '2-digit'
                                 })}
                               </span>
                             </div>
                           )}
                         </div>
                       </>
                     )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Profile Moderation</h2>
                <p className="text-muted-foreground">Review and moderate user profiles</p>
              </div>
              
              <div className="grid gap-4">
                {profiles.filter(p => p.is_approved === null).map((profile) => (
                  <Card key={profile.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback>
                              {profile.display_name?.charAt(0) || profile.first_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name'}
                            </h3>
                            <div className="text-sm text-muted-foreground">
                              {profile.email && <div>Email: {profile.email}</div>}
                              <div>Created: {new Date(profile.created_at).toLocaleDateString()}</div>
                            </div>
                            <div className="mt-2">
                              <Badge variant="secondary">Pending Review</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">User Roles Management</h2>
                <p className="text-muted-foreground">Manage user roles and permissions</p>
              </div>
              
              <div className="grid gap-4">
                {profiles.map((profile) => {
                  const roles = getUserRoles(profile.id);
                  return (
                    <Card key={profile.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={profile.avatar_url || ''} />
                              <AvatarFallback>
                                {profile.display_name?.charAt(0) || profile.first_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">
                                {profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name'}
                              </h3>
                              <div className="text-sm text-muted-foreground mb-1">
                                {profile.email && <div>Email: {profile.email}</div>}
                              </div>
                              <div className="flex gap-2 mt-1">
                                {roles.map((role) => (
                                  <Badge key={role} variant="outline">
                                    {role}
                                  </Badge>
                                ))}
                                {roles.length === 0 && (
                                  <Badge variant="secondary">user</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => assignRole(profile.id, 'admin')}
                            disabled={roles.includes('admin')}
                          >
                            Make Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => assignRole(profile.id, 'moderator')}
                            disabled={roles.includes('moderator')}
                          >
                            Make Moderator
                          </Button>
                          {roles.includes('admin') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeRole(profile.id, 'admin')}
                            >
                              Remove Admin
                            </Button>
                          )}
                          {roles.includes('moderator') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeRole(profile.id, 'moderator')}
                            >
                              Remove Moderator
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PhotoModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        photos={photoModalImages}
        currentIndex={photoModalIndex}
        contestantName={photoModalName}
      />
      
      <RejectReasonModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setApplicationToReject(null);
        }}
        onConfirm={async (reasonTypes, notes) => {
          if (!applicationToReject) return;
          
          console.log('Rejecting application:', applicationToReject);
          console.log('Reason types:', reasonTypes);
          console.log('Notes (additional comments):', notes);
          
          // Only save notes if they contain actual additional comments, not predefined reasons
          const trimmedNotes = notes?.trim() || '';
          
          const { error } = await supabase
            .from('contest_applications')
            .update({
              status: 'rejected',
              rejection_reason: trimmedNotes, // Only save additional comments here
              rejection_reason_types: reasonTypes,
              reviewed_at: new Date().toISOString(),
              reviewed_by: (await supabase.auth.getUser()).data.user?.id
            })
            .eq('id', applicationToReject.id);

          console.log('Supabase error:', error);

          if (error) {
            console.error('Detailed error:', error);
            toast({
              title: "Error",
              description: `Failed to reject application: ${error.message}`,
              variant: "destructive"
            });
            return;
          }

          toast({
            title: "Success",
            description: "Application rejected",
          });

          fetchContestApplications();
          setRejectModalOpen(false);
          setApplicationToReject(null);
        }}
      />

      <VotersModal
        isOpen={votersModalOpen}
        onClose={() => {
          setVotersModalOpen(false);
          setSelectedParticipantForVoters(null);
        }}
        participantId={selectedParticipantForVoters?.id || ''}
        participantName={selectedParticipantForVoters?.name || ''}
      />

      {/* Admin Edit Application Modal */}
      <ContestParticipationModal
        isOpen={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) {
            // Refresh data when modal closes
            fetchContestApplications();
            setEditingApplicationId(null);
            setEditingApplicationData(null);
          }
        }}
        editMode={true}
        existingData={editingApplicationData}
      />

      {/* Application Edit History */}
      <ApplicationEditHistory
        applicationId={editHistoryApplicationId || ''}
        isOpen={showEditHistory}
        onClose={() => {
          setShowEditHistory(false);
          setEditHistoryApplicationId(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the application for <strong>{applicationToDelete?.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. To confirm, please type <strong>delete</strong> below:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              className="w-full"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeleteConfirmText('');
                  setApplicationToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                onClick={async () => {
                  if (deleteConfirmText.toLowerCase() === 'delete' && applicationToDelete) {
                    await deleteApplication(applicationToDelete.id);
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

      {/* Application Edit History Modal */}
      <ApplicationEditHistory
        applicationId={editHistoryApplicationId || ''}
        isOpen={showEditHistory}
        onClose={() => {
          setShowEditHistory(false);
          setEditHistoryApplicationId(null);
        }}
      />
    </>
  );
};

export default Admin;