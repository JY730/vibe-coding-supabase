"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  joinDate: string;
}

export interface UseProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 사용자 프로필 정보를 조회하는 hook
 * @returns 프로필 정보, 로딩 상태, 에러, 재조회 함수
 */
export const useProfile = (): UseProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 현재 세션에서 사용자 정보 가져오기
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const user: User = session.user;

      // 사용자 프로필 정보 구성
      const userProfile: UserProfile = {
        id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "사용자",
        email: user.email || "",
        avatarUrl:
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        joinDate: user.created_at || new Date().toISOString(),
      };

      setProfile(userProfile);
    } catch (err) {
      console.error("프로필 조회 오류:", err);
      const message =
        err instanceof Error
          ? err.message
          : "프로필 정보를 불러오는데 실패했습니다.";
      setError(message);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await fetchProfile();
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
};
