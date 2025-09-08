import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const TestFormDebug = () => {
  const [testData, setTestData] = useState({
    first_name: "",
    last_name: "",
    email: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Test form submission started', { testData });
    
    setIsLoading(true);
    
    try {
      // Check auth
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth check', { hasSession: !!session?.user });
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      // Try to insert into contest_applications table
      const { data, error } = await supabase
        .from('contest_applications')
        .insert({
          user_id: session.user.id,
          application_data: {
            first_name: testData.first_name,
            last_name: testData.last_name,
            email: testData.email,
            test_submission: true
          },
          status: 'pending'
        })
        .select('id')
        .single();

      console.log('Test insert result', { data, error });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      toast({
        title: "Test Success",
        description: "Test form submitted successfully!"
      });

    } catch (error: any) {
      console.error('Test form error:', error);
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Debug Test Form</h3>
      <form onSubmit={handleTestSubmit} className="space-y-4">
        <Input
          placeholder="First Name"
          value={testData.first_name}
          onChange={(e) => setTestData(prev => ({ ...prev, first_name: e.target.value }))}
          required
        />
        <Input
          placeholder="Last Name"
          value={testData.last_name}
          onChange={(e) => setTestData(prev => ({ ...prev, last_name: e.target.value }))}
          required
        />
        <Input
          placeholder="Email"
          type="email"
          value={testData.email}
          onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Test Submit"}
        </Button>
      </form>
    </div>
  );
};