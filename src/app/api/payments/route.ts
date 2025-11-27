import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * PortOne V2 결제 API
 * 
 * @description
 * billingKey를 사용하여 PortOne에 결제를 요청하는 API
 * 
 * @method POST
 * @endpoint /api/payments
 */

// 요청 데이터 타입 정의
interface PaymentRequest {
  billingKey: string;
  orderName: string;
  amount: number;
  customer: {
    id: string;
  };
  customData?: string;
}

// 응답 데이터 타입 정의
interface PaymentResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

// PortOne API 요청 바디 타입
interface PortOnePaymentBody {
  billingKey: string;
  orderName: string;
  amount: {
    total: number;
  };
  customer: {
    id: string;
  };
  customData?: string;
  currency: string;
}

// Supabase 클라이언트 생성 헬퍼 함수
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const body: PaymentRequest = await request.json();
    
    // 2. 필수 필드 검증
    if (!body.billingKey || !body.orderName || !body.amount || !body.customer?.id) {
      return NextResponse.json(
        {
          success: false,
          message: '필수 필드가 누락되었습니다. (billingKey, orderName, amount, customer.id)',
        } as PaymentResponse,
        { status: 400 }
      );
    }

    // 3. 인가: API 요청자 검증 (가장 간단한 인가 방식)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: '인증 토큰이 필요합니다.',
        } as PaymentResponse,
        { status: 401 }
      );
    }

    const authToken = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClient();

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: '인증에 실패했습니다.',
        } as PaymentResponse,
        { status: 401 }
      );
    }

    const userId = user.id;

    // 4. 결제가능여부 검증: 인가된 user_id === customer.id
    if (userId !== body.customer.id) {
      return NextResponse.json(
        {
          success: false,
          message: '결제 권한이 없습니다.',
        } as PaymentResponse,
        { status: 403 }
      );
    }

    // 5. paymentId 생성 (고유한 결제 ID)
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 6. PortOne API 요청 바디 구성
    const portOneBody: PortOnePaymentBody = {
      billingKey: body.billingKey,
      orderName: body.orderName,
      amount: {
        total: body.amount,
      },
      customer: {
        id: body.customer.id,
      },
      customData: userId, // 로그인된 user_id를 customData에 저장
      currency: 'KRW',
    };

    // 7. PortOne API Secret 키 확인
    const portOneSecret = process.env.PORTONE_API_SECRET;
    if (!portOneSecret) {
      return NextResponse.json(
        {
          success: false,
          message: 'PortOne API Secret이 설정되지 않았습니다.',
        } as PaymentResponse,
        { status: 500 }
      );
    }

    // 8. PortOne V2 API 호출
    const portOneApiUrl = `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/billing-key`;

    const portOneResponse = await fetch(portOneApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `PortOne ${portOneSecret}`,
      },
      body: JSON.stringify(portOneBody),
    });

    // 9. PortOne 응답 처리
    const portOneData = await portOneResponse.json();

    if (!portOneResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: 'PortOne 결제 요청이 실패했습니다.',
          data: portOneData,
        } as PaymentResponse,
        { status: portOneResponse.status }
      );
    }

    // 10. 성공 응답 반환 (DB 저장 없이)
    return NextResponse.json(
      {
        success: true,
        message: '결제가 성공적으로 처리되었습니다.',
        data: portOneData,
      } as PaymentResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Payment API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.',
      } as PaymentResponse,
      { status: 500 }
    );
  }
}

