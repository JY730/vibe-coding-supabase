'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 데이터가 stale로 간주되는 시간 (5분)
            staleTime: 5 * 60 * 1000,
            // 캐시된 데이터를 유지하는 시간 (10분) - v5에서 gcTime으로 변경됨
            gcTime: 10 * 60 * 1000,
            // 네트워크 오류 시 재시도 횟수
            retry: (failureCount, error) => {
              // 4xx 에러는 재시도하지 않음
              if (error instanceof Error && 'status' in error) {
                const status = (error as Error & { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            // 재시도 간격 (지수 백오프)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // 윈도우 포커스 시 자동 refetch 비활성화
            refetchOnWindowFocus: false,
            // 네트워크 재연결 시 자동 refetch
            refetchOnReconnect: true,
            // 에러 발생 시 throw 여부 (v5 신규 기능)
            throwOnError: false,
          },
          mutations: {
            // 뮤테이션 재시도 횟수
            retry: (failureCount, error) => {
              // 4xx 에러는 재시도하지 않음
              if (error instanceof Error && 'status' in error) {
                const status = (error as Error & { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 1;
            },
            // 에러 발생 시 throw 여부
            throwOnError: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}
