import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestTransition = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTransition = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Calling weekly-transition function...');
      
      const { data, error: fnError } = await supabase.functions.invoke('weekly-transition', {
        body: { manual_trigger: true }
      });

      if (fnError) {
        console.error('Function error:', fnError);
        setError(fnError.message);
        return;
      }

      console.log('Function result:', data);
      setResult(data);
    } catch (err) {
      console.error('Error calling function:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Transition Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTransition} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Running Transition...' : 'Run Weekly Transition Now'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Result:</h3>
              <pre className="text-sm text-green-700 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestTransition;