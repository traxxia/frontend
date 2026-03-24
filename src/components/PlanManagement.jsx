import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Loader } from 'lucide-react';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import AdminTable from './AdminTable';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/PlanManagement.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const PlanModal = ({ show, plan, onClose, onSave, isSubmitting, onToast }) => {
    const { t } = useTranslation();
    const [showStatusConfirm, setShowStatusConfirm] = useState(false);
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
                limit_projects: plan.limits?.projects !== undefined ? Boolean(plan.limits.projects)
                    : (plan.can_create_projects !== undefined ? Boolean(plan.can_create_projects)
                        : (plan.max_projects !== undefined ? Boolean(plan.max_projects) : false)),
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
        if (formData.pmf && formData.limit_projects) featuresList.push('Projects Access');

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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'isActive' && !checked) {
            setShowStatusConfirm(true);
            return;
        }
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const confirmStatusChange = () => {
        setFormData(prev => ({ ...prev, isActive: false }));
        setShowStatusConfirm(false);
    };

    const cancelStatusChange = () => {
        setShowStatusConfirm(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            onToast(t('plan_name_required') || 'Plan name is required', 'error');
            return;
        }

        if (Number(formData.price) < 0) {
            onToast(t('price_negative') || 'Price cannot be negative', 'error');
            return;
        }

        const workspaceLimitValue = formData.workspace_limit !== '' ? Number(formData.workspace_limit) : undefined;
        const maxCollaborators = formData.limit_collaborators !== '' ? Number(formData.limit_collaborators) : undefined;
        const maxViewers = formData.limit_viewers !== '' ? Number(formData.limit_viewers) : undefined;
        const maxUsers = formData.limit_users !== '' ? Number(formData.limit_users) : undefined;

        if ((workspaceLimitValue !== undefined && workspaceLimitValue < 0) ||
            (maxCollaborators !== undefined && maxCollaborators < 0) ||
            (maxViewers !== undefined && maxViewers < 0) ||
            (maxUsers !== undefined && maxUsers < 0)) {
            onToast(t('limits_negative') || 'Limits cannot be negative', 'error');
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
                projects: formData.limit_projects,
                collaborators: maxCollaborators,
                viewers: maxViewers,
                users: maxUsers,
                insight: formData.insight,
                strategic: formData.strategic,
                pmf: formData.pmf
            },
            status: formData.isActive ? 'active' : 'inactive'
        };

        onSave(submitData);
    };

    return (
        <Modal show={show} onHide={onClose} size="lg" centered backdrop="static" dialogClassName="plan-modal-dialog">
            {/* ── Header: title left, status badge right ── */}
            <Modal.Header closeButton className="plan-modal-header">
                <div className="plan-modal-header-inner">
                    <Modal.Title className="plan-modal-title">
                        {plan ? t('edit_plan') || 'Edit Plan' : t('create_plan') || 'Create Plan'}
                    </Modal.Title>
                    <div className="plan-status-toggle-wrap">
                        <span className="plan-status-label">{t('status') || 'Status'}</span>
                        <input
                            className="form-check-input plan-status-switch"
                            type="checkbox"
                            role="switch"
                            id="planStatusSwitch"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                        />
                        <span className={`plan-status-text ${formData.isActive ? 'text-active' : 'text-inactive'}`}>
                            {formData.isActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                        </span>
                    </div>
                </div>
            </Modal.Header>

            <form onSubmit={handleSubmit}>
                <Modal.Body className="plan-modal-body">

                    {/* ── Section 1: Basic Info ── */}
                    <div className="plan-section">
                        <p className="plan-section-label">{'Basic Info'}</p>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="plan-field-label">{t('plan_name') || 'Plan Name'} <span className="required-star">*</span></label>
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
                                <label className="plan-field-label">{t('description') || 'Description'} <span className="required-star">*</span></label>
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
                        <p className="plan-section-label">{t('pricing') || 'Pricing'}</p>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="plan-field-label">
                                    {t('Price') || 'Price'} <span className="plan-currency-tag">USD</span>
                                    {plan && <span className="plan-readonly-note">{t('not_editable') || '(not editable)'}</span>}
                                </label>
                                <div className="plan-price-input-wrap">
                                    <span className="plan-price-symbol">$</span>
                                    <input
                                        type="number"
                                        name="price"
                                        className="plan-form-input plan-price-input"
                                        value={formData.price}
                                        onChange={handleChange}
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
                                <label className="plan-field-label">{t('period') || 'Billing Period'}</label>
                                <select
                                    name="period"
                                    className="plan-form-input"
                                    value={formData.period}
                                    onChange={handleChange}
                                >
                                    <option value="month">{t('Month') || 'Monthly'}</option>
                                    <option value="year">{t('Year') || 'Yearly'}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Section 3: Limits ── */}
                    <div className="plan-section">
                        <p className="plan-section-label">{t('plan_limits') || 'Plan Limits'}</p>
                        <div className="row g-3">
                            <div className="col-md-3 col-6">
                                <label className="plan-field-label">{t('workspace_limit') || 'Workspaces'}</label>
                                <input
                                    type="number"
                                    name="workspace_limit"
                                    className="plan-form-input"
                                    value={formData.workspace_limit}
                                    onChange={handleChange}
                                    placeholder="e.g. 1"
                                    min="0"
                                />
                            </div>
                            <div className="col-md-3 col-6">
                                <label className="plan-field-label">{t('users') || 'Users'}</label>
                                <input
                                    type="number"
                                    name="limit_users"
                                    className="plan-form-input"
                                    value={formData.limit_users}
                                    onChange={handleChange}
                                    placeholder="e.g. 5"
                                    min="0"
                                />
                            </div>
                            <div className="col-md-3 col-6">
                                <label className="plan-field-label">{t('collaborators') || 'Collaborators'}</label>
                                <input
                                    type="number"
                                    name="limit_collaborators"
                                    className="plan-form-input"
                                    value={formData.limit_collaborators}
                                    onChange={handleChange}
                                    placeholder="e.g. 10"
                                    min="0"
                                />
                            </div>
                            <div className="col-md-3 col-6">
                                <label className="plan-field-label">{t('viewers') || 'Viewers'}</label>
                                <input
                                    type="number"
                                    name="limit_viewers"
                                    className="plan-form-input"
                                    value={formData.limit_viewers}
                                    onChange={handleChange}
                                    placeholder="e.g. 20"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Section 4: Feature Access ── */}
                    <div className="plan-section">
                        <p className="plan-section-label">{t('feature_access') || 'Feature Access'}</p>
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
                                <span className="plan-access-name">{t('insight_access') || 'Insight'}</span>
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
                                <span className="plan-access-name">{t('strategic_access') || 'Strategic'}</span>
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
                                <span className="plan-access-name">{t('pmf_access') || 'PMF'}</span>
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
                                    <span className="plan-access-name">{t('projects_access') || 'Projects'}</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* ── Section 5: Generated Features Preview ── */}
                    <div className="plan-section plan-section--last">
                        <p className="plan-section-label">{t('features_preview') || 'Generated Features Preview'}</p>
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
                                    {t('no_features_generated') || 'No features yet — adjust limits and access above.'}
                                </p>
                            )}
                        </div>
                    </div>

                </Modal.Body>

                <Modal.Footer className="plan-modal-footer">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="plan-btn-cancel">
                        {t('cancel') || 'Cancel'}
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting} className="plan-btn-save d-flex align-items-center gap-2">
                        {isSubmitting && <Loader size={15} className="spinner" />}
                        {t('save') || 'Save Plan'}
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
                        {t('Confirm Status Change') || 'Confirm Status Change'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2 pb-3">
                    <p className="status-confirm-text-primary">
                        {t('status_change_active_msg') || "Set this plan to Inactive?"}
                    </p>
                    <p className="status-confirm-text-secondary">
                        {t('status_change_secondary_msg') || "Existing subscribers keep their current period, but new signups will be blocked."}
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={cancelStatusChange} className="status-confirm-btn">
                        {t('cancel') || 'Cancel'}
                    </Button>
                    <Button variant="danger" onClick={confirmStatusChange} className="status-confirm-btn">
                        {t('proceed') || 'Proceed'}
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

    const getAuthToken = () => sessionStorage.getItem('token');

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

    useEffect(() => {
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
            const errorMsg = error.response?.data?.error || defaultError || `Failed to ${!!modalState.plan ? 'update' : 'create'} plan`;
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
            label: t('plan_name') || 'Plan Name',
            render: (val) => <span className="admin-cell-primary">{val}</span>,
        },
        {
            key: 'price',
            label: t('price') || 'Price',
            render: (val, row) => <span className="admin-cell-primary">${val} / {t(row.period) || row.period || t('month')}</span>,
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
                    <Plus size={16} /> {t('create_plan') || 'Create Plan'}
                </button>
            </div>

            <AdminTable
                title={t('plan_management') || 'Plan Management'}
                count={filteredPlans.length}
                countLabel={t('plans') || 'Plans'}
                columns={columns}
                data={paginatedPlans}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={t('search plans') || 'Search plans...'}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredPlans.length}
                itemsPerPage={pageSize}
                emptyMessage={t('no_plans_found') || 'No Plans Found'}
                emptySubMessage={t('no_plans_matching_criteria') || 'There are no plans matching your criteria'}
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