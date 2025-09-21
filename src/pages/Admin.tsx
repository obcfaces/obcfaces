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
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, FileText, UserCog, Eye, Edit, Check, X, Trash2, 
  RotateCcw, Copy, Facebook, Minus, Clock
} from 'lucide-react';
import { PhotoModal } from '@/components/photo-modal';
import { RejectReasonModal } from '@/components/reject-reason-modal';
import { VotersModal } from '@/components/voters-modal';

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
  rejection_reason?: string;
  rejection_reason_type?: string;
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

const REJECTION_REASONS = {
  'inappropriate_content': 'Inappropriate content',
  'fake_photos': 'Fake or edited photos',
  'incorrect_info': 'Incorrect information',
  'terms_violation': 'Terms of service violation',
  'duplicate_application': 'Duplicate application',
  'age_verification': 'Age verification required',
  'photo_quality': 'Poor photo quality',
  'other': 'Other reason'
};

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
  const [selectedUserApplications, setSelectedUserApplications] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

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
        last_sign_in_at: userAuthData?.last_sign_in_at || null
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

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const reviewApplication = async (applicationId: string, newStatus: string) => {
    const { error } = await supabase
      .from('contest_applications')
      .update({
        status: newStatus,
        approved_at: newStatus === 'approved' ? new Date().toISOString() : null,
        rejected_at: newStatus === 'rejected' ? new Date().toISOString() : null
      })
      .eq('id', applicationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `Application ${newStatus}`,
    });

    fetchContestApplications();
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
            <TabsList>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Weekly Contests
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
                <h2 className="text-xl font-semibold">Weekly Contest Management</h2>
                <p className="text-muted-foreground">Manage weekly contests and participants</p>
              </div>
              
              {(() => {
                if (weeklyParticipants.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-lg">No weekly contest participants found</p>
                    </div>
                  );
                }

                return weeklyParticipants.map((participant) => {
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
                            <div className="flex flex-col gap-1 items-center">
                              <Badge variant={participant.is_active ? 'default' : 'secondary'}>
                                {participant.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <p className="text-xs text-muted-foreground text-center">
                                Rating: {participant.average_rating || 0}
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

            <TabsContent value="applications" className="space-y-4">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Contest Applications</h2>
                  <div className="flex gap-4 items-center">
                    <Button
                      variant={showDeletedApplications ? "default" : "outline"}
                      onClick={async () => {
                        if (!showDeletedApplications) {
                          const deleted = await fetchDeletedApplications();
                          setDeletedApplications(deleted);
                        }
                        setShowDeletedApplications(!showDeletedApplications);
                      }}
                    >
                      {showDeletedApplications ? 'Show Active' : 'Show Deleted'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const filteredApplications = (showDeletedApplications ? deletedApplications : contestApplications)
                    .filter((application) => {
                      const appData = application.application_data || {};
                      if (countryFilter !== 'all' && appData.country !== countryFilter) return false;
                      if (genderFilter !== 'all' && appData.gender !== genderFilter) return false;
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
                        <Card className="overflow-hidden relative">
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
                            <div className="flex flex-col md:flex-row md:items-stretch">
                              {/* Photos section */}
                              <div className="flex gap-px md:w-[25ch] md:flex-shrink-0 p-0">
                                {appData.photo1_url && (
                                  <div className="w-24 sm:w-28 md:w-32">
                                    <img 
                                      src={appData.photo1_url} 
                                      alt="Portrait" 
                                      className="w-full h-36 sm:h-40 md:h-44 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                    />
                                  </div>
                                )}
                                {appData.photo2_url && (
                                  <div className="w-24 sm:w-28 md:w-32">
                                    <img 
                                      src={appData.photo2_url} 
                                      alt="Full length" 
                                      className="w-full h-36 sm:h-40 md:h-44 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 1, `${appData.first_name} ${appData.last_name}`)}
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
                              </div>

                              {/* Right side actions */}
                              <div className="p-4 md:w-auto flex flex-col justify-between gap-2">
                                <div className="flex flex-col gap-1 items-center">
                                  {getApplicationStatusBadge(application.status)}
                                  <p className="text-xs text-muted-foreground text-center">
                                    {submittedDate.toLocaleDateString('ru-RU')} {submittedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {/* Show rejection reason if application is rejected */}
                                  {application.status === 'rejected' && ((application as any).rejection_reason_types || application.rejection_reason) && (
                                    <div className="text-xs text-center max-w-[120px]">
                                      {(application as any).rejection_reason_types && (application as any).rejection_reason_types.length > 0 && (
                                        <p className="text-destructive/80 mb-1">
                                          <span className="font-medium">Reasons:</span><br />
                                          {(application as any).rejection_reason_types.map((type: string) => REJECTION_REASONS[type as keyof typeof REJECTION_REASONS]).join(', ')}
                                        </p>
                                      )}
                                      {application.rejection_reason && (
                                        <p className="text-destructive/70">
                                          <span className="font-medium">Notes:</span><br />
                                          {application.rejection_reason.length > 50 ? `${application.rejection_reason.substring(0, 50)}...` : application.rejection_reason}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1 flex-wrap justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedUserApplications(
                                      selectedUserApplications === application.user_id ? null : application.user_id
                                    )}
                                    className="px-2"
                                  >
                                    <Clock className="w-3 h-3" />
                                  </Button>
                                  {!showDeletedApplications && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (application.status === 'approved') {
                                            reviewApplication(application.id, 'pending')
                                          } else {
                                            reviewApplication(application.id, 'approved')
                                          }
                                        }}
                                        className={
                                          application.status === 'approved'
                                            ? "bg-yellow-600 hover:bg-yellow-700 text-xs px-2 py-1 h-7"
                                            : "bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-7"
                                        }
                                      >
                                        {application.status === 'approved' ? (
                                          <>
                                            <Minus className="w-3 h-3" />
                                            <span className="hidden sm:inline ml-1">Unpublish</span>
                                          </>
                                        ) : (
                                          <>
                                            <Check className="w-3 h-3" />
                                            <span className="hidden sm:inline ml-1">Approve</span>
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          setApplicationToReject({
                                            id: application.id,
                                            name: `${appData.first_name} ${appData.last_name}`
                                          });
                                          setRejectModalOpen(true);
                                        }}
                                        className="text-xs px-2 py-1 h-7"
                                      >
                                        <X className="w-3 h-3" />
                                        <span className="hidden sm:inline ml-1">Reject</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => deleteApplication(application.id)}
                                        className="text-xs px-2 py-1 h-7"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span className="hidden sm:inline ml-1">Delete</span>
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
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

                                          <div className="text-xs text-muted-foreground">
                                            Education: {prevAppData.education || 'Not specified'}
                                          </div>
                                        </div>

                                        {/* Right side actions */}
                                        <div className="p-4 md:w-auto flex flex-col justify-between gap-2">
                                          <div className="flex flex-col gap-1 items-center">
                                            {getApplicationStatusBadge(prevApp.status)}
                                            <p className="text-xs text-muted-foreground text-center">
                                              {prevSubmittedDate.toLocaleDateString('ru-RU')} {prevSubmittedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {/* Show rejection reason if application is rejected */}
                                            {prevApp.status === 'rejected' && ((prevApp as any).rejection_reason_types || prevApp.rejection_reason) && (
                                              <div className="text-xs text-center max-w-[120px]">
                                                {(prevApp as any).rejection_reason_types && (prevApp as any).rejection_reason_types.length > 0 && (
                                                  <p className="text-destructive/80 mb-1">
                                                    <span className="font-medium">Reasons:</span><br />
                                                    {(prevApp as any).rejection_reason_types.map((type: string) => REJECTION_REASONS[type as keyof typeof REJECTION_REASONS]).join(', ')}
                                                  </p>
                                                )}
                                                {prevApp.rejection_reason && (
                                                  <p className="text-destructive/70">
                                                    <span className="font-medium">Notes:</span><br />
                                                    {prevApp.rejection_reason.length > 50 ? `${prevApp.rejection_reason.substring(0, 50)}...` : prevApp.rejection_reason}
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-1 flex-wrap justify-center">
                                            {!showDeletedApplications && (
                                              <>
                                                <Button
                                                  size="sm"
                                                  onClick={() => {
                                                    if (prevApp.status === 'approved') {
                                                      reviewApplication(prevApp.id, 'pending')
                                                    } else {
                                                      reviewApplication(prevApp.id, 'approved')
                                                    }
                                                  }}
                                                  className={
                                                    prevApp.status === 'approved'
                                                      ? "bg-yellow-600 hover:bg-yellow-700 text-xs px-2 py-1 h-7"
                                                      : "bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-7"
                                                  }
                                                >
                                                  {prevApp.status === 'approved' ? (
                                                    <>
                                                      <Minus className="w-3 h-3" />
                                                      <span className="hidden sm:inline ml-1">Unpublish</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Check className="w-3 h-3" />
                                                      <span className="hidden sm:inline ml-1">Approve</span>
                                                    </>
                                                  )}
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="destructive"
                                                  onClick={() => {
                                                    setApplicationToReject({
                                                      id: prevApp.id,
                                                      name: `${prevAppData.first_name} ${prevAppData.last_name}`
                                                    });
                                                    setRejectModalOpen(true);
                                                  }}
                                                  className="text-xs px-2 py-1 h-7"
                                                >
                                                  <X className="w-3 h-3" />
                                                  <span className="hidden sm:inline ml-1">Reject</span>
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => deleteApplication(prevApp.id)}
                                                  className="text-xs px-2 py-1 h-7"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                  <span className="hidden sm:inline ml-1">Delete</span>
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
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
              
              <div className="grid gap-4">
                {profiles.map((profile) => (
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
                              <div>Created: {new Date(profile.created_at).toLocaleDateString()}</div>
                            </div>
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
          console.log('Notes:', notes);
          
          const { error } = await supabase
            .from('contest_applications')
            .update({
              status: 'rejected',
              rejection_reason: notes,
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
    </>
  );
};

export default Admin;