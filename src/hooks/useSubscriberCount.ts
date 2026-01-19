import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriberCountResult {
  count: number;
  label: string;
}

export function useSubscriberCount() {
  const [data, setData] = useState<SubscriberCountResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data: result, error } = await supabase.rpc('get_subscriber_count');
        
        if (error) {
          console.error('Error fetching subscriber count:', error);
          // Fallback to default
          setData({ count: 0, label: 'Join our community' });
        } else if (result && typeof result === 'object' && 'count' in result && 'label' in result) {
          setData({ count: result.count as number, label: result.label as string });
        } else {
          // Handle unexpected result format
          setData({ count: 0, label: 'Join our community' });
        }
      } catch (err) {
        console.error('Failed to fetch subscriber count:', err);
        setData({ count: 0, label: 'Join our community' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, []);

  return { data, isLoading };
}