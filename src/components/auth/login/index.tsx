"use client";

import React from "react";
import Image from "next/image";
import styles from "./styles.module.css";
import { useGoogleLogin } from "./hooks/index.login.google.hook";

interface LoginComponentProps {
  handleGoogleLogin?: () => Promise<void>;
}

const LoginComponent = ({
  handleGoogleLogin: propHandleGoogleLogin,
}: LoginComponentProps = {}) => {
  const { handleGoogleLogin: hookHandleGoogleLogin } = useGoogleLogin();
  const handleGoogleLogin = propHandleGoogleLogin ?? hookHandleGoogleLogin;

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        {/* 로고 영역 */}
        <div className={styles.logoSection}>
          <div className={styles.logoContainer}>
            <Image
              src="/icons/book.svg"
              alt="IT 매거진 로고"
              width={64}
              height={64}
              className={styles.logo}
            />
          </div>
        </div>

        {/* 텍스트 영역 */}
        <div className={styles.textSection}>
          <h1 className={styles.title}>IT 매거진</h1>
          <p className={styles.subtitle}>
            최신 기술 트렌드와 인사이트를 한곳에서
          </p>
          <p className={styles.description}>
            로그인하고 개인 맞춤형 콘텐츠를 추천받으세요
          </p>
        </div>

        {/* 구글 로그인 버튼 */}
        <button className={styles.googleButton} onClick={handleGoogleLogin}>
          <Image
            src="/images/google.svg"
            alt="Google"
            width={24}
            height={24}
            className={styles.googleIcon}
          />
          <span className={styles.googleText}>Google로 계속하기</span>
        </button>

        {/* 구분선 */}
        <div className={styles.divider}>
          <div className={styles.dividerLine}></div>
          <div className={styles.dividerText}>또는</div>
        </div>

        {/* 로그인 없이 둘러보기 버튼 */}
        <div className={styles.guestButtonContainer}>
          <button className={styles.guestButton}>
            <span className={styles.guestButtonText}>
              로그인 없이 무료 콘텐츠 둘러보기
            </span>
          </button>

          {/* 약관 동의 텍스트 */}
          <div className={styles.termsText}>
            <span>로그인하면 </span>
            <a href="#" className={styles.termsLink}>
              이용약관
            </a>
            <span> 및 </span>
            <a href="#" className={styles.termsLink}>
              개인정보처리방침
            </a>
            <span>에 동의하게 됩니다</span>
          </div>
        </div>

        {/* 하단 기능 목록 */}
        <div className={styles.featuresSection}>
          <div className={styles.featureItem}>
            <Image
              src="/icons/check-circle.svg"
              alt="체크"
              width={20}
              height={20}
              className={styles.featureIcon}
            />
            <span className={styles.featureText}>무료 회원가입</span>
          </div>
          <div className={styles.featureItem}>
            <Image
              src="/icons/tag.svg"
              alt="태그"
              width={20}
              height={20}
              className={styles.featureIcon}
            />
            <span className={styles.featureText}>맞춤형 콘텐츠 추천</span>
          </div>
          <div className={styles.featureItem}>
            <Image
              src="/icons/bookmark.svg"
              alt="북마크"
              width={20}
              height={20}
              className={styles.featureIcon}
            />
            <span className={styles.featureText}>북마크 & 저장</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
