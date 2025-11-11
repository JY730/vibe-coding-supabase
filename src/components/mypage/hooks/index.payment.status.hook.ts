'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PaymentRecord {
  id: string;
  transaction_key: string;
  status: string;
  start_at: string | null;
  end_grace_at: string | null;
  created_at: string;
}

interface PaymentStatus {
  statusMessage: '구독중' | 'Free';
  canCancel: boolean;
  canSubscribe: boolean;
  transactionKey: string | null;
}

interface UsePaymentStatusResult extends PaymentStatus {
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  payments: PaymentRecord[];
}

const defaultStatus: PaymentStatus = {
  statusMessage: 'Free',
  canCancel: false,
  canSubscribe: true,
  transactionKey: null,
};

export const usePaymentStatus = (): UsePaymentStatusResult => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [status, setStatus] = useState<PaymentStatus>(defaultStatus);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const evaluateStatus = useCallback((records: PaymentRecord[]) => {
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

    if (activePayments.length > 0) {
      const [latestActive] = activePayments;
      setStatus({
        statusMessage: '구독중',
        canCancel: true,
        canSubscribe: false,
        transactionKey: latestActive.transaction_key,
      });
    } else {
      setStatus(defaultStatus);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('payment')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      const records = (data as PaymentRecord[] | null) ?? [];
      setPayments(records);
      evaluateStatus(records);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '결제 정보를 불러오지 못했습니다.';
      setError(message);
      setStatus(defaultStatus);
    } finally {
      setIsLoading(false);
    }
  }, [evaluateStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return useMemo(
    () => ({
      ...status,
      isLoading,
      error,
      refetch: fetchPayments,
      payments,
    }),
    [status, isLoading, error, fetchPayments, payments],
  );
};


