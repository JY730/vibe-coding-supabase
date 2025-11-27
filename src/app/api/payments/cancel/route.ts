import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * PortOne V2 결제 취소 API
 *
 * @description
 * transactionKey를 사용하여 PortOne에 결제 취소를 요청하는 API
 *
 * @method POST
 * @endpoint /api/payments/cancel
 */

// 요청 데이터 타입 정의
interface CancelRequest {
  transactionKey: string;
}

// 응답 데이터 타입 정의
interface CancelResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

// PortOne API 취소 요청 바디 타입
interface PortOneCancelBody {
  reason: string;
}

// Supabase 클라이언트 생성 헬퍼 함수
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const body: CancelRequest = await request.json();

    // 2. 필수 필드 검증
    if (!body.transactionKey) {
      return NextResponse.json(
        {
          success: false,
          message: "필수 필드가 누락되었습니다. (transactionKey)",
        } as CancelResponse,
        { status: 400 }
      );
    }

    // 3. 인가: API 요청자 검증 (가장 간단한 인가 방식)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "인증 토큰이 필요합니다.",
        } as CancelResponse,
        { status: 401 }
      );
    }

    const authToken = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient();

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "인증에 실패했습니다.",
        } as CancelResponse,
        { status: 401 }
      );
    }

    const userId = user.id;

    // 4. 취소가능여부 검증: payment 테이블 조회
    const { data: paymentData, error: paymentError } = await supabase
      .from("payment")
      .select("*")
      .eq("user_id", userId)
      .eq("transaction_key", body.transactionKey)
      .single();

    if (paymentError || !paymentData) {
      return NextResponse.json(
        {
          success: false,
          message: "취소 가능한 결제 내역을 찾을 수 없습니다.",
        } as CancelResponse,
        { status: 404 }
      );
    }

    // 5. PortOne API Secret 키 확인
    const portOneSecret = process.env.PORTONE_API_SECRET;
    if (!portOneSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "PortOne API Secret이 설정되지 않았습니다.",
        } as CancelResponse,
        { status: 500 }
      );
    }

    // 6. PortOne API 취소 요청 바디 구성
    const portOneCancelBody: PortOneCancelBody = {
      reason: "취소 사유 없음",
    };

    // 7. PortOne V2 결제 취소 API 호출
    const portOneApiUrl = `https://api.portone.io/payments/${encodeURIComponent(
      body.transactionKey
    )}/cancel`;

    const portOneResponse = await fetch(portOneApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `PortOne ${portOneSecret}`,
      },
      body: JSON.stringify(portOneCancelBody),
    });

    // 8. PortOne 응답 처리
    const portOneData = await portOneResponse.json();

    if (!portOneResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "PortOne 결제 취소 요청이 실패했습니다.",
          data: portOneData,
        } as CancelResponse,
        { status: portOneResponse.status }
      );
    }

    // 9. 성공 응답 반환 (DB 저장 없이)
    return NextResponse.json(
      {
        success: true,
      } as CancelResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment Cancel API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "결제 취소 처리 중 오류가 발생했습니다.",
      } as CancelResponse,
      { status: 500 }
    );
  }
}
