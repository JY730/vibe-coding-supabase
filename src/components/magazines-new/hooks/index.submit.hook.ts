import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

      // 로그인 상태 확인 및 사용자 정보 가져오기
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
        router.push("/auth/login");
        return;
      }

      const userId = session.user.id;

      // 태그 문자열을 배열로 변환 (공백으로 구분)
      const tagsArray = formData.tags
        ? formData.tags
            .split(" ")
            .filter((tag) => tag.trim() !== "")
            .map((tag) => tag.replace("#", ""))
        : null;

      // 이미지 업로드 처리 (선택)
      let uploadedImagePath: string | null = null;
      if (formData.image) {
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const uuid =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`;

        // 요구사항: 파일명은 yyyy/mm/dd/{UUID}.jpg
        const filePath = `${yyyy}/${mm}/${dd}/${uuid}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("vibe-coding-storage")
          .upload(filePath, formData.image, {
            upsert: false,
            contentType: formData.image.type || "image/jpeg",
          });

        if (uploadError) {
          throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
        }

        uploadedImagePath = filePath;
      }

      // Supabase에 매거진 데이터 삽입
      const { data, error: insertError } = await supabase
        .from("magazine")
        .insert([
          {
            image_url: uploadedImagePath,
            category: formData.category,
            title: formData.title,
            description: formData.description,
            content: formData.content,
            tags: tagsArray,
            user_id: userId,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw new Error(`매거진 등록 실패: ${insertError.message}`);
      }

      if (!data) {
        throw new Error("매거진 등록에 실패했습니다.");
      }

      // 성공 알림
      alert("등록에 성공하였습니다.");

      // 등록된 매거진 상세 페이지로 이동
      router.push(`/magazines/${data.id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      console.error("매거진 등록 오류:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    submitMagazine,
  };
};
