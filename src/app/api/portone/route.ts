import { NextRequest, NextResponse } from 'next/server';
import { createClient, type PostgrestError } from '@supabase/supabase-js';
import axios from 'axios';

type PortOnePaymentAmount = {
  total?: number;
};

type PortOnePaymentCustomer = {
  id?: string;
};

type PortOnePaymentMethod = {
  type?: string;
  billingKey?: string;
};

type PortOneBillingKeyPayment = {
  billingKey?: string;
  customerId?: string;
};

type PortOnePaymentData = {
  amount?: PortOnePaymentAmount;
  billingKey?: string; // fallback for 구형 타입
  orderName?: string;
  customer?: PortOnePaymentCustomer;
  method?: PortOnePaymentMethod;
  billingKeyPayment?: PortOneBillingKeyPayment;
  payment?: {
    billingKey?: string;
    customerId?: string;
    customer?: PortOnePaymentCustomer;
  };
};

type PaymentRow = {
  transaction_key: string;
  amount: number;
  status: string;
  start_at: string;
  end_at: string;
  end_grace_at: string;
  next_schedule_at: string;
  next_schedule_id: string;
};

type ScheduleItem = {
  id?: string;
  paymentId?: string;
};

type ScheduleListResponse = {
  items?: ScheduleItem[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || '';

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  return createClient(supabaseUrl, supabaseKey);
};

const extractBillingKey = (paymentData: PortOnePaymentData): string | undefined => {
  return (
    paymentData.method?.billingKey ??
    paymentData.billingKey ??
    paymentData.billingKeyPayment?.billingKey ??
    paymentData.payment?.billingKey ??
    (paymentData as { billing?: { billingKey?: string } })?.billing?.billingKey
  );
};

const extractCustomerId = (paymentData: PortOnePaymentData): string | undefined => {
  return (
    paymentData.customer?.id ??
    paymentData.billingKeyPayment?.customerId ??
    paymentData.payment?.customerId ??
    paymentData.payment?.customer?.id ??
    (paymentData as { customerId?: string }).customerId
  );
};

// Paid 시나리오 처리 함수
async function handlePaidStatus(paymentData: PortOnePaymentData, payment_id: string) {
  // 2. Supabase에 결제 정보 저장
  console.log('💾 2단계: Supabase에 결제 정보 저장 시작...');
  
  const supabase = getSupabaseClient();

  const {
    data: existingPayments,
    error: existingCheckError,
  } = (await supabase
    .from('payment')
    .select('transaction_key')
    .eq('transaction_key', payment_id)) as {
    data: Pick<PaymentRow, 'transaction_key'>[] | null;
    error: PostgrestError | null;
  };

  if (existingCheckError) {
    console.error('❌ Supabase 기존 결제 확인 실패:', existingCheckError);
    throw new Error(`Supabase 기존 결제 확인 실패: ${existingCheckError.message}`);
  }

  if (existingPayments && existingPayments.length > 0) {
    console.log(
      'ℹ️ Supabase에 이미 동일한 transaction_key가 존재하여 Paid 처리를 건너뜁니다.'
    );

    return NextResponse.json({
      success: true,
      steps: {
        step1_payment_inquiry: {
          status: 'skipped',
          message: '이미 Supabase에 저장된 결제입니다.',
          data: {
            payment_id,
          },
        },
      },
      timestamp: new Date().toISOString(),
    });
  }
  
  const now = new Date();
  const endAt = new Date(now);
  endAt.setDate(endAt.getDate() + 30);
  
  const endGraceAt = new Date(now);
  endGraceAt.setDate(endGraceAt.getDate() + 31);
  
  // 다음 결제 예약 시각: end_at + 1일 오전 10시~11시 사이 임의 시각
  const nextScheduleAt = new Date(endAt);
  nextScheduleAt.setDate(nextScheduleAt.getDate() + 1);
  nextScheduleAt.setHours(10, Math.floor(Math.random() * 60), 0, 0);
  
  // UUID 생성
  const nextScheduleId = crypto.randomUUID();

  const paymentRecord: PaymentRow = {
    transaction_key: payment_id,
    amount: paymentData.amount?.total || 0,
    status: 'Paid',
    start_at: now.toISOString(),
    end_at: endAt.toISOString(),
    end_grace_at: endGraceAt.toISOString(),
    next_schedule_at: nextScheduleAt.toISOString(),
    next_schedule_id: nextScheduleId,
  };

  const {
    data: insertedPayment,
    error: insertError,
  } = (await supabase
    .from('payment')
    .insert(paymentRecord)
    .select()
    .single()) as { data: PaymentRow | null; error: PostgrestError | null };

  if (insertError) {
    console.error('❌ Supabase 저장 실패:', insertError);
    throw new Error(`Supabase 저장 실패: ${insertError.message}`);
  }

  console.log('✅ Supabase 저장 성공:', insertedPayment);

  // 3. 다음 달 구독 예약
  console.log('📅 3단계: 다음 달 구독 예약 시작...');
  const billingKey = extractBillingKey(paymentData);
  const customerId =
    extractCustomerId(paymentData) ??
    paymentData.customer?.id ??
    paymentData.payment?.customer?.id ??
    paymentData.billingKeyPayment?.customerId ??
    `customer_${payment_id}`;

  let scheduleResult:
    | {
        status: 'completed' | 'skipped' | 'failed';
        message: string;
        data?: Record<string, unknown> | null;
      }
    | undefined;

  if (!billingKey) {
    console.warn('⚠️ 결제 정보에 billingKey가 없어 구독 예약 단계를 건너뜁니다.');
    scheduleResult = {
      status: 'skipped',
      message: 'billingKey 누락으로 구독 예약을 진행하지 못했음',
      data: null,
    };
  } else {
    const schedulePayload: Record<string, unknown> = {
      payment: {
        billingKey,
        orderName: paymentData.orderName,
        amount: {
          total: paymentData.amount?.total || 0,
        },
        currency: 'KRW',
      },
      timeToPay: nextScheduleAt.toISOString(),
    };

    (schedulePayload.payment as Record<string, unknown>).customer = {
      id: customerId,
    };

    try {
      console.log('📤 구독 예약 요청 payload:', schedulePayload);
      const scheduleResponse = await fetch(
        `https://api.portone.io/payments/${nextScheduleId}/schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
          },
          body: JSON.stringify(schedulePayload),
        }
      );

      if (!scheduleResponse.ok) {
        const errorText = await scheduleResponse.text();
        console.error('❌ 구독 예약 실패:', scheduleResponse.status, errorText);
        scheduleResult = {
          status: 'failed',
          message: '구독 예약 API 호출 실패',
          data: {
            status: scheduleResponse.status,
            error: errorText,
          },
        };
      } else {
        const scheduleData = await scheduleResponse.json();
        console.log('✅ 구독 예약 성공:', scheduleData);
        scheduleResult = {
          status: 'completed',
          message: '다음 달 구독 예약 완료',
          data: {
            next_schedule_id: nextScheduleId,
            next_schedule_at: nextScheduleAt.toISOString(),
          },
        };
      }
    } catch (scheduleError) {
      console.error('❌ 구독 예약 중 예외 발생:', scheduleError);
      scheduleResult = {
        status: 'failed',
        message: scheduleError instanceof Error ? scheduleError.message : '구독 예약 중 알 수 없는 오류',
      };
    }
  }

  // 체크리스트 생성
  const checklist = {
    success: true,
    steps: {
      step1_payment_inquiry: {
        status: 'completed',
        message: '포트원 결제 정보 조회 완료',
        data: {
          payment_id,
          amount: paymentData.amount?.total,
          billingKey: billingKey ?? null,
        },
      },
      step2_database_insert: {
        status: 'completed',
        message: 'Supabase payment 테이블 저장 완료',
        data: {
          transaction_key: payment_id,
          amount: paymentRecord.amount,
          status: paymentRecord.status,
          start_at: paymentRecord.start_at,
          end_at: paymentRecord.end_at,
          end_grace_at: paymentRecord.end_grace_at,
          next_schedule_at: paymentRecord.next_schedule_at,
          next_schedule_id: paymentRecord.next_schedule_id,
        },
      },
      step3_subscription_schedule: scheduleResult ?? {
        status: 'skipped',
        message: '구독 예약 처리 결과를 확인할 수 없음',
      },
    },
    timestamp: new Date().toISOString(),
  };

  console.log('✅ 전체 프로세스 완료');
  console.log('📋 체크리스트:', JSON.stringify(checklist, null, 2));

  return NextResponse.json(checklist);
}

// Cancelled 시나리오 처리 함수
async function handleCancelledStatus(paymentData: PortOnePaymentData, payment_id: string) {
  const supabase = getSupabaseClient();

  // 3-1-2) Supabase에서 기존 결제 정보 조회
  console.log('🔍 2단계: Supabase에서 기존 결제 정보 조회 시작...');
  
  const {
    data: existingPayment,
    error: selectError,
  } = (await supabase
    .from('payment')
    .select('*')
    .eq('transaction_key', payment_id)
    .single()) as { data: PaymentRow | null; error: PostgrestError | null };

  if (selectError || !existingPayment) {
    console.error('❌ Supabase 조회 실패:', selectError);
    throw new Error(`Supabase 조회 실패: ${selectError?.message || '데이터 없음'}`);
  }

  console.log('✅ Supabase 조회 성공:', existingPayment);

  // 3-1-3) Supabase에 취소 정보 저장
  console.log('💾 3단계: Supabase에 취소 정보 저장 시작...');
  
  const cancelRecord: PaymentRow = {
    transaction_key: existingPayment.transaction_key,
    amount: -existingPayment.amount, // 음수로 저장
    status: 'Cancel',
    start_at: existingPayment.start_at,
    end_at: existingPayment.end_at,
    end_grace_at: existingPayment.end_grace_at,
    next_schedule_at: existingPayment.next_schedule_at,
    next_schedule_id: existingPayment.next_schedule_id,
  };

  const {
    data: insertedCancel,
    error: insertError,
  } = (await supabase
    .from('payment')
    .insert(cancelRecord)
    .select()
    .single()) as { data: PaymentRow | null; error: PostgrestError | null };

  if (insertError) {
    console.error('❌ Supabase 취소 정보 저장 실패:', insertError);
    throw new Error(`Supabase 취소 정보 저장 실패: ${insertError.message}`);
  }

  console.log('✅ Supabase 취소 정보 저장 성공:', insertedCancel);

  // 3-2-1) 예약된 결제정보 조회
  console.log('🔍 4단계: 예약된 결제정보 조회 시작...');
  
  const fromDate = new Date(existingPayment.next_schedule_at);
  fromDate.setDate(fromDate.getDate() - 1);
  
  const untilDate = new Date(existingPayment.next_schedule_at);
  untilDate.setDate(untilDate.getDate() + 1);

  try {
    const billingKey = extractBillingKey(paymentData);

    if (!billingKey) {
      console.warn(
        '⚠️ 결제 정보에 billingKey가 없어 예약 조회 및 취소 단계를 건너뜁니다.'
      );

      const checklist = {
        success: true,
        steps: {
          step1_payment_inquiry: {
            status: 'completed',
            message: '포트원 결제 정보 조회 완료',
            data: {
              payment_id,
              billingKey: null,
            },
          },
          step2_database_select: {
            status: 'completed',
            message: 'Supabase 기존 결제 정보 조회 완료',
            data: {
              transaction_key: existingPayment.transaction_key,
              amount: existingPayment.amount,
              next_schedule_id: existingPayment.next_schedule_id,
            },
          },
          step3_database_insert_cancel: {
            status: 'completed',
            message: 'Supabase 취소 정보 저장 완료',
            data: {
              transaction_key: cancelRecord.transaction_key,
              amount: cancelRecord.amount,
              status: cancelRecord.status,
            },
          },
          step4_schedule_inquiry: {
            status: 'skipped',
            message: 'billingKey가 없어 예약 결제 조회를 건너뜀',
            data: null,
          },
          step5_schedule_cancel: {
            status: 'skipped',
            message: 'billingKey가 없어 예약 결제 취소를 건너뜀',
          },
        },
        timestamp: new Date().toISOString(),
      };

      console.log('✅ 전체 취소 프로세스 완료(예약 단계 생략)');
      console.log('📋 체크리스트:', JSON.stringify(checklist, null, 2));

      return NextResponse.json(checklist);
    }

    const scheduleListResponse = await axios.get<ScheduleListResponse>('https://api.portone.io/payment-schedules', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
      },
      data: {
        filter: {
          billingKey,
          from: fromDate.toISOString(),
          until: untilDate.toISOString(),
        },
      },
    });

    console.log('✅ 예약된 결제정보 조회 성공:', scheduleListResponse.data);

    // 3-2-2) schedule 객체의 id 추출
    const scheduleItems: ScheduleItem[] = scheduleListResponse.data.items || [];
    const targetSchedule = scheduleItems.find(
      (item) => item.paymentId === existingPayment.next_schedule_id
    );

    if (!targetSchedule) {
      console.warn('⚠️ 취소할 예약 결제를 찾지 못했습니다.');
    } else {
      // 3-2-3) 예약된 결제 취소
      console.log('🗑️ 5단계: 예약된 결제 취소 시작...');
      
      const cancelScheduleResponse = await axios.delete(
        'https://api.portone.io/payment-schedules',
        {
          headers: {
            'Content-Type': 'application/json',
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
          },
          data: {
            scheduleIds: [targetSchedule.id],
          },
        }
      );

      console.log('✅ 예약된 결제 취소 성공:', cancelScheduleResponse.data);
    }

    // 체크리스트 생성
    const checklist = {
      success: true,
      steps: {
        step1_payment_inquiry: {
          status: 'completed',
          message: '포트원 결제 정보 조회 완료',
          data: {
            payment_id,
            billingKey,
          },
        },
        step2_database_select: {
          status: 'completed',
          message: 'Supabase 기존 결제 정보 조회 완료',
          data: {
            transaction_key: existingPayment.transaction_key,
            amount: existingPayment.amount,
            next_schedule_id: existingPayment.next_schedule_id,
          },
        },
        step3_database_insert_cancel: {
          status: 'completed',
          message: 'Supabase 취소 정보 저장 완료',
          data: {
            transaction_key: cancelRecord.transaction_key,
            amount: cancelRecord.amount,
            status: cancelRecord.status,
          },
        },
        step4_schedule_inquiry: {
          status: targetSchedule ? 'completed' : 'skipped',
          message: targetSchedule
            ? '예약된 결제 정보 조회 완료'
            : '취소할 예약 결제를 찾지 못함',
          data: targetSchedule
            ? {
                schedule_id: targetSchedule.id,
                payment_id: targetSchedule.paymentId,
              }
            : null,
        },
        step5_schedule_cancel: {
          status: targetSchedule ? 'completed' : 'skipped',
          message: targetSchedule
            ? '예약된 결제 취소 완료'
            : '취소할 예약 결제 없음',
        },
      },
      timestamp: new Date().toISOString(),
    };

    console.log('✅ 전체 취소 프로세스 완료');
    console.log('📋 체크리스트:', JSON.stringify(checklist, null, 2));

    return NextResponse.json(checklist);
  } catch (error) {
    console.error('❌ 예약 결제 조회/취소 중 오류:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 체크
  if (!PORTONE_API_SECRET) {
      return NextResponse.json(
        {
          success: false,
        error: 'PORTONE_API_SECRET 환경 변수가 설정되지 않았습니다.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { payment_id, paymentId, status } = body;
    const resolvedPaymentId = paymentId ?? payment_id;

    if (!resolvedPaymentId) {
      console.error('❌ 유효한 paymentId를 찾을 수 없습니다:', body);
      return NextResponse.json(
        {
          success: false,
          error: '유효한 paymentId가 제공되지 않았습니다.',
        },
        { status: 400 }
      );
    }

    const normalizedStatus =
      typeof status === 'string' ? status.toLowerCase() : '';

    console.log('📥 포트원 웹훅 수신:', {
      paymentId: resolvedPaymentId,
      status,
    });

    // 1. 결제 정보 조회
    console.log('🔍 1단계: 포트원 결제 정보 조회 시작...');
    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${resolvedPaymentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error('❌ 포트원 결제 정보 조회 실패:', paymentResponse.status);
      throw new Error('포트원 결제 정보 조회 실패');
    }

    const paymentData = (await paymentResponse.json()) as PortOnePaymentData;
    console.log('✅ 포트원 결제 정보 조회 성공:', paymentData);

    // status에 따라 분기 처리
    switch (normalizedStatus) {
      case 'paid':
        return await handlePaidStatus(paymentData, resolvedPaymentId);
      case 'cancelled':
        return await handleCancelledStatus(paymentData, resolvedPaymentId);
      default:
        throw new Error(`지원하지 않는 status: ${status}`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

