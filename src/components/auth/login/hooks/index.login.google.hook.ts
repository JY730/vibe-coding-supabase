"use client";

import { supabase } from "@/lib/supabase";

/**
 * 구글 로그인을 처리하는 hook
 * @returns 구글 로그인 함수
 */
export const useGoogleLogin = () => {
  const handleGoogleLogin = async () => {
    try {
      // 환경 변수에서 명시적으로 설정된 URL이 있으면 사용, 없으면 현재 origin 사용
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${baseUrl}/auth/login/success`;

      // 디버깅을 위한 로그 (프로덕션에서는 제거 가능)
      console.log("OAuth 리다이렉트 URL:", redirectTo);
      console.log("현재 origin:", window.location.origin);

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
