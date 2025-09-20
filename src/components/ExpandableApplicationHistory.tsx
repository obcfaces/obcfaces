import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Edit, Check, Minus, X, Trash2, RotateCcw } from 'lucide-react';

interface Application {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  application_data: any;
  rejection_reason?: string;
}

interface ExpandableApplicationHistoryProps {
  applications: Application[];
  currentApplicationId: string;
  userId: string;
  isExpanded: boolean;
  showDeletedApplications: boolean;
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
  onEdit,
  onReview,
  onReject,
  onDelete,
  onRestore,
  getApplicationStatusBadge,
}) => {
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

        return (
          <Card key={app.id} className="overflow-hidden bg-muted/30">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">
                    {appData.first_name} {appData.last_name} - {new Date().getFullYear() - appData.birth_year} лет
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Подано: {submittedDate.toLocaleDateString('ru-RU')} {submittedDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {appData.city} {appData.state} {appData.country} • {appData.weight_kg}kg • {appData.height_cm}cm
                  </div>
                  {getApplicationStatusBadge(app.status)}
                </div>
                
                <div className="flex gap-1 ml-4">
                  {!showDeletedApplications && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(app)}
                        className="text-xs px-2 py-1 h-7"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};