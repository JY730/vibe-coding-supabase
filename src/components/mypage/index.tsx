'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePaymentCancel } from './hooks/index.payment.cancel.hook';
import { usePaymentStatus } from './hooks/index.payment.status.hook';
import styles from './styles.module.css';

export default function Mypage() {
  const router = useRouter();
  const {
    statusMessage,
    canCancel,
    canSubscribe,
    transactionKey,
    isLoading: isStatusLoading,
    error,
    refetch,
  } = usePaymentStatus();
  const {
    isLoading: isCancelLoading,
    cancelSubscription,
  } = usePaymentCancel();

  const isProcessing = isStatusLoading || isCancelLoading;

  const handleListClick = () => {
    router.push('/magazines');
  };

  const handleCancelSubscription = async () => {
    if (!transactionKey) {
      alert('구독 정보가 없습니다.');
      return;
    }

    if (confirm('정말로 구독을 취소하시겠습니까?')) {
      const result = await cancelSubscription({ transactionKey });
      if (result) {
        await refetch();
      }
    }
  };

  const handleSubscribe = () => {
    if (isProcessing) {
      return;
    }

    router.push('/magazines');
  };

  return (
    <div className={styles.container}>
      {/* 목록으로 버튼 */}
      <button className={styles.listButton} onClick={handleListClick}>
        <div className={styles.listButtonIcon}>
          <Image
            src="/icons/left-arrow.svg"
            alt="목록으로"
            width={20}
            height={20}
          />
        </div>
        <span className={styles.listButtonText}>목록으로</span>
      </button>

      {/* 타이틀 영역 */}
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>IT 매거진 구독</h1>
        <p className={styles.subtitle}>프리미엄 콘텐츠를 제한 없이 이용하세요</p>
      </div>

      {/* 프로필 영역 */}
      <div className={styles.profileContainer}>
        <div className={styles.profileImage}>
          <Image
            src="/images/picture01.jpg"
            alt="테크러버"
            width={120}
            height={120}
          />
        </div>
        <h2 className={styles.profileName}>테크러버</h2>
        <p className={styles.profileDescription}>
          최신 IT 트렌드와 개발 이야기를 공유합니다
        </p>
        <div className={styles.joinDate}>가입일 2024.03</div>
      </div>

      {/* 구독 플랜 영역 */}
      <div className={styles.subscriptionContainer}>
        <div className={styles.subscriptionHeader}>
          <h3 className={styles.subscriptionTitle}>구독 플랜</h3>
          <div className={styles.subscriptionBadge}>
            {isStatusLoading ? '확인 중...' : statusMessage}
          </div>
        </div>

        <div className={styles.subscriptionContent}>
          <h4 className={styles.planName}>IT Magazine Premium</h4>

          <div className={styles.benefitsList}>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>
                <Image
                  src="/icons/check-circle.svg"
                  alt="체크"
                  width={16}
                  height={16}
                />
              </div>
              <span className={styles.benefitText}>
                모든 프리미엄 콘텐츠 무제한 이용
              </span>
            </div>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>
                <Image
                  src="/icons/check-circle.svg"
                  alt="체크"
                  width={16}
                  height={16}
                />
              </div>
              <span className={styles.benefitText}>
                매주 새로운 IT 트렌드 리포트
              </span>
            </div>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>
                <Image
                  src="/icons/check-circle.svg"
                  alt="체크"
                  width={16}
                  height={16}
                />
              </div>
              <span className={styles.benefitText}>
                광고 없는 깔끔한 읽기 환경
              </span>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}

          {canCancel && (
            <button
              className={styles.cancelButton}
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? '진행 중...' : '구독 취소'}
            </button>
          )}

          {canSubscribe && (
            <button
              className={styles.subscribeButton}
              onClick={handleSubscribe}
              disabled={isProcessing}
            >
              {isProcessing ? '진행 중...' : '구독하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

