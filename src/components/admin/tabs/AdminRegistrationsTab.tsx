import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProfileData } from '@/types/admin';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Star, Heart } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

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
  emailDomainStats: any[];
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
  emailDomainStats,
}: AdminRegistrationsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [maybeSuspiciousActive, setMaybeSuspiciousActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [expandedFingerprint, setExpandedFingerprint] = useState<string | null>(null);

  // Calculate weekly registration statistics
  const weeklyStats = useMemo(() => {
    const stats = {
      all: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      email_verified: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      unverified: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      gmail: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      facebook: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      maybe_suspicious: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      suspicious: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    };

    // Get current week's Monday in Manila timezone
    const nowManila = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentDayOfWeek = nowManila.getDay();
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const weekStartManila = new Date(nowManila);
    weekStartManila.setDate(nowManila.getDate() - daysFromMonday);
    weekStartManila.setHours(0, 0, 0, 0);
    
    const weekEndManila = new Date(weekStartManila);
    weekEndManila.setDate(weekStartManila.getDate() + 6);
    weekEndManila.setHours(23, 59, 59, 999);

    profiles.forEach(profile => {
      const manilaTimeStr = new Date(profile.created_at).toLocaleString('en-US', { 
        timeZone: 'Asia/Manila' 
      });
      const profileCreatedAtManila = new Date(manilaTimeStr);

      // Only count registrations from current week
      if (profileCreatedAtManila < weekStartManila || profileCreatedAtManila > weekEndManila) {
        return;
      }

      const dayOfWeek = profileCreatedAtManila.getDay();
      const dayMap: { [key: number]: keyof typeof stats.all } = {
        1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun'
      };
      const day = dayMap[dayOfWeek];

      stats.all[day]++;

      if (profile.auth_provider === 'email' && profile.email_confirmed_at) {
        stats.email_verified[day]++;
      }
      if (!profile.email_confirmed_at) {
        stats.unverified[day]++;
      }
      if (profile.auth_provider === 'google') {
        stats.gmail[day]++;
      }
      if (profile.auth_provider === 'facebook') {
        stats.facebook[day]++;
      }

      const isSuspicious = userRoles.some(r => r.user_id === profile.id && r.role === 'suspicious');
      if (isSuspicious) {
        stats.suspicious[day]++;
      } else {
        const isOAuth = profile.auth_provider === 'google' || profile.auth_provider === 'facebook';
        if (!isOAuth) {
          const wasAutoConfirmed = profile.created_at && profile.email_confirmed_at && 
            Math.abs(new Date(profile.email_confirmed_at).getTime() - new Date(profile.created_at).getTime()) < 1000;
          const formFillTime = profile.raw_user_meta_data?.form_fill_time_seconds;
          const fastFormFill = formFillTime !== undefined && formFillTime !== null && formFillTime < 5;
          let hasDuplicateFingerprint = false;
          if (profile.fingerprint_id) {
            const sameFingerprint = profiles.filter(p => 
              p.fingerprint_id === profile.fingerprint_id && p.id !== profile.id
            );
            hasDuplicateFingerprint = sameFingerprint.length >= 4;
          }
          if (wasAutoConfirmed || fastFormFill || hasDuplicateFingerprint) {
            stats.maybe_suspicious[day]++;
          }
        }
      }
    });

    return stats;
  }, [profiles, userRoles]);

  // Get current week dates for table headers
  const weekDates = useMemo(() => {
    const nowManila = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentDayOfWeek = nowManila.getDay();
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const monday = new Date(nowManila);
    monday.setDate(nowManila.getDate() - daysFromMonday);

    return {
      mon: `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`,
      tue: (() => { const d = new Date(monday); d.setDate(monday.getDate() + 1); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })(),
      wed: (() => { const d = new Date(monday); d.setDate(monday.getDate() + 2); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })(),
      thu: (() => { const d = new Date(monday); d.setDate(monday.getDate() + 3); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })(),
      fri: (() => { const d = new Date(monday); d.setDate(monday.getDate() + 4); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })(),
      sat: (() => { const d = new Date(monday); d.setDate(monday.getDate() + 5); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })(),
      sun: (() => { const d = new Date(monday); d.setDate(monday.getDate() + 6); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })(),
    };
  }, []);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
        const displayName = (profile.display_name || '').toLowerCase();
        const email = ((profile as any).email || '').toLowerCase();
        const ip = (profile.ip_address || '').toLowerCase();
        
        if (!(fullName.includes(query) || displayName.includes(query) || email.includes(query) || ip.includes(query))) {
          return false;
        }
      }

      // Verification filter
      if (verificationFilter === 'verified' && !profile.email_confirmed_at) return false;
      if (verificationFilter === 'unverified' && profile.email_confirmed_at) return false;

      // Role filter
      const userRole = userRoleMap[profile.id] || 'usual';
      if (roleFilter === 'admin' && userRole !== 'admin') return false;
      if (roleFilter === 'usual' && userRole !== 'usual' && userRole) return false;
      if (roleFilter === 'suspicious' && userRole !== 'suspicious') return false;
      if (roleFilter === 'moderator' && userRole !== 'moderator') return false;
      if (roleFilter === 'regular') {
        const hasRegular = userRoles.some(r => r.user_id === profile.id && r.role === 'regular');
        if (!hasRegular) return false;
      }

      // Maybe Suspicious filter
      if (maybeSuspiciousActive) {
        const hasSuspiciousRole = userRoles.some(r => r.user_id === profile.id && r.role === 'suspicious');
        if (hasSuspiciousRole) return false;

        const hasClearedRole = userRoles.some(r => r.user_id === profile.id && r.role === 'cleared');
        if (hasClearedRole) return false;

        const isOAuth = profile.auth_provider === 'google' || profile.auth_provider === 'facebook';
        if (isOAuth) return false;

        const wasAutoConfirmed = profile.created_at && profile.email_confirmed_at && 
          Math.abs(new Date(profile.email_confirmed_at).getTime() - new Date(profile.created_at).getTime()) < 1000;
        const formFillTime = profile.raw_user_meta_data?.form_fill_time_seconds;
        const fastFormFill = formFillTime !== undefined && formFillTime !== null && formFillTime < 5;
        let hasDuplicateFingerprint = false;
        if (profile.fingerprint_id) {
          const sameFingerprint = profiles.filter(p => 
            p.fingerprint_id === profile.fingerprint_id && p.id !== profile.id
          );
          hasDuplicateFingerprint = sameFingerprint.length >= 4;
        }

        if (!(wasAutoConfirmed || fastFormFill || hasDuplicateFingerprint)) return false;
      }

      return true;
    });
  }, [profiles, searchQuery, verificationFilter, roleFilter, maybeSuspiciousActive, userRoleMap, userRoles]);

  // Pagination
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProfiles, currentPage]);

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

  const maybeSuspiciousCount = useMemo(() => {
    return profiles.filter(p => {
      const hasSuspiciousRole = userRoles.some(r => r.user_id === p.id && r.role === 'suspicious');
      if (hasSuspiciousRole) return false;
      
      const isOAuth = p.auth_provider === 'google' || p.auth_provider === 'facebook';
      if (isOAuth) return false;
      
      const wasAutoConfirmed = p.created_at && p.email_confirmed_at && 
        Math.abs(new Date(p.email_confirmed_at).getTime() - new Date(p.created_at).getTime()) < 1000;
      const formFillTime = p.raw_user_meta_data?.form_fill_time_seconds;
      const fastFormFill = formFillTime !== undefined && formFillTime !== null && formFillTime < 5;
      let hasDuplicateFingerprint = false;
      if (p.fingerprint_id) {
        const sameFingerprint = profiles.filter(prof => 
          prof.fingerprint_id === p.fingerprint_id && prof.id !== p.id
        );
        hasDuplicateFingerprint = sameFingerprint.length >= 4;
      }
      
      return wasAutoConfirmed || fastFormFill || hasDuplicateFingerprint;
    }).length;
  }, [profiles, userRoles]);

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
      {/* Weekly Statistics Table */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium">Тип</th>
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
                { label: 'Всего', key: 'all', className: '' },
                { label: 'Почта ✓', key: 'email_verified', className: '' },
                { label: 'Unverif', key: 'unverified', className: '' },
                { label: 'Gmail', key: 'gmail', className: '' },
                { label: 'Facebook', key: 'facebook', className: '' },
                { label: 'Maybe Suspicious', key: 'maybe_suspicious', className: 'text-red-500' },
                { label: 'Suspicious', key: 'suspicious', className: 'text-red-500' },
              ].map(row => (
                <tr key={row.key} className="border-b border-border/50">
                  <td className={`text-left p-2 ${row.className}`}>{row.label}</td>
                  {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(day => (
                    <td key={day} className={`text-center p-2 ${row.className}`}>
                      {weeklyStats[row.key as keyof typeof weeklyStats][day]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Search Input */}
      <Input
        placeholder="Поиск по имени, email или IP..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
              {verificationFilter === 'all' ? 'All Users' : 
               verificationFilter === 'verified' ? 'Verified' : 'Unverified'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[140px] bg-background z-50">
            <DropdownMenuItem onClick={() => setVerificationFilter('all')}>All Users</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVerificationFilter('verified')}>Verified</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVerificationFilter('unverified')}>Unverified</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
              {roleFilter === 'all' ? 'All Roles' :
               roleFilter === 'suspicious' ? 'Suspicious' :
               roleFilter === 'usual' ? 'Usual' :
               roleFilter === 'moderator' ? 'Moderator' :
               roleFilter === 'regular' ? 'Regular' : 'Admin'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[140px] bg-background z-50">
            <DropdownMenuItem onClick={() => setRoleFilter('all')}>All Roles</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('suspicious')}>Suspicious</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('usual')}>Usual</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('moderator')}>Moderator</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('regular')}>Regular</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('admin')}>Admin</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={maybeSuspiciousActive ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setMaybeSuspiciousActive(!maybeSuspiciousActive)}
        >
          Maybe Suspicious {maybeSuspiciousCount > 0 ? `(${maybeSuspiciousCount})` : ''}
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedProfiles.length} of {filteredProfiles.length} results (page {currentPage} of {totalPages || 1})
      </div>

      {/* User Cards */}
      <div className="space-y-4">
        {paginatedProfiles.map(profile => {
          const fullName = profile.display_name || 
            `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
            'Unknown';

          return (
            <Card key={profile.id} className="p-4 relative">
              {/* Registration date */}
              <div className="absolute top-2 left-2 text-xs text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString('ru-RU', { 
                  day: 'numeric', 
                  month: 'short' 
                })}{' '}
                {new Date(profile.created_at).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false
                })}
              </div>

              {/* Three dots menu */}
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <span className="text-lg leading-none">⋮</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-[9999] bg-popover border shadow-lg">
                    <DropdownMenuItem onClick={() => {
                      const currentRole = userRoleMap[profile.id] || 'usual';
                      handleRoleChange(profile.id, fullName, currentRole === 'suspicious' ? 'usual' : 'suspicious');
                    }}>
                      {(userRoleMap[profile.id] || 'usual') === 'suspicious' ? 'Mark as Usual' : 'Mark as Suspicious'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* User info */}
              <div className="mt-8 flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                  {fullName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base">{fullName}</h3>
                  
                  <div className="text-sm space-y-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span>{(profile as any).email || 'No email'}</span>
                      {(profile as any).email && (
                        <button
                          onClick={() => navigator.clipboard.writeText((profile as any).email)}
                          className="text-xs opacity-50 hover:opacity-100"
                        >
                          📋
                        </button>
                      )}
                      {profile.auth_provider === 'google' && <span className="text-blue-500">G</span>}
                      {profile.auth_provider === 'google' && <span className="text-blue-500">G</span>}
                    </div>

                    {profile.ip_address && (
                      <div className="text-blue-600">
                        IP: {profile.ip_address}
                        {(() => {
                          const duplicateCount = profiles.filter(p => p.ip_address === profile.ip_address && p.id !== profile.id).length;
                          return duplicateCount > 0 ? ` (${duplicateCount + 1})` : '';
                        })()}
                      </div>
                    )}

                    {profile.fingerprint_id && (
                      <div>
                        <button
                          onClick={() => toggleFingerprintExpand(profile.fingerprint_id!, profile.id)}
                          className="text-sm hover:underline text-left"
                        >
                          <span className={fingerprintCounts.get(profile.fingerprint_id)! > 1 ? 'text-blue-600 font-medium' : ''}>
                            {profile.user_agent?.includes('Mac') ? 'Desktop' : 'mobile'} | {profile.user_agent?.includes('Mac') ? 'macOS' : 'Unknown'} | {profile.user_agent?.includes('Safari') ? 'Safari' : 'Unknown'} | fp {profile.fingerprint_id.substring(0, 8)}
                            {fingerprintCounts.get(profile.fingerprint_id)! > 1 && (
                              <span> ({fingerprintCounts.get(profile.fingerprint_id)})</span>
                            )}
                          </span>
                        </button>

                        {expandedFingerprint === `${profile.fingerprint_id}-${profile.id}` && 
                         fingerprintCounts.get(profile.fingerprint_id)! > 1 && (
                          <div className="ml-4 pl-3 border-l-2 border-blue-200 space-y-2 mt-2">
                            {getProfilesWithFingerprint(profile.fingerprint_id!)
                              .filter(p => p.id !== profile.id)
                              .map(matchedProfile => {
                                const matchedName = matchedProfile.display_name || 
                                  `${matchedProfile.first_name || ''} ${matchedProfile.last_name || ''}`.trim() || 
                                  'Unknown';
                                return (
                                  <div key={matchedProfile.id} className="text-xs text-muted-foreground">
                                    <p className="font-medium text-blue-600">{matchedName}</p>
                                    <p>{(matchedProfile as any).email}</p>
                                    <p>{matchedProfile.ip_address}</p>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}

                    {profile.city && profile.country && (
                      <div className="text-muted-foreground">
                        , {profile.city}, {profile.country}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 items-center">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">0</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 7) {
                pageNumber = i + 1;
              } else if (currentPage <= 4) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNumber = totalPages - 6 + i;
              } else {
                pageNumber = currentPage - 3 + i;
              }
              
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(pageNumber);
                    }}
                    isActive={pageNumber === currentPage}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {filteredProfiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No registrations found
        </div>
      )}
    </div>
  );
}