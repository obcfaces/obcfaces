import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Edit, Check, X, Trash2, RotateCcw } from 'lucide-react';
import { ContestApplication } from '@/types/admin';
import { getStatusBadgeVariant, getInitials } from '@/utils/adminHelpers';

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
}: AdminNewApplicationsTabProps) {
  const displayApplications = showDeleted ? deletedApplications : applications;

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayApplications.map((app) => {
          const data = app.application_data || {};
          const firstName = data.first_name || data.firstName || '';
          const lastName = data.last_name || data.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const photo1 = data.photo_1_url || data.photo1_url || '';
          const photo2 = data.photo_2_url || data.photo2_url || '';

          return (
            <Card key={app.id} className={app.deleted_at ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={photo1} alt={fullName} />
                      <AvatarFallback>{getInitials(firstName, lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{fullName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {data.age} • {data.city}, {data.country}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(app.admin_status || 'pending')}>
                    {app.admin_status || 'pending'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewPhotos([photo1, photo2], 0, fullName)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Photos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(app)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>

                {!app.deleted_at ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => onApprove(app)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => onReject(app)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(app)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => onRestore(app)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {displayApplications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No {showDeleted ? 'deleted' : 'new'} applications
        </div>
      )}
    </div>
  );
}
