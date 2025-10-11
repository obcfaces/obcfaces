import React, { useState } from 'react';
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
import { LoadingSpinner } from '@/components/admin/LoadingSpinner';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';
import { Country } from 'country-state-city';
import { ParticipantStatusHistoryModal } from '@/components/admin/ParticipantStatusHistoryModal';

interface AdminNewApplicationsTabProps {
  applications: ContestApplication[];
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  
  if (loading) {
    return <LoadingSpinner message="Loading applications..." />;
  }

  const displayApplications = showDeleted ? deletedApplications : applications;

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'pre next week':
        return 'bg-purple-100 dark:bg-purple-900';
      case 'next week':
        return 'bg-[hsl(var(--status-next-week))]';
      case 'next week on site':
        return 'bg-[hsl(var(--status-next-week-on-site))]';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">New Applications</h2>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-deleted-apps"
            checked={showDeleted}
            onCheckedChange={onToggleDeleted}
          />
          <label htmlFor="show-deleted-apps" className="text-sm cursor-pointer">
            Show Deleted ({deletedApplications.length})
          </label>
        </div>
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
        <div className="text-center py-12 text-muted-foreground">
          No {showDeleted ? 'deleted' : 'new'} applications
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
      <Card className={`overflow-hidden relative mx-0 rounded-lg h-[149px] ${participant.admin_status === 'rejected' ? 'bg-red-50 border-red-200' : ''} ${participant.deleted_at ? 'opacity-60' : ''}`}>
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
                  {['this week', 'next week', 'next week on site', 'pre next week'].includes(participant.admin_status || '') && (
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
                  <Avatar className="h-5 w-5 flex-shrink-0">
                    <AvatarImage src={photo1 || ''} />
                    <AvatarFallback className="text-[10px]">
                      {firstName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold">
                    {firstName} {lastName} {appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : ''}
                  </span>
                </div>
                <div 
                  className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1 mb-1"
                  onClick={() => setExpandedId(expandedId === participant.id ? null : participant.id)}
                  title="Click to view full application data"
                >
                  <span>{appData.city}, {appData.country}</span>
                  {expandedId === participant.id ? (
                    <ChevronUp className="h-2.5 w-2.5" />
                  ) : (
                    <ChevronDown className="h-2.5 w-2.5" />
                  )}
                </div>
                
                {/* Expandable application data */}
                {expandedId === participant.id && (
                  <div className="text-xs text-muted-foreground mt-1 max-h-32 md:max-h-40 overflow-y-auto overflow-x-hidden space-y-1 pr-1">
                    <div>
                      {Object.entries(appData).map(([key, value], index) => {
                        if (key.includes('url') || key.includes('photo') || key === 'phone' || !value) return null;
                        return (
                          <span key={key}>
                            {String(value)}
                            {index < Object.entries(appData).filter(([k, v]) => !k.includes('url') && !k.includes('photo') && k !== 'phone' && v).length - 1 ? ', ' : ''}
                          </span>
                        );
                      })}
                    </div>
                    
                    {/* Facebook Link */}
                    <div className="pt-1">
                      {appData.facebook_url ? (
                        <a 
                          href={appData.facebook_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                        >
                          {appData.facebook_url}
                        </a>
                      ) : appData.cached_facebook_url ? (
                        <a 
                          href={appData.cached_facebook_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 underline break-all"
                        >
                          save {appData.cached_facebook_url}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/60">no fb</span>
                      )}
                    </div>
                    
                    {/* Phone */}
                    <div>
                      {appData.phone?.number ? (
                        <span>
                          {appData.phone.country_code && `+${Country.getCountryByCode(appData.phone.country_code)?.phonecode || ''} `}
                          {appData.phone.number}
                        </span>
                      ) : appData.cached_phone?.number ? (
                        <span className="text-orange-600 dark:text-orange-400">
                          save {appData.cached_phone.country_code && `+${Country.getCountryByCode(appData.cached_phone.country_code)?.phonecode || ''} `}
                          {appData.cached_phone.number}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">no tel</span>
                      )}
                    </div>
                  </div>
                )}

                {appData.email && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="cursor-pointer truncate" title={appData.email}>
                      {appData.email.substring(0, 20)}...
                    </span>
                    <Copy 
                      className="h-2.5 w-2.5 flex-shrink-0 cursor-pointer hover:text-foreground" 
                      onClick={() => navigator.clipboard.writeText(appData.email || '')}
                    />
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
                    <SelectItem value="next week on site">Next Week On Site</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
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
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={photo1 || ''} />
                      <AvatarFallback className="text-[10px]">
                        {firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold">
                      {firstName} {lastName}
                    </span>
                  </div>
                  <div 
                    className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => setExpandedId(expandedId === participant.id ? null : participant.id)}
                    title="Click to view full application data"
                  >
                    <span>{appData.city}, {appData.country}</span>
                    {expandedId === participant.id ? (
                      <ChevronUp className="h-2.5 w-2.5" />
                    ) : (
                      <ChevronDown className="h-2.5 w-2.5" />
                    )}
                  </div>
                  
                  {/* Expandable application data */}
                  {expandedId === participant.id && (
                    <div className="text-xs text-muted-foreground mt-1 max-h-32 md:max-h-40 overflow-y-auto overflow-x-hidden space-y-1 pr-1">
                      <div>
                        {Object.entries(appData).map(([key, value], index) => {
                          if (key.includes('url') || key.includes('photo') || key === 'phone' || !value) return null;
                          return (
                            <span key={key}>
                              {String(value)}
                              {index < Object.entries(appData).filter(([k, v]) => !k.includes('url') && !k.includes('photo') && k !== 'phone' && v).length - 1 ? ', ' : ''}
                            </span>
                          );
                        })}
                      </div>
                      
                      {/* Facebook Link */}
                      <div className="pt-1">
                        {appData.facebook_url ? (
                          <a 
                            href={appData.facebook_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                          >
                            {appData.facebook_url}
                          </a>
                        ) : appData.cached_facebook_url ? (
                          <a 
                            href={appData.cached_facebook_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 underline break-all"
                          >
                            save {appData.cached_facebook_url}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/60">no fb</span>
                        )}
                      </div>
                      
                      {/* Phone */}
                      <div>
                        {appData.phone?.number ? (
                          <span>
                            {appData.phone.country_code && `+${Country.getCountryByCode(appData.phone.country_code)?.phonecode || ''} `}
                            {appData.phone.number}
                          </span>
                        ) : appData.cached_phone?.number ? (
                          <span className="text-orange-600 dark:text-orange-400">
                            save {appData.cached_phone.country_code && `+${Country.getCountryByCode(appData.cached_phone.country_code)?.phonecode || ''} `}
                            {appData.cached_phone.number}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">no tel</span>
                        )}
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
                      <SelectItem value="next week on site">Next Week On Site</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                  
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Rejection reasons banner - displayed below card with no gap */}
      {participant.admin_status === 'rejected' && (
        <div className="bg-red-200 border-x border-b border-red-300 rounded-b-lg p-3 text-xs">
          {(() => {
            const hasReasons = (participant as any).rejection_reason_types && (participant as any).rejection_reason_types.length > 0;
            const hasNote = (participant as any).rejection_reason && (participant as any).rejection_reason.trim();
            
            if (!hasReasons && !hasNote) {
              return (
                <div className="text-red-800 italic">
                  No rejection reason provided. Please update the rejection reason.
                </div>
              );
            }
            
            return (
              <>
                {hasReasons && (
                  <div className="space-y-1 text-red-700">
                    {((participant as any).rejection_reason_types as string[]).map((reasonType: string, idx: number) => (
                      <div key={idx}>• {REJECTION_REASONS[reasonType as keyof typeof REJECTION_REASONS] || reasonType}</div>
                    ))}
                  </div>
                )}
                {hasNote && (
                  <div className={`text-red-700 ${hasReasons ? 'mt-2 pt-2 border-t border-red-300' : ''}`}>
                    {(participant as any).rejection_reason}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

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
