'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface MagazineData {
  id: string;
  image_url: string;
  category: string;
  title: string;
  description: string;
  content: string;
  tags: string[] | null;
}

export interface UseMagazineDetailReturn {
  data: MagazineData | null;
  loading: boolean;
  error: string | null;
}

export function useMagazineDetail(id: string): UseMagazineDetailReturn {
  const [data, setData] = useState<MagazineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMagazine() {
      try {
        setLoading(true);
        setError(null);

        const { data: magazineData, error: fetchError } = await supabase
          .from('magazine')
          .select('id, image_url, category, title, description, content, tags')
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (magazineData) {
          setData(magazineData);
        }
      } catch (err) {
        console.error('Error fetching magazine:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch magazine');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchMagazine();
    }
  }, [id]);

  return { data, loading, error };
}
