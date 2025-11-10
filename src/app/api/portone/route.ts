import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PORTONE_SECRET = process.env.PORTONE_SECRET || '';

// 서버 사이드에서 사용할 Supabase 클라이언트 (Service Role Key 사용)
const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 체크
    if (!PORTONE_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'PORTONE_SECRET 환경 변수가 설정되지 않았습니다.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { payment_id, status } = body;

    console.log('📥 포트원 웹훅 수신:', { payment_id, status });

    // 1. 결제 정보 조회
    console.log('🔍 1단계: 포트원 결제 정보 조회 시작...');
    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${payment_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `PortOne ${PORTONE_SECRET}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error('❌ 포트원 결제 정보 조회 실패:', paymentResponse.status);
      throw new Error('포트원 결제 정보 조회 실패');
    }

    const paymentData = await paymentResponse.json();
    console.log('✅ 포트원 결제 정보 조회 성공:', paymentData);

    // 2. Supabase에 결제 정보 저장
    console.log('💾 2단계: Supabase에 결제 정보 저장 시작...');
    
    const supabase = getSupabaseClient();
    
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

    const paymentRecord = {
      transaction_key: payment_id,
      amount: paymentData.amount?.total || 0,
      status: 'Paid',
      start_at: now.toISOString(),
      end_at: endAt.toISOString(),
      end_grace_at: endGraceAt.toISOString(),
      next_schedule_at: nextScheduleAt.toISOString(),
      next_schedule_id: nextScheduleId,
    };

    const { data: insertedPayment, error: insertError } = await supabase
      .from('payment')
      .insert(paymentRecord)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Supabase 저장 실패:', insertError);
      throw new Error(`Supabase 저장 실패: ${insertError.message}`);
    }

    console.log('✅ Supabase 저장 성공:', insertedPayment);

    // 3. 다음 달 구독 예약
    console.log('📅 3단계: 다음 달 구독 예약 시작...');
    
    const schedulePayload = {
      payment: {
        billingKey: paymentData.billingKey,
        orderName: paymentData.orderName,
        customer: {
          id: paymentData.customer?.id,
        },
        amount: {
          total: paymentData.amount?.total || 0,
        },
        currency: 'KRW',
      },
      timeToPay: nextScheduleAt.toISOString(),
    };

    const scheduleResponse = await fetch(
      `https://api.portone.io/payments/${nextScheduleId}/schedule`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `PortOne ${PORTONE_SECRET}`,
        },
        body: JSON.stringify(schedulePayload),
      }
    );

    if (!scheduleResponse.ok) {
      const errorText = await scheduleResponse.text();
      console.error('❌ 구독 예약 실패:', scheduleResponse.status, errorText);
      throw new Error(`구독 예약 실패: ${errorText}`);
    }

    const scheduleData = await scheduleResponse.json();
    console.log('✅ 구독 예약 성공:', scheduleData);

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
            billingKey: paymentData.billingKey,
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
        step3_subscription_schedule: {
          status: 'completed',
          message: '다음 달 구독 예약 완료',
          data: {
            next_schedule_id: nextScheduleId,
            next_schedule_at: nextScheduleAt.toISOString(),
          },
        },
      },
      timestamp: new Date().toISOString(),
    };

    console.log('✅ 전체 프로세스 완료');
    console.log('📋 체크리스트:', JSON.stringify(checklist, null, 2));

    return NextResponse.json(checklist);
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

