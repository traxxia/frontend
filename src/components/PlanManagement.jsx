import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Loader, Trash2 } from 'lucide-react';
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
                    plan.workspace_limit !== undefined
                        ? plan.workspace_limit
                        : (plan.max_workspaces !== undefined ? plan.max_workspaces
                            : (plan.limits?.workspaces !== undefined ? plan.limits.workspaces : '')),
                limit_projects: plan.limits?.projects !== undefined ? Boolean(plan.limits?.projects)
                    : (plan.max_projects !== undefined ? Boolean(plan.max_projects) : false),
                limit_collaborators: plan.max_collaborators !== undefined ? plan.max_collaborators
                    : (plan.limits?.collaborators !== undefined ? plan.limits.collaborators : ''),
                limit_viewers: plan.max_viewers !== undefined ? plan.max_viewers
                    : (plan.limits?.viewers !== undefined ? plan.limits.viewers : ''),
                limit_users: plan.max_users !== undefined ? plan.max_users
                    : (plan.limits?.users !== undefined ? plan.limits.users : ''),
                insight: plan.insight !== undefined ? plan.insight
                    : (plan.limits?.insight !== undefined ? plan.limits.insight : false),
                strategic: plan.strategic !== undefined ? plan.strategic
                    : (plan.limits?.strategic !== undefined ? plan.limits.strategic : false),
                pmf: plan.pmf !== undefined ? plan.pmf
                    : (plan.limits?.pmf !== undefined ? plan.limits.pmf : false),
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
        
        // Basic validation
        if (!formData.name.trim()) {
            onToast('Plan name is required', 'error');
            return;
        }

        if (Number(formData.price) < 0) {
            onToast('Price cannot be negative', 'error');
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
            onToast('Limits cannot be negative', 'error');
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
            <Modal.Header closeButton>
                <Modal.Title>{plan ? t('edit_plan') || 'Edit Plan' : t('create_plan') || 'Create Plan'}</Modal.Title>
            </Modal.Header>
            <form onSubmit={handleSubmit}>
                <Modal.Body className="plan-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden' }}>
                    <div className="row">
                        <div className="col-md-6 plan-form-group">
                            <label>{t('plan_name') || 'Plan Name'}</label>
                            <input
                                type="text"
                                name="name"
                                className="plan-form-input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 plan-form-group">
                            <label>{t('price') || 'Price'} ({t('usd') || 'USD'})</label>
                            <input
                                type="number"
                                name="price"
                                className="plan-form-input"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                readOnly={!!plan}
                                style={plan ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6 plan-form-group">
                            <label>{t('description') || 'Description'}</label>
                            <textarea
                                name="description"
                                className="plan-form-input"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 plan-form-group">
                            <label className="mb-2">{t('features_preview') || 'Generated Features Preview'}</label>
                            <div className="features-preview-list" style={{ 
                                maxHeight: '150px', 
                                overflowY: 'auto', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px', 
                                padding: '12px',
                                backgroundColor: '#f8f9fa'
                            }}>
                                {formData.features.length > 0 ? (
                                    <ul className="list-unstyled mb-0">
                                        {formData.features.map((feature, index) => (
                                            <li key={index} className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: '0.85rem' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4f46e5' }}></div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-muted small">{t('no_features_generated') || 'No features generated. Adjust limits above.'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6 plan-form-group">
                            <label>{t('period') || 'Period'}</label>
                            <select
                                name="period"
                                className="plan-form-input"
                                value={formData.period}
                                onChange={handleChange}
                            >
                                <option value="month">{t('month') || 'Month'}</option>
                                <option value="year">{t('year') || 'Year'}</option>
                            </select>
                        </div>
                        <div className="col-md-6 plan-form-group d-flex align-items-end pb-2">
                            <div className="toggle-status form-check form-switch w-100 d-flex align-items-center mb-1">
                                <input
                                    className="form-check-input plan-status-switch mb-0 mt-0"
                                    type="checkbox"
                                    role="switch"
                                    id="planStatusSwitch"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                />
                                <label
                                    className={`form-check-label ms-3 mb-0 plan-status-label ${formData.isActive ? 'active' : 'inactive'}`}
                                    htmlFor="planStatusSwitch"
                                >
                                    {t('status') || 'Status'}: {formData.isActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                                </label>
                            </div>
                        </div>
                    </div>

                    <h6 className="mt-4 mb-3" style={{ color: '#374151', fontWeight: '600' }}>{t('plan_limits') || 'Plan Limits'}</h6>

                    <div className="row">
                        <div className="col-md-6 plan-form-group">
                            <label>{t('workspace_limit') || 'Workspace Limit'}</label>
                            <input
                                type="number"
                                name="workspace_limit"
                                className="plan-form-input"
                                value={formData.workspace_limit}
                                onChange={handleChange}
                                placeholder={`${t('eg') || 'e.g.'} 1`}
                            />
                        </div>
                        <div className="col-md-6 plan-form-group">
                            <label>{t('users') || 'Users'}</label>
                            <input
                                type="number"
                                name="limit_users"
                                className="plan-form-input"
                                value={formData.limit_users}
                                onChange={handleChange}
                                placeholder={`${t('eg') || 'e.g.'} 0`}
                            />
                        </div>
                    </div>

                    <div className="row mt-3">
                        <div className="col-md-6 plan-form-group">
                            <label>{t('collaborators') || 'Collaborators'}</label>
                            <input
                                type="number"
                                name="limit_collaborators"
                                className="plan-form-input"
                                value={formData.limit_collaborators}
                                onChange={handleChange}
                                placeholder={`${t('eg') || 'e.g.'} 0`}
                            />
                        </div>
                        <div className="col-md-6 plan-form-group">
                            <label>{t('viewers') || 'Viewers'}</label>
                            <input
                                type="number"
                                name="limit_viewers"
                                className="plan-form-input"
                                value={formData.limit_viewers}
                                onChange={handleChange}
                                placeholder={`${t('eg') || 'e.g.'} 0`}
                            />
                        </div>
                    </div>

                    <div className="row mt-3">
                        <div className="col-md-3 plan-form-group d-flex align-items-center gap-2">
                            <input
                                type="checkbox"
                                name="insight"
                                className="form-check-input m-0"
                                checked={formData.insight}
                                onChange={handleChange}
                                id="insight-check"
                            />
                            <label htmlFor="insight-check" className="mb-0" style={{ cursor: 'pointer' }}>{t('insight_access') || 'Insight Access'}</label>
                        </div>
                        <div className="col-md-3 plan-form-group d-flex align-items-center gap-2">
                            <input
                                type="checkbox"
                                name="strategic"
                                className="form-check-input m-0"
                                checked={formData.strategic}
                                onChange={handleChange}
                                id="strategic-check"
                            />
                            <label htmlFor="strategic-check" className="mb-0" style={{ cursor: 'pointer' }}>{t('strategic_access') || 'Strategic Access'}</label>
                        </div>
                        <div className="col-md-3 plan-form-group d-flex align-items-center gap-2">
                            <input
                                type="checkbox"
                                name="pmf"
                                className="form-check-input m-0"
                                checked={formData.pmf}
                                onChange={handleChange}
                                id="pmf-check"
                            />
                            <label htmlFor="pmf-check" className="mb-0" style={{ cursor: 'pointer' }}>{t('pmf_access') || 'PMF Access'}</label>
                        </div>
                        {formData.pmf && (<div className="col-md-3 plan-form-group d-flex align-items-center gap-2">
                            <input
                                type="checkbox"
                                name="limit_projects"
                                className="form-check-input m-0"
                                checked={formData.limit_projects}
                                onChange={handleChange}
                                id="projects-check"
                            />
                            <label htmlFor="projects-check" className="mb-0" style={{ cursor: 'pointer' }}>{t('projects_access') || 'Projects Access'}</label>
                        </div>)}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        {t('cancel') || 'Cancel'}
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting} className="d-flex align-items-center gap-2">
                        {isSubmitting ? <Loader size={16} className="spinner" /> : null}
                        {t('save') || 'Save'}
                    </Button>
                </Modal.Footer>
            </form>

            <Modal 
                show={showStatusConfirm} 
                onHide={cancelStatusChange} 
                centered 
                backdrop="static" 
                dialogClassName="status-confirm-modal" 
                className="status-confirm-modal-container"
                size="md"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="status-confirm-title">{t('Confirm Status Change') || 'Confirm Status Change'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3 pb-4">
                    <p className="status-confirm-text-primary">
                        {t('status_change_active_msg') || "Are you sure you want to change this plan's status to Inactive?"}
                    </p>
                    <p className="status-confirm-text-secondary">
                        {t('status_change_secondary_msg') || "Existing subscribers will continue their current period without interruption, but new users won't be able to select this plan."}
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

            await request(url, planData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

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
        setModalState({
            show: true,
            plan,
            isSubmitting: false
        });
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
            render: (val) => <span className="admin-cell-secondary" style={{ maxWidth: '300px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</span>,
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
                    style={{ padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: '500' }}
                    onClick={() => handleEditClick(row)}
                >
                    <Edit size={16} color="#374151" /> {t('edit') || 'Edit'}
                </button>
            ),
        }
    ];

    return (
        <div className="plan-management-wrapper">
            <div className="admin-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="create-plan-btn"
                    onClick={() => setModalState({ show: true, plan: null, isSubmitting: false })}
                >
                    <Plus size={18} /> {t('create_plan') || 'Create Plan'}
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