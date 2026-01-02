import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import './PaginationControls.css';

export default function PaginationControls({
  pageCount,
  currentPage,
  posts = [],
  onPageChange
}) {
  const { t } = useLanguage();
  const [inputPage, setInputPage] = useState(currentPage + 1);

  useEffect(() => {
    setInputPage(currentPage + 1);
  }, [currentPage]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === "" || /^[0-9]+$/.test(val)) {
      setInputPage(val);
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    let pageNum = parseInt(inputPage, 10);
    if (!isNaN(pageNum)) {
      if (pageNum < 1) pageNum = 1;
      onPageChange(pageNum - 1);
    } else {
      setInputPage(currentPage + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInputSubmit(e);
    }
  };

  const handleBlur = (e) => {
    handleInputSubmit(e);
  };

  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="pagination-card">
      <div className="pagination-info">
        <p>{t('search.showingCharts', { count: posts.length })}</p>
      </div>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 0}
        >
          {t('search.previous')}
        </button>

        <div className="pagination-input-container">
          <span className="pagination-text">{t('search.page')}</span>
          <input
            type="text"
            className="pagination-input"
            value={inputPage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            aria-label="Page number"
          />
          <span className="pagination-text">{t('search.of')}...</span>
        </div>

        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={posts.length === 0}
        >
          {t('search.next')}
        </button>
      </div>
    </div>
  );
}
