import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Loader } from 'lucide-react';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import AdminTable from './AdminTable';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/PlanManagement.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const PlanModal = ({ show, plan, onClose, onSave, isSubmitting }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        features: '',
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
                features: plan.features ? (Array.isArray(plan.features) ? plan.features.join(', ') : plan.features) : '',
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
                features: '',
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

    if (!show) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const workspaceLimitValue = formData.workspace_limit !== '' ? Number(formData.workspace_limit) : undefined;
        const maxCollaborators = formData.limit_collaborators !== '' ? Number(formData.limit_collaborators) : undefined;
        const maxViewers = formData.limit_viewers !== '' ? Number(formData.limit_viewers) : undefined;
        const maxUsers = formData.limit_users !== '' ? Number(formData.limit_users) : undefined;

        const submitData = {
            name: formData.name,
            description: formData.description,
            currency: 'USD',
            price: Number(formData.price),
            period: formData.period,
            features: formData.features.split(',').map(f => f.trim()).filter(f => f !== ''),
            workspace_limit: workspaceLimitValue,
            max_workspaces: workspaceLimitValue,
            max_projects: formData.limit_projects,
            max_collaborators: maxCollaborators,
            max_viewers: maxViewers,
            max_users: maxUsers,
            insight: formData.insight,
            strategic: formData.strategic,
            pmf: formData.pmf,
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
                            <label>{t('price') || 'Price'} (USD)</label>
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
                            <label>{t('features') || 'Features'} <small>(comma separated)</small></label>
                            <textarea
                                name="features"
                                className="plan-form-input"
                                value={formData.features}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6 plan-form-group">
                            <label>Period</label>
                            <select
                                name="period"
                                className="plan-form-input"
                                value={formData.period}
                                onChange={handleChange}
                            >
                                <option value="month">Month</option>
                                <option value="year">Year</option>
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
                                    {formData.isActive ? 'Status: Active' : 'Status: Inactive'}
                                </label>
                            </div>
                        </div>
                    </div>

                    <h6 className="mt-4 mb-3" style={{ color: '#374151', fontWeight: '600' }}>Plan Limits</h6>

                    <div className="row">
                        <div className="col-md-6 plan-form-group">
                            <label>Workspace Limit</label>
                            <input
                                type="number"
                                name="workspace_limit"
                                className="plan-form-input"
                                value={formData.workspace_limit}
                                onChange={handleChange}
                                placeholder="e.g. 1"
                            />
                        </div>
                        <div className="col-md-6 plan-form-group">
                            <label>Users</label>
                            <input
                                type="number"
                                name="limit_users"
                                className="plan-form-input"
                                value={formData.limit_users}
                                onChange={handleChange}
                                placeholder="e.g. 0"
                            />
                        </div>
                    </div>

                    <div className="row mt-3">
                        <div className="col-md-6 plan-form-group">
                            <label>Collaborators</label>
                            <input
                                type="number"
                                name="limit_collaborators"
                                className="plan-form-input"
                                value={formData.limit_collaborators}
                                onChange={handleChange}
                                placeholder="e.g. 0"
                            />
                        </div>
                        <div className="col-md-6 plan-form-group">
                            <label>Viewers</label>
                            <input
                                type="number"
                                name="limit_viewers"
                                className="plan-form-input"
                                value={formData.limit_viewers}
                                onChange={handleChange}
                                placeholder="e.g. 0"
                            />
                        </div>
                    </div>

                    <div className="row mt-3">
                        {formData.pmf && (<div className="col-md-3 plan-form-group d-flex align-items-center gap-2">
                            <input
                                type="checkbox"
                                name="limit_projects"
                                className="form-check-input m-0"
                                checked={formData.limit_projects}
                                onChange={handleChange}
                                id="projects-check"
                            />
                            <label htmlFor="projects-check" className="mb-0" style={{ cursor: 'pointer' }}>Projects Access</label>
                        </div>)}
                        <div className="col-md-3 plan-form-group d-flex align-items-center gap-2">
                            <input
                                type="checkbox"
                                name="insight"
                                className="form-check-input m-0"
                                checked={formData.insight}
                                onChange={handleChange}
                                id="insight-check"
                            />
                            <label htmlFor="insight-check" className="mb-0" style={{ cursor: 'pointer' }}>Insight Access</label>
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
                            <label htmlFor="strategic-check" className="mb-0" style={{ cursor: 'pointer' }}>Strategic Access</label>
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
                            <label htmlFor="pmf-check" className="mb-0" style={{ cursor: 'pointer' }}>PMF Access</label>
                        </div>
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
                    'Authorization': `Bearer ${token}`
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

            onToast(`Plan successfully ${isEdit ? 'updated' : 'created'}`, 'success');
            setModalState({ show: false, plan: null, isSubmitting: false });
            loadPlans();
        } catch (error) {
            console.error('Error saving plan:', error);
            const errorMsg = error.response?.data?.error || `Failed to ${!!modalState.plan ? 'update' : 'create'} plan`;
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
            render: (val, row) => <span className="admin-cell-primary">${val} / {row.period || 'month'}</span>,
        },
        {
            key: 'description',
            label: t('description') || 'Description',
            render: (val) => <span className="admin-cell-secondary" style={{ maxWidth: '300px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</span>,
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <button
                    className="admin-action-btn edit-plan-btn"
                    style={{ padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: '500' }}
                    onClick={() => handleEditClick(row)}
                >
                    <Edit size={16} color="#374151" /> {t('edit_plan') || 'Edit'}
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
                countLabel={'Plans'}
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
                emptyMessage={'No Plans Found'}
                emptySubMessage={'There are no plans matching your criteria'}
                loading={loading}
            />

            <PlanModal
                show={modalState.show}
                plan={modalState.plan}
                isSubmitting={modalState.isSubmitting}
                onClose={() => setModalState({ show: false, plan: null, isSubmitting: false })}
                onSave={handleSavePlan}
            />
        </div>
    );
};

export default PlanManagement;