import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Edit, Check, Minus, X, Trash2, RotateCcw, Copy } from 'lucide-react';

interface Application {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  application_data: any;
  rejection_reason?: string;
}

interface ProfileData {
  id: string;
  email?: string;
  avatar_url?: string;
}

interface ExpandableApplicationHistoryProps {
  applications: Application[];
  currentApplicationId: string;
  userId: string;
  isExpanded: boolean;
  showDeletedApplications: boolean;
  profiles: ProfileData[];
  onEdit: (application: Application) => void;
  onReview: (id: string, status: string) => void;
  onReject: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  getApplicationStatusBadge: (status: string) => React.ReactNode;
}

export const ExpandableApplicationHistory: React.FC<ExpandableApplicationHistoryProps> = ({
  applications,
  currentApplicationId,
  userId,
  isExpanded,
  showDeletedApplications,
  profiles,
  onEdit,
  onReview,
  onReject,
  onDelete,
  onRestore,
  getApplicationStatusBadge,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  if (!isExpanded) return null;

  const previousApplications = applications
    .filter(app => app.user_id === userId && app.id !== currentApplicationId)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  if (previousApplications.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {previousApplications.map((app) => {
        const appData = typeof app.application_data === 'string' 
          ? JSON.parse(app.application_data) 
          : app.application_data;
        const submittedDate = new Date(app.submitted_at);
        const userProfile = profiles.find(p => p.id === app.user_id);

        return (
          <Card key={app.id} className="overflow-hidden bg-muted/30 relative rounded-lg">
            {/* Edit button in bottom left corner */}
            {!showDeletedApplications && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(app)}
                className="absolute bottom-0 left-0 z-20 p-1 m-0 rounded-none rounded-tr-md border-0 border-t border-r bg-background/90 hover:bg-background"
                title="Edit Application"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            
            <CardContent className="p-0">
              {/* Desktop and Mobile layout combined */}
              <div className="flex">
                {/* Photos section */}
                <div className="w-[25ch] md:w-[25ch] flex-shrink-0 p-0">
                  <div className="flex gap-px">
                    {appData.photo1_url && (
                      <div className="w-full">
                        <img 
                          src={appData.photo1_url} 
                          alt="Portrait" 
                          className="w-full h-36 object-contain"
                        />
                      </div>
                    )}
                    {appData.photo2_url && (
                      <div className="w-full relative">
                        <img 
                          src={appData.photo2_url} 
                          alt="Full length" 
                          className="w-full h-36 object-cover"
                        />
                        {/* User avatar positioned in top right corner for mobile */}
                        <div className="absolute top-2 right-2 md:hidden">
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
                </div>

                {/* Information section */}
                <div className="flex-1 p-4 pl-2 md:pl-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Desktop avatar */}
                    <Avatar className="h-6 w-6 flex-shrink-0 hidden md:block">
                      <AvatarImage src={userProfile?.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {appData.first_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {new Date().getFullYear() - appData.birth_year} {appData.first_name} {appData.last_name}
                    </span>
                  </div>
                  
                  <div 
                    className="text-xs text-muted-foreground mb-1 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => {
                      const newExpanded = new Set(expandedItems);
                      if (expandedItems.has(app.id)) {
                        newExpanded.delete(app.id);
                      } else {
                        newExpanded.add(app.id);
                      }
                      setExpandedItems(newExpanded);
                    }}
                  >
                    {appData.city} {appData.state} {appData.country}
                  </div>
                  
                  {/* Expanded information */}
                  {expandedItems.has(app.id) && (
                    <div className="text-xs text-muted-foreground mb-1 space-y-0.5">
                      <div>{appData.weight_kg}kg, {appData.height_cm}cm</div>
                      <div>{appData.marital_status}, {appData.has_children ? 'Has kids' : 'No kids'}</div>
                      <div className="flex items-center gap-1">
                        <span>
                          {userProfile?.email 
                            ? (userProfile.email.length > 7 ? `${userProfile.email.substring(0, 7)}...` : userProfile.email)
                            : 'No email'
                          }
                        </span>
                        {userProfile?.email && (
                          <Copy 
                            className="h-3 w-3 cursor-pointer hover:text-foreground" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(userProfile.email);
                            }}
                          />
                        )}
                      </div>
                      <div>
                        {(() => {
                          const phone = appData.phone?.country && appData.phone?.number 
                            ? `${appData.phone.country} ${appData.phone.number}` 
                            : 'No phone';
                          const facebook = appData.facebook_url ? (
                            <a
                              href={appData.facebook_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              fb
                            </a>
                          ) : 'no fb';
                          return (
                            <span>
                              {phone} {facebook}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1"></div>
                  
                  {/* Date and status */}
                  <div className="text-xs text-muted-foreground mb-2">
                    {submittedDate.toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })} {submittedDate.toLocaleTimeString('en-GB', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  
                  {/* Status and action buttons */}
                  <div className="flex justify-between items-center">
                    {getApplicationStatusBadge(app.status)}
                    
                    <div className="flex gap-1">
                      {!showDeletedApplications && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (app.status === 'approved') {
                                onReview(app.id, 'pending')
                              } else {
                                onReview(app.id, 'approved')
                              }
                            }}
                            className={
                              app.status === 'approved'
                                ? "bg-yellow-600 hover:bg-yellow-700 text-xs px-2 py-1 h-7"
                                : "bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-7"
                            }
                          >
                            {app.status === 'approved' ? (
                              <Minus className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onReject(app.id, `${appData.first_name} ${appData.last_name}`)}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete(app.id)}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {showDeletedApplications && (
                        <Button
                          size="sm"
                          onClick={() => onRestore(app.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 h-7"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};