import React, { useState, useMemo, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Copy, Trash2, ChevronDown, ChevronUp, MoreVertical, History } from 'lucide-react';
import { ContestApplication, ParticipantStatus } from '@/types/admin';
import { REJECTION_REASONS } from '@/components/reject-reason-modal';
import { LoadingSpinner } from '../LoadingSpinner';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';
import { Country } from 'country-state-city';
import { ParticipantStatusHistoryModal } from '../ParticipantStatusHistoryModal';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { formatDateInCountry } from '@/utils/weekIntervals';

interface AdminNewApplicationsTabProps {
  applications: ContestApplication[];
  allApplications?: ContestApplication[]; // For statistics table calculation
  deletedApplications: ContestApplication[];
  showDeleted: boolean;
  onToggleDeleted: (show: boolean) => void;
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onEdit: (app: ContestApplication) => void;
  onApprove: (app: ContestApplication) => void;
  onReject: (app: ContestApplication) => void;
  onDelete: (app: ContestApplication) => void;
  onRestore: (app: ContestApplication) => void;
  loading?: boolean;
}

export function AdminNewApplicationsTab({
  applications,
  allApplications,
  deletedApplications,
  showDeleted,
  onToggleDeleted,
  onViewPhotos,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onRestore,
  loading = false,
}: AdminNewApplicationsTabProps) {
  // ALL HOOKS MUST COME BEFORE ANY CONDITIONAL RETURNS
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [statusRowFilter, setStatusRowFilter] = useState<string | null>(null);
  const [adminStatusFilter, setAdminStatusFilter] = useState<ParticipantStatus | 'all' | 'deleted'>('pending');
  const { selectedCountry } = useAdminCountry();
  
  // Reset table filters when admin status filter changes
  useEffect(() => {
    setDayFilter(null);
    setStatusRowFilter(null);
  }, [adminStatusFilter]);
  
  // Filter by selected country
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const country = app.application_data?.country;
      return country === selectedCountry;
    });
  }, [applications, selectedCountry]);

  const filteredDeletedApplications = useMemo(() => {
    return deletedApplications.filter(app => {
      const country = app.application_data?.country;
      return country === selectedCountry;
    });
  }, [deletedApplications, selectedCountry]);

  // Calculate weekly statistics for current day
  const weeklyStats = useMemo(() => {
    const stats = {
      all: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      pending: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      approved: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      rejected: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    };

    // Get current week's Monday
    const nowUtc = new Date();
    const currentDayOfWeek = nowUtc.getUTCDay();
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const weekStartUtc = new Date(Date.UTC(
      nowUtc.getUTCFullYear(),
      nowUtc.getUTCMonth(),
      nowUtc.getUTCDate() - daysFromMonday,
      0, 0, 0, 0
    ));
    
    const weekEndUtc = new Date(weekStartUtc);
    weekEndUtc.setUTCDate(weekStartUtc.getUTCDate() + 6);
    weekEndUtc.setUTCHours(23, 59, 59, 999);
    
    console.log('🔍🔍🔍 WEEK RANGE CHECK 🔍🔍🔍');
    console.log('Current UTC:', nowUtc.toISOString());
    console.log('Week Start UTC:', weekStartUtc.toISOString());
    console.log('Week End UTC:', weekEndUtc.toISOString());

    console.log('📊 Week range:', weekStartUtc.toISOString(), 'to', weekEndUtc.toISOString());
    
    // Use allApplications for statistics if provided, otherwise use applications
    const appsForStats = allApplications || applications;
    
    appsForStats.forEach(app => {
      const country = app.application_data?.country;
      if (country !== selectedCountry) return;

      // USE CREATED_AT FOR REGISTRATION DATE (not submitted_at which can be updated)
      const createdAtUtc = new Date(app.created_at || app.submitted_at);

      // Debug log for applications created today
      const isToday = createdAtUtc.toISOString().startsWith('2025-10-14') || 
                      createdAtUtc.toISOString().startsWith('2025-10-13');
      if (isToday) {
        console.log('📅 Application created today/yesterday:', {
          id: app.id,
          created_at: app.created_at,
          createdAtUtc: createdAtUtc.toISOString(),
          status: app.admin_status,
          weekStart: weekStartUtc.toISOString(),
          weekEnd: weekEndUtc.toISOString(),
          inRange: createdAtUtc >= weekStartUtc && createdAtUtc <= weekEndUtc
        });
      }

      // Only count from current week
      if (createdAtUtc < weekStartUtc || createdAtUtc > weekEndUtc) {
        return;
      }

      const dayOfWeek = createdAtUtc.getUTCDay();
      const dayMap: { [key: number]: keyof typeof stats.all } = {
        1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun'
      };
      const day = dayMap[dayOfWeek];

      stats.all[day]++;

      if (app.admin_status === 'pending') {
        stats.pending[day]++;
      }
      if (app.admin_status && ['pre next week', 'next week', 'next week on site', 'this week'].includes(app.admin_status)) {
        stats.approved[day]++;
      }
      if (app.admin_status === 'rejected') {
        stats.rejected[day]++;
      }
    });
    
    console.log('📊 Statistics calculated:', stats);

    return stats;
  }, [applications, selectedCountry]);

  // Get current week dates for table headers
  const weekDates = useMemo(() => {
    const nowUtc = new Date();
    const currentDayOfWeek = nowUtc.getUTCDay();
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const monday = new Date(Date.UTC(
      nowUtc.getUTCFullYear(),
      nowUtc.getUTCMonth(),
      nowUtc.getUTCDate() - daysFromMonday
    ));

    return {
      mon: `${String(monday.getUTCDate()).padStart(2, '0')}/${String(monday.getUTCMonth() + 1).padStart(2, '0')}`,
      tue: (() => { const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + 1); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; })(),
      wed: (() => { const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + 2); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; })(),
      thu: (() => { const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + 3); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; })(),
      fri: (() => { const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + 4); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; })(),
      sat: (() => { const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + 5); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; })(),
      sun: (() => { const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + 6); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; })(),
    };
  }, []);

  // Filter by day and status row
  const displayApplications = useMemo(() => {
    console.log('🔍 Filtering applications:', { 
      totalApps: filteredApplications.length,
      dayFilter, 
      statusRowFilter, 
      adminStatusFilter 
    });
    
    // Show deleted or regular applications based on filter
    let apps = adminStatusFilter === 'deleted' ? filteredDeletedApplications : filteredApplications;
    
    console.log(`📋 Starting with ${apps.length} apps (${adminStatusFilter === 'deleted' ? 'deleted' : 'regular'})`);

    // Filter by admin status (skip if showing deleted or using table filters)
    if (adminStatusFilter !== 'all' && adminStatusFilter !== 'deleted' && !dayFilter && !statusRowFilter) {
      apps = apps.filter(app => app.admin_status === adminStatusFilter);
      console.log(`✂️ Filtered by admin status ${adminStatusFilter}: ${apps.length} apps remaining`);
    }

    // Then filter by table cell click - FILTER BY REGISTRATION DATE (submitted_at)
    if (dayFilter || statusRowFilter) {
      console.log('📅 Applying table filters (by registration date)...');
      
      // Get current week boundaries
      const nowUtc = new Date();
      const currentDayOfWeek = nowUtc.getUTCDay();
      const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      const weekStartUtc = new Date(Date.UTC(
        nowUtc.getUTCFullYear(),
        nowUtc.getUTCMonth(),
        nowUtc.getUTCDate() - daysFromMonday,
        0, 0, 0, 0
      ));
      
      const weekEndUtc = new Date(weekStartUtc);
      weekEndUtc.setUTCDate(weekStartUtc.getUTCDate() + 6);
      weekEndUtc.setUTCHours(23, 59, 59, 999);

      console.log('📆 Week range:', { weekStartUtc, weekEndUtc });

      // Count how many apps we're filtering
      const totalBeforeFilter = apps.length;
      console.log(`🔍 Starting to filter ${totalBeforeFilter} apps for day=${dayFilter}, statusRow=${statusRowFilter}`);
      
      apps = apps.filter(app => {
        // USE CREATED_AT FOR REGISTRATION DATE (not submitted_at which can be updated)
        const createdAtUtc = new Date(app.created_at || app.submitted_at);
        
        console.log(`🔎 Checking app:`, {
          name: `${app.application_data?.first_name} ${app.application_data?.last_name}`,
          created_at: app.created_at,
          submitted_at: app.submitted_at,
          createdAtUtc: createdAtUtc.toISOString(),
          admin_status: app.admin_status,
          weekStart: weekStartUtc.toISOString(),
          weekEnd: weekEndUtc.toISOString()
        });
        
        // MUST be in current week
        if (createdAtUtc < weekStartUtc || createdAtUtc > weekEndUtc) {
          console.log(`❌ Not in current week (created ${createdAtUtc.toISOString()}, week ${weekStartUtc.toISOString()} - ${weekEndUtc.toISOString()})`);
          return false;
        }

        const dayOfWeek = createdAtUtc.getUTCDay();
        const dayMap: { [key: number]: string } = {
          1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun'
        };
        const day = dayMap[dayOfWeek];

        console.log(`📅 Registered on: ${day}`);

        // Day filter
        if (dayFilter && day !== dayFilter) {
          console.log(`❌ Day mismatch: expected ${dayFilter}, got ${day}`);
          return false;
        }

        // Status row filter
        if (statusRowFilter) {
          if (statusRowFilter === 'all') {
            console.log(`✅ Match (all)`);
            return true;
          } else if (statusRowFilter === 'pending') {
            const match = app.admin_status === 'pending';
            console.log(`${match ? '✅' : '❌'} Pending status check: ${app.admin_status}`);
            return match;
          } else if (statusRowFilter === 'approved') {
            const match = app.admin_status && ['pre next week', 'next week', 'next week on site', 'this week'].includes(app.admin_status);
            console.log(`${match ? '✅' : '❌'} Approved status check: ${app.admin_status}`);
            return match;
          } else if (statusRowFilter === 'rejected') {
            const match = app.admin_status === 'rejected';
            console.log(`${match ? '✅' : '❌'} Rejected status check: ${app.admin_status}`);
            return match;
          }
        }

        console.log(`✅ Match (no specific status filter)`);
        return true;
      });
      
      console.log(`✅ After table filters: ${apps.length} apps`);
    }

    console.log(`📊 Final result: ${apps.length} apps to display`);
    return apps;
  }, [filteredApplications, filteredDeletedApplications, dayFilter, statusRowFilter, adminStatusFilter]);

  // NOW we can have conditional returns after all hooks
  if (loading) {
    return <LoadingSpinner message="Loading applications..." />;
  }

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

  const toggleHistoryExpand = (id: string) => {
    const newSet = new Set(expandedHistory);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedHistory(newSet);
  };

  const handleCellClick = (day: string, statusRow: string) => {
    console.log('📊 Table cell clicked:', { day, statusRow, currentDayFilter: dayFilter, currentStatusRowFilter: statusRowFilter });
    
    // If clicking the same cell, clear filters
    if (dayFilter === day && statusRowFilter === statusRow) {
      setDayFilter(null);
      setStatusRowFilter(null);
      console.log('🔄 Clearing filters');
    } else {
      // Use flushSync to synchronously update all states together
      flushSync(() => {
        setAdminStatusFilter('all');
        setDayFilter(day);
        setStatusRowFilter(statusRow);
      });
      console.log('✅ Set filters:', { day, statusRow, adminStatusFilter: 'all' });
    }
  };

  return (
    <div className="space-y-4 -mx-2 md:mx-0">
      {/* Weekly Statistics Table */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium">Type</th>
                {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((dayName, idx) => (
                  <th key={dayName} className="text-center p-2 font-medium">
                    {dayName}
                    <div className="text-[10px] text-muted-foreground font-normal">
                      {weekDates[(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const)[idx]]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'All', key: 'all', className: '' },
                { label: 'Pending', key: 'pending', className: '' },
                { label: 'Approved', key: 'approved', className: '' },
                { label: 'Rejected', key: 'rejected', className: 'text-red-500' },
              ].map(row => (
                <tr key={row.key} className="border-b border-border/50">
                  <td className={`text-left p-2 ${row.className}`}>{row.label}</td>
                  {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(day => {
                    const count = weeklyStats[row.key as keyof typeof weeklyStats][day];
                    const isActive = dayFilter === day && statusRowFilter === row.key;
                    return (
                      <td 
                        key={day} 
                        className={`text-center p-2 ${row.className} cursor-pointer hover:bg-accent/50 ${isActive ? 'bg-accent font-bold' : ''}`}
                        onClick={() => handleCellClick(day, row.key)}
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 md:px-0">
        <Select value={adminStatusFilter} onValueChange={(value) => setAdminStatusFilter(value as ParticipantStatus | 'all' | 'deleted')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status filter" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="pre next week">Pre Next Week</SelectItem>
            <SelectItem value="next week">Next Week</SelectItem>
            <SelectItem value="this week">This Week</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="deleted">Deleted ({deletedApplications.length})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {displayApplications.map((participant) => {
        const appData = participant.application_data || {};
        const firstName = appData.first_name || appData.firstName || '';
        const lastName = appData.last_name || appData.lastName || '';
        // Try multiple possible keys for photo URLs to handle different data formats
        const photo1 = appData.photo_1_url || appData.photo1_url || appData.photo1Url || appData.photoUrl1 || '';
        const photo2 = appData.photo_2_url || appData.photo2_url || appData.photo2Url || appData.photoUrl2 || '';
        
        // Get the latest status change date from status_history or fallback to submitted_at
        const getLatestStatusChangeDate = () => {
          const statusHistory = participant.status_history;
          if (!statusHistory || typeof statusHistory !== 'object') {
            return participant.submitted_at ? new Date(participant.submitted_at) : null;
          }
          
          const dates: Date[] = [];
          
          // Extract all dates from status_history
          Object.entries(statusHistory).forEach(([key, data]: [string, any]) => {
            if (key === 'changed_at' || key === 'changed_by' || key === 'change_reason') return;
            if (!data || typeof data !== 'object') return;
            
            const dateStr = data.changed_at || data.timestamp;
            if (dateStr) {
              dates.push(new Date(dateStr));
            }
          });
          
          // Return the most recent date
          if (dates.length > 0) {
            return new Date(Math.max(...dates.map(d => d.getTime())));
          }
          
          return participant.submitted_at ? new Date(participant.submitted_at) : null;
        };
        
        const submittedDate = getLatestStatusChangeDate();

        return (
          <ApplicationCardWithHistory
            key={participant.id}
            participant={participant}
            appData={appData}
            firstName={firstName}
            lastName={lastName}
            photo1={photo1}
            photo2={photo2}
            submittedDate={submittedDate}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            expandedHistory={expandedHistory}
            toggleHistoryExpand={toggleHistoryExpand}
            onViewPhotos={onViewPhotos}
            onEdit={onEdit}
            onApprove={onApprove}
            onReject={onReject}
            onDelete={onDelete}
            onRestore={onRestore}
            getStatusBackgroundColor={getStatusBackgroundColor}
          />
        );
      })}

      {displayApplications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground px-2 md:px-0">
          No {adminStatusFilter === 'deleted' ? 'deleted' : 'new'} applications
        </div>
      )}
    </div>
  );
}

// Separate component with history hook
const ApplicationCardWithHistory = ({
  participant,
  appData,
  firstName,
  lastName,
  photo1,
  photo2,
  submittedDate,
  expandedId,
  setExpandedId,
  expandedHistory,
  toggleHistoryExpand,
  onViewPhotos,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onRestore,
  getStatusBackgroundColor,
}: any) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { history, loading } = useApplicationHistory(participant.id);
  
  // All history records should be shown (they have different IDs from the participant)
  const historyCount = history.length;

  return (
    <div className="space-y-0">
      <Card className={`overflow-hidden relative rounded-none md:rounded-lg h-[149px] ${participant.admin_status === 'rejected' ? 'bg-red-50 border-red-200' : ''} ${participant.deleted_at ? 'opacity-60' : ''}`}>
        <CardContent className="p-0">
          {/* Date/Time badge - left top corner */}
          {submittedDate && (
            <Badge 
              variant="outline" 
              className="absolute top-0 left-0 z-20 text-xs rounded-none rounded-br-md font-normal bg-muted/90 border-border"
            >
              {submittedDate.toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short' 
              })} {submittedDate.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </Badge>
          )}

          {/* History badge - right of edit button */}
          {historyCount > 0 && (
            <div
              className="absolute bottom-0 left-8 z-20 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-primary/90 shadow-lg transition-all border-2 border-background"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              title={`${historyCount} version${historyCount > 1 ? 's' : ''} - click to expand versions`}
            >
              {historyCount}
            </div>
          )}

          {/* Three dots menu - top right corner */}
          <div className="absolute top-0 right-0 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-none rounded-bl-md hover:bg-background/90 bg-background/80"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[9999]">
                <DropdownMenuItem
                  onClick={() => setShowStatusHistoryModal(true)}
                >
                  <History className="h-3.5 w-3.5 mr-2" />
                  History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (participant.deleted_at) {
                      onRestore(participant);
                    } else {
                      setShowDeleteConfirm(true);
                    }
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  {participant.deleted_at ? 'Restore' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Edit button in bottom left corner */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(participant)}
            className="absolute bottom-0 left-0 z-20 p-1 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background"
            title="Edit Application"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          {/* Desktop/Tablet layout - same style as mobile */}
          <div className="hidden md:flex h-[149px]">
            {/* Photos section - Fixed width */}
            <div className="flex gap-px w-[200px] flex-shrink-0 h-[149px]">
              {photo1 && (
                <div className="w-[100px] h-[149px] flex-shrink-0 relative overflow-hidden">
                  <img 
                    src={photo1} 
                    alt="Portrait" 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, `${firstName} ${lastName}`)}
                  />
                  {['this week', 'next week', 'pre next week'].includes(participant.admin_status || '') && (
                    <Badge variant="outline" className="absolute bottom-1 left-1 text-[10px] px-1 py-0 h-4 bg-green-500/90 text-white border-green-600 shadow-sm">
                      on site
                    </Badge>
                  )}
                </div>
              )}
              {photo2 && (
                <div className="w-[100px] h-[149px] flex-shrink-0 relative overflow-hidden">
                  <img 
                    src={photo2} 
                    alt="Full length" 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, `${firstName} ${lastName}`)}
                  />
                </div>
              )}
              {!photo2 && (
                <div className="w-[100px] h-[149px] flex-shrink-0 bg-muted flex items-center justify-center border border-border overflow-hidden">
                  <div className="text-center text-muted-foreground">
                    <p className="text-xs font-medium">No Photo 2</p>
                  </div>
                </div>
              )}
            </div>

            {/* Info section - same as mobile */}
            <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-semibold">
                    {appData.birth_year ? `${new Date().getFullYear() - parseInt(appData.birth_year)}, ` : ''}{firstName} {lastName}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground mb-1">
                  {appData.city}, {appData.country}
                </div>

                {/* Email with copy icon */}
                {appData.email && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-muted-foreground truncate" title={appData.email}>
                      {appData.email.substring(0, 10)}...
                    </span>
                    <Copy 
                      className="h-3 w-3 flex-shrink-0 cursor-pointer text-muted-foreground hover:text-foreground" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(appData.email || '');
                      }}
                    />
                  </div>
                )}

                {/* Facebook link */}
                {(appData.facebook_url || appData.cached_facebook_url) && (
                  <div className="mb-1">
                    <a 
                      href={appData.facebook_url || appData.cached_facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Facebook
                    </a>
                  </div>
                )}

                {/* Phone */}
                {(appData.phone?.number || appData.cached_phone?.number) && (
                  <div className="text-xs text-muted-foreground mb-1">
                    {appData.phone?.number ? (
                      <>
                        {appData.phone.country_code && `+${Country.getCountryByCode(appData.phone.country_code)?.phonecode || ''} `}
                        {appData.phone.number}
                      </>
                    ) : (
                      <>
                        {appData.cached_phone.country_code && `+${Country.getCountryByCode(appData.cached_phone.country_code)?.phonecode || ''} `}
                        {appData.cached_phone.number}
                      </>
                    )}
                  </div>
                )}
                
                {/* Expandable application data */}
                <div 
                  className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                  onClick={() => setExpandedId(expandedId === participant.id ? null : participant.id)}
                  title="Click to view full application data"
                >
                  <span>More info</span>
                  {expandedId === participant.id ? (
                    <ChevronUp className="h-2.5 w-2.5" />
                  ) : (
                    <ChevronDown className="h-2.5 w-2.5" />
                  )}
                </div>

                {expandedId === participant.id && (
                  <div className="text-xs text-muted-foreground mt-1 max-h-32 md:max-h-40 overflow-y-auto overflow-x-hidden space-y-1 pr-1">
                    <div>
                      {Object.entries(appData).map(([key, value], index) => {
                        if (key.includes('url') || key.includes('photo') || key === 'phone' || key === 'email' || !value) return null;
                        return (
                          <span key={key}>
                            {String(value)}
                            {index < Object.entries(appData).filter(([k, v]) => !k.includes('url') && !k.includes('photo') && k !== 'phone' && k !== 'email' && v).length - 1 ? ', ' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Select 
                  value={participant.admin_status || 'pending'}
                  onValueChange={(value) => {
                    if (value === 'rejected' && participant.admin_status !== 'rejected') {
                      onReject(participant);
                    } else {
                      onApprove(participant);
                    }
                  }}
                >
                  <SelectTrigger className={`w-[110px] h-6 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pending')}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-popover border shadow-lg">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pre next week">Pre Next Week</SelectItem>
                    <SelectItem value="this week">This Week</SelectItem>
                    <SelectItem value="next week">Next Week</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
                {participant.status_history && (() => {
                  const history = participant.status_history as any;
                  const latestStatus = Object.keys(history)
                    .filter(k => k !== 'changed_at' && k !== 'changed_by' && k !== 'change_reason')
                    .sort((a, b) => {
                      const dateA = history[a]?.changed_at || history[a]?.timestamp || '';
                      const dateB = history[b]?.changed_at || history[b]?.timestamp || '';
                      return dateB.localeCompare(dateA);
                    })[0];
                  const changedByEmail = history[latestStatus]?.changed_by_email;
                  return changedByEmail && changedByEmail !== 'user' ? (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {changedByEmail.substring(0, 4)}
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden">
            <div className="flex w-full">
              {/* Photos section - Fixed width */}
              <div className="flex gap-px w-[200px] flex-shrink-0 h-[149px]">
                {photo1 && (
                  <div className="w-[100px] h-[149px] flex-shrink-0">
                    <img 
                      src={photo1} 
                      alt="Portrait" 
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, `${firstName} ${lastName}`)}
                    />
                  </div>
                )}
                {photo2 && (
                  <div className="w-[100px] h-[149px] flex-shrink-0">
                    <img 
                      src={photo2} 
                      alt="Full length" 
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, `${firstName} ${lastName}`)}
                    />
                  </div>
                )}
              </div>

              {/* Info section */}
              <div className="flex-1 p-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs font-semibold">
                      {appData.birth_year ? `${new Date().getFullYear() - parseInt(appData.birth_year)}, ` : ''}{firstName} {lastName}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {appData.city}, {appData.country}
                  </div>

                  {/* Email with copy icon */}
                  {appData.email && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground truncate" title={appData.email}>
                        {appData.email.substring(0, 10)}...
                      </span>
                      <Copy 
                        className="h-3 w-3 flex-shrink-0 cursor-pointer text-muted-foreground hover:text-foreground" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(appData.email || '');
                        }}
                      />
                    </div>
                  )}

                  {/* Facebook link */}
                  {(appData.facebook_url || appData.cached_facebook_url) && (
                    <div>
                      <a 
                        href={appData.facebook_url || appData.cached_facebook_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Facebook
                      </a>
                    </div>
                  )}

                  {/* Phone */}
                  {(appData.phone?.number || appData.cached_phone?.number) && (
                    <div className="text-xs text-muted-foreground">
                      {appData.phone?.number ? (
                        <>
                          {appData.phone.country_code && `+${Country.getCountryByCode(appData.phone.country_code)?.phonecode || ''} `}
                          {appData.phone.number}
                        </>
                      ) : (
                        <>
                          {appData.cached_phone.country_code && `+${Country.getCountryByCode(appData.cached_phone.country_code)?.phonecode || ''} `}
                          {appData.cached_phone.number}
                        </>
                      )}
                    </div>
                  )}
                  
                  {expandedId === participant.id && (
                    <div className="text-xs text-muted-foreground mt-1 max-h-32 md:max-h-40 overflow-y-auto overflow-x-hidden space-y-1 pr-1">
                      <div>
                        {Object.entries(appData).map(([key, value], index) => {
                          if (key.includes('url') || key.includes('photo') || key === 'phone' || key === 'email' || !value) return null;
                          return (
                            <span key={key}>
                              {String(value)}
                              {index < Object.entries(appData).filter(([k, v]) => !k.includes('url') && !k.includes('photo') && k !== 'phone' && k !== 'email' && v).length - 1 ? ', ' : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-1">
                  <Select 
                    value={participant.admin_status || 'pending'}
                    onValueChange={(value) => {
                      if (value === 'rejected' && participant.admin_status !== 'rejected') {
                        onReject(participant);
                      } else {
                        onApprove(participant);
                      }
                    }}
                  >
                    <SelectTrigger className={`w-[100px] text-[10px] h-5 ${getStatusBackgroundColor(participant.admin_status || 'pending')}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pre next week">Pre Next Week</SelectItem>
                      <SelectItem value="this week">This Week</SelectItem>
                      <SelectItem value="next week">Next Week</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                  {participant.status_history && (() => {
                    const history = participant.status_history as any;
                    const latestStatus = Object.keys(history)
                      .filter(k => k !== 'changed_at' && k !== 'changed_by' && k !== 'change_reason')
                      .sort((a, b) => {
                        const dateA = history[a]?.changed_at || history[a]?.timestamp || '';
                        const dateB = history[b]?.changed_at || history[b]?.timestamp || '';
                        return dateB.localeCompare(dateA);
                      })[0];
                    const changedByEmail = history[latestStatus]?.changed_by_email;
                    return changedByEmail && changedByEmail !== 'user' ? (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        {changedByEmail.substring(0, 4)}
                      </span>
                    ) : null;
                  })()}
                  
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Rejection reasons banner - displayed below card with no gap */}
      {participant.admin_status === 'rejected' && (() => {
        const [isExpanded, setIsExpanded] = useState(false);
        const hasReasons = (participant as any).rejection_reason_types && (participant as any).rejection_reason_types.length > 0;
        const hasNote = (participant as any).rejection_reason && (participant as any).rejection_reason.trim();
        
        if (!hasReasons && !hasNote) {
          return (
            <div className="bg-red-200 border-x border-b border-red-300 rounded-none md:rounded-b-lg p-3 text-xs">
              <div className="text-red-800 italic">
                No rejection reason provided. Please update the rejection reason.
              </div>
            </div>
          );
        }
        
        const reasons = hasReasons ? ((participant as any).rejection_reason_types as string[]) : [];
        const firstReason = reasons.length > 0 ? REJECTION_REASONS[reasons[0] as keyof typeof REJECTION_REASONS] || reasons[0] : '';
        const hasMore = reasons.length > 1 || hasNote;
        
        return (
          <div className="bg-red-200 border-x border-b border-red-300 rounded-none md:rounded-b-lg p-3 text-xs">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="text-red-700">
                • {firstReason}
              </div>
              {hasMore && (
                <ChevronDown className={`h-3 w-3 text-red-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </div>
            
            {isExpanded && hasMore && (
              <div className="mt-2 pt-2 border-t border-red-300">
                {reasons.slice(1).map((reasonType: string, idx: number) => (
                  <div key={idx} className="text-red-700 mt-1">
                    • {REJECTION_REASONS[reasonType as keyof typeof REJECTION_REASONS] || reasonType}
                  </div>
                ))}
                {hasNote && (
                  <div className={`text-red-700 ${reasons.length > 1 ? 'mt-2 pt-2 border-t border-red-300' : ''}`}>
                    • {(participant as any).rejection_reason}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* History versions - shown when expanded */}
      {isHistoryExpanded && history.length > 0 && (
        <div className="mt-2 space-y-2">
          {history.map((historyItem, idx) => (
            <Card key={historyItem.id} className="overflow-hidden bg-muted/30 relative rounded-lg h-[149px]">
              <CardContent className="p-0">
                {/* Version badge and date/time */}
                <Badge 
                  variant="outline" 
                  className="absolute top-0 left-0 z-20 text-xs rounded-none rounded-br-md font-normal bg-muted/90 border-border"
                >
                  {new Date(historyItem.created_at).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short' 
                  })} {new Date(historyItem.created_at).toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className="absolute top-1 right-1 z-20 text-[10px] px-1.5 py-0 h-4 shadow-sm"
                >
                  v{history.length - idx}
                </Badge>

                {/* Desktop/Tablet layout - same style as mobile */}
                <div className="hidden md:flex h-[149px]">
                  {/* Photos section - Fixed width */}
                  <div className="flex gap-px w-[200px] flex-shrink-0 h-[149px]">
                    {historyItem.application_data?.photo1_url && (
                      <div className="w-[100px] h-[149px] flex-shrink-0 relative overflow-hidden">
                        <img 
                          src={historyItem.application_data.photo1_url} 
                          alt="Portrait" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => onViewPhotos([historyItem.application_data?.photo1_url, historyItem.application_data?.photo2_url].filter(Boolean), 0, `${historyItem.application_data?.first_name} ${historyItem.application_data?.last_name}`)}
                        />
                      </div>
                    )}
                    {historyItem.application_data?.photo2_url && (
                      <div className="w-[100px] h-[149px] flex-shrink-0 relative overflow-hidden">
                        <img 
                          src={historyItem.application_data.photo2_url} 
                          alt="Full length" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => onViewPhotos([historyItem.application_data?.photo1_url, historyItem.application_data?.photo2_url].filter(Boolean), 1, `${historyItem.application_data?.first_name} ${historyItem.application_data?.last_name}`)}
                        />
                      </div>
                    )}
                    {!historyItem.application_data?.photo2_url && (
                      <div className="w-[100px] h-[149px] flex-shrink-0 bg-muted flex items-center justify-center border border-border overflow-hidden">
                        <div className="text-center text-muted-foreground">
                          <p className="text-xs font-medium">No Photo 2</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info section - same as mobile */}
                  <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Avatar className="h-5 w-5 flex-shrink-0">
                          <AvatarImage src={historyItem.application_data?.photo1_url || ''} />
                          <AvatarFallback className="text-[10px]">
                            {historyItem.application_data?.first_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold">
                          {historyItem.application_data?.first_name} {historyItem.application_data?.last_name} {historyItem.application_data?.birth_year ? new Date().getFullYear() - parseInt(historyItem.application_data.birth_year) : ''}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1">
                        {historyItem.application_data?.city}, {historyItem.application_data?.country}
                      </div>

                      {historyItem.application_data?.email && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="cursor-pointer truncate" title={historyItem.application_data.email}>
                            {historyItem.application_data.email.substring(0, 20)}...
                          </span>
                          <Copy 
                            className="h-2.5 w-2.5 flex-shrink-0 cursor-pointer hover:text-foreground" 
                            onClick={() => navigator.clipboard.writeText(historyItem.application_data?.email || '')}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={historyItem.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs h-6">
                        {historyItem.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="flex w-full h-[149px]">
                    {/* Photos section - Fixed width */}
                    <div className="flex gap-px w-[200px] flex-shrink-0 h-[149px]">
                      {historyItem.application_data?.photo1_url && (
                        <div className="w-[100px] h-[149px] flex-shrink-0 overflow-hidden">
                          <img 
                            src={historyItem.application_data.photo1_url} 
                            alt="Portrait" 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => onViewPhotos([historyItem.application_data?.photo1_url, historyItem.application_data?.photo2_url].filter(Boolean), 0, `${historyItem.application_data?.first_name} ${historyItem.application_data?.last_name}`)}
                          />
                        </div>
                      )}
                      {historyItem.application_data?.photo2_url && (
                        <div className="w-[100px] h-[149px] flex-shrink-0 overflow-hidden">
                          <img 
                            src={historyItem.application_data.photo2_url} 
                            alt="Full length" 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => onViewPhotos([historyItem.application_data?.photo1_url, historyItem.application_data?.photo2_url].filter(Boolean), 1, `${historyItem.application_data?.first_name} ${historyItem.application_data?.last_name}`)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Info section */}
                    <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <Avatar className="h-5 w-5 flex-shrink-0">
                            <AvatarImage src={historyItem.application_data?.photo1_url || ''} />
                            <AvatarFallback className="text-[10px]">
                              {historyItem.application_data?.first_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold">
                            {historyItem.application_data?.first_name} {historyItem.application_data?.last_name}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-muted-foreground">
                          {historyItem.application_data?.city}, {historyItem.application_data?.country}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={historyItem.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs h-6">
                          {historyItem.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Status History Modal */}
      <ParticipantStatusHistoryModal
        isOpen={showStatusHistoryModal}
        onClose={() => setShowStatusHistoryModal(false)}
        participantName={`${firstName} ${lastName}`}
        participantId={participant.id}
        statusHistory={participant.status_history}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the application for {firstName} {lastName}? This action can be undone by restoring the application later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(participant);
                setShowDeleteConfirm(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
