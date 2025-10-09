import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileData } from '@/types/admin';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface AdminRegistrationsTabProps {
  profiles: ProfileData[];
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onApprove: (profile: ProfileData) => void;
  onReject: (profile: ProfileData) => void;
  userRoleMap: Record<string, string>;
  userRoles: any[];
  userVotingStats: Record<string, any>;
  expandedMaybeFingerprints: Set<string>;
  setExpandedMaybeFingerprints: (value: Set<string>) => void;
  verifyingUsers: Set<string>;
  handleEmailVerification: (userId: string) => void;
  handleRoleChange: (userId: string, userName: string, role: string) => void;
  expandedUserActivity: Set<string>;
  setExpandedUserActivity: (value: Set<string>) => void;
  userActivityData: Record<string, any>;
  isEmailDomainWhitelisted: (email: string) => boolean;
}

export function AdminRegistrationsTab({
  profiles,
  statusFilter,
  onStatusFilterChange,
  onApprove,
  onReject,
  userRoleMap,
  userRoles,
  userVotingStats,
  expandedMaybeFingerprints,
  setExpandedMaybeFingerprints,
  verifyingUsers,
  handleEmailVerification,
  handleRoleChange,
  expandedUserActivity,
  setExpandedUserActivity,
  userActivityData,
  isEmailDomainWhitelisted,
}: AdminRegistrationsTabProps) {
  const [expandedFingerprint, setExpandedFingerprint] = useState<string | null>(null);

  const filteredProfiles = profiles.filter(profile => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return profile.is_approved === null;
    if (statusFilter === 'approved') return profile.is_approved === true;
    if (statusFilter === 'rejected') return profile.is_approved === false;
    return true;
  });

  // Calculate fingerprint counts
  const fingerprintCounts = useMemo(() => {
    const counts = new Map<string, number>();
    profiles.forEach(profile => {
      if (profile.fingerprint_id) {
        counts.set(profile.fingerprint_id, (counts.get(profile.fingerprint_id) || 0) + 1);
      }
    });
    return counts;
  }, [profiles]);

  // Get profiles with same fingerprint
  const getProfilesWithFingerprint = (fingerprintId: string) => {
    return profiles.filter(p => p.fingerprint_id === fingerprintId);
  };

  const toggleFingerprintExpand = (fingerprintId: string, profileId: string) => {
    if (expandedFingerprint === `${fingerprintId}-${profileId}`) {
      setExpandedFingerprint(null);
    } else {
      setExpandedFingerprint(`${fingerprintId}-${profileId}`);
    }
  };

  return (
    <div className="space-y-4">
      {filteredProfiles.map(profile => {
        const lastActivity = userActivityData[profile.id]?.lastActivity;
        const now = new Date();
        const activityDate = lastActivity ? new Date(lastActivity) : null;
        const daysDiff = activityDate ? Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        let activityColor = 'bg-red-100 text-red-700';
        if (daysDiff !== null) {
          if (daysDiff < 2) activityColor = 'bg-green-100 text-green-700';
          else if (daysDiff < 7) activityColor = 'bg-yellow-100 text-yellow-700';
        }

        const fullName = profile.display_name || 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
          'Unknown';

        return (
          <React.Fragment key={profile.id}>
            <Card className="p-3 relative overflow-hidden">
              {/* Registration date badge */}
              <Badge 
                variant="outline" 
                className="absolute top-0 left-0 text-xs bg-background/50 backdrop-blur-sm font-normal rounded-none rounded-br-md"
              >
                {new Date(profile.created_at).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
                {' '}
                {new Date(profile.created_at).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false
                })}
              </Badge>
              
              {/* Last activity badge */}
              {activityDate && (
                <Badge 
                  variant="outline" 
                  className={`absolute top-0 left-28 text-xs font-normal rounded-none rounded-br-md cursor-pointer ${activityColor}`}
                  onClick={() => {
                    const newExpanded = new Set(expandedUserActivity);
                    if (expandedUserActivity.has(profile.id)) {
                      newExpanded.delete(profile.id);
                    } else {
                      newExpanded.add(profile.id);
                    }
                    setExpandedUserActivity(newExpanded);
                  }}
                >
                  {activityDate.toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </Badge>
              )}
          
              {/* Controls menu in top right */}
              <div className="absolute top-0 right-0 flex items-center gap-1">
                {/* Role badge */}
                {(() => {
                  const currentRole = userRoleMap[profile.id] || 'usual';
                  
                  if (currentRole === 'suspicious') {
                    return (
                      <Badge variant="destructive" className="text-xs rounded-none bg-red-500 text-white hover:bg-red-600">
                        Suspicious
                      </Badge>
                    );
                  } else if (currentRole === 'admin') {
                    const hasRegular = userRoles.some(r => r.user_id === profile.id && r.role === 'regular');
                    return (
                      <>
                        <Badge className="text-xs rounded-none bg-blue-500 text-white hover:bg-blue-600">
                          Admin
                        </Badge>
                        {hasRegular && (
                          <Badge className="text-xs rounded-none bg-green-500 text-white hover:bg-green-600 ml-1">
                            Regular ({userVotingStats[profile.id]?.unique_weeks_count || 0}w)
                          </Badge>
                        )}
                      </>
                    );
                  } else if (currentRole === 'moderator') {
                    const hasRegular = userRoles.some(r => r.user_id === profile.id && r.role === 'regular');
                    return (
                      <>
                        <Badge className="text-xs rounded-none bg-yellow-500 text-white hover:bg-yellow-600">
                          Moderator
                        </Badge>
                        {hasRegular && (
                          <Badge className="text-xs rounded-none bg-green-500 text-white hover:bg-green-600 ml-1">
                            Regular ({userVotingStats[profile.id]?.unique_weeks_count || 0}w)
                          </Badge>
                        )}
                      </>
                    );
                  } else {
                    const hasRegular = userRoles.some(r => r.user_id === profile.id && r.role === 'regular');
                    if (hasRegular) {
                      return (
                        <Badge className="text-xs rounded-none bg-green-500 text-white hover:bg-green-600">
                          Regular ({userVotingStats[profile.id]?.unique_weeks_count || 0}w)
                        </Badge>
                      );
                    }
                    
                    const isOAuthUser = profile.auth_provider === 'google' || profile.auth_provider === 'facebook';
                    const emailNotWhitelisted = profile.email ? !isEmailDomainWhitelisted(profile.email) : false;
                    const wasAutoConfirmed = profile.created_at && profile.email_confirmed_at && 
                      Math.abs(new Date(profile.email_confirmed_at).getTime() - new Date(profile.created_at).getTime()) < 1000;
                    const formFillTime = profile.raw_user_meta_data?.form_fill_time_seconds;
                    const fastFormFill = formFillTime !== undefined && formFillTime !== null && formFillTime < 5;
                    
                    let hasDuplicateFingerprint = false;
                    let sameFingerprint = [];
                    if (profile.fingerprint_id) {
                      sameFingerprint = profiles.filter(p => 
                        p.fingerprint_id === profile.fingerprint_id && p.id !== profile.id
                      );
                      hasDuplicateFingerprint = sameFingerprint.length >= 4;
                    }
                    
                    const hasClearedRole = userRoles.some(r => r.user_id === profile.id && r.role === 'cleared');
                    const isMaybeSuspicious = !isOAuthUser && !hasClearedRole && (wasAutoConfirmed || fastFormFill || hasDuplicateFingerprint);
                    
                    if (isMaybeSuspicious) {
                      const reasonCodes = [];
                      if (wasAutoConfirmed) reasonCodes.push("<1");
                      if (fastFormFill) reasonCodes.push(`<${formFillTime}`);
                      if (hasDuplicateFingerprint) reasonCodes.push(`FP ${sameFingerprint.length + 1}`);
                      
                      return (
                        <Badge 
                          variant="outline" 
                          className="text-xs rounded-none bg-orange-100 text-orange-700 border-orange-300 flex items-center gap-1 cursor-pointer hover:bg-orange-200"
                          onClick={() => {
                            if (hasDuplicateFingerprint && profile.fingerprint_id) {
                              const newExpanded = new Set(expandedMaybeFingerprints);
                              if (expandedMaybeFingerprints.has(profile.id)) {
                                newExpanded.delete(profile.id);
                              } else {
                                newExpanded.add(profile.id);
                              }
                              setExpandedMaybeFingerprints(newExpanded);
                            }
                          }}
                        >
                          {reasonCodes.length > 0 && (
                            <span className="text-[10px] font-semibold">
                              {reasonCodes.join(" ")}
                            </span>
                          )}
                          Maybe
                        </Badge>
                      );
                    }
                    
                    if (userVotingStats[profile.id]?.is_regular_voter) {
                      return (
                        <Badge className="text-xs rounded-none bg-green-500 text-white hover:bg-green-600">
                          Regular ({userVotingStats[profile.id].unique_weeks_count}w)
                        </Badge>
                      );
                    }
                  }
                  
                  return null;
                })()}
                
                {/* Verify button */}
                {!profile.email_confirmed_at && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Are you sure you want to verify email for ${fullName}?`)) {
                        handleEmailVerification(profile.id);
                      }
                    }}
                    disabled={verifyingUsers.has(profile.id)}
                    className="h-6 px-2 text-xs rounded-none rounded-bl-md bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    {verifyingUsers.has(profile.id) ? 'Verifying...' : 'Verify'}
                  </Button>
                )}
                
                {/* Three dots menu for role */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none rounded-bl-md">
                      <span className="text-lg leading-none">⋮</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-[9999] bg-popover border shadow-lg">
                    <DropdownMenuItem
                      onClick={() => {
                        const currentRole = userRoleMap[profile.id] || 'usual';
                        if (currentRole === 'suspicious') {
                          handleRoleChange(profile.id, fullName, 'usual');
                        } else {
                          handleRoleChange(profile.id, fullName, 'suspicious');
                        }
                      }}
                    >
                      {(userRoleMap[profile.id] || 'usual') === 'suspicious' ? 'Mark as Usual' : 'Mark as Suspicious'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const hasRegular = userRoles.some(r => r.user_id === profile.id && r.role === 'regular');
                        if (hasRegular) {
                          handleRoleChange(profile.id, fullName, 'remove-regular');
                        } else {
                          handleRoleChange(profile.id, fullName, 'regular');
                        }
                      }}
                    >
                      {userRoles.some(r => r.user_id === profile.id && r.role === 'regular') ? 'Remove Regular' : 'Mark as Regular'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const hasClearedRole = userRoles.some(r => r.user_id === profile.id && r.role === 'cleared');
                        if (hasClearedRole) {
                          handleRoleChange(profile.id, fullName, 'remove-cleared');
                        } else {
                          handleRoleChange(profile.id, fullName, 'cleared');
                        }
                      }}
                    >
                      {userRoles.some(r => r.user_id === profile.id && r.role === 'cleared') ? 'Remove Cleared' : 'Mark as Cleared'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Profile content */}
              <div className="mt-6 space-y-2">
                <h3 className="font-semibold text-lg">{fullName}</h3>
                
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p className="flex items-center gap-1">
                    {profile.email || 'No email'}
                    {profile.email && (
                      <button
                        onClick={() => navigator.clipboard.writeText(profile.email!)}
                        className="opacity-0 hover:opacity-100 transition-opacity"
                      >
                        📋
                      </button>
                    )}
                  </p>
                  
                  {profile.ip_address && (
                    <p className={profile.isDuplicateIP ? 'text-blue-600 font-medium' : ''}>
                      IP: {profile.ip_address}
                      {profile.isDuplicateIP && ' (duplicate)'}
                    </p>
                  )}

                  {profile.fingerprint_id && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleFingerprintExpand(profile.fingerprint_id!, profile.id)}
                        className="flex items-center gap-1 text-sm hover:underline text-left"
                      >
                        <span className={fingerprintCounts.get(profile.fingerprint_id)! > 1 ? 'text-blue-600 font-medium' : ''}>
                          {profile.auth_provider === 'facebook' ? 'Facebook' : 'mobile'} | {profile.device_info || 'Unknown device'} | fp {profile.fingerprint_id.substring(0, 8)}
                          {fingerprintCounts.get(profile.fingerprint_id)! > 1 && (
                            <span className="ml-1">({fingerprintCounts.get(profile.fingerprint_id)})</span>
                          )}
                        </span>
                      </button>

                      {expandedFingerprint === `${profile.fingerprint_id}-${profile.id}` && 
                       fingerprintCounts.get(profile.fingerprint_id)! > 1 && (
                        <div className="ml-4 pl-3 border-l-2 border-blue-200 space-y-2">
                          {getProfilesWithFingerprint(profile.fingerprint_id!)
                            .filter(p => p.id !== profile.id)
                            .map(matchedProfile => {
                              const matchedName = matchedProfile.display_name || 
                                `${matchedProfile.first_name || ''} ${matchedProfile.last_name || ''}`.trim() || 
                                'Unknown';
                              return (
                                <div key={matchedProfile.id} className="text-xs text-muted-foreground">
                                  <p className="font-medium text-blue-600">{matchedName}</p>
                                  <p>{matchedProfile.email}</p>
                                  <p>{matchedProfile.ip_address}</p>
                                  <p className="text-[10px]">
                                    {new Date(matchedProfile.last_sign_in_at || matchedProfile.created_at).toLocaleString()}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  <p>{profile.age} • {profile.gender}</p>
                  <p>{profile.city}, {profile.country}</p>
                  
                  {profile.last_sign_in_at && (
                    <p className="text-xs">
                      Last login: {new Date(profile.last_sign_in_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Approval buttons */}
                {profile.is_approved === null && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => onApprove(profile)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => onReject(profile)}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {profile.is_approved === true && (
                  <Badge variant="default">Approved</Badge>
                )}
                {profile.is_approved === false && (
                  <Badge variant="destructive">Rejected</Badge>
                )}
              </div>

              {/* Expanded user activity */}
              {expandedUserActivity.has(profile.id) && userActivityData[profile.id] && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                  <p><strong>Total votes:</strong> {userActivityData[profile.id].totalVotes || 0}</p>
                  <p><strong>Unique weeks:</strong> {userActivityData[profile.id].uniqueWeeks || 0}</p>
                  <p><strong>Last activity:</strong> {userActivityData[profile.id].lastActivity ? new Date(userActivityData[profile.id].lastActivity).toLocaleString() : 'Never'}</p>
                </div>
              )}

              {/* Expanded maybe suspicious fingerprints */}
              {expandedMaybeFingerprints.has(profile.id) && profile.fingerprint_id && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-semibold mb-2">Users with same fingerprint:</p>
                  <div className="space-y-2">
                    {getProfilesWithFingerprint(profile.fingerprint_id)
                      .filter(p => p.id !== profile.id)
                      .map(matchedProfile => {
                        const matchedName = matchedProfile.display_name || 
                          `${matchedProfile.first_name || ''} ${matchedProfile.last_name || ''}`.trim() || 
                          'Unknown';
                        return (
                          <div key={matchedProfile.id} className="text-xs p-2 bg-orange-50 rounded border border-orange-200">
                            <p className="font-medium">{matchedName}</p>
                            <p className="text-muted-foreground">{matchedProfile.email}</p>
                            <p className="text-muted-foreground">IP: {matchedProfile.ip_address}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(matchedProfile.last_sign_in_at || matchedProfile.created_at).toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </Card>
          </React.Fragment>
        );
      })}

      {filteredProfiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No registrations found
        </div>
      )}
    </div>
  );
}