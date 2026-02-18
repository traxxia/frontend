import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, ArrowLeft, ArrowRight, Building2 } from 'lucide-react';
import '../styles/AdminTableStyles.css';

/**
 * AdminTable — reusable premium table for admin panels.
 *
 * Props:
 *  title            {string}    Table heading
 *  count            {number}    Optional count shown in badge next to title
 *  countLabel       {string}    Label for count badge, e.g. "Companies" (defaults to "Records")
 *  columns          {Array}     [{ key, label, render? }]
 *                               render(value, row) => ReactNode — optional custom cell renderer
 *  data             {Array}     Array of row objects
 *  searchTerm       {string}    Controlled search value
 *  onSearchChange   {Function}  Called with new search string
 *  searchPlaceholder{string}
 *  currentPage      {number}
 *  totalPages       {number}
 *  onPageChange     {Function}
 *  totalItems       {number}
 *  itemsPerPage     {number}
 *  emptyMessage     {string}
 *  emptySubMessage  {string}
 *  loading          {boolean}
 *  showFilter       {boolean}   Show Filter button (default true)
 *  showSort         {boolean}   Show Sort button (default true)
 */
const AdminTable = ({
    title,
    count,
    countLabel = 'Records',
    columns = [],
    data = [],
    searchTerm = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalItems = 0,
    itemsPerPage = 10,
    emptyMessage = 'No records found',
    emptySubMessage = '',
    loading = false,
    showFilter = false,
    showSort = false,
    toolbarContent = null,
}) => {
    // ---- Pagination helpers ----
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = [];
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
        ) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="admin-table-wrapper">
            {/* ---- Header Bar ---- */}
            <div className="admin-table-header">
                <div className="admin-table-title-group">
                    <h2 className="admin-table-title">{title}</h2>
                    {count !== undefined && count !== null && (
                        <span className="admin-table-count-badge">
                            {count} {countLabel}
                        </span>
                    )}
                </div>

                <div className="admin-table-actions">
                    {toolbarContent}
                    {onSearchChange && (
                        <div className="admin-search-wrapper">
                            <Search size={15} className="admin-search-icon" />
                            <input
                                type="text"
                                className="admin-search-input"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                    )}
                    {showFilter && (
                        <button className="admin-table-btn">
                            <SlidersHorizontal size={14} />
                            Filter
                        </button>
                    )}
                    {showSort && (
                        <button className="admin-table-btn">
                            <ArrowUpDown size={14} />
                            Sort
                        </button>
                    )}
                </div>
            </div>

            {/* ---- Table Body ---- */}
            {loading ? (
                <div className="admin-table-loading">
                    <div className="admin-spinner" />
                    <span>Loading...</span>
                </div>
            ) : data.length === 0 ? (
                <div className="admin-table-empty">
                    <Building2 size={40} strokeWidth={1.5} />
                    <h3>{emptyMessage}</h3>
                    {emptySubMessage && <p>{emptySubMessage}</p>}
                </div>
            ) : (
                <div className="admin-table-scroll">
                    <table className="admin-data-table">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        style={{ textAlign: col.align || (col.key === 'actions' ? 'right' : 'left') }}
                                    >
                                        <div className="th-inner" style={{ justifyContent: col.align === 'right' || (!col.align && col.key === 'actions') ? 'flex-end' : 'flex-start' }}>
                                            {col.label}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rowIdx) => (
                                <tr key={row._id || row.id || rowIdx}>
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            style={{ textAlign: col.align || (col.key === 'actions' ? 'right' : 'left') }}
                                        >
                                            <div
                                                className="td-inner"
                                                style={{
                                                    justifyContent: col.align === 'right' || (!col.align && col.key === 'actions') ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                {col.render
                                                    ? col.render(row[col.key], row)
                                                    : row[col.key] ?? '-'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ---- Pagination ---- */}
            {!loading && totalPages > 1 && (
                <div className="admin-pagination">
                    <span className="admin-pagination-info">
                        Showing {startItem}–{endItem} of {totalItems}
                    </span>
                    <div className="admin-pagination-controls">
                        <button
                            className="admin-page-btn"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ArrowLeft size={13} />
                            Previous
                        </button>

                        {getPageNumbers().map((page, idx) =>
                            page === '...' ? (
                                <span key={`ellipsis-${idx}`} className="admin-page-ellipsis">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    className={`admin-page-number ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => onPageChange(page)}
                                >
                                    {page}
                                </button>
                            )
                        )}

                        <button
                            className="admin-page-btn"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ArrowRight size={13} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTable;
