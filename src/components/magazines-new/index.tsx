'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './styles.module.css';

export default function MagazinesNew() {
  const [formData, setFormData] = useState({
    image: null as File | null,
    category: '',
    title: '',
    description: '',
    content: '',
    tags: ''
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categoryOptions = [
    { value: 'ai', label: '인공지능' },
    { value: 'webdev', label: '웹개발' },
    { value: 'cloud', label: '클라우드' },
    { value: 'security', label: '보안' },
    { value: 'mobile', label: '모바일' },
    { value: 'datascience', label: '데이터사이언스' },
    { value: 'blockchain', label: '블록체인' },
    { value: 'devops', label: 'DevOps' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleCategorySelect = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: 실제 제출 로직 구현
  };

  return (
    <div className={styles.container}>
      {/* gap1: 1400 * 32 */}
      <div className={styles.gap1}></div>
      
      {/* list-button: 1400 * 40 */}
      <div className={styles.listButton}>
        <button className={styles.backButton}>
          <Image 
            src="/icons/left-arrow.svg" 
            alt="뒤로가기" 
            width={18} 
            height={18}
          />
          <span>목록으로</span>
        </button>
      </div>
      
      {/* gap1: 1400 * 32 */}
      <div className={styles.gap1}></div>
      
      {/* title: 1400 * 56 */}
      <div className={styles.title}>
        <div className={styles.titleContent}>
          <h1>새 아티클 등록</h1>
          <p>IT 매거진에 새로운 기술 아티클을 등록합니다</p>
        </div>
      </div>
      
      {/* gap2: 1400 * 40 */}
      <div className={styles.gap2}></div>
      
      {/* content: 1400 * auto */}
      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 이미지 파일 업로드 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>이미지 파일</label>
            <div 
              className={`${styles.imageUploadArea} ${isDragOver ? styles.dragOver : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={styles.imageUploadContent}>
                <Image 
                  src="/icons/image.svg" 
                  alt="이미지 아이콘" 
                  width={48} 
                  height={48}
                />
                <div className={styles.imageUploadText}>
                  <p className={styles.imageUploadMainText}>클릭하여 이미지 선택</p>
                  <p className={styles.imageUploadSubText}>또는 드래그 앤 드롭</p>
                  <p className={styles.imageUploadHint}>JPG, PNG, GIF (최대 10MB)</p>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.hiddenFileInput}
              />
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              카테고리 <span className={styles.required}>*</span>
            </label>
            <div className={styles.customDropdown} ref={dropdownRef}>
              <div 
                className={`${styles.dropdownTrigger} ${formData.category ? styles.selected : ''}`}
                onClick={toggleDropdown}
              >
                <span className={styles.dropdownText}>
                  {formData.category 
                    ? categoryOptions.find(opt => opt.value === formData.category)?.label
                    : '카테고리를 선택해주세요'
                  }
                </span>
                <Image 
                  src="/icons/bottom-chevron.svg" 
                  alt="드롭다운" 
                  width={20} 
                  height={20}
                  className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.rotated : ''}`}
                />
              </div>
              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {categoryOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`${styles.dropdownItem} ${formData.category === option.value ? styles.selectedItem : ''}`}
                      onClick={() => handleCategorySelect(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 제목 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>제목</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="예: 2025년 AI 트렌드: 생성형 AI의 진화"
              className={styles.input}
            />
          </div>

          {/* 한줄 소개 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>한줄 소개</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="아티클을 간단히 소개해주세요 (1-2문장)"
              className={styles.input}
            />
          </div>

          {/* 상세 내용 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>상세 내용</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="아티클의 상세 내용을 작성해주세요..."
              className={styles.textarea}
              rows={10}
            />
          </div>

          {/* 태그 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>태그</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="#React #TypeScript #JavaScript"
              className={styles.input}
            />
            <p className={styles.tagHint}>
              공백으로 구분하여 입력해주세요 (예: #React #Node.js #WebDev)
            </p>
          </div>

          {/* 제출 버튼 */}
          <button type="submit" className={styles.submitButton}>
            아티클 등록하기
          </button>
        </form>
      </div>
      
      {/* gap2: 1400 * 40 */}
      <div className={styles.gap2}></div>
    </div>
  );
}
