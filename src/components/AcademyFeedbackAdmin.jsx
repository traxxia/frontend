import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import AdminTable from './AdminTable';
import { ThumbsUp, ThumbsDown, MessageSquareMore } from 'lucide-react';

const AcademyFeedbackAdmin = ({ onToast }) => {
    const { t } = useTranslation();
    const [feedbackData, setFeedbackData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterHelpful, setFilterHelpful] = useState('all'); // 'all', 'yes', 'no'
    const [currentPage, setCurrentPage] = useState(1);

    // Configurable items per page
    const itemsPerPage = 10;

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
    const getAuthToken = () => sessionStorage.getItem('token');

    useEffect(() => {
        loadFeedback();
    }, []);

    const loadFeedback = async () => {
        try {
            setIsLoading(true);
            const token = getAuthToken();

            // Adjust the endpoint if necessary based on your actual backend route (e.g., /api/admin/academy-feedback)
            const response = await fetch(`${API_BASE_URL}/api/academy-feedback`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Assuming the backend returns an array of objects directly or a { feedback: [...] } object
                const feedbackArray = Array.isArray(data) ? data : data.feedback || data.data || [];

                // Sort by date descending (newest first)
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

    // Derived state: Filtering and Search
    const filteredFeedback = useMemo(() => {
        return feedbackData.filter(item => {
            // 1. Helpfulness Filter
            if (filterHelpful === 'yes' && item.helpful !== true) return false;
            if (filterHelpful === 'no' && item.helpful !== false) return false;

            // 2. Search Term Filter (Search by articleId, feedback text, or userId)
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

    // Derived state: Pagination
    const totalItems = filteredFeedback.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Reset to page 1 if data filtering changes the total page count below current page
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

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
                // Read from created_at first since that's what the API returns 
                const dateVal = row.created_at || row.createdAt || row.date;
                if (!dateVal) return '-';
                const dateObj = new Date(dateVal);
                return (
                    <div className="admin-cell-secondary">
                        {dateObj.toLocaleDateString()}
                    </div>
                );
            }
        },
        {
            key: 'articleId',
            label: 'Article',
            width: '150px',
            render: (val) => <span className="admin-cell-secondary admin-text-mono">{val || '-'}</span>
        },
        {
            key: 'helpful',
            label: 'Helpful?',
            width: '100px',
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
            key: 'feedback',
            label: 'Feedback / Comments',
            render: (val) => (
                <div className="admin-cell-primary admin-feedback-text">
                    {val || <span className="admin-text-italic">No comment provided</span>}
                </div>
            )
        },
        {
            key: 'userName',
            label: 'User Info',
            width: '150px',
            render: (val) => {
                if (!val) {
                    return <div className="admin-cell-secondary admin-text-italic admin-text-sm">Anonymous</div>;
                }

                // If the backend is ever updated to populate the user (.populate('userId', 'name email'))
                if (typeof val === 'object' && val !== null) {
                    return (
                        <div className="admin-cell-primary admin-text-sm">
                            <div className="admin-font-medium">{val.name || 'Unknown User'}</div>
                            {val.email && <div className="admin-cell-secondary admin-text-xs">{val.email}</div>}
                        </div>
                    );
                }

                // Temporary display when backend only returns the ID string
                return (
                    <div className="admin-cell-secondary admin-text-sm">
                        <span className="admin-text-mono">{val}</span>
                    </div>
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

                // Search functionality
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search by article or feedback..."

                // Custom Toolbar for filters
                toolbarContent={MyFilterToolbar}

                // Pagination 
                totalItems={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}

                emptyMessage={filterHelpful !== 'all' || searchTerm ? "No feedback matches your filter" : "No feedback collected yet"}
            />
        </div>
    );
};

export default AcademyFeedbackAdmin;
