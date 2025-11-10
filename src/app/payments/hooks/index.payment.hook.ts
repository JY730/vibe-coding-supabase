"use client";

import { useRouter } from "next/navigation";

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

      // 2. 빌링키 발급 요청
      const issueResponse = await window.PortOne.requestIssueBillingKey({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "",
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "",
        billingKeyMethod: "CARD",
        customer: {
          id: `customer_${Date.now()}`,
          name: "고객명",
          email: "customer@example.com",
        },
      });

      // 3. 빌링키 발급 실패 처리
      if (issueResponse.code !== undefined) {
        alert(issueResponse.message || "빌링키 발급에 실패했습니다.");
        return;
      }

      // 4. 빌링키 발급 성공 확인
      if (!issueResponse.billingKey) {
        alert("빌링키가 발급되지 않았습니다.");
        return;
      }

      // 5. 결제 API 요청
      const paymentRequestData: PaymentRequestData = {
        billingKey: issueResponse.billingKey,
        orderName: "IT 매거진 월간 구독",
        amount: 9900,
        customer: {
          id: `customer_${Date.now()}`,
        },
      };

      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentRequestData),
      });

      const paymentData: PaymentResponseData = await paymentResponse.json();

      // 6. 결제 실패 처리
      if (!paymentData.success) {
        alert(paymentData.message || "결제에 실패했습니다.");
        return;
      }

      // 7. 결제 성공 처리
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

