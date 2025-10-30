'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Magazine {
  id: string;
  image_url: string;
  category: string;
  title: string;
  description: string;
  tags: string[] | null;
}

export interface UseMagazinesReturn {
  magazines: Magazine[];
  loading: boolean;
  error: string | null;
}

export const useMagazines = (): UseMagazinesReturn => {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMagazines = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('magazine')
          .select('id, image_url, category, title, description, tags')
          .limit(10);

        if (fetchError) {
          throw fetchError;
        }

        setMagazines(data || []);
      } catch (err) {
        console.error('Error fetching magazines:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch magazines');
      } finally {
        setLoading(false);
      }
    };

    fetchMagazines();
  }, []);

  return { magazines, loading, error };
};
