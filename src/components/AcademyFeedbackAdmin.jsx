import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import AdminTable from './AdminTable';
import { ThumbsUp, ThumbsDown, MessageSquareMore, Eye } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { Modal, Button } from 'react-bootstrap';

import { useAuthStore } from '../store/authStore';

const AcademyFeedbackAdmin = ({ onToast }) => {
    const { t } = useTranslation();
    const [feedbackData, setFeedbackData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterHelpful, setFilterHelpful] = useState('all'); // 'all', 'yes', 'no'
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPageBeforeSearch, setLastPageBeforeSearch] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState('');

    const handleCloseModal = () => setShowModal(false);
    const handleShowModal = (feedback) => {
        setSelectedFeedback(feedback);
        setShowModal(true);
    };

    // Configurable items per page
    const itemsPerPage = 10;

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
    const getAuthToken = () => useAuthStore.getState().token;

    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;
        loadFeedback();
    }, []);

    const loadFeedback = async () => {
        try {
            setIsLoading(true);
            const token = getAuthToken();

            const response = await fetch(`${API_BASE_URL}/api/academy-feedback`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const feedbackArray = Array.isArray(data) ? data : data.feedback || data.data || [];

                const sortedFeedback = feedbackArray.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.createdAt || a.date);
                    const dateB = new Date(b.created_at || b.createdAt || b.date);
                    return dateB - dateA;
                });

                setFeedbackData(sortedFeedback);
            } else {
                onToast('Failed to load academy feedback', 'error');
            }
        } catch (error) {
            console.error('Error loading academy feedback:', error);
            onToast('Error loading feedback data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredFeedback = useMemo(() => {
        return feedbackData.filter(item => {
            if (filterHelpful === 'yes' && item.helpful !== true) return false;
            if (filterHelpful === 'no' && item.helpful !== false) return false;

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const textMatch = item.feedback?.toLowerCase().includes(term);
                const articleMatch = item.articleId?.toLowerCase().includes(term);
                const userMatch = item.userId?.toLowerCase().includes(term);

                if (!textMatch && !articleMatch && !userMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [feedbackData, searchTerm, filterHelpful]);

    const totalItems = filteredFeedback.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Handle search term changes to manage page state
    useEffect(() => {
        if (searchTerm) {
            if (lastPageBeforeSearch === null) {
                setLastPageBeforeSearch(currentPage);
                setCurrentPage(1);
            }
        } else if (!searchTerm && lastPageBeforeSearch !== null) {
            setCurrentPage(lastPageBeforeSearch);
            setLastPageBeforeSearch(null);
        }
    }, [searchTerm]);
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredFeedback.slice(start, end);
    }, [filteredFeedback, currentPage, itemsPerPage]);

    const columns = [
        {
            key: 'date',
            label: 'Date',
            width: '120px',
            render: (val, row) => {
                const dateVal = row.created_at || row.createdAt || row.date;
                if (!dateVal) return '-';
                return (
                    <div className="admin-cell-secondary">
                        {formatDate(dateVal)}
                    </div>
                );
            }
        },
        {
            key: 'articleId',
            label: 'Article',
            width: '140px',
            render: (val) => <span className="admin-cell-secondary admin-text-mono">{val || '-'}</span>
        },
        {
            key: 'helpful',
            label: 'Helpful?',
            width: '100px',
            align: 'center',
            render: (val) => {
                if (val === true) {
                    return (
                        <span className="admin-status-badge launched admin-icon-badge">
                            <ThumbsUp size={12} /> Yes
                        </span>
                    );
                }
                return (
                    <span className="admin-status-badge inactive admin-icon-badge">
                        <ThumbsDown size={12} /> No
                    </span>
                );
            }
        },
        {
            key: 'userName',
            label: 'User Info',
            width: '180px',
            render: (val) => {
                if (!val) {
                    return <div className="admin-cell-secondary admin-text-italic admin-text-sm">Anonymous</div>;
                }

                if (typeof val === 'object' && val !== null) {
                    return (
                        <div className="admin-cell-primary admin-text-sm">
                            <div className="admin-font-medium">{val.name || 'Unknown User'}</div>
                            {val.email && <div className="admin-cell-secondary admin-text-xs">{val.email}</div>}
                        </div>
                    );
                }

                return (
                    <div className="admin-cell-secondary admin-text-sm">
                        <span className="admin-text-mono">{val}</span>
                    </div>
                );
            }
        },
        {
            key: 'feedback',
            label: 'Feedback / Comments',
            width: '150px',
            align: 'center',
            render: (val) => {
                if (!val) {
                    return <span className="admin-text-italic admin-text-sm">No comment provided</span>;
                }

                return (
                    <Button
                        variant="outline-primary"
                        size="sm"
                        className="admin-text-xs d-flex align-items-center gap-1"
                        onClick={() => handleShowModal(val)}
                        title="View full feedback"
                    >
                        <Eye size={12} /> View Feedback
                    </Button>
                );
            }
        }
    ];

    const MyFilterToolbar = (
        <div className="admin-filter-toolbar">
            <span className="admin-filter-label">Filter by:</span>
            <select
                value={filterHelpful}
                onChange={(e) => setFilterHelpful(e.target.value)}
                className="admin-filter-select"
            >
                <option value="all">All Feedback</option>
                <option value="yes">Helpful (Yes)</option>
                <option value="no">Not Helpful (No)</option>
            </select>
        </div>
    );

    return (
        <div className="academy-feedback-admin admin-fade-in">
            <AdminTable
                title="Academy Feedback"
                columns={columns}
                data={paginatedData}
                loading={isLoading}

                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search by article..."

                toolbarContent={MyFilterToolbar}

                totalItems={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}

                emptyMessage={filterHelpful !== 'all' || searchTerm ? "No feedback matches your filter" : "No feedback collected yet"}
            />

            {/* Feedback Detail Modal */}
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                centered
                scrollable
                className="admin-compact-modal"
                contentClassName="admin-feedback-modal-content"
            >
                <Modal.Header closeButton className="admin-modal-header">
                    <Modal.Title className="admin-modal-title d-flex align-items-center gap-2">
                        <MessageSquareMore size={20} className="text-primary" />
                        Feedback Details
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="admin-modal-body p-4">
                    <div className="admin-feedback-content-full">
                        <p className="admin-text-primary admin-lh-base pre-wrap" style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
                            {selectedFeedback}
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer className="admin-modal-footer">
                    <Button variant="secondary" onClick={handleCloseModal} className="admin-btn-secondary">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AcademyFeedbackAdmin;
