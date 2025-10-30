import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export interface MagazineFormData {
  image: File | null;
  category: string;
  title: string;
  description: string;
  content: string;
  tags: string;
}

export interface UseSubmitMagazineReturn {
  isSubmitting: boolean;
  error: string | null;
  submitMagazine: (formData: MagazineFormData) => Promise<void>;
}

export const useSubmitMagazine = (): UseSubmitMagazineReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submitMagazine = async (formData: MagazineFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // 태그 문자열을 배열로 변환 (공백으로 구분)
      const tagsArray = formData.tags 
        ? formData.tags.split(' ').filter(tag => tag.trim() !== '').map(tag => tag.replace('#', ''))
        : null;

      // Supabase에 매거진 데이터 삽입
      const { data, error: insertError } = await supabase
        .from('magazine')
        .insert([
          {
            image_url: null, // 요구사항에 따라 무시
            category: formData.category,
            title: formData.title,
            description: formData.description,
            content: formData.content,
            tags: tagsArray
          }
        ])
        .select()
        .single();

      if (insertError) {
        throw new Error(`매거진 등록 실패: ${insertError.message}`);
      }

      if (!data) {
        throw new Error('매거진 등록에 실패했습니다.');
      }

      // 성공 알림
      alert('등록에 성공하였습니다.');
      
      // 등록된 매거진 상세 페이지로 이동
      router.push(`/magazines/${data.id}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('매거진 등록 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    submitMagazine
  };
};
