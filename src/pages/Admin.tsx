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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, UserCog, FileText, Calendar, Trophy, RotateCcw, Edit, Plus, History, AlertCircle, Trash2, Copy } from "lucide-react";
import { PhotoModal } from "@/components/photo-modal";
import { RejectReasonModal, RejectionReasonType, REJECTION_REASONS } from "@/components/reject-reason-modal";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useApplicationHistory } from "@/hooks/useApplicationHistory";
import { Clock } from "lucide-react";
import { VotersModal } from "@/components/voters-modal";

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
  auth_provider?: string;
  email?: string;
  facebook_data?: any;
  last_sign_in_at?: string;
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
  is_active: boolean;
  rejection_reason?: string | null;
  rejection_reason_type?: string | null; // Allow any string type for backward compatibility
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
  is_active: boolean;
}

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [contestApplications, setContestApplications] = useState<ContestApplication[]>([]);
  const [deletedApplications, setDeletedApplications] = useState<ContestApplication[]>([]);
  const [weeklyContests, setWeeklyContests] = useState<WeeklyContest[]>([]);
  const [weeklyParticipants, setWeeklyParticipants] = useState<WeeklyContestParticipant[]>([]);
  const [selectedContest, setSelectedContest] = useState<string | null>(null);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0); // 0 = current week, -1 = last week, etc.
  const [showDeletedApplications, setShowDeletedApplications] = useState(false);
  const [editingApplication, setEditingApplication] = useState<ContestApplication | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [photo1File, setPhoto1File] = useState<File | null>(null);
  const [photo2File, setPhoto2File] = useState<File | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<WeeklyContestParticipant | null>(null);
  const [participantPhoto1File, setParticipantPhoto1File] = useState<File | null>(null);
  const [participantPhoto2File, setParticipantPhoto2File] = useState<File | null>(null);
  const [uploadingParticipantPhotos, setUploadingParticipantPhotos] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalImages, setPhotoModalImages] = useState<string[]>([]);
  const [photoModalIndex, setPhotoModalIndex] = useState(0);
  const [photoModalName, setPhotoModalName] = useState("");
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [viewingApplicationHistory, setViewingApplicationHistory] = useState<string | null>(null);
  const [applicationHistoryOpen, setApplicationHistoryOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [applicationToReject, setApplicationToReject] = useState<{ id: string; name: string } | null>(null);
  const [votersModalOpen, setVotersModalOpen] = useState(false);
  const [selectedParticipantForVoters, setSelectedParticipantForVoters] = useState<{ id: string; name: string } | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
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
    // First fetch profiles
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

    // Then fetch auth data using our secure function
    const { data: authData, error: authError } = await supabase
      .rpc('get_user_auth_data_admin');

    if (authError) {
      console.warn('Failed to fetch auth data:', authError);
    }

    // Merge profile and auth data
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
    // Auto-select current week's contest
    const currentWeek = data?.find(contest => contest.status === 'active');
    if (currentWeek && !selectedContest) {
      setSelectedContest(currentWeek.id);
    }
  };

  const fetchWeeklyParticipants = async () => {
    const { data, error } = await supabase
      .rpc('get_weekly_contest_participants_admin', { weeks_offset: selectedWeekOffset });

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
      application_data: participant.application_data,
      is_active: participant.is_active ?? true
    }));

    setWeeklyParticipants(transformedData);
  };

  // Load participants when selected contest changes
  // Fetch participants when week offset changes
  useEffect(() => {
    fetchWeeklyParticipants();
  }, [selectedWeekOffset]);

  // Generate week options for selector
  const getWeekOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i >= -8; i--) { // Current week and 8 previous weeks
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() + (i * 7));
      
      const monday = new Date(weekDate);
      monday.setDate(weekDate.getDate() - weekDate.getDay() + 1);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const label = i === 0 
        ? `This Week (${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()})`
        : i === -1
        ? `Last Week (${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()})`
        : `${Math.abs(i)} Weeks Ago (${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()})`;
      
      options.push({ value: i, label });
    }
    
    return options;
  };

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

  // Active/Inactive toggle functions
  const toggleApplicationActive = async (applicationId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('contest_applications')
      .update({ is_active: !currentActive })
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
      description: `Application ${!currentActive ? 'activated' : 'deactivated'} successfully`,
    });

    fetchContestApplications();
  };

  const toggleParticipantActive = async (participantId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('weekly_contest_participants')
      .update({ is_active: !currentActive })
      .eq('id', participantId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update participant status",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `Participant ${!currentActive ? 'activated' : 'deactivated'} successfully`,
    });

    await fetchWeeklyParticipants();
  };

  const openVotersModal = (participantId: string, participantName: string) => {
    setSelectedParticipantForVoters({ id: participantId, name: participantName });
    setVotersModalOpen(true);
  };

  const deleteParticipant = async (participantId: string, participantName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить участника ${participantName}? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      console.log(`=== НАЧАЛО УДАЛЕНИЯ (ID-BASED) ===`);
      console.log(`Удаление участника: "${participantName}" (ID: ${participantId})`);

      // Получаем участника для получения user_id
      const { data: participant } = await supabase
        .from('weekly_contest_participants')
        .select('user_id, contest_id')
        .eq('id', participantId)
        .single();

      if (!participant) {
        throw new Error('Участник не найден');
      }

      const userId = participant.user_id;
      console.log(`User ID участника: ${userId}`);

      // Удаляем ВСЕ лайки, связанные с этим user_id (используем новый формат)
      const { data: deletedLikes } = await supabase
        .from('likes')
        .delete()
        .or(`content_id.eq.contestant-user-${userId},content_id.like.contestant-user-${userId}-%`)
        .select();

      console.log(`Удалено лайков: ${deletedLikes?.length || 0}`);

      // Удаляем ВСЕ комментарии, связанные с этим user_id
      const { data: deletedComments } = await supabase
        .from('photo_comments')
        .delete()
        .or(`content_id.eq.contestant-user-${userId},content_id.like.contestant-user-${userId}-%`)
        .select();

      console.log(`Удалено комментариев: ${deletedComments?.length || 0}`);

      // Удаляем ВСЕ рейтинги участника по user_id
      const { data: deletedRatings } = await supabase
        .from('contestant_ratings')
        .delete()
        .eq('contestant_user_id', userId)
        .select();

      console.log(`Удалено рейтингов: ${deletedRatings?.length || 0}`);

      // Удаляем самого участника из weekly_contest_participants
      const { error, data: deletedParticipant } = await supabase
        .from('weekly_contest_participants')
        .delete()
        .eq('id', participantId)
        .select();

      if (error) {
        throw error;
      }

      console.log(`Участник удален из weekly_contest_participants:`, deletedParticipant);

      // Проверяем, есть ли у пользователя другие активные участия в конкурсах
      const { data: otherParticipations } = await supabase
        .from('weekly_contest_participants')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      console.log(`Другие активные участия: ${otherParticipations?.length || 0}`);

      // Если нет других активных участий, убираем флаг is_contest_participant
      if (!otherParticipations || otherParticipations.length === 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            is_contest_participant: false,
            participant_type: null 
          })
          .eq('id', userId);

        if (profileError) {
          console.error('Ошибка обновления профиля:', profileError);
        } else {
          console.log('Профиль пользователя обновлен - убран статус участника конкурса');
        }
      }

      // Делаем неактивной заявку пользователя, чтобы не блокировать новые заявки
      const { error: applicationError } = await supabase
        .from('contest_applications')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (applicationError) {
        console.error('Ошибка при деактивации заявки:', applicationError);
      } else {
        console.log('Заявка пользователя деактивирована для возможности подачи новых заявок');
      }

      console.log(`=== КОНЕЦ УДАЛЕНИЯ ===`);

      toast({
        title: "Успех",
        description: `Участник ${participantName} полностью удален по ID. Пользователь может подавать новые заявки.`,
      });

      // Принудительно обновляем данные
      await fetchWeeklyParticipants();
      
    } catch (error) {
      console.error('Ошибка удаления участника:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить участника",
        variant: "destructive"
      });
    }
  };

  const deleteApplication = async (applicationId: string, applicationName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить заявку ${applicationName}? Заявка будет перемещена в удалённые.`)) {
      return;
    }

    // Soft delete - mark as deleted instead of removing completely
    const { error } = await supabase
      .from('contest_applications')
      .update({ 
        deleted_at: new Date().toISOString(),
        is_active: false 
      })
      .eq('id', applicationId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заявку",
        variant: "destructive"
      });
      return;
    }

    // Also remove from weekly contest participants if exists
    const { data: application } = await supabase
      .from('contest_applications')
      .select('user_id')
      .eq('id', applicationId)
      .single();

    if (application) {
      // Remove contest participant status from profile when deleting application
      await supabase
        .from('profiles')
        .update({ 
          is_contest_participant: false,
          participant_type: null 
        })
        .eq('id', application.user_id);

      await supabase
        .from('weekly_contest_participants')
        .update({ is_active: false })
        .eq('user_id', application.user_id);
    }

    toast({
      title: "Успех",
      description: `Заявка ${applicationName} перемещена в удалённые`,
    });

    fetchContestApplications();
  };

  const restoreApplication = async (applicationId: string, applicationName: string) => {
    const { error } = await supabase
      .from('contest_applications')
      .update({ 
        deleted_at: null,
        is_active: true 
      })
      .eq('id', applicationId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить заявку",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Успех",
      description: `Заявка ${applicationName} восстановлена`,
    });

    fetchContestApplications();
  };

  const toggleHistoryExpansion = (participantId: string) => {
    setExpandedHistory(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  const getApplicationIdForParticipant = (participant: WeeklyContestParticipant): string | undefined => {
    // Find the corresponding application for this participant
    const application = contestApplications.find(app => app.user_id === participant.user_id);
    return application?.id;
  };

  const ApplicationHistorySection = ({ applicationId }: { applicationId?: string }) => {
    const { history, loading, error } = useApplicationHistory(applicationId);

    if (!applicationId) {
      return (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Заявка не найдена</span>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="h-4 w-4" />
            <span>Загрузка истории...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Ошибка загрузки истории: {error}</span>
          </div>
        </div>
      );
    }

    if (history.length === 0) {
      return (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="h-4 w-4" />
            <span>История изменений пуста</span>
          </div>
        </div>
      );
    }

    const getStatusBadgeVariant = (status: string) => {
      switch (status) {
        case 'approved': return 'default';
        case 'rejected': return 'destructive';
        case 'pending': return 'secondary';
        default: return 'outline';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'approved': return 'Approved';
        case 'rejected': return 'Rejected';
        case 'pending': return 'Under review';
        default: return status;
      }
    };

    return (
      <div className="border-t">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4" />
            <span className="font-medium text-sm">История изменений</span>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {history.map((item) => (
              <div key={item.id} className="text-xs space-y-1 p-2 rounded border bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.change_reason || 'Изменение'}</span>
                  <span className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleString('ru-RU')}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-muted-foreground">Статус:</span>
                  <Badge variant={getStatusBadgeVariant(item.status)} className="h-5 text-xs">
                    {getStatusText(item.status)}
                  </Badge>
                </div>
                {item.notes && (
                  <div>
                    <span className="text-muted-foreground">Заметки: </span>
                    <span>{item.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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

    setUploadingPhotos(true);

    try {
      // Upload new photos if provided
      let updatedEditForm = { ...editForm };

      if (photo1File) {
        const photo1Url = await uploadPhoto(photo1File, 1);
        updatedEditForm.photo1_url = photo1Url;
      }

      if (photo2File) {
        const photo2Url = await uploadPhoto(photo2File, 2);
        updatedEditForm.photo2_url = photo2Url;
      }

      // Update contest application
      const { error: appError } = await supabase
        .from('contest_applications')
        .update({
          application_data: updatedEditForm,
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
      const birthDate = updatedEditForm.birth_year && updatedEditForm.birth_month && updatedEditForm.birth_day
        ? new Date(updatedEditForm.birth_year, updatedEditForm.birth_month - 1, updatedEditForm.birth_day).toISOString().split('T')[0]
        : null;

      const age = updatedEditForm.birth_year ? new Date().getFullYear() - updatedEditForm.birth_year : null;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: updatedEditForm.first_name,
          last_name: updatedEditForm.last_name,
          display_name: `${updatedEditForm.first_name || ''} ${updatedEditForm.last_name || ''}`.trim(),
          city: updatedEditForm.city,
          state: updatedEditForm.state,
          country: updatedEditForm.country,
          gender: updatedEditForm.gender,
          height_cm: updatedEditForm.height_cm,
          weight_kg: updatedEditForm.weight_kg,
          marital_status: updatedEditForm.marital_status,
          has_children: updatedEditForm.has_children,
          birthdate: birthDate,
          age: age,
          photo_1_url: updatedEditForm.photo1_url,
          photo_2_url: updatedEditForm.photo2_url,
          avatar_url: updatedEditForm.photo1_url, // Use portrait photo as avatar
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
          application_data: updatedEditForm
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
      setPhoto1File(null);
      setPhoto2File(null);
      fetchContestApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive"
      });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const cancelEdit = () => {
    setEditingApplication(null);
    setEditForm({});
    setPhoto1File(null);
    setPhoto2File(null);
  };

  // Photo upload handlers
  const handlePhoto1Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto1File(file);
    }
  };

  const handlePhoto2Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto2File(file);
    }
  };

  // Participant photo editing functions
  const startEditingParticipant = (participant: WeeklyContestParticipant) => {
    setEditingParticipant(participant);
    setParticipantPhoto1File(null);
    setParticipantPhoto2File(null);
  };

  const cancelParticipantEdit = () => {
    setEditingParticipant(null);
    setParticipantPhoto1File(null);
    setParticipantPhoto2File(null);
  };

  const handleParticipantPhoto1Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setParticipantPhoto1File(file);
    }
  };

  const handleParticipantPhoto2Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setParticipantPhoto2File(file);
    }
  };

  const saveParticipantPhotos = async () => {
    if (!editingParticipant) return;

    setUploadingParticipantPhotos(true);

    try {
      const updates: any = {};

      // Upload photo1 if provided
      if (participantPhoto1File) {
        const fileExt = participantPhoto1File.name.split('.').pop();
        const fileName = `photo_1.${fileExt}`;
        const filePath = `${editingParticipant.user_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contest-photos')
          .upload(filePath, participantPhoto1File, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contest-photos')
          .getPublicUrl(filePath);
        
        const timestampedUrl = `${publicUrl}?t=${Date.now()}`;
        updates.photo_1_url = timestampedUrl;
      }

      // Upload photo2 if provided
      if (participantPhoto2File) {
        const fileExt = participantPhoto2File.name.split('.').pop();
        const fileName = `photo_2.${fileExt}`;
        const filePath = `${editingParticipant.user_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contest-photos')
          .upload(filePath, participantPhoto2File, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contest-photos')
          .getPublicUrl(filePath);
        
        const timestampedUrl = `${publicUrl}?t=${Date.now()}`;
        updates.photo_2_url = timestampedUrl;
      }

      // Update profile if there are changes
      if (Object.keys(updates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', editingParticipant.user_id);

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "Photos updated successfully",
        });

        // Refresh participants list immediately
        await fetchWeeklyParticipants();
      }

      cancelParticipantEdit();
    } catch (error: any) {
      console.error('Error updating participant photos:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update photos",
        variant: "destructive",
      });
    } finally {
      setUploadingParticipantPhotos(false);
    }
  };

  // Process image to maintain 4:5 aspect ratio (width:height) with side padding if needed
  const processImageAspectRatio = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const targetAspectRatio = 4 / 5; // width:height = 4:5
        
        // If image is narrower than 4:5 ratio, add padding on sides
        if (aspectRatio < targetAspectRatio) {
          // Image is too narrow, need to add horizontal padding (make it wider)
          const targetHeight = img.height;
          const targetWidth = img.height * targetAspectRatio; // width = height * (4/5)
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Fill with white background (padding)
          ctx!.fillStyle = '#ffffff';
          ctx!.fillRect(0, 0, targetWidth, targetHeight);
          
          // Center the original image horizontally
          const offsetX = (targetWidth - img.width) / 2;
          ctx!.drawImage(img, offsetX, 0, img.width, img.height);
        } else {
          // For images with aspect ratio >= 4:5, keep original
          canvas.width = img.width;
          canvas.height = img.height;
          ctx!.drawImage(img, 0, 0);
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(processedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.9);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload photo to Supabase storage
  const uploadPhoto = async (file: File, photoNumber: number): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    // Process image for proper aspect ratio
    const processedFile = await processImageAspectRatio(file);

    // Create file path with user folder structure for RLS to work
    const fileName = `${user.id}/photo${photoNumber}-${Date.now()}.${processedFile.name.split('.').pop()}`;
    
    const { error: uploadError } = await supabase.storage
      .from('contest-photos')
      .upload(fileName, processedFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('contest-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const openPhotoModal = (photos: string[], index: number, name: string) => {
    const validPhotos = photos.filter(photo => photo && photo.trim() !== '');
    if (validPhotos.length === 0) return;
    
    setPhotoModalImages(validPhotos);
    setPhotoModalIndex(index);
    setPhotoModalName(name);
    setPhotoModalOpen(true);
  };

  const reviewApplication = async (applicationId: string, status: 'approved' | 'rejected' | 'pending', notes?: string, rejectionReason?: string, rejectionReasonTypes?: RejectionReasonType | RejectionReasonType[]) => {
    const updateData: any = {
      status,
      notes: notes || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString()
    };

    if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason;
      if (rejectionReasonTypes) {
        updateData.rejection_reason_types = Array.isArray(rejectionReasonTypes) 
          ? rejectionReasonTypes 
          : [rejectionReasonTypes];
      }
    }

    const { error } = await supabase
      .from('contest_applications')
      .update(updateData)
      .eq('id', applicationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive"
      });
      return;
    }

    const application = contestApplications.find(app => app.id === applicationId);
    
    if (status === 'approved') {
      // If approved, make user a contest participant and add to current weekly contest
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
    } else if (status === 'rejected') {
      // If rejected, keep user as contest participant but remove from current weekly contests
      if (application) {
        // Ensure user keeps contest participant status so card shows in profile with rejection reason
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_contest_participant: true })
          .eq('id', application.user_id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        // Only deactivate from weekly contest participants (don't delete completely)
        const { error: participantError } = await supabase
          .from('weekly_contest_participants')
          .update({ is_active: false })
          .eq('user_id', application.user_id);

        if (participantError) {
          console.error('Error deactivating from weekly contests:', participantError);
        }
      }
    } else if (status === 'pending') {
      // If set back to pending, remove from current weekly contest and reset status
      if (application) {
        // Remove from weekly contest participants
        const { error: participantError } = await supabase
          .from('weekly_contest_participants')
          .delete()
          .eq('user_id', application.user_id);

        if (participantError) {
          console.error('Error removing from weekly contests:', participantError);
        }
      }
    }

    toast({
      title: "Success",
      description: `Application ${status}${status === 'approved' ? ' and added to contest' : status === 'rejected' ? ' and removed from contest' : status === 'pending' ? ' and removed from contest' : ''}`,
    });

    fetchContestApplications();
  };

  const handleRejectConfirm = async (reasonTypes: RejectionReasonType[], notes: string) => {
    if (applicationToReject) {
      // Get the rejection reason texts from REJECTION_REASONS
      const rejectionReasonTexts = reasonTypes.map(type => REJECTION_REASONS[type]);
      const combinedRejectionReason = rejectionReasonTexts.join("; ");
      await reviewApplication(applicationToReject.id, 'rejected', notes, combinedRejectionReason, reasonTypes);
      setApplicationToReject(null);
      setRejectModalOpen(false);
    }
  };

interface ApplicationHistoryModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ApplicationHistoryModal = ({ applicationId, isOpen, onClose }: ApplicationHistoryModalProps) => {
  const { history, loading } = useApplicationHistory(applicationId || undefined);

  const renderApplicationCard = (item: any, index: number) => {
    const appData = item.application_data || {};
    const phone = appData.phone;
    
    return (
      <Card key={item.id} className="py-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left section with avatar and basic info */}
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={appData.photo1_url || ''} />
                <AvatarFallback>
                  {appData.first_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">
                  {appData.first_name} {appData.last_name} - Версия {history.length - index}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date().getFullYear() - appData.birth_year} yo</span>
                  <span>•</span>
                  <span>{appData.weight_kg}kg</span>
                  <span>•</span>
                  <span>{appData.height_cm}cm</span>
                  <span>•</span>
                  <span>{appData.gender}</span>
                  <span>•</span>
                  <span className="truncate">{appData.city}, {appData.country}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>Born: {appData.birth_day}/{appData.birth_month}/{appData.birth_year}</span>
                  <span>•</span>
                  <span>{appData.marital_status}</span>
                  <span>•</span>
                  <span>Children: {appData.has_children ? 'Yes' : 'No'}</span>
                  <span>•</span>
                  <span>Phone: {phone ? phone.full_number : 'Not provided'}</span>
                  <span>•</span>
                  <span>Facebook: {appData.facebook_url || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Center section with photos */}
            <div className="flex items-center gap-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Portrait</p>
                {appData.photo1_url && (
                  <img 
                    src={appData.photo1_url} 
                    alt="Portrait" 
                    className="w-16 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Full Length</p>
                {appData.photo2_url && (
                  <img 
                    src={appData.photo2_url} 
                    alt="Full length" 
                    className="w-16 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  />
                )}
              </div>
            </div>

            {/* Right section with status and timestamp */}
            <div className="flex flex-col gap-1 items-center">
              <Badge 
                variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}
              >
                {item.status}
              </Badge>
              <p className="text-xs text-muted-foreground text-center">
                {new Date(item.created_at).toLocaleDateString('ru-RU')} {new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          
          {/* Notes and reason section - if present */}
          {(item.notes || item.change_reason) && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                {item.notes && (
                  <div className="mb-1">
                    <span className="font-medium">Заметки:</span> {item.notes}
                  </div>
                )}
                {item.change_reason && (
                  <div>
                    <span className="font-medium">Причина изменения:</span> {item.change_reason}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>История заявки</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Загрузка истории...</div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            История изменений пуста
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => renderApplicationCard(item, index))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
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
              
              {/* Week selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Contest Week:</label>
                <select 
                  value={selectedWeekOffset} 
                  onChange={(e) => setSelectedWeekOffset(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {getWeekOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              
              {/* Display current week info */}
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-1">
                  {selectedWeekOffset === 0 ? "Current Week Contest" 
                   : selectedWeekOffset === -1 ? "Last Week Contest"
                   : `Contest from ${Math.abs(selectedWeekOffset)} weeks ago`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Showing {weeklyParticipants.length} participant{weeklyParticipants.length !== 1 ? 's' : ''}
                  {weeklyParticipants.length > 0 && weeklyParticipants[0].week_start_date && 
                    ` for the period ${new Date(weeklyParticipants[0].week_start_date).toLocaleDateString()} - ${new Date(weeklyParticipants[0].week_end_date).toLocaleDateString()}`
                  }
                </p>
              </div>

              {/* Participants list */}
              <div className="grid gap-4">
                {weeklyParticipants.map((participant) => (
                    <Card key={participant.id} className="py-3">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
                          
                          {/* Top section: Avatar and basic info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={participant.photo1_url || ''} />
                              <AvatarFallback>
                                {participant.first_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold truncate">
                                {participant.first_name} {participant.last_name}
                              </h3>
                              <div className="text-xs text-muted-foreground truncate">
                                {participant.city}, {participant.country}
                              </div>
                               <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                 <span>{participant.age} yo</span>
                                 <span>•</span>
                                 <span>{participant.weight_kg}kg</span>
                                 <span>•</span>
                                 <span>{participant.height_cm}cm</span>
                                </div>
                            </div>
                          </div>

                          {/* Mobile: Contact info on separate row */}
                          <div className="md:hidden w-full">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span>📞 {participant.application_data?.phone?.full_number || 'Not provided'}</span>
                              {participant.application_data?.facebook_url && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{participant.application_data.facebook_url}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Desktop: Contact info inline */}
                          <div className="hidden md:block flex-1 min-w-0">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>📞 {participant.application_data?.phone?.full_number || 'Not provided'}</span>
                              <span>•</span>
                              {participant.application_data?.facebook_url ? (
                                <span className="truncate">{participant.application_data.facebook_url}</span>
                              ) : (
                                <span>Facebook: Not provided</span>
                              )}
                            </div>
                          </div>

                          {/* Photos section */}
                          <div className="flex items-center gap-2 justify-center md:justify-start">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Portrait</p>
                              {participant.photo1_url && (
                                <img 
                                  src={participant.photo1_url} 
                                  alt="Portrait" 
                                  className="w-16 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => openPhotoModal([participant.photo1_url, participant.photo2_url].filter(Boolean), 0, `${participant.first_name} ${participant.last_name}`)}
                                />
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Full Length</p>
                              {participant.photo2_url && (
                                <img 
                                  src={participant.photo2_url} 
                                  alt="Full length" 
                                  className="w-16 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => openPhotoModal([participant.photo1_url, participant.photo2_url].filter(Boolean), 1, `${participant.first_name} ${participant.last_name}`)}
                                />
                              )}
                            </div>
                          </div>

                          {/* Controls and stats section */}
                          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2 text-xs">
                              <Switch
                                checked={participant.is_active}
                                onCheckedChange={() => toggleParticipantActive(participant.id, participant.is_active)}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              {participant.average_rating && participant.average_rating > 0 ? (
                                <>
                                  <Badge variant="default" className="bg-contest-blue text-xs px-2 py-0">
                                    Rating: {participant.average_rating.toFixed(1)}
                                  </Badge>
                                   <Badge 
                                     variant="secondary" 
                                     className="text-xs px-2 py-0 cursor-pointer hover:bg-muted-foreground/20 transition-colors"
                                     onClick={() => openVotersModal(participant.id, `${participant.first_name} ${participant.last_name}`)}
                                   >
                                     Votes: {participant.total_votes || 0}
                                   </Badge>
                                </>
                              ) : (
                                <Badge variant="secondary" className="text-xs px-2 py-0">No Rating</Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleHistoryExpansion(participant.id)}
                                className="px-2"
                                title="История изменений"
                              >
                                <Plus className={`h-4 w-4 transition-transform ${expandedHistory.has(participant.id) ? 'rotate-45' : ''}`} />
                              </Button>
                              <Button
                                onClick={() => startEditingParticipant(participant)}
                                size="sm"
                                className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                              >
                                <Edit className="w-3 h-3" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                onClick={() => deleteParticipant(participant.id, `${participant.first_name} ${participant.last_name}`)}
                                size="sm"
                                variant="destructive"
                                className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                                title="Удалить участника"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <Collapsible open={expandedHistory.has(participant.id)}>
                          <CollapsibleContent>
                            <ApplicationHistorySection applicationId={getApplicationIdForParticipant(participant)} />
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    </Card>
                ))}
                
                {weeklyParticipants.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">
                        {selectedWeekOffset === 0 
                          ? "No participants in this week's contest yet." 
                          : "No participants found for the selected week."
                        }
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedWeekOffset === 0 
                          ? "Approve contest applications to add participants to weekly contests."
                          : "This week may not have had any approved participants."
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Photo editing dialog */}
              <Dialog open={!!editingParticipant} onOpenChange={(open) => !open && cancelParticipantEdit()}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      Edit Photos for {editingParticipant?.first_name} {editingParticipant?.last_name}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {editingParticipant && (
                    <div className="space-y-6">
                      {/* Current Photos */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Current Portrait Photo</Label>
                          {editingParticipant.photo1_url && (
                            <img 
                              src={editingParticipant.photo1_url} 
                              alt="Current portrait" 
                              className="w-full h-48 object-cover rounded border mt-2 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openPhotoModal([editingParticipant.photo1_url, editingParticipant.photo2_url].filter(Boolean), 0, `${editingParticipant.first_name} ${editingParticipant.last_name}`)}
                            />
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Current Full Length Photo</Label>
                          {editingParticipant.photo2_url && (
                            <img 
                              src={editingParticipant.photo2_url} 
                              alt="Current full length" 
                              className="w-full h-48 object-cover rounded border mt-2 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openPhotoModal([editingParticipant.photo1_url, editingParticipant.photo2_url].filter(Boolean), 1, `${editingParticipant.first_name} ${editingParticipant.last_name}`)}
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* New Photo Uploads */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Replace Portrait Photo</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleParticipantPhoto1Upload}
                            className="mt-2"
                          />
                          {participantPhoto1File && (
                            <p className="text-sm text-green-600 mt-1">
                              New portrait selected: {participantPhoto1File.name}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Replace Full Length Photo</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleParticipantPhoto2Upload}
                            className="mt-2"
                          />
                          {participantPhoto2File && (
                            <p className="text-sm text-green-600 mt-1">
                              New full length selected: {participantPhoto2File.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={cancelParticipantEdit} disabled={uploadingParticipantPhotos}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={saveParticipantPhotos} 
                          className="bg-blue-600 hover:bg-blue-700" 
                          disabled={uploadingParticipantPhotos || (!participantPhoto1File && !participantPhoto2File)}
                        >
                          {uploadingParticipantPhotos ? "Uploading..." : "Save Photos"}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Contest Applications</h2>
                <div className="flex gap-2">
                  <Button
                    variant={!showDeletedApplications ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowDeletedApplications(false)}
                  >
                    Active Applications
                  </Button>
                  <Button
                    variant={showDeletedApplications ? "default" : "outline"}
                    size="sm"
                    onClick={async () => {
                      setShowDeletedApplications(true);
                      const deleted = await fetchDeletedApplications();
                      setDeletedApplications(deleted);
                    }}
                  >
                    Deleted Applications
                  </Button>
                </div>
              </div>
              
              {/* Country and Gender Filters */}
              <div className="flex gap-3 mb-4">
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {Array.from(new Set(contestApplications.map(app => app.application_data?.country).filter(Boolean))).sort().map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4">
                {(showDeletedApplications ? deletedApplications : contestApplications)
                  .filter((application) => {
                    const appData = application.application_data || {};
                    
                    // Apply country filter
                    if (countryFilter !== 'all' && appData.country !== countryFilter) {
                      return false;
                    }
                    
                    // Apply gender filter  
                    if (genderFilter !== 'all' && appData.gender !== genderFilter) {
                      return false;
                    }
                    
                    return true;
                  })
                  .map((application) => {
                   const appData = application.application_data || {};
                   const phone = appData.phone;
                   const submittedDate = new Date(application.submitted_at);
                   
                   // Find the user's profile to get auth data
                   const userProfile = profiles.find(p => p.id === application.user_id);
                  
                  return (
                     <Card key={application.id} className="overflow-hidden">
                       <CardContent className="p-4">
                           <div className="flex flex-col md:flex-row md:items-stretch gap-4">
                             {/* Photos section - Left edge without padding */}
                             <div className="flex items-center gap-2 py-0 md:py-0 md:w-[20ch] md:flex-shrink-0">
                               {appData.photo1_url && (
                                 <div className="flex-1">
                                   <img 
                                     src={appData.photo1_url} 
                                     alt="Portrait" 
                                     className="w-full max-h-32 object-contain rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                     onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 0, `${appData.first_name} ${appData.last_name}`)}
                                   />
                                 </div>
                               )}
                               {appData.photo2_url && (
                                 <div className="flex-1">
                                   <img 
                                     src={appData.photo2_url} 
                                     alt="Full length" 
                                     className="w-full max-h-32 object-contain rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                     onClick={() => openPhotoModal([appData.photo1_url, appData.photo2_url].filter(Boolean), 1, `${appData.first_name} ${appData.last_name}`)}
                                   />
                                 </div>
                               )}
                             </div>

                             {/* Main info section - Fixed width 50 chars */}
                             <div className="md:w-[50ch] md:flex-shrink-0 flex-1 min-w-0">
                               {/* First line: Avatar + Name and Age */}
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
                              
                              {/* Second line: Location */}
                              <div className="text-xs text-muted-foreground mb-1">
                                {appData.city} {appData.state} {appData.country}
                              </div>
                               
                               {/* Third line: Physical stats */}
                               <div className="text-xs text-muted-foreground mb-1">
                                 {appData.weight_kg}kg • {appData.height_cm}cm • {appData.gender}
                               </div>


                               {/* Fifth line: Marital and children status */}
                               <div className="text-xs text-muted-foreground mb-1">
                                 {appData.marital_status} • {appData.has_children ? 'Has children' : 'No children'}
                               </div>

                               {/* Fifth line: Contact - email with copy icon */}
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

                               {/* Sixth line: Phone and Facebook */}
                               <div className="text-xs text-muted-foreground mb-1">
                                 <div className="flex items-center gap-2">
                                   <span>{phone ? phone.full_number : 'Not provided'}</span>
                                   {appData.facebook_url && (
                                     <div className="flex items-center gap-1">
                                       <span>•</span>
                                       <span 
                                         className="cursor-pointer" 
                                         title={appData.facebook_url}
                                       >
                                         {(() => {
                                           const displayUrl = appData.facebook_url.replace(/^https?:\/\/(www\.)?facebook\.com\/?/, '');
                                           return displayUrl.length > 10 ? `${displayUrl.substring(0, 10)}...` : displayUrl;
                                         })()}
                                       </span>
                                       <Copy 
                                         className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                         onClick={() => navigator.clipboard.writeText(appData.facebook_url)}
                                       />
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>

                            {/* Controls and status section */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                              <div className="flex items-center gap-2 text-xs">
                                <Switch
                                  checked={application.is_active ?? true}
                                  onCheckedChange={() => toggleApplicationActive(application.id, application.is_active ?? true)}
                                />
                              </div>
                             <div className="flex flex-col gap-1 items-center">
                               {getApplicationStatusBadge(application.status)}
                               <p className="text-xs text-muted-foreground text-center">
                                 {submittedDate.toLocaleDateString('ru-RU')} {submittedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                               </p>
                             </div>
                             <div className="flex gap-1 flex-wrap justify-center">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => {
                                   setViewingApplicationHistory(application.id);
                                   setApplicationHistoryOpen(true);
                                 }}
                                 className="px-2"
                               >
                                 <Clock className="w-3 h-3" />
                               </Button>
                                {!showDeletedApplications && (
                                 <>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => startEditingApplication(application)}
                                     className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                                   >
                                     <Edit className="w-3 h-3" />
                                     <span className="hidden sm:inline">Edit</span>
                                   </Button>
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
                                     <Check className="w-3 h-3" />
                                     <span className="hidden sm:inline">{application.status === 'approved' ? 'Unapprove' : 'Approve'}</span>
                                   </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        const appData = application.application_data as any;
                                        const name = `${appData.first_name || ''} ${appData.last_name || ''}`.trim();
                                        setApplicationToReject({ id: application.id, name });
                                        setRejectModalOpen(true);
                                      }}
                                      disabled={application.status === 'rejected'}
                                      className="text-xs px-2 py-1 h-7"
                                    >
                                      <X className="w-3 h-3" />
                                      <span className="hidden sm:inline">Reject</span>
                                    </Button>
                                    <Button
                                      onClick={() => deleteApplication(application.id, `${appData.first_name} ${appData.last_name}`)}
                                      size="sm"
                                      variant="destructive"
                                      className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                                      title="Удалить заявку"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                 </>
                                )}
                                {showDeletedApplications && (
                                  <Button
                                    onClick={() => restoreApplication(application.id, `${appData.first_name} ${appData.last_name}`)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 h-7"
                                    title="Восстановить заявку"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span className="hidden sm:inline">Restore</span>
                                  </Button>
                                )}
                             </div>
                           </div>
                         </div>
                        
                        {/* Timestamps and notes section - collapsed */}
                        {(application.notes || application.reviewed_at || (application.status === 'rejected' && (application.rejection_reason || application.rejection_reason_type))) && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex justify-between items-start text-xs text-muted-foreground">
                              <div className="flex gap-4">
                                <span>Submitted: {new Date(application.submitted_at).toLocaleString()}</span>
                                <span>Updated: {new Date(application.updated_at).toLocaleString()}</span>
                                {application.reviewed_at && (
                                  <span>Reviewed: {new Date(application.reviewed_at).toLocaleString()}</span>
                                )}
                              </div>
                              {application.notes && (
                                <span className="text-right max-w-md truncate">Notes: {application.notes}</span>
                              )}
                            </div>
                            {/* Rejection reason display */}
                            {application.status === 'rejected' && (application.rejection_reason || application.rejection_reason_type) && (
                              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
                                <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Rejection Reason:</span>
                                </div>
                                {application.rejection_reason_type && (
                                  <p className="text-destructive/80 mb-1">
                                    {REJECTION_REASONS[application.rejection_reason_type as keyof typeof REJECTION_REASONS]}
                                  </p>
                                )}
                                {application.rejection_reason && (
                                  <p className="text-destructive/70">
                                    Comment: {application.rejection_reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
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
                              Reject
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
                              <div className="text-sm text-muted-foreground mb-1">
                                {profile.email && (
                                  <div>Email: {profile.email}</div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span>Auth Provider:</span>
                                  <Badge variant={profile.auth_provider === 'facebook' ? 'default' : 'secondary'}>
                                    {profile.auth_provider || 'unknown'}
                                  </Badge>
                                </div>
                                {profile.facebook_data && (
                                  <div className="text-xs mt-1 p-2 bg-blue-50 rounded border">
                                    <strong>Facebook Data:</strong>
                                    {profile.facebook_data.name && <div>Name: {profile.facebook_data.name}</div>}
                                    {profile.facebook_data.email && <div>FB Email: {profile.facebook_data.email}</div>}
                                    {profile.facebook_data.picture && <div>Profile Pic: Available</div>}
                                    {profile.facebook_data.verified && <div>Verified: {profile.facebook_data.verified ? 'Yes' : 'No'}</div>}
                                  </div>
                                )}
                                {profile.last_sign_in_at && (
                                  <div className="text-xs">
                                    Last Login: {new Date(profile.last_sign_in_at).toLocaleString()}
                                  </div>
                                )}
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
                      <Label htmlFor="photo1_url">Portrait Photo</Label>
                      <Input
                        id="photo1_url"
                        value={editForm.photo1_url || ''}
                        onChange={(e) => handleEditFormChange('photo1_url', e.target.value)}
                        placeholder="Portrait photo URL"
                        className="mb-2"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto1Upload}
                        className="mb-2"
                      />
                      {photo1File && (
                        <p className="text-sm text-green-600 mb-2">
                          New photo selected: {photo1File.name}
                        </p>
                      )}
                      {editForm.photo1_url && (
                        <img 
                          src={editForm.photo1_url} 
                          alt="Portrait preview" 
                          className="w-24 h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openPhotoModal([editForm.photo1_url, editForm.photo2_url].filter(Boolean), 0, `${editForm.first_name} ${editForm.last_name}` || 'Application')}
                        />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="photo2_url">Full Length Photo</Label>
                      <Input
                        id="photo2_url"
                        value={editForm.photo2_url || ''}
                        onChange={(e) => handleEditFormChange('photo2_url', e.target.value)}
                        placeholder="Full length photo URL"
                        className="mb-2"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhoto2Upload}
                        className="mb-2"
                      />
                      {photo2File && (
                        <p className="text-sm text-green-600 mb-2">
                          New photo selected: {photo2File.name}
                        </p>
                      )}
                      {editForm.photo2_url && (
                        <img 
                          src={editForm.photo2_url} 
                          alt="Full length preview" 
                          className="w-24 h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openPhotoModal([editForm.photo1_url, editForm.photo2_url].filter(Boolean), 1, `${editForm.first_name} ${editForm.last_name}` || 'Application')}
                        />
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={cancelEdit} disabled={uploadingPhotos}>
                      Cancel
                    </Button>
                    <Button onClick={saveApplicationEdit} className="bg-blue-600 hover:bg-blue-700" disabled={uploadingPhotos}>
                      {uploadingPhotos ? "Uploading..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Application History Modal */}
          <ApplicationHistoryModal 
            applicationId={viewingApplicationHistory}
            isOpen={applicationHistoryOpen}
            onClose={() => {
              setApplicationHistoryOpen(false);
              setViewingApplicationHistory(null);
            }}
          />
        </div>
      </div>

      {/* Photo Modal */}
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
        onConfirm={handleRejectConfirm}
      />

      {/* Voters Modal */}
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