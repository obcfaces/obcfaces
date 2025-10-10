import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileData } from '@/types/admin';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Star, Heart, Copy, Facebook, Loader2 } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { UAParser } from 'ua-parser-js';
import { useToast } from '@/hooks/use-toast';

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
          
          const activityDate = new Date(profile.created_at);
          const manilaTime = activityDate.toLocaleString('en-GB', {
            timeZone: 'Asia/Manila',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });
          
          const email = (profile as any).email || '';
          const userRole = userRoleMap[profile.id] || 'usual';
          const votingStats = userVotingStats[profile.id];
          
          // Get device info from user_agent
          const deviceInfo = profile.user_agent ? (() => {
            const { browser, device, os } = UAParser(profile.user_agent);
            return `${device.type || 'Desktop'} | ${os.name || 'Unknown OS'} ${os.version || ''}`;
          })() : 'Unknown';
          
          const ipCount = profile.ip_address ? profiles.filter(p => p.ip_address === profile.ip_address).length : 0;
          const fingerprintCount = profile.fingerprint_id ? (fingerprintCounts.get(profile.fingerprint_id) || 0) : 0;
          const fingerprintShort = profile.fingerprint_id ? profile.fingerprint_id.substring(0, 5) : 'N/A';
          
          const profilesWithSameFingerprint = profile.fingerprint_id ? 
            getProfilesWithFingerprint(profile.fingerprint_id).filter(p => p.id !== profile.id) : [];
          
          const isExpanded = expandedFingerprint === `${profile.fingerprint_id}-${profile.id}`;
          
          // IP color based on count
          let ipColor = 'text-muted-foreground';
          if (ipCount >= 10) {
            ipColor = 'text-red-500 font-medium';
          } else if (ipCount >= 2 && ipCount <= 5) {
            ipColor = 'text-blue-500 font-medium';
          }
          
          // Fingerprint styling
          const duplicateCount = profilesWithSameFingerprint.length;
          const isBlue = duplicateCount >= 2;
          const showCount = duplicateCount >= 2;
          const isClickable = duplicateCount >= 1;
          
          // Check for suspicious indicators
          const hasSuspiciousRole = userRoles.some(r => r.user_id === profile.id && r.role === 'suspicious');
          const hasClearedRole = userRoles.some(r => r.user_id === profile.id && r.role === 'cleared');
          const isOAuth = profile.auth_provider === 'google' || profile.auth_provider === 'facebook';
          const wasAutoConfirmed = profile.created_at && profile.email_confirmed_at && 
            Math.abs(new Date(profile.email_confirmed_at).getTime() - new Date(profile.created_at).getTime()) < 1000;
          const formFillTime = profile.raw_user_meta_data?.form_fill_time_seconds;
          const fastFormFill = formFillTime !== undefined && formFillTime !== null && formFillTime < 5;
          const hasDuplicateFingerprint = duplicateCount >= 4;
          const hasRegularRole = userRoles.some(r => r.user_id === profile.id && r.role === 'regular');
          
          const isMaybeSuspicious = !isOAuth && !hasClearedRole && !hasSuspiciousRole && (wasAutoConfirmed || fastFormFill || hasDuplicateFingerprint);
          
          const reasonCodes = [];
          if (wasAutoConfirmed) reasonCodes.push("<1");
          if (fastFormFill) reasonCodes.push("<3");
          if (hasDuplicateFingerprint) reasonCodes.push(`FP ${duplicateCount + 1}`);
          
          return (
            <div key={profile.id} className="space-y-2">
              <Card className="p-4 relative hover:shadow-md transition-shadow">
                {/* Date/time badge in top-left */}
                <Badge 
                  variant="outline"
                  className="absolute top-0 left-0 text-xs rounded-none rounded-tr-md font-normal"
                >
                  {activityDate.toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </Badge>
                
                {/* Role and status badges in top-right */}
                <div className="absolute top-0 right-0 flex items-center gap-1">
                  {/* Role badge */}
                  {hasSuspiciousRole && (
                    <Badge variant="destructive" className="text-xs rounded-none bg-red-500 text-white hover:bg-red-600">
                      Suspicious
                    </Badge>
                  )}
                  {userRole === 'admin' && (
                    <>
                      <Badge className="text-xs rounded-none bg-blue-500 text-white hover:bg-blue-600">
                        Admin
                      </Badge>
                      {hasRegularRole && (
                        <Badge className="text-xs rounded-none bg-green-500 text-white hover:bg-green-600 ml-1">
                          Regular ({votingStats?.unique_weeks_count || 0}w)
                        </Badge>
                      )}
                    </>
                  )}
                  {userRole === 'moderator' && (
                    <>
                      <Badge className="text-xs rounded-none bg-yellow-500 text-white hover:bg-yellow-600">
                        Moderator
                      </Badge>
                      {hasRegularRole && (
                        <Badge className="text-xs rounded-none bg-green-500 text-white hover:bg-green-600 ml-1">
                          Regular ({votingStats?.unique_weeks_count || 0}w)
                        </Badge>
                      )}
                    </>
                  )}
                  {userRole === 'usual' && hasRegularRole && (
                    <Badge className="text-xs rounded-none bg-green-500 text-white hover:bg-green-600">
                      Regular ({votingStats?.unique_weeks_count || 0}w)
                    </Badge>
                  )}
                  {isMaybeSuspicious && (
                    <>
                      <Badge 
                        variant="outline" 
                        className="text-xs rounded-none bg-orange-100 text-orange-700 border-orange-300 flex items-center gap-1 cursor-pointer hover:bg-orange-200"
                        onClick={() => {
                          if (hasDuplicateFingerprint && profile.fingerprint_id) {
                            toggleFingerprintExpand(profile.fingerprint_id, profile.id);
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
                      {hasRegularRole && (
                        <Badge className="text-xs rounded-none bg-green-500 text-white hover:bg-green-600 ml-1">
                          Regular ({votingStats?.unique_weeks_count || 0}w)
                        </Badge>
                      )}
                    </>
                  )}
                  
                  {/* Verify button if not verified */}
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
                  
                  {/* Three dots menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none rounded-bl-md">
                        <span className="text-lg leading-none">⋮</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[9999] bg-popover border shadow-lg">
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(profile.id, fullName, hasSuspiciousRole ? 'usual' : 'suspicious')}
                        className="cursor-pointer"
                      >
                        {hasSuspiciousRole ? '✓ ' : ''}Mark as Suspicious
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(profile.id, fullName, 'usual')}
                        className="cursor-pointer"
                      >
                        {userRole === 'usual' ? '✓ ' : ''}Mark as Usual
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(profile.id, fullName, hasClearedRole ? 'usual' : 'cleared')}
                        className="cursor-pointer"
                      >
                        {hasClearedRole ? '✓ ' : ''}Clear "Maybe Suspicious"
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(profile.id, fullName, 'regular')}
                        className="cursor-pointer"
                      >
                        {hasRegularRole ? '✓ ' : ''}Mark as Regular
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(profile.id, fullName, 'moderator')}
                        className="cursor-pointer"
                      >
                        {userRole === 'moderator' ? '✓ ' : ''}Make Moderator
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(profile.id, fullName, userRole === 'admin' ? 'usual' : 'admin')}
                        className="cursor-pointer"
                      >
                        {userRole === 'admin' ? '✓ ' : ''}Make Admin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Main content */}
                <div className="mt-6">
                  <div className="flex items-start gap-2 mb-1">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={profile.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {profile.display_name?.charAt(0) || profile.first_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {fullName}
                    </span>
                  </div>
                  
                  {/* Email */}
                  {email && (
                    <div className="text-xs text-foreground/80 flex items-center gap-1 mb-1">
                      <span>{email}</span>
                      <Copy 
                        className="h-3 w-3 cursor-pointer hover:text-foreground" 
                        onClick={() => {
                          navigator.clipboard.writeText(email);
                        }}
                      />
                      {/* Social profile links */}
                      {profile.auth_provider === 'google' && (
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent(email)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                          title="Search Google profile"
                        >
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          G
                        </a>
                      )}
                      {profile.auth_provider === 'facebook' && profile.provider_data?.provider_id && (
                        <a 
                          href={`https://www.facebook.com/${profile.provider_data.provider_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-600 hover:text-blue-800"
                          title="View Facebook profile"
                        >
                          <Facebook className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* No email warning */}
                  {!email && (
                    <div className="text-xs text-destructive font-medium mb-1">
                      ⚠️ NO EMAIL - {profile.auth_provider === 'facebook' ? 'Facebook' : profile.auth_provider || 'Unknown'} - ID: {profile.id?.substring(0, 8)}
                      {profile.auth_provider === 'facebook' && profile.provider_data?.provider_id && (
                        <a 
                          href={`https://www.facebook.com/${profile.provider_data.provider_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          title="View Facebook profile"
                        >
                          <Facebook className="h-3 w-3" />
                          FB Profile
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* IP Address */}
                  {profile.ip_address ? (
                    <div className={`text-xs ${ipColor}`}>
                      IP: {profile.ip_address}
                      {ipCount > 1 && ` (${ipCount})`}
                      {(profile.country || profile.city) && (
                        <span className="text-muted-foreground font-normal ml-1">
                          📍 {profile.city ? `${profile.city}, ` : ''}{profile.country || 'Unknown Country'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600">
                      ⚠️ IP/данные устройства будут записаны при следующем логине
                    </div>
                  )}
                  
                  {/* Device Info + Fingerprint */}
                  {profile.user_agent && (
                    <div className="text-xs text-muted-foreground">
                      {deviceInfo}
                      {profile.fingerprint_id && (
                        <span className={`ml-2 ${isBlue ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}>
                          | {isClickable ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFingerprintExpand(profile.fingerprint_id!, profile.id);
                              }}
                              className="hover:underline cursor-pointer"
                            >
                              fp {fingerprintShort}
                              {showCount && ` (${duplicateCount + 1})`}
                            </button>
                          ) : (
                            <>fp {fingerprintShort}</>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* User Activity Icons (bottom right) */}
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    {/* Ratings */}
                    <div className="flex items-center gap-1 bg-background/90 px-2 py-1 rounded shadow-sm border">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs font-medium">
                        {votingStats?.total_votes_count || 0}
                      </span>
                    </div>
                    
                    {/* Likes */}
                    <div className="flex items-center gap-1 bg-background/90 px-2 py-1 rounded shadow-sm border">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-medium">
                        {userActivityData?.[profile.id]?.likes_given || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Expanded fingerprint section */}
              {isExpanded && profilesWithSameFingerprint.length > 0 && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium mb-3 text-blue-900 dark:text-blue-100">
                    Пользователи с таким же Fingerprint ({profile.fingerprint_id?.substring(0, 16)}...):
                  </h4>
                  
                  <div className="space-y-4">
                    {profilesWithSameFingerprint.map(fpProfile => {
                      const fpFullName = fpProfile.display_name || 
                        `${fpProfile.first_name || ''} ${fpProfile.last_name || ''}`.trim() || 
                        'Unknown';
                      const fpEmail = (fpProfile as any).email || '';
                      const fpVotingStats = userVotingStats[fpProfile.id];
                      const fpActivityDate = new Date(fpProfile.created_at);
                      
                      return (
                        <div key={fpProfile.id} className="p-3 bg-background rounded border">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={fpProfile.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {fpProfile.display_name?.charAt(0) || fpProfile.first_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{fpFullName}</span>
                                {fpProfile.auth_provider === 'google' && (
                                  <Badge variant="outline" className="text-xs">G</Badge>
                                )}
                                {fpProfile.auth_provider === 'facebook' && (
                                  <Badge variant="outline" className="text-xs">F</Badge>
                                )}
                              </div>
                              
                              {fpEmail && (
                                <div className="text-xs text-muted-foreground mb-0.5">{fpEmail}</div>
                              )}
                              
                              {fpProfile.ip_address && (
                                <div className="text-xs text-blue-600 mb-0.5">
                                  IP: {fpProfile.ip_address}
                                </div>
                              )}
                              
                              <div className="text-xs text-muted-foreground mb-0.5">
                                Зарегистрирован: {fpActivityDate.toLocaleString('en-GB', {
                                  timeZone: 'Asia/Manila',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                              
                              {fpProfile.user_agent && (() => {
                                const { browser, device, os } = UAParser(fpProfile.user_agent);
                                return (
                                  <div className="text-xs text-muted-foreground">
                                    {device.type || 'Desktop'} | {os.name || 'Unknown OS'}
                                  </div>
                                );
                              })()}
                              
                              {/* Stats */}
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span className="text-xs">{fpVotingStats?.total_votes_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3 text-red-500" />
                                  <span className="text-xs">{userActivityData?.[fpProfile.id]?.likes_given || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
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