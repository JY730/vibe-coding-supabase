'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';
import Image from 'next/image';
import { useMagazines } from './hooks/index.binding.hook';
import { supabase } from '@/lib/supabase';

export default function Magazines() {
  const router = useRouter();
  const { magazines, loading, error } = useMagazines();

  const resolveImageSrc = (raw: string | null | undefined): string => {
    const value = (raw || '').trim();
    if (value === '') return '/images/detail-image.png';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
    // 썸네일 변환: width 323px, resize: contain
    // format 옵션을 생략하면 자동으로 WebP로 최적화됨
    const { data } = supabase.storage.from('vibe-coding-storage').getPublicUrl(value, {
      transform: {
        width: 323,
        resize: 'contain'
      }
    });
    const thumbnailUrl = data.publicUrl || '';
    return thumbnailUrl || '/images/detail-image.png';
  };

  // 카테고리 value를 label로 매핑
  const getCategoryLabel = (category: string): string => {
    const labelMap: { [key: string]: string } = {
      'ai': '인공지능',
      'web': '웹개발',
      'webdev': '웹개발',
      'cloud': '클라우드',
      'security': '보안',
      'mobile': '모바일',
      'data': '데이터사이언스',
      'datascience': '데이터사이언스',
      'blockchain': '블록체인',
      'devops': 'DevOps',
      'other': '기타'
    };
    return labelMap[category] || category; // 매핑되지 않은 경우 원본 값 반환
  };

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      'ai': '#8b5cf6',
      'webdev': '#22c55e',
      'cloud': '#3b82f6',
      'security': '#ef4444',
      'mobile': '#ec4899',
      'datascience': '#f59e0b',
      'blockchain': '#14b8a6',
      'devops': '#6366f1',
      'other': '#6b7280'
    };
    return colorMap[category] || colorMap['other'];
  };

  // 매거진 카드 클릭 핸들러
  const handleMagazineClick = (id: string) => {
    router.push(`/magazines/${id}`);
  };

  // 로딩 상태 처리
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>매거진을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>매거진을 불러오는데 실패했습니다: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header 영역 */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerNav}>
            {/* 로그인 버튼 */}
            <button className={styles.loginButton} onClick={() => router.push('/auth/login')}>
              <Image src="/icons/login.svg" alt="로그인" width={18} height={18} />
              <span className={styles.buttonText}>로그인</span>
            </button>
            
            {/* 글쓰기 버튼 */}
            <button className={styles.writeButton} onClick={() => router.push('/magazines/new')}>
              <Image src="/icons/write.svg" alt="글쓰기" width={18} height={18} />
              <span className={styles.buttonText}>글쓰기</span>
            </button>
            
            {/* 구독하기 버튼 */}
            <button className={styles.subscribeButton} onClick={() => router.push('/payments')}>
              <Image src="/icons/subscribe.svg" alt="구독하기" width={18} height={18} />
              <span className={styles.buttonText}>구독하기</span>
            </button>
          </div>
        </div>
      </header>

      {/* Gap */}
      <div className={styles.gap}></div>

      {/* Title 영역 */}
      <section className={styles.titleSection}>
        <h1 className={styles.title}>IT 매거진</h1>
        <p className={styles.subtitle}>최신 기술 트렌드와 인사이트를 전합니다</p>
      </section>

      {/* Gap */}
      <div className={styles.gap2}></div>

      {/* Main 영역 */}
      <main className={styles.main}>
        <div className={styles.articlesGrid}>
          {magazines.map((magazine) => (
            <article 
              key={magazine.id} 
              className={styles.magazineCard}
              onClick={() => handleMagazineClick(magazine.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* 이미지 영역 */}
              <div className={styles.cardImageContainer}>
                <Image
                  src={resolveImageSrc(magazine.image_url)}
                  alt={magazine.title}
                  width={323}
                  height={200}
                  className={styles.cardImage}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  unoptimized
                />
                <div 
                  className={styles.categoryOverlay}
                  style={{ backgroundColor: getCategoryColor(magazine.category) }}
                >
                  {getCategoryLabel(magazine.category)}
                </div>
              </div>
              
              {/* 콘텐츠 영역 */}
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{magazine.title}</h2>
                <p className={styles.cardDescription}>{magazine.description}</p>
                
                {/* 태그 영역 */}
                <div className={styles.tagsContainer}>
                  {magazine.tags && magazine.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Gap */}
      <div className={styles.gap2}></div>
    </div>
  );
};
