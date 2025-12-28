import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function SupabaseDiagnostics() {
  const [results, setResults] = useState<any[]>([]);

  const runTest = async (name: string, fn: () => Promise<any>) => {
    setResults(prev => [...prev, { name, status: 'testing...' }]);
    try {
      const data = await fn();
      setResults(prev => prev.map(r => r.name === name ? { name, status: 'SUCCESS', data } : r));
    } catch (error: any) {
      console.error(`Test ${name} failed:`, error);
      setResults(prev => prev.map(r => r.name === name ? { name, status: 'FAILED', error: error.message, details: error } : r));
    }
  };

  useEffect(() => {
    const runAll = async () => {
      setResults([]); // Clear previous results
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      await runTest('Auth Session', async () => {
        return session ? `Logged in as ${session.user.email}` : 'No active session (None)';
      });

      await runTest('Fetch Transactions', async () => {
        const query = supabase.from('transactions').select('*').limit(1);
        if (userId) {
          query.eq('user_id', userId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
      });

      if (userId) {
        await runTest('Edge Function Hello (ai-chat)', async () => {
          const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: { message: 'hello', userId: userId }
          });
          if (error) throw error;
          return data;
        });
      } else {
        setResults(prev => [...prev, { name: 'Edge Function Hello (ai-chat)', status: 'SKIPPED', error: 'User must be logged in to test AI' }]);
      }
    };
    runAll();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: 'white', fontFamily: 'monospace' }}>
      <h2>Supabase Diagnostics</h2>
      {results.map(r => (
        <div key={r.name} style={{ margin: '10px 0', border: '1px solid #333', padding: '10px' }}>
          <strong>{r.name}</strong>: 
          <span style={{ color: r.status === 'SUCCESS' ? '#4ade80' : r.status === 'FAILED' ? '#f87171' : r.status === 'SKIPPED' ? '#94a3b8' : '#fbbf24', marginLeft: '10px' }}>
            {r.status}
          </span>
          {r.error && <div style={{ color: '#f87171', fontSize: '12px' }}>Error: {r.error}</div>}
          {r.data && <pre style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>{JSON.stringify(r.data, null, 2)}</pre>}
        </div>
      ))}
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', cursor: 'pointer' }}>
          Run Again
        </button>
      </div>
    </div>
  );
}
