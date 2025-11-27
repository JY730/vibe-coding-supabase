'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePaymentCancel } from './hooks/index.payment.cancel.hook';
import { usePaymentStatus } from './hooks/index.payment.status.hook';
import { useProfile } from './hooks/index.profile.hook';
import styles from './styles.module.css';

/**
 * 날짜를 YYYY.MM 형식으로 포맷하는 헬퍼 함수
 */
const formatJoinDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}.${month}`;
  } catch {
    return '';
  }
};

/**
 * 이름에서 이니셜을 추출하는 헬퍼 함수
 */
const getInitials = (name: string): string => {
  if (!name) return 'U';
  
  // 한글 이름인 경우 첫 글자만 사용
  const isKorean = /[가-힣]/.test(name);
  if (isKorean) {
    return name.charAt(0);
  }
  
  // 영문 이름인 경우 첫 글자들 사용 (예: "John Doe" -> "JD")
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

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
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useProfile();

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

    router.push('/payments');
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
        {isProfileLoading ? (
          <div>프로필을 불러오는 중...</div>
        ) : profileError ? (
          <div className={styles.errorMessage}>{profileError}</div>
        ) : profile ? (
          <>
            <div className={styles.profileImage}>
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={120}
                  height={120}
                />
              ) : (
                <div className={styles.profileAvatarFallback}>
                  {getInitials(profile.name)}
                </div>
              )}
            </div>
            <h2 className={styles.profileName}>{profile.name}</h2>
            <p className={styles.profileDescription}>{profile.email}</p>
            <div className={styles.joinDate}>
              가입일 {formatJoinDate(profile.joinDate)}
            </div>
          </>
        ) : (
          <div>로그인이 필요합니다.</div>
        )}
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

