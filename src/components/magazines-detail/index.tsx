'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMagazineDetail } from '@/app/magazines/[id]/hooks/index.func.binding';
import { supabase } from '@/lib/supabase';
import styles from './styles.module.css';

interface MagazinesDetailProps {
  id: string;
}

export default function MagazinesDetail({ id }: MagazinesDetailProps) {
  const router = useRouter();
  const { data, loading, error } = useMagazineDetail(id);

  // 디버깅: 데이터 확인
  React.useEffect(() => {
    if (data) {
      console.log('Magazine data:', data);
      console.log('Image URL from DB:', data.image_url);
    }
  }, [data]);

  const resolveImageSrc = (raw: string | null | undefined): string => {
    const value = (raw || '').trim();
    if (value === '') return '/images/detail-image.png';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
    
    // Supabase Storage의 이미지 변환 URL 생성: width 852px, resize contain
    // 목록 페이지와 동일한 방식 사용 (transform 옵션 사용)
    const { data } = supabase.storage
      .from('vibe-coding-storage')
      .getPublicUrl(value, {
        transform: {
          width: 852,
          resize: 'contain'
        }
      });
    
    const transformedUrl = data.publicUrl || '';
    if (!transformedUrl) {
      console.warn('Failed to generate public URL for:', value);
      return '/images/detail-image.png';
    }
    
    // format=webp 파라미터는 Supabase의 transform 옵션이 자동으로 처리하거나
    // 지원하지 않을 수 있으므로 일단 기본 변환 URL 사용
    // 필요시 브라우저가 자동으로 webp를 지원하는지 확인
    console.log('Image URL:', {
      original: value,
      transformedUrl
    });
    
    return transformedUrl;
  };

  // 카테고리 value를 label로 매핑
  const getCategoryLabel = (category: string): string => {
    const labelMap: { [key: string]: string } = {
      'ai': '인공지능',
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
      'data': '#f59e0b',
      'datascience': '#f59e0b',
      'blockchain': '#14b8a6',
      'devops': '#6366f1',
      'other': '#6b7280'
    };
    return colorMap[category] || colorMap['other'];
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          에러가 발생했습니다: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          매거진을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Gap 1 */}
      <div className={styles.gap1}></div>

      {/* Button Container */}
      <div className={styles.buttonContainer}>
        <button className={styles.listButton} onClick={() => router.push('/magazines')}>
          <Image 
            src="/icons/left-arrow.svg" 
            alt="왼쪽 화살표" 
            width={18} 
            height={18}
            className={styles.arrowIcon}
          />
          <span className={styles.buttonText}>목록으로</span>
        </button>
      </div>

      {/* Gap 1 */}
      <div className={styles.gap1}></div>

      {/* Detail Content */}
      <div className={styles.detailContent}>
        {/* Image Container */}
        <div className={styles.imageContainer}>
          <img 
            src={resolveImageSrc(data.image_url)} 
            alt={data.title}
            className={styles.contentImage}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => {
              console.error('Image load error:', {
                src: e.currentTarget.src,
                imageUrl: data.image_url
              });
              // 이미지 로드 실패 시 fallback 이미지로 변경
              e.currentTarget.src = '/images/detail-image.png';
            }}
          />
          <div className={styles.imageGradient}></div>
          <div 
            className={styles.categoryTag}
            style={{ backgroundColor: getCategoryColor(data.category) }}
          >
            <span className={styles.categoryText}>{getCategoryLabel(data.category)}</span>
          </div>
        </div>

        <div className={styles.articleContainer}>
          {/* Article Header */}
          <div className={styles.articleHeader}>
            <div className={styles.articleDate}>2025년 10월 21일</div>
            <h1 className={styles.articleTitle}>{data.title}</h1>
            <div className={styles.articleSubtitle}>
              {data.description}
            </div>
          </div>

          {/* Article Body */}
          <div className={styles.articleBody}>
            <div 
              className={styles.articleContent}
              dangerouslySetInnerHTML={{ __html: data.content }}
            />

            {/* Tags */}
            {data.tags && data.tags.length > 0 && (
              <div className={styles.tagsContainer}>
                {data.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gap 2 */}
      <div className={styles.gap2}></div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.footerButton} onClick={() => router.push('/magazines')}>목록으로 돌아가기</button>
      </div>

       {/* Gap 2 */}
       <div className={styles.gap2}></div>
    </div>
  );
}
