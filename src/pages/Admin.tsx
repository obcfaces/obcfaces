import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Check, X, Eye, Star, Heart, Trash2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ParticipantsService } from '@/services/ParticipantsService';

const Admin = () => {
  const { user, isAdmin, loading } = useAdminAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('new1');
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [weeklyParticipants, setWeeklyParticipants] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch applications when tab changes
  useEffect(() => {
    if (!isAdmin || !user) return;
    
    const fetchData = async () => {
      setLoadingData(true);
      try {
        let filters: any = {};
        
        switch (activeTab) {
          case 'new1':
            filters = { status: statusFilter !== 'all' ? statusFilter : undefined };
            break;
          case 'prenextweek':
            filters = { status: 'pre next week' };
            break;
          case 'nextweek':
            filters = { status: 'next week' };
            break;
          case 'weekly':
            filters = { status: 'this week' };
            break;
          case 'pastweek':
            filters = { status: 'past' };
            break;
          case 'all':
            filters = {};
            break;
        }
        
        const data = await ParticipantsService.getParticipants(filters);
        setWeeklyParticipants(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [activeTab, statusFilter, isAdmin, user]);

  const handleStatusChange = async (participantId: string, newStatus: string, name: string) => {
    if (!user) return;
    
    try {
      await ParticipantsService.updateStatus(participantId, newStatus, user.id);
      
      toast({
        title: 'Success',
        description: `${name} status updated to ${newStatus}`,
      });
      
      // Refresh data
      const data = await ParticipantsService.getParticipants({ 
        status: statusFilter !== 'all' ? statusFilter : undefined 
      });
      setWeeklyParticipants(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const renderApplicationCard = (participant: any) => {
    const fullName = participant.first_name && participant.last_name 
      ? `${participant.first_name} ${participant.last_name}`
      : participant.display_name || 'Unknown';

    return (
      <Card key={participant.participant_id} className="mb-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span className="text-lg md:text-xl">{fullName}</span>
            <Badge variant={
              participant.admin_status === 'pending' ? 'secondary' :
              participant.admin_status === 'rejected' ? 'destructive' :
              'default'
            }>
              {participant.admin_status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleStatusChange(participant.participant_id, 'pre next week', fullName)}
              disabled={loadingData}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusChange(participant.participant_id, 'rejected', fullName)}
              disabled={loadingData}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWeeklyCard = (participant: any) => {
    const fullName = participant.first_name && participant.last_name 
      ? `${participant.first_name} ${participant.last_name}`
      : participant.display_name || 'Unknown';

    return (
      <Card key={participant.participant_id} className="mb-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {participant.final_rank && (
                <Badge variant="default">#{participant.final_rank}</Badge>
              )}
              <span className="text-lg md:text-xl">{fullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                {Number(participant.average_rating || 0).toFixed(1)}
              </Badge>
              <Badge variant="secondary">
                {participant.total_votes || 0} votes
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Location:</span>{' '}
              {participant.city}, {participant.country}
            </div>
            <div>
              <span className="text-muted-foreground">Age:</span> {participant.age}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>Admin Panel - Online Beauty Contest</title>
        <meta name="description" content="Admin panel for managing contest applications and participants" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden md:flex">
            <TabsTrigger value="new1">New</TabsTrigger>
            <TabsTrigger value="prenextweek">Pre</TabsTrigger>
            <TabsTrigger value="nextweek">Next</TabsTrigger>
            <TabsTrigger value="weekly">This</TabsTrigger>
            <TabsTrigger value="pastweek">Past</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="registrations">Reg</TabsTrigger>
            <TabsTrigger value="stat">Stat</TabsTrigger>
            <TabsTrigger value="winnercontent">Win</TabsTrigger>
          </TabsList>

          <TabsContent value="new1" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Applications</h2>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="pre next week">Pre Next Week</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {weeklyParticipants.map(renderApplicationCard)}
                
                {weeklyParticipants.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No applications found
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="prenextweek" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Pre Next Week</h2>
            {loadingData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {weeklyParticipants.map(renderApplicationCard)}
                {weeklyParticipants.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No participants found
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="nextweek" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Next Week</h2>
            {loadingData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {weeklyParticipants.map(renderWeeklyCard)}
                {weeklyParticipants.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No participants found
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">This Week's Contest</h2>
            {loadingData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {weeklyParticipants
                  .sort((a: any, b: any) => {
                    if (a.final_rank && !b.final_rank) return -1;
                    if (!a.final_rank && b.final_rank) return 1;
                    if (a.final_rank && b.final_rank) return a.final_rank - b.final_rank;
                    
                    const ratingA = Number(a.average_rating) || 0;
                    const ratingB = Number(b.average_rating) || 0;
                    if (ratingB !== ratingA) return ratingB - ratingA;
                    
                    const votesA = Number(a.total_votes) || 0;
                    const votesB = Number(b.total_votes) || 0;
                    return votesB - votesA;
                  })
                  .map(renderWeeklyCard)}
                
                {weeklyParticipants.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No participants found
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="pastweek" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Past Week</h2>
            {loadingData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {weeklyParticipants.map(renderWeeklyCard)}
                {weeklyParticipants.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No participants found
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">All Participants</h2>
            {loadingData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {weeklyParticipants.map(renderWeeklyCard)}
                {weeklyParticipants.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No participants found
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Recent Registrations</h2>
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Registrations tab - coming soon
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stat" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Statistics</h2>
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Statistics tab - coming soon
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="winnercontent" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Winner Content</h2>
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Winner content management - coming soon
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Admin;
