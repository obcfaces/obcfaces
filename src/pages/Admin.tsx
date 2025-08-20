import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, UserCog, FileText, Calendar, Trophy, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  age: number | null;
  country: string | null;
  city: string | null;
  gender: string | null;
  bio: string | null;
  is_approved: boolean | null;
  moderation_notes: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface ContestApplication {
  id: string;
  user_id: string;
  status: string;
  application_data: any;
  submitted_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

interface WeeklyContest {
  id: string;
  week_start_date: string;
  week_end_date: string;
  title: string;
  status: string;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

interface WeeklyContestParticipant {
  id: string;
  contest_id?: string;
  user_id: string;
  application_data?: any;
  final_rank: number | null;
  total_votes?: number;
  average_rating?: number;
  created_at?: string;
  first_name: string;
  last_name: string;
  age: number;
  city: string;
  country: string;
  photo1_url: string;
  photo2_url: string;
  height_cm: number;
  weight_kg: number;
  contest_status?: string;
  week_start_date?: string;
  week_end_date?: string;
}

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [contestApplications, setContestApplications] = useState<ContestApplication[]>([]);
  const [weeklyContests, setWeeklyContests] = useState<WeeklyContest[]>([]);
  const [weeklyParticipants, setWeeklyParticipants] = useState<WeeklyContestParticipant[]>([]);
  const [selectedContest, setSelectedContest] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Check if user has admin role
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive"
      });
      return;
    }

    setProfiles(data || []);
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
    // Auto-select current week's contest
    const currentWeek = data?.find(contest => contest.status === 'active');
    if (currentWeek && !selectedContest) {
      setSelectedContest(currentWeek.id);
    }
  };

  const fetchWeeklyParticipants = async () => {
    if (!selectedContest) return;

    const { data, error } = await supabase
      .rpc('get_weekly_contest_participants', { weeks_offset: 0 });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch weekly participants",
        variant: "destructive"
      });
      return;
    }

    setWeeklyParticipants(data || []);
  };

  // Load participants when selected contest changes
  useEffect(() => {
    if (selectedContest) {
      fetchWeeklyParticipants();
    }
  }, [selectedContest]);

  const rotateWeeklyContests = async () => {
    const { error } = await supabase.rpc('rotate_weekly_contests');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to rotate weekly contests",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Weekly contests rotated successfully",
    });

    fetchWeeklyContests();
    fetchWeeklyParticipants();
  };

  const setParticipantRank = async (participantId: string, rank: number) => {
    const { error } = await supabase
      .from('weekly_contest_participants')
      .update({ final_rank: rank })
      .eq('id', participantId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to set participant rank",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Participant rank updated",
    });

    fetchWeeklyParticipants();
  };

  const setContestWinner = async (contestId: string, winnerId: string) => {
    const { error } = await supabase
      .from('weekly_contests')
      .update({ winner_id: winnerId })
      .eq('id', contestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to set contest winner",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Contest winner set successfully",
    });

    fetchWeeklyContests();
  };

  const reviewApplication = async (applicationId: string, status: 'approved' | 'rejected', notes?: string) => {
    const { error } = await supabase
      .from('contest_applications')
      .update({
        status,
        notes: notes || null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive"
      });
      return;
    }

    // If approved, make user a contest participant and add to current weekly contest
    if (status === 'approved') {
      const application = contestApplications.find(app => app.id === applicationId);
      if (application) {
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_contest_participant: true })
          .eq('id', application.user_id);

        if (profileError) {
          toast({
            title: "Warning",
            description: "Application approved but failed to add to contest",
            variant: "destructive"
          });
          return;
        }

        // Add to current weekly contest
        const { data: currentContest } = await supabase
          .from('weekly_contests')
          .select('id')
          .eq('status', 'active')
          .single();

        if (currentContest) {
          const { error: participantError } = await supabase
            .from('weekly_contest_participants')
            .insert({
              contest_id: currentContest.id,
              user_id: application.user_id,
              application_data: application.application_data
            });

          if (participantError) {
            console.error('Error adding to weekly contest:', participantError);
          }
        }
      }
    }

    toast({
      title: "Success",
      description: `Application ${status}${status === 'approved' ? ' and added to contest' : ''}`,
    });

    fetchContestApplications();
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

  const moderateProfile = async (profileId: string, isApproved: boolean, notes?: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_approved: isApproved,
        moderation_notes: notes || null,
        moderated_by: user?.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to moderate profile",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `Profile ${isApproved ? 'approved' : 'rejected'}`,
    });

    fetchProfiles();
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

  const getStatusBadge = (isApproved: boolean | null) => {
    if (isApproved === null) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    return isApproved ? (
      <Badge variant="default" className="bg-green-500">Approved</Badge>
    ) : (
      <Badge variant="destructive">Rejected</Badge>
    );
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

          <Tabs defaultValue="weekly" className="space-y-6">
            <TabsList>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Weekly Contests
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Contest Applications
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Weekly Contest Management</h2>
                <Button onClick={rotateWeeklyContests} className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Rotate Contests
                </Button>
              </div>
              
              {/* Contest selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Contest Week:</label>
                <select 
                  value={selectedContest || ''} 
                  onChange={(e) => setSelectedContest(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {weeklyContests.map((contest) => (
                    <option key={contest.id} value={contest.id}>
                      {contest.title} ({contest.status}) - 
                      {new Date(contest.week_start_date).toLocaleDateString()} to {new Date(contest.week_end_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Participants list */}
              <div className="grid gap-4">
                {weeklyParticipants.map((participant) => (
                  <Card key={participant.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={participant.photo1_url || ''} />
                            <AvatarFallback>
                              {participant.first_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">
                              {participant.first_name} {participant.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {participant.age} years old • {participant.city}, {participant.country}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Height: {participant.height_cm}cm • Weight: {participant.weight_kg}kg
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {participant.final_rank ? (
                            <Badge variant="default" className="bg-yellow-500">
                              <Trophy className="w-3 h-3 mr-1" />
                              Rank #{participant.final_rank}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No Rank Set</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Portrait Photo:</h4>
                          {participant.photo1_url && (
                            <img 
                              src={participant.photo1_url} 
                              alt="Portrait" 
                              className="w-32 h-40 object-cover rounded border"
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Full Length Photo:</h4>
                          {participant.photo2_url && (
                            <img 
                              src={participant.photo2_url} 
                              alt="Full length" 
                              className="w-32 h-40 object-cover rounded border"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5].map((rank) => (
                          <Button
                            key={rank}
                            size="sm"
                            variant={participant.final_rank === rank ? "default" : "outline"}
                            onClick={() => setParticipantRank(participant.id, rank)}
                            className={participant.final_rank === rank ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                          >
                            #{rank}
                          </Button>
                        ))}
                        {selectedContest && participant.final_rank === 1 && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 ml-2"
                            onClick={() => setContestWinner(selectedContest, participant.user_id)}
                          >
                            <Trophy className="w-4 h-4 mr-1" />
                            Set as Winner
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {weeklyParticipants.length === 0 && selectedContest && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No participants found for this week.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Approve contest applications to add participants to weekly contests.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <div className="grid gap-4">
                {contestApplications.map((application) => {
                  const appData = application.application_data || {};
                  const phone = appData.phone;
                  const submittedDate = new Date(application.submitted_at);
                  return (
                    <Card key={application.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={appData.photo1_url || ''} />
                              <AvatarFallback>
                                {appData.first_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {appData.first_name} {appData.last_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {appData.gender} • {new Date().getFullYear() - appData.birth_year} years old
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {appData.city}, {appData.state}, {appData.country}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Height: {appData.height_cm}cm • Weight: {appData.weight_kg}kg
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getApplicationStatusBadge(application.status)}
                            <p className="text-xs text-muted-foreground mt-2">
                              Submitted: {submittedDate.toLocaleDateString('ru-RU')} {submittedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Personal Info:</h4>
                            <p className="text-sm text-muted-foreground">
                              Born: {appData.birth_day}/{appData.birth_month}/{appData.birth_year}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Marital Status: {appData.marital_status}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Has Children: {appData.has_children ? 'Yes' : 'No'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Contact Info:</h4>
                            {phone ? (
                              <p className="text-sm text-muted-foreground">
                                Phone: {phone.full_number}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Phone: Not provided
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Portrait Photo:</h4>
                            {appData.photo1_url && (
                              <img 
                                src={appData.photo1_url} 
                                alt="Portrait" 
                                className="w-32 h-40 object-cover rounded border"
                              />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Full Length Photo:</h4>
                            {appData.photo2_url && (
                              <img 
                                src={appData.photo2_url} 
                                alt="Full length" 
                                className="w-32 h-40 object-cover rounded border"
                              />
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground mb-4">
                          <p>Submitted: {new Date(application.submitted_at).toLocaleString()}</p>
                          <p>Updated: {new Date(application.updated_at).toLocaleString()}</p>
                          {application.reviewed_at && (
                            <p>Reviewed: {new Date(application.reviewed_at).toLocaleString()}</p>
                          )}
                        </div>
                        
                        {application.notes && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Review Notes:</h4>
                            <p className="text-sm text-muted-foreground">{application.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => reviewApplication(application.id, 'approved')}
                            disabled={application.status === 'approved'}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const notes = prompt("Reason for rejection (optional):");
                              reviewApplication(application.id, 'rejected', notes || undefined);
                            }}
                            disabled={application.status === 'rejected'}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4">
              <div className="grid gap-4">
                {profiles.map((profile) => (
                  <Card key={profile.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback>
                              {profile.display_name?.charAt(0) || profile.first_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">
                              {profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {profile.age && `${profile.age} years old`} {profile.gender && `• ${profile.gender}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {profile.city && profile.country && `${profile.city}, ${profile.country}`}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(profile.is_approved)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {profile.bio && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Bio:</h4>
                          <p className="text-sm text-muted-foreground">{profile.bio}</p>
                        </div>
                      )}
                      
                      {profile.moderation_notes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Moderation Notes:</h4>
                          <p className="text-sm text-muted-foreground">{profile.moderation_notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => moderateProfile(profile.id, true)}
                          disabled={profile.is_approved === true}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const notes = prompt("Reason for rejection (optional):");
                            moderateProfile(profile.id, false, notes || undefined);
                          }}
                          disabled={profile.is_approved === false}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/u/${profile.id}`)}
                        >
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
    </>
  );
};

export default Admin;