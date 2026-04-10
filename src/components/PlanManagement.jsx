import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Loader } from 'lucide-react';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import AdminTable from './AdminTable';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store/authStore';
import '../styles/PlanManagement.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const PlanModal = ({ show, plan, onClose, onSave, isSubmitting, onToast }) => {
    const { t } = useTranslation();
    const [showStatusConfirm, setShowStatusConfirm] = useState(false);
    const [pendingData, setPendingData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        features: [],
        period: 'month',
        workspace_limit: '',
        limit_projects: false,
        limit_collaborators: '',
        limit_viewers: '',
        limit_users: '',
        insight: false,
        strategic: false,
        pmf: false,
        isActive: true
    });

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name || '',
                description: plan.description || '',
                price: plan.price !== undefined ? plan.price : '',
                period: plan.period || 'month',
                features: plan.features ? (Array.isArray(plan.features) ? plan.features : plan.features.split(',').map(f => f.trim()).filter(f => f !== '')) : [],
                workspace_limit:
                    plan.limits?.workspaces !== undefined ? plan.limits.workspaces
                        : (plan.workspace_limit !== undefined ? plan.workspace_limit
                            : (plan.max_workspaces !== undefined ? plan.max_workspaces : '')),
                limit_projects: plan.limits?.project !== undefined ? Boolean(plan.limits.project)
                    : (plan.limits?.projects !== undefined ? Boolean(plan.limits.projects)
                        : (plan.can_create_projects !== undefined ? Boolean(plan.can_create_projects)
                            : (plan.max_projects !== undefined ? Boolean(plan.max_projects) : false))),
                limit_collaborators: plan.limits?.collaborators !== undefined ? plan.limits.collaborators
                    : (plan.max_collaborators !== undefined ? plan.max_collaborators : ''),
                limit_viewers: plan.limits?.viewers !== undefined ? plan.limits.viewers
                    : (plan.max_viewers !== undefined ? plan.max_viewers : ''),
                limit_users: plan.limits?.users !== undefined ? plan.limits.users
                    : (plan.max_users !== undefined ? plan.max_users : ''),
                insight: plan.limits?.insight !== undefined ? plan.limits.insight
                    : (plan.insight !== undefined ? plan.insight : false),
                strategic: plan.limits?.strategic !== undefined ? plan.limits.strategic
                    : (plan.strategic !== undefined ? plan.strategic : false),
                pmf: plan.limits?.pmf !== undefined ? plan.limits.pmf
                    : (plan.pmf !== undefined ? plan.pmf : false),
                isActive: plan.status !== 'inactive'
            });
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                period: 'month',
                features: [],
                workspace_limit: '',
                limit_projects: false,
                limit_collaborators: '',
                limit_viewers: '',
                limit_users: '',
                insight: false,
                strategic: false,
                pmf: false,
                isActive: true
            });
        }
    }, [plan, show]);

    useEffect(() => {
        const featuresList = [];
        if (formData.workspace_limit) featuresList.push(`Up to ${formData.workspace_limit} Workspaces`);
        if (formData.limit_users) featuresList.push(`Up to ${formData.limit_users} Users`);
        if (formData.limit_collaborators) featuresList.push(`Up to ${formData.limit_collaborators} Collaborators`);
        if (formData.limit_viewers) featuresList.push(`Up to ${formData.limit_viewers} Viewers`);
        if (formData.insight) featuresList.push('Insight Access');
        if (formData.strategic) featuresList.push('Strategic Access');
        if (formData.pmf) featuresList.push('PMF Access');
        if (formData.limit_projects) featuresList.push('Projects Access');

        setFormData(prev => ({ ...prev, features: featuresList }));
    }, [
        formData.workspace_limit,
        formData.limit_users,
        formData.limit_collaborators,
        formData.limit_viewers,
        formData.insight,
        formData.strategic,
        formData.pmf,
        formData.limit_projects
    ]);

    if (!show) return null;

    const handleKeyDown = (e) => {
        const { name } = e.target;
        
        // Basic keys that should always be allowed
        const isControlKey = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key);
        if (isControlKey) return;

        // Prevent navigation keys like 'e', '+', '-', etc. that are sometimes allowed in type="number"
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
            return;
        }

        if (name === 'price') {
            // Allow only digits and one dot
            if (e.key === '.') {
                if (formData.price.toString().includes('.')) {
                    e.preventDefault();
                }
            } else if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        } else if (['workspace_limit', 'limit_users', 'limit_collaborators', 'limit_viewers'].includes(name)) {
            // Allow only digits
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Immediate status toggle confirmation removed as per requirement: 
        // Confirmation now happens on Save for all edits.

        let processedValue = type === 'checkbox' ? checked : value;

        // Double-check and filter value during change (catches paste, etc.)
        if (name === 'price') {
            // Allow only numbers and a single dot
            processedValue = value.replace(/[^0-9.]/g, '');
            const dots = processedValue.split('.').length - 1;
            if (dots > 1) {
                const parts = processedValue.split('.');
                processedValue = parts[0] + '.' + parts.slice(1).join('');
            }
        } else if (['workspace_limit', 'limit_users', 'limit_collaborators', 'limit_viewers'].includes(name)) {
            // Allow only whole numbers
            processedValue = value.replace(/[^0-9]/g, '');
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const confirmStatusChange = () => {
        if (pendingData) {
            onSave(pendingData);
            setPendingData(null);
        }
        setShowStatusConfirm(false);
    };

    const cancelStatusChange = () => {
        setPendingData(null);
        setShowStatusConfirm(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const name = formData.name.trim();
        if (!name) {
            onToast(t('plan_name_required'), 'error');
            return;
        }

        if (!/[a-zA-Z]/.test(name)) {
            onToast(t('plan_name_invalid'), 'error');
            return;
        }

        const description = formData.description.trim();
        if (!description) {
            onToast(t('plan_description_required'), 'error');
            return;
        }

        if (!/[a-zA-Z]/.test(description)) {
            onToast(t('plan_description_invalid'), 'error');
            return;
        }

        if (!formData.period) {
            onToast(t('period_required'), 'error');
            return;
        }

        // Strict regex for price: non-negative, up to 2 decimal places
        const priceStr = formData.price.toString().trim();
        if (priceStr === '' || !/^\d+(\.\d{1,2})?$/.test(priceStr)) {
            onToast(t('price_invalid'), 'error');
            return;
        }

        const workspaceLimitValue = formData.workspace_limit !== '' ? Number(formData.workspace_limit) : undefined;
        const maxCollaborators = formData.limit_collaborators !== '' ? Number(formData.limit_collaborators) : undefined;
        const maxViewers = formData.limit_viewers !== '' ? Number(formData.limit_viewers) : undefined;
        const maxUsers = formData.limit_users !== '' ? Number(formData.limit_users) : undefined;

        if ((workspaceLimitValue !== undefined && (isNaN(workspaceLimitValue) || workspaceLimitValue < 0)) ||
            (maxCollaborators !== undefined && (isNaN(maxCollaborators) || maxCollaborators < 0)) ||
            (maxViewers !== undefined && (isNaN(maxViewers) || maxViewers < 0)) ||
            (maxUsers !== undefined && (isNaN(maxUsers) || maxUsers < 0))) {
            onToast(t('limits_negative'), 'error');
            return;
        }

        const submitData = {
            name: formData.name,
            description: formData.description,
            currency: 'USD',
            price: Number(formData.price),
            period: formData.period,
            features: formData.features.map(f => f.trim()).filter(f => f !== ''),
            limits: {
                workspaces: workspaceLimitValue,
                project: formData.limit_projects,
                collaborators: maxCollaborators,
                viewers: maxViewers,
                users: maxUsers,
                insight: formData.insight,
                strategic: formData.strategic,
                pmf: formData.pmf
            },
            status: formData.isActive ? 'active' : 'inactive'
        };

        if (plan) {
            // Edit mode: trigger confirmation before saving
            setPendingData(submitData);
            setShowStatusConfirm(true);
            return;
        }

        // Create mode: proceed immediately
        onSave(submitData);
    };

    return (
        <Modal show={show} onHide={onClose} size="lg" centered backdrop="static" dialogClassName="plan-modal-dialog">
            {/* ── Header: title left, status badge right ── */}
            <Modal.Header closeButton className="plan-modal-header">
                <div className="plan-modal-header-inner">
                    <Modal.Title className="plan-modal-title">
                        {plan ? t('edit_plan') : t('create_plan')}
                    </Modal.Title>
                    <div className="plan-status-toggle-wrap">
                        <span className="plan-status-label">{t('status')}</span>
                        <input
                            className="form-check-input plan-status-switch"
                            type="checkbox"
                            role="switch"
                            id="planStatusSwitch"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            disabled={!plan && !formData.name.trim()}
                            style={(!plan && !formData.name.trim()) ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                        />
                        <span className={`plan-status-text ${formData.isActive ? 'text-active' : 'text-inactive'}`}>
                            {formData.isActive ? t('active') : t('inactive')}
                        </span>
                    </div>
                </div>
            </Modal.Header>

            <form onSubmit={handleSubmit}>
                <Modal.Body className="plan-modal-body">

                    {/* ── Section 1: Basic Info ── */}
                    <div className="plan-section">
                        <p className="plan-section-label">{t('basic_info')}</p>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="plan-field-label">{t('plan_name')} <span className="required-star">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    className="plan-form-input"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Starter"
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="plan-field-label">{t('description')} <span className="required-star">*</span></label>
                                <textarea
                                    name="description"
                                    className="plan-form-input plan-textarea"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    placeholder="Brief description of this plan"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Section 2: Pricing ── */}
                    <div className="plan-section">
                        <p className="plan-section-label">{t('pricing')}</p>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="plan-field-label">
                                    {t('Price')} <span className="required-star">*</span> <span className="plan-currency-tag">USD</span>
                                    {plan && <span className="plan-readonly-note">{t('not_editable')}</span>}
                                </label>
                                <div className="plan-price-input-wrap">
                                    <span className="plan-price-symbol">$</span>
                                    <input
                                        type="number"
                                        name="price"
                                        className="plan-form-input plan-price-input"
                                        value={formData.price}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        required
                                        min="0"
                                        step="0.01"
                                        readOnly={!!plan}
                                        placeholder="0.00"
                                        style={plan ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <label className="plan-field-label">{t('billing_period')} <span className="required-star">*</span></label>
                                <select
                                    name="period"
                                    className="plan-form-input"
                                    value={formData.period}
                                    onChange={handleChange}
                                >
                                    <option value="month">{t('month')}</option>
                                    <option value="year">{t('year')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Section 3: Limits ── */}
                    <div className="plan-section">
                        <p className="plan-section-label">{t('plan_limits')}</p>
                        <div className="row g-3">
                            <div className="col-md-3 col-6">
                                <label className="plan-field-label">{t('workspace_limit')}</label>
                                <input
                                    type="number"
                                    name="workspace_limit"
                                    className="plan-form-input"
                                    value={formData.workspace_limit}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g. 1"
                                    min="0"
                                />
                            </div>
                            <div className="col-md-3 col-6">
                                <label className="plan-field-label">{t('users')}</label>
                                <input
                                    type="number"
                                    name="limit_users"
                                    className="plan-form-input"
                                    value={formData.limit_users}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g. 5"
                                    min="0"
                                />
                            </div>
                            <div className="col-md-3 col-6">
                                <label className="plan-field-label">{t('collaborators')}</label>
                                <input
                                    type="number"
                                    name="limit_collaborators"
                                    className="plan-form-input"
                                    value={formData.limit_collaborators}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g. 10"
                                    min="0"
                                />
                            </div>
                            <div className="col-md-3 col-6">
                                <label className="plan-field-label">{t('viewers')}</label>
                                <input
                                    type="number"
                                    name="limit_viewers"
                                    className="plan-form-input"
                                    value={formData.limit_viewers}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g. 20"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Section 4: Feature Access ── */}
                    <div className="plan-section">
                        <p className="plan-section-label">{t('feature_access')}</p>
                        <div className="plan-access-grid">
                            <label className="plan-access-card">
                                <input
                                    type="checkbox"
                                    name="insight"
                                    checked={formData.insight}
                                    onChange={handleChange}
                                    className="plan-access-checkbox"
                                />
                                <span className="plan-access-indicator" />
                                <span className="plan-access-name">{t('insight_access')}</span>
                            </label>

                            <label className="plan-access-card">
                                <input
                                    type="checkbox"
                                    name="strategic"
                                    checked={formData.strategic}
                                    onChange={handleChange}
                                    className="plan-access-checkbox"
                                />
                                <span className="plan-access-indicator" />
                                <span className="plan-access-name">{t('strategic_access')}</span>
                            </label>

                            <label className="plan-access-card">
                                <input
                                    type="checkbox"
                                    name="pmf"
                                    checked={formData.pmf}
                                    onChange={handleChange}
                                    className="plan-access-checkbox"
                                />
                                <span className="plan-access-indicator" />
                                <span className="plan-access-name">{t('pmf_access')}</span>
                            </label>

                            {formData.pmf && (
                                <label className="plan-access-card plan-access-card--sub">
                                    <input
                                        type="checkbox"
                                        name="limit_projects"
                                        checked={formData.limit_projects}
                                        onChange={handleChange}
                                        className="plan-access-checkbox"
                                    />
                                    <span className="plan-access-indicator" />
                                    <span className="plan-access-name">{t('projects_access')}</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* ── Section 5: Generated Features Preview ── */}
                    <div className="plan-section plan-section--last">
                        <p className="plan-section-label">{t('features_preview')}</p>
                        <div className="plan-features-preview">
                            {formData.features.length > 0 ? (
                                <ul className="plan-features-list">
                                    {formData.features.map((feature, index) => (
                                        <li key={index} className="plan-features-item">
                                            <span className="plan-features-dot" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="plan-features-empty">
                                    {t('no_features_generated')}
                                </p>
                            )}
                        </div>
                    </div>

                </Modal.Body>

                <Modal.Footer className="plan-modal-footer">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="plan-btn-cancel">
                        {t('cancel')}
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting} className="plan-btn-save d-flex align-items-center gap-2">
                        {isSubmitting && <Loader size={15} className="spinner" />}
                        {t('save')}
                    </Button>
                </Modal.Footer>
            </form>

            {/* ── Status Confirm Sub-Modal ── */}
            <Modal
                show={showStatusConfirm}
                onHide={cancelStatusChange}
                centered
                backdrop="static"
                size="sm"
                dialogClassName="status-confirm-modal"
                className="status-confirm-modal-container"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="status-confirm-title">
                        {formData.isActive 
                            ? (t('confirm_plan_update') || 'Confirm Plan Update')
                            : (t('Confirm Status Change') || 'Confirm Status Change')
                        }
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2 pb-3">
                    {formData.isActive ? (
                        <>
                            <p className="status-confirm-text-primary">
                                {t('plan_update_active_msg')}
                            </p>
                            <p className="status-confirm-text-secondary">
                                {t('plan_update_secondary_msg')}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="status-confirm-text-primary">
                                {t('status_change_active_msg')}
                            </p>
                            <p className="status-confirm-text-secondary">
                                {t('status_change_secondary_msg')}
                            </p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={cancelStatusChange} className="status-confirm-btn">
                        {t('cancel')}
                    </Button>
                    <Button variant="danger" onClick={confirmStatusChange} className="status-confirm-btn">
                        {t('proceed')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Modal>
    );
};

const PlanManagement = ({ onToast }) => {
    const { t } = useTranslation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [modalState, setModalState] = useState({
        show: false,
        plan: null,
        isSubmitting: false
    });

    const getAuthToken = () => useAuthStore.getState().token;

    const loadPlans = useCallback(async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            const response = await axios.get(`${API_BASE_URL}/api/plans`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-include-inactive': 'true'
                }
            });
            setPlans(response.data.plans || []);
        } catch (error) {
            console.error('Error loading plans:', error);
            onToast(error.response?.data?.error || 'Failed to load plans', 'error');
        } finally {
            setLoading(false);
        }
    }, [onToast]);

    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;
        loadPlans();
    }, [loadPlans]);

    const handleSavePlan = async (planData) => {
        setModalState(prev => ({ ...prev, isSubmitting: true }));
        try {
            const token = getAuthToken();
            const isEdit = !!modalState.plan;
            const url = isEdit
                ? `${API_BASE_URL}/api/plans/${modalState.plan._id}`
                : `${API_BASE_URL}/api/plans`;
            const request = isEdit ? axios.put : axios.post;
            await request(url, planData, { headers: { 'Authorization': `Bearer ${token}` } });
            const successMsg = isEdit ? t('plan_updated_success') : t('plan_created_success');
            onToast(successMsg || `Plan successfully ${isEdit ? 'updated' : 'created'}`, 'success');
            setModalState({ show: false, plan: null, isSubmitting: false });
            loadPlans();
        } catch (error) {
            console.error('Error saving plan:', error);
            const defaultError = !!modalState.plan ? t('failed_to_update_plan') : t('failed_to_create_plan');
            const errorMsg = error.response?.data?.error || defaultError;
            onToast(errorMsg, 'error');
            setModalState(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    const handleEditClick = (plan) => {
        setModalState({ show: true, plan, isSubmitting: false });
    };

    const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const paginatedPlans = filteredPlans.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(filteredPlans.length / pageSize);

    const columns = [
        {
            key: 'name',
            label: t('plan_name'),
            render: (val) => <span className="admin-cell-primary">{val}</span>,
        },
        {
            key: 'price',
            label: t('price'),
            render: (val, row) => <span className="admin-cell-primary">${val} / {t(row.period) || row.period}</span>,
        },
        {
            key: 'description',
            label: t('description') || 'Description',
            render: (val) => (
                <span className="admin-cell-secondary" style={{ maxWidth: '300px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {val}
                </span>
            ),
        },
        {
            key: 'status',
            label: t('status') || 'Status',
            render: (_, row) => (
                <span className={`admin-status-badge ${row.status === 'inactive' ? 'inactive' : 'active'}`}>
                    {row.status === 'inactive' ? (t('inactive') || 'Inactive') : (t('active') || 'Active')}
                </span>
            ),
        },
        {
            key: 'actions',
            label: t('actions') || 'Actions',
            render: (_, row) => (
                <button
                    className="admin-action-btn edit-plan-btn"
                    onClick={() => handleEditClick(row)}
                >
                    <Edit size={15} /> {t('edit') || 'Edit'}
                </button>
            ),
        }
    ];

    return (
        <div className="plan-management-wrapper">
            <div className="admin-header">
                <button
                    className="create-plan-btn"
                    onClick={() => setModalState({ show: true, plan: null, isSubmitting: false })}
                >
                    <Plus size={16} /> {t('create_plan')}
                </button>
            </div>

            <AdminTable
                title={t('plan_management')}
                count={filteredPlans.length}
                countLabel={t('plans')}
                columns={columns}
                data={paginatedPlans}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={t('search plans')}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredPlans.length}
                itemsPerPage={pageSize}
                emptyMessage={t('no_plans_found')}
                emptySubMessage={t('no_plans_matching_criteria')}
                loading={loading}
            />

            <PlanModal
                show={modalState.show}
                plan={modalState.plan}
                isSubmitting={modalState.isSubmitting}
                onClose={() => setModalState({ show: false, plan: null, isSubmitting: false })}
                onSave={handleSavePlan}
                onToast={onToast}
            />
        </div>
    );
};

export default PlanManagement;