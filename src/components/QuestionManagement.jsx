import React, { useState, useEffect, useRef } from 'react';
import { Plus, HelpCircle, Edit, Save, X, ChevronDown, ChevronRight, Trash2, GripVertical, AlertCircle, FileText, CheckCircle2, ListChecks, Layers } from 'lucide-react';
import '../styles/question-management.css';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '../store/authStore';
import AdminTable from './AdminTable';
import MetricCard from './MetricCard';

const QuestionManagement = ({ onToast }) => {
  const [questions, setQuestions] = useState([]);
  const [questionsByPhase, setQuestionsByPhase] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [collapsedPhases, setCollapsedPhases] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const { t } = useTranslation();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => useAuthStore.getState().token;

  const phases = ['initial', 'essential', 'advanced'];

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);

        // Group questions by phase
        const groupedQuestions = data.questions.reduce((acc, question) => {
          const phase = question.phase || 'initial';
          if (!acc[phase]) {
            acc[phase] = [];
          }
          acc[phase].push(question);
          return acc;
        }, {});

        // Sort questions within each phase by order
        Object.keys(groupedQuestions).forEach(phase => {
          groupedQuestions[phase].sort((a, b) => (a.order || 0) - (b.order || 0));
        });

        setQuestionsByPhase(groupedQuestions);
      } else {
        onToast('Failed to load questions', 'error');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      onToast('Error loading questions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (formData) => {
    try {
      setIsCreating(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/admin/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onToast('Question created successfully', 'success');
        setShowCreateForm(false);
        loadQuestions();
      } else {
        const error = await response.json();
        onToast(error.error || 'Failed to create question', 'error');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      onToast('Error creating question', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateQuestion = async (questionId, formData) => {
    try {
      setIsUpdating(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onToast('Question updated successfully', 'success');
        setEditingQuestion(null);
        loadQuestions();
      } else {
        const error = await response.json();
        onToast(error.error || 'Failed to update question', 'error');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      onToast('Error updating question', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      const questionId = questionToDelete._id || questionToDelete.id;
      setDeletingQuestionId(questionId);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        onToast('Question deleted successfully', 'success');
        loadQuestions();
      } else {
        const error = await response.json();
        onToast(error.error || 'Failed to delete question', 'error');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      onToast('Error deleting question', 'error');
    } finally {
      setDeletingQuestionId(null);
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    }
  };

  const handleReorderQuestions = async (reorderedQuestions, phase) => {
    try {
      setIsReordering(true);
      const token = getAuthToken();

      const questionOrders = reorderedQuestions.map((question, index) => ({
        question_id: question._id || question.id,
        order: index + 1
      })).filter(q => q.question_id);

      const response = await fetch(`${API_BASE_URL}/api/admin/questions/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionOrders,
          phase: phase
        })
      });

      if (response.ok) {
        const result = await response.json();
        onToast('Questions reordered successfully', 'success');
        loadQuestions();
      } else {
        const error = await response.json();
        console.error('Reorder error:', error);
        onToast(error.error || 'Failed to reorder questions', 'error');
        loadQuestions();
      }
    } catch (error) {
      console.error('Error reordering questions:', error);
      onToast('Error reordering questions', 'error');
      loadQuestions();
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragStart = (e, question, phase) => {
    setDraggedItem({ question, phase });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetQuestion, targetPhase) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.phase !== targetPhase) {
      setDraggedItem(null);
      return;
    }

    const phaseQuestions = [...(questionsByPhase[targetPhase] || [])];
    const getQuestionId = (q) => q._id || q.id;
    const draggedIndex = phaseQuestions.findIndex(q => getQuestionId(q) === getQuestionId(draggedItem.question));
    const targetIndex = phaseQuestions.findIndex(q => getQuestionId(q) === getQuestionId(targetQuestion));

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedItem(null);
      return;
    }

    const [draggedQuestion] = phaseQuestions.splice(draggedIndex, 1);
    phaseQuestions.splice(targetIndex, 0, draggedQuestion);

    setQuestionsByPhase(prev => ({
      ...prev,
      [targetPhase]: phaseQuestions
    }));

    handleReorderQuestions(phaseQuestions, targetPhase);
    setDraggedItem(null);
  };

  const togglePhaseCollapse = (phase) => {
    setCollapsedPhases(prev => ({
      ...prev,
      [phase]: !prev[phase]
    }));
  };

  if (isLoading) {
    return (
      <div className="question-management__loading">
        <div>Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="question-management">
      <div className="admin-metrics-grid" style={{ marginBottom: '2rem' }}>
        <MetricCard
          label={t("total_questions") || "Total Questions"}
          value={questions.length}
          icon={FileText}
          iconColor="blue"
        />
        <MetricCard
          label={t("total_questions") || "Total Questions"}
          value={questionsByPhase.initial?.length || 0}
          icon={CheckCircle2}
          iconColor="green"
        />
        <MetricCard
          label={t("essential_phase") || "Essential Phase"}
          value={questionsByPhase.essential?.length || 0}
          icon={ListChecks}
          iconColor="orange"
        />
        <MetricCard
          label={t("advanced_phase") || "Advanced Phase"}
          value={questionsByPhase.advanced?.length || 0}
          icon={Layers}
          iconColor="purple"
        />
      </div>

      <div className="question-management__header">
        <h2>{t('question_management')}</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="admin-primary-btn"
        >
          <Plus size={16} />
          {t('add_question')}
        </button>
      </div>

      {showCreateForm && (
        <CreateQuestionForm
          onSubmit={handleCreateQuestion}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      )}

      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onUpdate={handleUpdateQuestion}
          onCancel={() => setEditingQuestion(null)}
          isUpdating={isUpdating}
        />
      )}

      {showDeleteModal && (
        <DeleteQuestionModal
          onConfirm={handleDeleteQuestion}
          onCancel={() => {
            setShowDeleteModal(false);
            setQuestionToDelete(null);
          }}
          isDeleting={!!deletingQuestionId}
        />
      )}

      {isReordering && (
        <div className="question-management__reordering-overlay">
          <div className="question-management__reordering-modal">
            <div className="admin-spinner" style={{ marginRight: '10px', display: 'inline-block' }} />
            Reordering questions...
          </div>
        </div>
      )}

      {phases.map(phase => {
        const phaseQuestions = questionsByPhase[phase] || [];
        const isCollapsed = collapsedPhases[phase];

        const phaseIcons = {
          initial: { icon: CheckCircle2, color: '#16a34a' },
          essential: { icon: ListChecks, color: '#ea580c' },
          advanced: { icon: Layers, color: '#7c3aed' }
        };

        const Icon = phaseIcons[phase]?.icon;
        const iconColor = phaseIcons[phase]?.color;

        const columns = [
          {
            key: 'drag_handle',
            label: '',
            render: () => (
              <div className="drag-handle">
                <GripVertical size={16} />
              </div>
            )
          },
          {
            key: 'order',
            label: '#',
            width: '80px',
            render: (_, row, idx) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <span className="admin-cell-secondary">{idx + 1}</span>
              </div>
            )
          },
          {
            key: 'question_text',
            label: t('question_text'),
            render: (val, row) => (
              <div className="question-text-cell">
                <div className="admin-cell-primary">{val}</div>
                {(row.objective || row.required_info) && (
                  <div className="admin-cell-secondary" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    {row.objective}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'used_for',
            label: t('used_for'),
            render: (val) => <span className="admin-status-badge launched">{val || 'Not set'}</span>
          },
          {
            key: 'severity',
            label: t('severity'),
            render: (val) => (
              <span className={`admin-status-badge ${val === 'mandatory' ? 'active' : 'inactive'}`}>
                {val === "mandatory"
                  ? t("mandatory")
                  : val === "optional"
                    ? t("optional")
                    : val}
              </span>
            )
          },
          {
            key: 'actions',
            label: t('actions'),
            render: (_, row) => (
              <div className="question-row__actions" style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingQuestion(row)}
                  className="question-row__action-btn question-row__action-btn--edit"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => {
                    setQuestionToDelete(row);
                    setShowDeleteModal(true);
                  }}
                  className="question-row__action-btn question-row__action-btn--delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          }
        ];

        return (
          <div key={phase} className="phase-section-wrapper" style={{ marginBottom: '2rem' }}>
            <div
              onClick={() => togglePhaseCollapse(phase)}
              className="phase-section__header"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#f8fafc' }}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              {Icon && <Icon size={20} style={{ color: iconColor }} />}
              <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>
                {t(`${phase}_phase`) || `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase`}
              </strong>
              <span className="admin-table-count-badge">
                {phaseQuestions.length} {t('questions')}
              </span>
            </div>

            {!isCollapsed && (
              <AdminTable
                columns={columns}
                data={phaseQuestions}
                loading={isLoading}
                getRowProps={(row) => ({
                  draggable: true,
                  onDragStart: (e) => handleDragStart(e, row, phase),
                  onDragOver: handleDragOver,
                  onDrop: (e) => handleDrop(e, row, phase),
                  className: `question-row-draggable ${(draggedItem?.question?._id || draggedItem?.question?.id) === (row._id || row.id) ? 'dragging' : ''}`
                })}
              />
            )}
          </div>
        );
      })}

      {questions.length === 0 && (
        <div className="question-management__empty-state">
          <HelpCircle size={48} />
          <h3>No Questions Yet</h3>
          <p>Create your first question to get started</p>
        </div>
      )}
    </div>
  );
};

const EditQuestionModal = ({ question, onUpdate, onCancel, isUpdating }) => {
  const [formData, setFormData] = useState({
    question_text: question.question_text,
    phase: question.phase,
    used_for: question.used_for || '',
    objective: question.objective || '',
    required_info: question.required_info || ''
  });
  const [errors, setErrors] = useState({});
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getSeverityForPhase = (phase) => {
    return phase === 'initial' ? 'mandatory' : 'optional';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.question_text.trim()) newErrors.question_text = t('question_text_required');
    if (!formData.used_for.trim()) newErrors.used_for = t('used_for_required');
    if (!formData.objective.trim()) newErrors.objective = t('objective_required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onUpdate(question._id || question.id, {
      ...formData,
      severity: getSeverityForPhase(formData.phase)
    });
  };

  const currentSeverity = getSeverityForPhase(formData.phase);

  return (
    <div className="create-form-overlay">
      <div className="create-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>{t('edit_question')}</h3>
          <button onClick={onCancel} className="admin-modal-close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="create-form__field">
            <label>{t('question_text')} *</label>
            <textarea
              name="question_text"
              value={formData.question_text}
              onChange={handleChange}
              required
              rows="4"
            />
            {errors.question_text && <span className="error-message">{errors.question_text}</span>}
          </div>

          <div className="create-form__grid">
            <div className="create-form__field">
              <label>{t('phase')} *</label>
              <select name="phase" value={formData.phase} onChange={handleChange} required>
                <option value="initial">{t('initial')}</option>
                <option value="essential">{t('essential')}</option>
                <option value="advanced">{t('advanced')}</option>
              </select>
            </div>

            <div className="create-form__field">
              <label>{t('used_for')} *</label>
              <input
                type="text"
                name="used_for"
                value={formData.used_for}
                onChange={handleChange}
                required
                placeholder="SWOT, Customer Segmentation..."
              />
              {errors.used_for && <span className="error-message">{errors.used_for}</span>}
            </div>
          </div>

          <div className="create-form__field">
            <label>{t('objective')} *</label>
            <textarea
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
              rows="3"
            />
            {errors.objective && <span className="error-message">{errors.objective}</span>}
          </div>

          <div className="create-form__field">
            <label>{t('required_information')}</label>
            <textarea
              name="required_info"
              value={formData.required_info}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="create-form__severity-info">
            <div className="create-form__severity-label">{t('severity')} ({t('auto_assigned')})</div>
            <div className="create-form__severity-display">
              <span className={`create-form__severity-badge create-form__severity-badge--${currentSeverity}`}>
                {currentSeverity}
              </span>
              <span className="create-form__severity-text">
                {formData.phase === 'initial'
                  ? t('initial_questions_mandatory')
                  : t('non_initial_optional')}
              </span>
            </div>
          </div>

          <div className="create-form__actions">
            <button type="button" onClick={onCancel} disabled={isUpdating} className="create-form__btn create-form__btn--cancel">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isUpdating} className="create-form__btn create-form__btn--submit">
              {isUpdating ? t('updating') : t('save_changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateQuestionForm = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    question_text: '',
    phase: 'initial',
    used_for: '',
    objective: '',
    required_info: ''
  });
  const [errors, setErrors] = useState({});
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getSeverityForPhase = (phase) => {
    return phase === 'initial' ? 'mandatory' : 'optional';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.question_text.trim()) newErrors.question_text = t('question_text_required');
    if (!formData.used_for.trim()) newErrors.used_for = t('used_for_required');
    if (!formData.objective.trim()) newErrors.objective = t('objective_required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit({ ...formData, severity: getSeverityForPhase(formData.phase) });
  };

  const currentSeverity = getSeverityForPhase(formData.phase);

  return (
    <div className="create-form-overlay">
      <div className="create-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>{t('create_new_question')}</h3>
          <button onClick={onCancel} className="admin-modal-close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="create-form__field">
            <label>{t('question_text')} *</label>
            <textarea
              name="question_text"
              value={formData.question_text}
              onChange={handleChange}
              required
              rows="4"
              placeholder={t('enter_your_question_here')}
            />
            {errors.question_text && <span className="error-message">{errors.question_text}</span>}
          </div>

          <div className="create-form__grid">
            <div className="create-form__field">
              <label>{t('phase')} *</label>
              <select name="phase" value={formData.phase} onChange={handleChange} required>
                <option value="initial">{t('initial')}</option>
                <option value="essential">{t('essential')}</option>
                <option value="advanced">{t('advanced')}</option>
              </select>
            </div>

            <div className="create-form__field">
              <label>{t('used_for')} *</label>
              <input
                type="text"
                name="used_for"
                value={formData.used_for}
                onChange={handleChange}
                required
                placeholder="SWOT, Customer Segmentation..."
              />
              {errors.used_for && <span className="error-message">{errors.used_for}</span>}
            </div>
          </div>

          <div className="create-form__field">
            <label>{t('objective')} *</label>
            <textarea
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
              rows="3"
              placeholder={t('what_this_question_aims_to_understand')}
            />
            {errors.objective && <span className="error-message">{errors.objective}</span>}
          </div>

          <div className="create-form__field">
            <label>{t('required_information')}</label>
            <textarea
              name="required_info"
              value={formData.required_info}
              onChange={handleChange}
              rows="3"
              placeholder={t('what_specific_information_is_needed_for_analysis')}
            />
          </div>

          <div className="create-form__severity-info">
            <div className="create-form__severity-label">{t('severity')} ({t('auto_assigned')})</div>
            <div className="create-form__severity-display">
              <span className={`create-form__severity-badge create-form__severity-badge--${currentSeverity}`}>
                {currentSeverity}
              </span>
              <span className="create-form__severity-text">
                {formData.phase === 'initial'
                  ? t('initial_questions_mandatory')
                  : t('non_initial_optional')}
              </span>
            </div>
          </div>

          <div className="create-form__actions">
            <button type="button" onClick={onCancel} disabled={isLoading} className="create-form__btn create-form__btn--cancel">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isLoading} className="create-form__btn create-form__btn--submit">
              {isLoading ? t('creating') : t('create_question')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteQuestionModal = ({ onConfirm, onCancel, isDeleting }) => {
  const { t } = useTranslation();

  return (
    <div className="create-form-overlay">
      <div className="create-form" style={{ maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} />
            {t('Delete Question')}
          </h3>
          <button onClick={onCancel} className="admin-modal-close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ margin: '0 0 1rem', color: '#1e293b', fontWeight: '500' }}>
            Are you sure you want to delete this question?
          </p>
          <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#991b1b', fontSize: '0.9rem', lineHeight: '1.5' }}>
            <strong>Warning:</strong> If you delete this question, it will be removed permanently. Additionally, any answers provided by users for this question will also be deleted.
          </div>
        </div>

        <div className="create-form__actions">
          <button type="button" onClick={onCancel} disabled={isDeleting} className="create-form__btn create-form__btn--cancel">
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="create-form__btn create-form__btn--submit"
            style={{ background: '#dc2626', borderColor: '#dc2626' }}
          >
            {isDeleting ? t('Deleting...') : t('Delete Question')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionManagement;