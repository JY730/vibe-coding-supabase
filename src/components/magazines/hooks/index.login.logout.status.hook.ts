"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface UseLoginLogoutStatusReturn {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  handleLogout: () => Promise<void>;
}

/**
 * 로그인 상태 조회 및 로그아웃을 처리하는 hook
 * @returns 로그인 상태, 사용자 정보, 로그아웃 함수
 */
export const useLoginLogoutStatus = (): UseLoginLogoutStatusReturn => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setIsLoggedIn(true);
          setUser(session.user);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("세션 확인 오류:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUser(session.user);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("로그아웃 오류:", error);
        throw error;
      }
      // 로그아웃 성공 후 로그인 페이지로 이동
      router.push("/auth/login");
    } catch (error) {
      console.error("로그아웃 처리 중 오류 발생:", error);
      throw error;
    }
  };

  return {
    isLoggedIn,
    user,
    loading,
    handleLogout,
  };
};




