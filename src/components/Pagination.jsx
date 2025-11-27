import React from 'react';
import { useTranslation } from "../hooks/useTranslation";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    showPageNumbers = true,
    showPrevNext = true,
    className = '',
    totalItems = 0,
    itemsPerPage = 10,
    showInfo = true
}) => {
    const { t } = useTranslation();
    // Don't render if there's only one page or no pages
    if (totalPages <= 1) return null; 

    // Calculate pagination info
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Pagination info component
    const PaginationInfo = () => (
        showInfo && totalItems > 0 ? (
            <div className="pagination-info minimal">
                {t("showing")} {startItem}-{endItem} {t("of")} {totalItems} {t("total_entries")}
            </div>
        ) : null
    );

    // Generate page numbers
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        // For small number of pages, show all
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                range.push(i);
            }
            return range;
        }

        // Complex pagination with dots
        for (
            let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++
        ) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    const pageNumbers = getPageNumbers();
 
    return (
        <div className={`pagination-container ${className}`}>
            <div className="pagination">
                {showPrevNext && (
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="pagination-btn pagination-prev"
                    >
                        <ChevronLeft size={16} />
                        {t("previous")}
                    </button>
                )}

                {showPageNumbers && (
                    <div className="pagination-numbers">
                        {pageNumbers.map((number, index) => (
                            <button
                                style={{ margin: '0 2px' }}
                                key={index}
                                onClick={() => typeof number === 'number' && onPageChange(number)}
                                className={`pagination-number ${number === currentPage ? 'active' : ''} ${typeof number !== 'number' ? 'dots' : ''}`}
                                disabled={typeof number !== 'number'}
                            >
                                {number}
                            </button>
                        ))}
                    </div>
                )}

                {showPrevNext && (
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="pagination-btn pagination-next"
                    >
                        {t("next")}
                        <ChevronRight size={16} />
                    </button>
                )}
            </div>

            <PaginationInfo />
        </div>
    );
};

export default Pagination;