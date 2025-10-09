import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminApplicationsTab } from '@/components/admin/AdminApplicationsTab';
import { AdminWeeklyTab } from '@/components/admin/AdminWeeklyTab';
import { AdminRegistrationsTab } from '@/components/admin/AdminRegistrationsTab';
import { AdminStatsTab } from '@/components/admin/AdminStatsTab';

const Admin = () => {
  const { user, isAdmin, loading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('new1');

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

  return (
    <>
      <Helmet>
        <title>Admin Panel - Online Beauty Contest</title>
        <meta name="description" content="Admin panel for managing contest applications and participants" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 gap-2">
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
            <AdminApplicationsTab userId={user?.id || ''} />
          </TabsContent>

          <TabsContent value="prenextweek" className="space-y-4">
            <AdminApplicationsTab userId={user?.id || ''} />
          </TabsContent>

          <TabsContent value="nextweek" className="space-y-4">
            <AdminApplicationsTab userId={user?.id || ''} />
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <AdminWeeklyTab />
          </TabsContent>

          <TabsContent value="pastweek" className="space-y-4">
            <AdminWeeklyTab />
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <AdminWeeklyTab />
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4">
            <AdminRegistrationsTab />
          </TabsContent>

          <TabsContent value="stat" className="space-y-4">
            <AdminStatsTab />
          </TabsContent>

          <TabsContent value="winnercontent" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              Winner content management coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Admin;
