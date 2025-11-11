import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 구독 취소 훅
 * 
 * @description
 * PortOne V2를 사용한 구독 취소 기능을 제공하는 커스텀 훅
 * 
 * @returns {Object} 구독 취소 관련 상태와 함수들
 * @returns {boolean} isLoading - 취소 요청 진행 중 여부
 * @returns {string | null} error - 에러 메시지
 * @returns {Function} cancelSubscription - 구독 취소 함수
 */

interface CancelSubscriptionParams {
  transactionKey: string;
}

interface CancelResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export const usePaymentCancel = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 구독 취소 함수
   * 
   * @param {CancelSubscriptionParams} params - 취소에 필요한 파라미터
   * @param {string} params.transactionKey - 결제 트랜잭션 키
   * @returns {Promise<boolean>} 취소 성공 여부
   */
  const cancelSubscription = async ({ transactionKey }: CancelSubscriptionParams): Promise<boolean> => {
    try {
      // 1. 로딩 시작 및 에러 초기화
      setIsLoading(true);
      setError(null);

      // 2. 필수 파라미터 검증
      if (!transactionKey) {
        throw new Error('transactionKey가 필요합니다.');
      }

      // 3. 구독 취소 API 호출
      const response = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionKey,
        }),
      });

      const data: CancelResponse = await response.json();

      // 4. 응답 처리
      if (!response.ok || !data.success) {
        throw new Error(data.message || '구독 취소에 실패했습니다.');
      }

      // 5. 성공 처리
      alert('구독이 취소되었습니다.');
      router.push('/magazines');
      
      return true;
    } catch (err) {
      // 6. 에러 처리
      const errorMessage = err instanceof Error ? err.message : '구독 취소 중 오류가 발생했습니다.';
      setError(errorMessage);
      alert(errorMessage);
      
      return false;
    } finally {
      // 7. 로딩 종료
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    cancelSubscription,
  };
};

