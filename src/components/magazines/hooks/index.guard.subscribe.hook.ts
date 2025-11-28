"use client";

import { supabase } from "@/lib/supabase";

interface PaymentRecord {
  id: string;
  transaction_key: string;
  status: string;
  start_at: string | null;
  end_grace_at: string | null;
  created_at: string;
  user_id: string;
}

/**
 * 구독 액션GUARD 훅
 * 구독 여부를 검사하고, 비구독시 알림을 띄우고 작업을 중단합니다.
 */
export const useSubscribeGuard = () => {
  /**
   * 구독 여부를 검사하는 함수
   * @returns 구독 여부 (true: 구독중, false: 비구독)
   */
  const checkSubscribe = async (): Promise<boolean> => {
    // TEST 조건: window.__TEST_BYPASS__가 true이면 가드를 무시
    if (typeof window !== "undefined" && (window as Window & { __TEST_BYPASS__?: boolean }).__TEST_BYPASS__ === true) {
      return true;
    }

    try {
      // 현재 세션에서 사용자 정보 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        // 로그인되지 않은 경우 비구독으로 처리
        alert("구독 후 이용 가능합니다.");
        return false;
      }

      const userId = session.user.id;

      // 1-1-1) 내 결제 정보만 필터링: user_id === 로그인된 user_id
      const { data, error: supabaseError } = await supabase
        .from('payment')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      const records = (data as PaymentRecord[] | null) ?? [];

      if (records.length === 0) {
        // 결제 정보가 없는 경우 비구독
        alert("구독 후 이용 가능합니다.");
        return false;
      }

      // 1-1-2) 그룹화: transaction_key 그룹화, 각 그룹에서 created_at 최신 1건씩 추출
      const grouped = new Map<string, PaymentRecord>();

      for (const record of records) {
        const existing = grouped.get(record.transaction_key);

        if (!existing) {
          grouped.set(record.transaction_key, record);
          continue;
        }

        const currentCreatedAt = new Date(record.created_at).getTime();
        const existingCreatedAt = new Date(existing.created_at).getTime();

        if (currentCreatedAt > existingCreatedAt) {
          grouped.set(record.transaction_key, record);
        }
      }

      // 1-1-3) 위 그룹 결과에서 조회: status === "Paid"이고 start_at <= 현재시각 <= end_grace_at
      const now = new Date();

      const activePayments = Array.from(grouped.values()).filter((record) => {
        if (record.status !== 'Paid') {
          return false;
        }

        if (!record.start_at || !record.end_grace_at) {
          return false;
        }

        const startAt = new Date(record.start_at);
        const endGraceAt = new Date(record.end_grace_at);

        return startAt <= now && now <= endGraceAt;
      });

      if (activePayments.length === 0) {
        // 활성 구독이 없는 경우 비구독
        alert("구독 후 이용 가능합니다.");
        return false;
      }

      return true;
    } catch (error) {
      console.error("구독 상태 확인 오류:", error);
      alert("구독 후 이용 가능합니다.");
      return false;
    }
  };

  /**
   * 구독 액션GUARD를 실행하는 래퍼 함수
   * 구독되어 있을 때만 콜백 함수를 실행합니다.
   * @param callback 구독되어 있을 때 실행할 콜백 함수
   */
  const withSubscribeGuard = async <T,>(
    callback: () => T | Promise<T>
  ): Promise<T | null> => {
    const isSubscribed = await checkSubscribe();
    if (!isSubscribed) {
      return null;
    }
    return await callback();
  };

  return {
    checkSubscribe,
    withSubscribeGuard,
  };
};

