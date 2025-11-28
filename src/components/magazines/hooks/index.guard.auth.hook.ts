"use client";

import { supabase } from "@/lib/supabase";

/**
 * 로그인 액션GUARD 훅
 * 로그인 여부를 검사하고, 비로그인시 알림을 띄우고 작업을 중단합니다.
 */
export const useAuthGuard = () => {
  /**
   * 로그인 여부를 검사하고, 비로그인시 알림을 띄우고 작업을 중단하는 함수
   * @returns 로그인 여부 (true: 로그인됨, false: 비로그인)
   */
  const checkAuth = async (): Promise<boolean> => {
    // TEST 조건: window.__TEST_BYPASS__가 true이면 가드를 무시
    if (typeof window !== "undefined" && (window as Window & { __TEST_BYPASS__?: boolean }).__TEST_BYPASS__ === true) {
      return true;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // 비로그인시 알림을 띄우고 작업을 중단
        alert("로그인 후 이용 가능합니다");
        return false;
      }

      return true;
    } catch (error) {
      console.error("로그인 상태 확인 오류:", error);
      alert("로그인 후 이용 가능합니다");
      return false;
    }
  };

  /**
   * 로그인 액션GUARD를 실행하는 래퍼 함수
   * 로그인되어 있을 때만 콜백 함수를 실행합니다.
   * @param callback 로그인되어 있을 때 실행할 콜백 함수
   */
  const withAuthGuard = async <T,>(
    callback: () => T | Promise<T>
  ): Promise<T | null> => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return null;
    }
    return await callback();
  };

  return {
    checkAuth,
    withAuthGuard,
  };
};

