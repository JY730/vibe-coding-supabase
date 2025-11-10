"use client";

import React from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePayment } from '@/app/payments/hooks/index.payment.hook';

export default function Payments() {
  const router = useRouter();
  const { handleSubscribe } = usePayment();

  const handleListClick = () => {
    router.push('/magazines');
  };

  return (
    <div className={styles.container}>
      {/* Gap1 - 1400 * 32 */}
      <div className={styles.gap1}></div>

      {/* List Button - 1400 * 40 */}
      <div className={styles.listButton}>
        <button className={styles.listButtonInner} onClick={handleListClick}>
          <Image 
            src="/icons/left-arrow.svg" 
            alt="left arrow" 
            width={18} 
            height={18} 
            className={styles.leftArrow}
          />
          <span>목록으로</span>
        </button>
      </div>

      {/* Gap1 - 1400 * 32 */}
      <div className={styles.gap1}></div>

      {/* Title - 1400 * 56 */}
      <div className={styles.title}>
        <div className={styles.titleGroup}>
          <h1>IT 매거진 구독</h1>
          <p>프리미엄 콘텐츠를 제한 없이 이용하세요</p>
        </div>
      </div>

      {/* Gap2 - 1400 * 40 */}
      <div className={styles.gap2}></div>

      {/* Content - 1400 * auto */}
      <div className={styles.content}>
        <div className={styles.subscriptionCard}>
          {/* Subscription Header */}
          <div className={styles.subscriptionHeader}>
            <h2>월간 구독</h2>
            <p>모든 IT 매거진 콘텐츠에 무제한 접근</p>
          </div>

          {/* Price Section */}
          <div className={styles.priceSection}>
            <div className={styles.priceContainer}>
              <span className={styles.price}>9,900원</span>
              <span className={styles.priceUnit}>/월</span>
            </div>
          </div>

          {/* Features List */}
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <Image 
                src="/icons/check.svg" 
                alt="check" 
                width={20} 
                height={20} 
                className={styles.checkIcon}
              />
              <span>모든 프리미엄 아티클 열람</span>
            </div>
            <div className={styles.featureItem}>
              <Image 
                src="/icons/check.svg" 
                alt="check" 
                width={20} 
                height={20} 
                className={styles.checkIcon}
              />
              <span>최신 기술 트렌드 리포트</span>
            </div>
            <div className={styles.featureItem}>
              <Image 
                src="/icons/check.svg" 
                alt="check" 
                width={20} 
                height={20} 
                className={styles.checkIcon}
              />
              <span>광고 없는 읽기 환경</span>
            </div>
            <div className={styles.featureItem}>
              <Image 
                src="/icons/check.svg" 
                alt="check" 
                width={20} 
                height={20} 
                className={styles.checkIcon}
              />
              <span>언제든지 구독 취소 가능</span>
            </div>
          </div>

          {/* Subscribe Button */}
          <button className={styles.subscribeButton} onClick={handleSubscribe}>
            구독하기
          </button>
        </div>
      </div>

      {/* Gap2 - 1400 * 40 */}
      <div className={styles.gap2}></div>
    </div>
  );
}
