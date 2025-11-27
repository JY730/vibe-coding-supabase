"use client";

import { supabase } from "@/lib/supabase";

/**
 * 구글 로그인을 처리하는 hook
 * @returns 구글 로그인 함수
 */
export const useGoogleLogin = () => {
  const handleGoogleLogin = async () => {
    try {
      // 현재 페이지의 origin을 가져와서 redirectTo URL 생성
      const redirectTo = `${window.location.origin}/auth/login/success`;

      // Supabase 구글 OAuth 로그인 시작
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error("구글 로그인 오류:", error);
        throw error;
      }

      // signInWithOAuth는 자동으로 구글 로그인 페이지로 리다이렉트됩니다.
      // 성공 시 redirectTo로 지정한 URL로 돌아옵니다.
    } catch (error) {
      console.error("구글 로그인 처리 중 오류 발생:", error);
      throw error;
    }
  };

  return {
    handleGoogleLogin,
  };
};
