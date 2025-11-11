import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const body: CancelRequest = await request.json();
    
    // 2. 필수 필드 검증
    if (!body.transactionKey) {
      return NextResponse.json(
        {
          success: false,
          message: '필수 필드가 누락되었습니다. (transactionKey)',
        } as CancelResponse,
        { status: 400 }
      );
    }

    // 3. PortOne API Secret 키 확인
    const portOneSecret = process.env.PORTONE_API_SECRET;
    if (!portOneSecret) {
      return NextResponse.json(
        {
          success: false,
          message: 'PortOne API Secret이 설정되지 않았습니다.',
        } as CancelResponse,
        { status: 500 }
      );
    }

    // 4. PortOne API 취소 요청 바디 구성
    const portOneCancelBody: PortOneCancelBody = {
      reason: '취소 사유 없음',
    };

    // 5. PortOne V2 결제 취소 API 호출
    const portOneApiUrl = `https://api.portone.io/payments/${encodeURIComponent(body.transactionKey)}/cancel`;
    
    const portOneResponse = await fetch(portOneApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `PortOne ${portOneSecret}`,
      },
      body: JSON.stringify(portOneCancelBody),
    });

    // 6. PortOne 응답 처리
    const portOneData = await portOneResponse.json();

    if (!portOneResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: 'PortOne 결제 취소 요청이 실패했습니다.',
          data: portOneData,
        } as CancelResponse,
        { status: portOneResponse.status }
      );
    }

    // 7. 성공 응답 반환 (DB 저장 없이)
    return NextResponse.json(
      {
        success: true,
        message: '결제가 성공적으로 취소되었습니다.',
        data: portOneData,
      } as CancelResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Payment Cancel API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '결제 취소 처리 중 오류가 발생했습니다.',
      } as CancelResponse,
      { status: 500 }
    );
  }
}

