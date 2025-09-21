import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';

interface ApplicationEditHistoryProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ApplicationEditHistory = ({ 
  applicationId, 
  isOpen, 
  onClose 
}: ApplicationEditHistoryProps) => {
  const { history, loading, error } = useApplicationHistory(applicationId);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Fetch user names for all changers
  useEffect(() => {
    const fetchUserNames = async () => {
      const changerIds = [...new Set(history.map(h => h.changed_by).filter(Boolean))];
      
      if (changerIds.length === 0) return;

      try {
        // Fetch user profile data for admin display
        const { data: authData } = await supabase.rpc('get_user_auth_data_admin');
        
        const names: Record<string, string> = {};
        authData?.forEach((user: any) => {
          if (changerIds.includes(user.user_id)) {
            names[user.user_id] = user.email || 'Unknown User';
          }
        });
        
        setUserNames(names);
      } catch (error) {
        console.error('Error fetching user names:', error);
      }
    };

    if (history.length > 0) {
      fetchUserNames();
    }
  }, [history]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Application Edit History</h2>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading history...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-8">
              <p className="text-destructive">Error loading history: {error}</p>
            </div>
          )}
          
          {!loading && !error && history.length === 0 && (
            <div className="text-center py-8">
              <Edit className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No edit history available</p>
            </div>
          )}
          
          {!loading && !error && history.length > 0 && (
            <div className="space-y-4">
              {history.map((item, index) => (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Version {history.length - index}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        item.status === 'approved' ? 'default' :
                        item.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {item.status}
                      </Badge>
                      
                      {item.changed_by && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>
                            {userNames[item.changed_by] || 'Unknown User'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {item.change_reason && (
                      <p className="text-xs text-muted-foreground italic">
                        {item.change_reason}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {item.notes && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm">{item.notes}</p>
                      </div>
                    )}
                    
                    {item.application_data && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Application Data:</p>
                        <div className="bg-muted/50 rounded p-3 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium">Name:</span>{' '}
                              {item.application_data.first_name} {item.application_data.last_name}
                            </div>
                            <div>
                              <span className="font-medium">Country:</span>{' '}
                              {item.application_data.country}
                            </div>
                            <div>
                              <span className="font-medium">City:</span>{' '}
                              {item.application_data.city}
                            </div>
                            <div>
                              <span className="font-medium">Age:</span>{' '}
                              {item.application_data.birth_year ? 
                                new Date().getFullYear() - item.application_data.birth_year : 
                                'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Height:</span>{' '}
                              {item.application_data.height_cm}cm
                            </div>
                            <div>
                              <span className="font-medium">Weight:</span>{' '}
                              {item.application_data.weight_kg}kg
                            </div>
                          </div>
                          
                          {(item.application_data.admin_edited || item.application_data.admin_edited_at) && (
                            <div className="mt-2 pt-2 border-t border-muted">
                              <div className="flex items-center gap-1 text-orange-600">
                                <Edit className="w-3 h-3" />
                                <span className="font-medium text-xs">
                                  Admin Edited
                                  {item.application_data.admin_edited_at && (
                                    <span className="ml-1 font-normal">
                                      at {new Date(item.application_data.admin_edited_at).toLocaleString('ru-RU')}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};