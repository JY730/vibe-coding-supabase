"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * 포트원 V2 SDK 타입 정의
 */
declare global {
  interface Window {
    PortOne?: {
      requestIssueBillingKey: (params: IssueBillingKeyParams) => Promise<IssueBillingKeyResponse>;
    };
  }
}

/**
 * 빌링키 발급 요청 파라미터
 */
interface IssueBillingKeyParams {
  storeId: string;
  channelKey: string;
  billingKeyMethod: "CARD" | "MOBILE";
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
  };
}

/**
 * 빌링키 발급 응답
 */
interface IssueBillingKeyResponse {
  code?: string;
  message?: string;
  billingKey?: string;
}

/**
 * 결제 API 요청 데이터
 */
interface PaymentRequestData {
  billingKey: string;
  orderName: string;
  amount: number;
  customer: {
    id: string;
  };
  customData?: string;
}

/**
 * 결제 API 응답 데이터
 */
interface PaymentResponseData {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

/**
 * 포트원 V2 빌링키 발급 및 결제 훅
 */
export const usePayment = () => {
  const router = useRouter();

  /**
   * 구독하기 버튼 클릭 핸들러
   * 1. 빌링키 발급
   * 2. 결제 API 요청
   * 3. 성공 시 매거진 페이지로 이동
   */
  const handleSubscribe = async () => {
    try {
      // 1. 포트원 SDK 로드 확인
      if (!window.PortOne) {
        alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 2. 로그인 상태 확인 및 사용자 정보 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
        router.push("/auth/login");
        return;
      }

      const userId = session.user.id;
      const accessToken = session.access_token;

      // 3. 환경 변수 확인
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

      if (!storeId || !channelKey) {
        console.error("포트원 환경 변수 누락:", { storeId, channelKey });
        alert("결제 설정이 올바르지 않습니다. 관리자에게 문의하세요.");
        return;
      }

      console.log("포트원 빌링키 발급 요청:", { storeId, channelKey });

      // 4. 빌링키 발급 요청
      const issueResponse = await window.PortOne.requestIssueBillingKey({
        storeId,
        channelKey,
        billingKeyMethod: "CARD",
        customer: {
          id: userId,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "고객명",
          email: session.user.email || "customer@example.com",
        },
      });

      // 5. 빌링키 발급 실패 처리
      if (issueResponse.code !== undefined) {
        console.error("빌링키 발급 실패:", issueResponse);
        alert(issueResponse.message || "빌링키 발급에 실패했습니다.");
        return;
      }

      // 6. 빌링키 발급 성공 확인
      if (!issueResponse.billingKey) {
        console.error("빌링키 없음:", issueResponse);
        alert("빌링키가 발급되지 않았습니다.");
        return;
      }

      console.log("빌링키 발급 성공:", issueResponse.billingKey);

      // 7. 결제 API 요청
      const paymentRequestData: PaymentRequestData = {
        billingKey: issueResponse.billingKey,
        orderName: "IT 매거진 월간 구독",
        amount: 9900,
        customer: {
          id: userId,
        },
        customData: userId, // 로그인된 user_id
      };

      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`, // 인증토큰
        },
        body: JSON.stringify(paymentRequestData),
      });

      const paymentData: PaymentResponseData = await paymentResponse.json();

      // 8. 결제 실패 처리
      if (!paymentData.success) {
        console.error("결제 실패:", paymentData);
        alert(paymentData.message || "결제에 실패했습니다.");
        return;
      }

      // 9. 결제 성공 처리
      console.log("결제 성공:", paymentData);
      alert("구독에 성공하였습니다.");
      router.push("/magazines");

    } catch (error) {
      console.error("Payment Error:", error);
      alert(error instanceof Error ? error.message : "결제 처리 중 오류가 발생했습니다.");
    }
  };

  return {
    handleSubscribe,
  };
};

