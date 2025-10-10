import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ContestApplication, ParticipantStatus } from '@/types/admin';
import { REJECTION_REASONS } from '@/components/reject-reason-modal';
import { LoadingSpinner } from '@/components/admin/LoadingSpinner';

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
        const photo1 = appData.photo_1_url || appData.photo1_url || '';
        const photo2 = appData.photo_2_url || appData.photo2_url || '';

        return (
          <div key={participant.id} className="space-y-0">
            <Card className={`overflow-hidden relative mx-0 rounded-lg h-[149px] ${participant.admin_status === 'rejected' ? 'bg-red-50 border-red-200' : ''} ${participant.deleted_at ? 'opacity-60' : ''}`}>
              <CardContent className="p-0">
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
                
                {/* Desktop layout */}
                <div className="hidden md:flex md:overflow-visible">
                  {/* Column 1: Photos (25ch) */}
                  <div className="w-[25ch] flex-shrink-0 p-0">
                    <div className="flex gap-px">
                      {photo1 && (
                        <div className="w-full relative">
                          <img 
                            src={photo1}
                            alt="Portrait"
                            className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, `${firstName} ${lastName}`)}
                          />
                          {['this week', 'next week', 'next week on site', 'pre next week'].includes(participant.admin_status || '') && (
                            <Badge variant="outline" className="absolute top-1 left-1 text-[10px] px-1 py-0 h-4 bg-green-500/90 text-white border-green-600 shadow-sm">
                              on site
                            </Badge>
                          )}
                        </div>
                      )}
                      {photo2 && (
                        <div className="w-full">
                          <img 
                            src={photo2} 
                            alt="Full length"
                            className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 1, `${firstName} ${lastName}`)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Information (25ch) */}
                  <div className="w-[25ch] flex-shrink-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={photo1 || ''} />
                        <AvatarFallback className="text-xs">
                          {firstName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold whitespace-nowrap flex items-center gap-1">
                        {firstName} {lastName} {appData.birth_year ? new Date().getFullYear() - parseInt(appData.birth_year) : ''}
                      </span>
                    </div>
                    
                    <div 
                      className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                      onClick={() => setExpandedId(expandedId === participant.id ? null : participant.id)}
                      title="Click to view full application data"
                    >
                      <span>{appData.city} {appData.state} {appData.country}</span>
                      {expandedId === participant.id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                    
                    {/* Expandable application data */}
                    {expandedId === participant.id && (
                      <div className="text-sm text-muted-foreground mb-2 max-h-32 overflow-y-auto">
                        {Object.entries(appData).map(([key, value], index) => {
                          if (key.includes('url') || key.includes('photo') || !value) return null;
                          return (
                            <span key={key}>
                              {String(value)}
                              {index < Object.entries(appData).filter(([k, v]) => !k.includes('url') && !k.includes('photo') && v).length - 1 ? ', ' : ''}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mb-1">
                      {appData.email && (
                        <div className="flex items-center gap-1">
                          <span 
                            className="cursor-pointer" 
                            title={appData.email}
                          >
                            {appData.email.substring(0, 15)}...
                          </span>
                          <Copy 
                            className="h-3 w-3 cursor-pointer hover:text-foreground" 
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
                        <SelectTrigger className={`w-28 h-6 text-xs ${getStatusBackgroundColor(participant.admin_status || 'pending')}`}>
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
                      
                      {/* Edit rejection reason button - only show for rejected items */}
                      {participant.admin_status === 'rejected' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onReject(participant)}
                          title="Edit rejection reason"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {`${((participant as any).average_rating || 0).toFixed(1)} (${(participant as any).total_votes || 0})`}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => participant.deleted_at ? onRestore(participant) : onDelete(participant)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="flex w-full">
                    {/* Photos section */}
                    <div className="flex gap-px w-[50vw] flex-shrink-0">
                      {photo1 && (
                        <div className="w-1/2">
                          <img 
                            src={photo1} 
                            alt="Portrait" 
                            className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => onViewPhotos([photo1, photo2].filter(Boolean), 0, `${firstName} ${lastName}`)}
                          />
                        </div>
                      )}
                      {photo2 && (
                        <div className="w-1/2">
                          <img 
                            src={photo2} 
                            alt="Full length" 
                            className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
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
                          <div className="text-xs text-muted-foreground mt-1 max-h-24 overflow-y-auto">
                            {Object.entries(appData).map(([key, value], index) => {
                              if (key.includes('url') || key.includes('photo') || !value) return null;
                              return (
                                <span key={key}>
                                  {String(value)}
                                  {index < Object.entries(appData).filter(([k, v]) => !k.includes('url') && !k.includes('photo') && v).length - 1 ? ', ' : ''}
                                </span>
                              );
                            })}
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
                          <SelectTrigger className={`text-[10px] h-5 ${getStatusBackgroundColor(participant.admin_status || 'pending')}`}>
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
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={() => participant.deleted_at ? onRestore(participant) : onDelete(participant)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
          </div>
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
