import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, UserCog, FileText, Calendar, Trophy, RotateCcw, Edit } from "lucide-react";
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
  const [editingApplication, setEditingApplication] = useState<ContestApplication | null>(null);
  const [editForm, setEditForm] = useState<any>({});
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
      .rpc('get_weekly_contest_participants_admin', { weeks_offset: 0 });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch weekly participants",
        variant: "destructive"
      });
      return;
    }

    // Transform the data to match expected interface
    const transformedData = (data || []).map((participant: any) => ({
      id: participant.participant_id,
      user_id: participant.user_id,
      first_name: participant.first_name,
      last_name: participant.last_name,
      age: participant.age,
      city: participant.city,
      country: participant.country,
      photo1_url: participant.photo_1_url,
      photo2_url: participant.photo_2_url,
      height_cm: participant.height_cm,
      weight_kg: participant.weight_kg,
      final_rank: participant.final_rank,
      average_rating: participant.average_rating,
      total_votes: participant.total_votes,
      contest_status: participant.contest_status,
      week_start_date: participant.contest_start_date,
      week_end_date: participant.contest_end_date,
      application_data: participant.application_data
    }));

    setWeeklyParticipants(transformedData);
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

  const startEditingApplication = (application: ContestApplication) => {
    setEditingApplication(application);
    setEditForm(application.application_data || {});
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveApplicationEdit = async () => {
    if (!editingApplication) return;

    // Update contest application
    const { error: appError } = await supabase
      .from('contest_applications')
      .update({
        application_data: editForm,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingApplication.id);

    if (appError) {
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive"
      });
      return;
    }

    // Update user profile with the same data
    const birthDate = editForm.birth_year && editForm.birth_month && editForm.birth_day
      ? new Date(editForm.birth_year, editForm.birth_month - 1, editForm.birth_day).toISOString().split('T')[0]
      : null;

    const age = editForm.birth_year ? new Date().getFullYear() - editForm.birth_year : null;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        display_name: `${editForm.first_name || ''} ${editForm.last_name || ''}`.trim(),
        city: editForm.city,
        state: editForm.state,
        country: editForm.country,
        gender: editForm.gender,
        height_cm: editForm.height_cm,
        weight_kg: editForm.weight_kg,
        marital_status: editForm.marital_status,
        has_children: editForm.has_children,
        birthdate: birthDate,
        age: age,
        photo_1_url: editForm.photo1_url,
        photo_2_url: editForm.photo2_url,
        avatar_url: editForm.photo1_url, // Use portrait photo as avatar
        updated_at: new Date().toISOString()
      })
      .eq('id', editingApplication.user_id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail the operation if profile update fails
    }

    // Update weekly contest participants data if they're in a contest
    const { error: participantError } = await supabase
      .from('weekly_contest_participants')
      .update({
        application_data: editForm
      })
      .eq('user_id', editingApplication.user_id);

    if (participantError) {
      console.error('Error updating contest participant:', participantError);
      // Don't fail the operation if participant update fails
    }

    toast({
      title: "Success",
      description: "Application and profile updated successfully",
    });

    setEditingApplication(null);
    setEditForm({});
    fetchContestApplications();
  };

  const cancelEdit = () => {
    setEditingApplication(null);
    setEditForm({});
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
                        <div className="flex flex-col items-end gap-1">
                          {participant.average_rating && participant.average_rating > 0 ? (
                            <>
                              <Badge variant="default" className="bg-contest-blue">
                                Rating: {participant.average_rating.toFixed(1)}
                              </Badge>
                              <Badge variant="secondary">
                                Votes: {participant.total_votes || 0}
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="secondary">No Rating Yet</Badge>
                          )}
                        </div>
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

                      <div className="text-center text-muted-foreground">
                        <p className="text-sm">
                          Места определяются автоматически по рейтингу участниц
                        </p>
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
                            variant="outline"
                            onClick={() => startEditingApplication(application)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
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

            <TabsContent value="registrations" className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Все регистрации пользователей</h2>
                <p className="text-muted-foreground">Полный список всех зарегистрированных пользователей</p>
              </div>
              
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
                              {profile.age && `${profile.age} лет`} {profile.gender && `• ${profile.gender}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {profile.city && profile.country && `${profile.city}, ${profile.country}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Дата регистрации: {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {getStatusBadge(profile.is_approved)}
                          {getUserRoles(profile.id).map(role => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {profile.bio && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">О себе:</h4>
                          <p className="text-sm text-muted-foreground">{profile.bio}</p>
                        </div>
                      )}
                      {profile.moderation_notes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Заметки модерации:</h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {profile.moderation_notes}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/profile/${profile.id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Просмотр профиля
                        </Button>
                        {profile.is_approved === null && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => moderateProfile(profile.id, true)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Одобрить
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => moderateProfile(profile.id, false)}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Отклонить
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

          {/* Edit Application Modal */}
          <Dialog open={!!editingApplication} onOpenChange={() => !editingApplication ? null : cancelEdit()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Application</DialogTitle>
              </DialogHeader>
              
              {editingApplication && (
                <div className="space-y-6">
                  {/* Names Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={editForm.first_name || ''}
                        onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={editForm.last_name || ''}
                        onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  {/* Birth Date Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="birth_day">Birth Day</Label>
                      <select
                        id="birth_day"
                        value={editForm.birth_day || ''}
                        onChange={(e) => handleEditFormChange('birth_day', parseInt(e.target.value))}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">Day of birth</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="birth_month">Birth Month</Label>
                      <select
                        id="birth_month"
                        value={editForm.birth_month || ''}
                        onChange={(e) => handleEditFormChange('birth_month', parseInt(e.target.value))}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">Month of birth</option>
                        {[
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ].map((month, index) => (
                          <option key={index + 1} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="birth_year">Birth Year</Label>
                      <select
                        id="birth_year"
                        value={editForm.birth_year || ''}
                        onChange={(e) => handleEditFormChange('birth_year', parseInt(e.target.value))}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">Year of birth</option>
                        {Array.from({ length: 60 }, (_, i) => {
                          const year = new Date().getFullYear() - 18 - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Location Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editForm.city || ''}
                        onChange={(e) => handleEditFormChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={editForm.state || ''}
                        onChange={(e) => handleEditFormChange('state', e.target.value)}
                        placeholder="State/Province"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={editForm.country || ''}
                        onChange={(e) => handleEditFormChange('country', e.target.value)}
                        placeholder="Country code (e.g., PH)"
                      />
                    </div>
                  </div>

                  {/* Physical Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={editForm.gender || ''}
                        onChange={(e) => handleEditFormChange('gender', e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="height_cm">Height (cm)</Label>
                      <Input
                        id="height_cm"
                        type="number"
                        min="140"
                        max="200"
                        value={editForm.height_cm || ''}
                        onChange={(e) => handleEditFormChange('height_cm', parseInt(e.target.value))}
                        placeholder="Height in cm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight_kg">Weight (kg)</Label>
                      <Input
                        id="weight_kg"
                        type="number"
                        min="35"
                        max="120"
                        step="0.1"
                        value={editForm.weight_kg || ''}
                        onChange={(e) => handleEditFormChange('weight_kg', parseFloat(e.target.value))}
                        placeholder="Weight in kg"
                      />
                    </div>
                  </div>

                  {/* Marital Status Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="marital_status">Marital Status</Label>
                      <select
                        id="marital_status"
                        value={editForm.marital_status || ''}
                        onChange={(e) => handleEditFormChange('marital_status', e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">Marital status</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="has_children">Has Children</Label>
                      <select
                        id="has_children"
                        value={editForm.has_children !== undefined ? editForm.has_children.toString() : ''}
                        onChange={(e) => handleEditFormChange('has_children', e.target.value === 'true')}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">Do you have children?</option>
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  </div>

                  {/* Photos Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="photo1_url">Portrait Photo URL</Label>
                      <Input
                        id="photo1_url"
                        value={editForm.photo1_url || ''}
                        onChange={(e) => handleEditFormChange('photo1_url', e.target.value)}
                        placeholder="Portrait photo URL"
                      />
                      {editForm.photo1_url && (
                        <img 
                          src={editForm.photo1_url} 
                          alt="Portrait preview" 
                          className="w-24 h-32 object-cover rounded border mt-2"
                        />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="photo2_url">Full Length Photo URL</Label>
                      <Input
                        id="photo2_url"
                        value={editForm.photo2_url || ''}
                        onChange={(e) => handleEditFormChange('photo2_url', e.target.value)}
                        placeholder="Full length photo URL"
                      />
                      {editForm.photo2_url && (
                        <img 
                          src={editForm.photo2_url} 
                          alt="Full length preview" 
                          className="w-24 h-32 object-cover rounded border mt-2"
                        />
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={saveApplicationEdit} className="bg-blue-600 hover:bg-blue-700">
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default Admin;