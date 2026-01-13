import React, { useState, useEffect } from 'react';
import { Plus, HelpCircle, Edit, Save, X, ChevronDown, ChevronRight, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import '../styles/question-management.css';
import { useTranslation } from '@/hooks/useTranslation';

const QuestionManagement = ({ onToast }) => {
  const [questions, setQuestions] = useState([]);
  const [questionsByPhase, setQuestionsByPhase] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [collapsedPhases, setCollapsedPhases] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const { t } = useTranslation();
 


  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  const phases = ['initial', 'essential', 'advanced'];

  useEffect(() => {
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

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
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
    }
  };

  const handleReorderQuestions = async (reorderedQuestions, phase) => {
    try {
      setIsReordering(true);
      const token = getAuthToken();

      const questionOrders = reorderedQuestions.map((question, index) => ({
        question_id: question._id,
        order: index + 1
      }));

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
    const draggedIndex = phaseQuestions.findIndex(q => q._id === draggedItem.question._id);
    const targetIndex = phaseQuestions.findIndex(q => q._id === targetQuestion._id);

    if (draggedIndex === targetIndex) {
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
      <div className="question-management__header">
        <h2>{t('question_management')}</h2>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="question-management__add-btn"
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

      {isReordering && (
        <div className="question-management__reordering-overlay">
          <div className="question-management__reordering-modal">
            Reordering questions...
          </div>
        </div>
      )}

      {phases.map(phase => {
        const phaseQuestions = questionsByPhase[phase] || [];
        const isCollapsed = collapsedPhases[phase];

        return (
          <div key={phase} className="phase-section">
            <div
              onClick={() => togglePhaseCollapse(phase)}
              className="phase-section__header"
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              <strong>{phase.charAt(0).toUpperCase() + phase.slice(1)} Phase</strong>
              <span className="phase-section__count">
                {phaseQuestions.length} {t('questions')}
              </span>
            </div>

            {!isCollapsed && (
              <div style={{ overflowX: "auto" }}>
              <table className="questions-table">
                <thead>
                  <tr className="questions-table__header">
                    <th className="questions-table__header-cell questions-table__header-cell--number">
                      #
                    </th>
                    <th className="questions-table__header-cell">
                      {t('question_text')}
                    </th>
                    <th className="questions-table__header-cell questions-table__header-cell--center questions-table__header-cell--used-for">
                      {t('used_for')}
                    </th>
                    <th className="questions-table__header-cell questions-table__header-cell--center questions-table__header-cell--severity">
                      {t('severity')}
                    </th>
                    <th className="questions-table__header-cell questions-table__header-cell--center questions-table__header-cell--actions">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {phaseQuestions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="questions-table__empty-row">
                        <HelpCircle size={24} className="questions-table__empty-icon" />
                        <div>No questions in {phase} phase</div>
                      </td>
                    </tr>
                  ) : (
                    phaseQuestions.map((question, index) => (
                      <QuestionRow
                        key={question._id}
                        question={question}
                        index={index}
                        phase={phase}
                        isEditing={editingQuestion?._id === question._id}
                        onEdit={() => setEditingQuestion(question)}
                        onUpdate={handleUpdateQuestion}
                        onCancelEdit={() => setEditingQuestion(null)}
                        onDelete={handleDeleteQuestion}
                        isUpdating={isUpdating}
                        isDeleting={deletingQuestionId === question._id}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      />
                    ))
                  )}
                </tbody>
              </table>
              </div>
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

const QuestionRow = ({ 
  question, 
  index, 
  phase, 
  isEditing, 
  onEdit, 
  onUpdate, 
  onCancelEdit,
  onDelete,
  isUpdating,
  isDeleting,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const [editForm, setEditForm] = useState({
    question_text: question.question_text,
    phase: question.phase,
    order: question.order,
    used_for: question.used_for || '',
    objective: question.objective || '',
    required_info: question.required_info || ''
  });

  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();

  const handleSave = () => {
    onUpdate(question._id, {
      question_text: editForm.question_text,
      phase: editForm.phase,
      order: editForm.order,
      used_for: editForm.used_for,
      objective: editForm.objective,
      required_info: editForm.required_info,
      severity: question.severity
    });
  };

  const handleChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isEditing) {
    return (
      <>
        <tr className="question-row question-row--editing">
          <td className="question-row__cell question-row__cell--number">
            <div className="question-row__number question-row__number--editing">
              <GripVertical size={14} style={{ color: '#6c757d' }} />
              <span>
                {index + 1}
              </span>
            </div>
          </td>
          
          <td className="question-row__cell">
            <textarea
              name="question_text"
              value={editForm.question_text}
              onChange={handleChange}
              className="question-row__textarea"
            />
          </td>

          <td className="question-row__cell">
            <input
              type="text"
              name="used_for"
              value={editForm.used_for}
              onChange={handleChange}
              placeholder="SWOT, Customer..."
              className="question-row__input"
            />
          </td>
          
          <td className="question-row__cell question-row__cell--center">
            <span className={`question-row__severity-badge question-row__severity-badge--${question.severity}`}>
              {question.severity}
            </span>
            <div className="question-row__severity-auto">
              Auto-assigned
            </div>
          </td>
           
          <td className="question-row__cell question-row__cell--center">
            <div className="question-row__actions">
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="question-row__action-btn question-row__action-btn--save"
              >
                <Save size={12} />
              </button>
              <button
                onClick={onCancelEdit}
                disabled={isUpdating}
                className="question-row__action-btn question-row__action-btn--cancel"
              >
                <X size={12} />
              </button>
            </div>
          </td>
        </tr>
        
        {/* Additional fields row when editing */}
        <tr className="question-row--editing">
          <td colSpan="5" className="question-row__edit-fields">
            <div className="question-row__edit-grid">
              <div className="question-row__edit-field">
                <label>
                  {t('objective')}
                </label>
                <textarea
                  name="objective"
                  value={editForm.objective}
                  onChange={handleChange}
                  placeholder={t('what_this_question_aims_to_understand')}
                />
              </div>
              <div className="question-row__edit-field">
                <label>
                  {t('required_information')}
                </label>
                <textarea
                  name="required_info"
                  value={editForm.required_info}
                  onChange={handleChange}
                  placeholder="What information is needed for analysis..."
                />
              </div>
            </div>
          </td>
        </tr>
      </>
    );
  }

  return (
    <>
      <tr 
        draggable
        onDragStart={(e) => onDragStart(e, question, phase)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, question, phase)}
        className="question-row"
      >
        <td className="question-row__cell question-row__cell--number">
          <div className="question-row__number">
            <GripVertical size={14} style={{ color: '#6c757d' }} />
            <span>
              {index + 1}
            </span>
          </div>
        </td>
         
        <td className="question-row__cell">
          <div className="question-row__question-text">
            {question.question_text}
            {(question.objective || question.required_info) && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="question-row__details-btn"
              >
                <AlertCircle size={10} style={{ marginRight: '2px' }} />
                Details
              </button>
            )}
          </div>
        </td>

        <td className="question-row__cell question-row__cell--center">
          {question.used_for ? (
            <span className="question-row__used-for-badge">
              {question.used_for}
            </span>
          ) : (
            <span className="question-row__used-for-empty">Not set</span>
          )}
        </td>

        <td className="question-row__cell question-row__cell--center">
          <span className={`question-row__severity-badge question-row__severity-badge--${question.severity}`}>
            {question.severity}
          </span>
        </td>
         
        <td className="question-row__cell question-row__cell--center">
          <div className="question-row__actions">
            <button
              onClick={onEdit}
              disabled={isDeleting}
              className={`question-row__action-btn question-row__action-btn--edit ${isDeleting ? 'question-row__action-btn--disabled' : ''}`}
            >
              <Edit size={12} />
            </button>
            <button
              onClick={() => onDelete(question._id)}
              disabled={isDeleting}
              className={`question-row__action-btn question-row__action-btn--delete ${isDeleting ? 'question-row__action-btn--disabled' : ''}`}
            >
              {isDeleting ? (
                <span style={{ fontSize: '10px' }}>...</span>
              ) : (
                <Trash2 size={12} />
              )}
            </button>
          </div>
        </td>
      </tr>

      {/* Details row */}
      {showDetails && (question.objective || question.required_info) && (
        <tr>
          <td colSpan="5" className="question-row__details">
            <div className="question-row__details-grid">
              {question.objective && (
                <div>
                  <strong className="question-row__details-label">{t('objective')}:</strong>
                  <div className="question-row__details-content">{question.objective}</div>
                </div>
              )}
              {question.required_info && (
                <div>
                  <strong className="question-row__details-label">{t('required_information')}:</strong>
                  <div className="question-row__details-content">{question.required_info}</div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const CreateQuestionForm = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    question_text: '',
    phase: 'initial',
    order: 1,
    used_for: '',
    objective: '',
    required_info: ''
  });

  
  const [errors, setErrors] = useState({});
  const { t } = useTranslation();

  const getSeverityForPhase = (phase) => {
    return phase === 'initial' ? 'mandatory' : 'optional';
  };

 const validateForm = () => {
  const newErrors = {};

  if (!formData.question_text.trim()) {
    newErrors.question_text = 'Question text is required';
  } else if (formData.question_text.trim().length < 10) {
    newErrors.question_text = 'Question must be at least 10 characters long';
  } else if (formData.question_text.trim().length > 200) {
    newErrors.question_text = 'Question cannot exceed 200 characters';
  }

  if (!formData.used_for.trim()) {
    newErrors.used_for = 'Used For field is required';
  } else if (!/^[A-Za-z,\s]+$/.test(formData.used_for.trim())) {
    newErrors.used_for = 'Used For can only contain letters, commas, and spaces';
  } else if (formData.used_for.trim().length >20) {
    newErrors.used_for = 'Used For cannot exceed 20 characters';
  }

  if (!formData.objective.trim()) {
    newErrors.objective = 'Objective is required';
  } else if (formData.objective.trim().length < 15) {
    newErrors.objective = 'Objective must be at least 15 characters long';
  } else if (formData.objective.trim().length > 200) {
    newErrors.objective = 'Objective cannot exceed 200 characters';
  }

  if (formData.required_info && formData.required_info.length > 200) {
    newErrors.required_info = 'Required info cannot exceed 200 characters';
  }

 

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const handleSubmit = (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  const submitData = { ...formData, severity: getSeverityForPhase(formData.phase) };
  onSubmit(submitData);
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const currentSeverity = getSeverityForPhase(formData.phase);

  return (
    <div className="create-form-overlay">
      <div className="create-form">
        <h3>{t('create_new_question')}</h3>
        
        <form onSubmit={handleSubmit} >
          <div className="create-form__field">
            <label>
              {t('question_text')} *
            </label>
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
              <label>
                {t('phase')} *
              </label>
              <select
                name="phase"
                value={formData.phase}
                onChange={handleChange}
                required
              >
                <option value="initial">Initial</option>
                <option value="essential">Essential</option> 
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="create-form__field">
              <label>
                {t('used_for')} *
              </label>
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
            <label>
              {t('objective')} *
            </label>
            <textarea
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
              rows="3"
              placeholder={t('what_this_question_aims_to_understand_or_analyze')}
            />
            {errors.objective && <span className="error-message">{errors.objective}</span>}
          </div>

          <div className="create-form__field">
            <label>
              {t('required_information')}
            </label>
            <textarea
              name="required_info"
              value={formData.required_info}
              onChange={handleChange}
              rows="3"
              placeholder={t('what_specific_information_is_needed_for_analysis')}
            />
          </div>

          <div className="create-form__severity-info">
            <div className="create-form__severity-label">
              {t('severity')} (Auto-assigned)
            </div>
            <div className="create-form__severity-display">
              <span className={`create-form__severity-badge create-form__severity-badge--${currentSeverity}`}>
                {currentSeverity}
              </span>
              <span className="create-form__severity-text">
                {formData.phase === 'initial' 
                  ? 'Initial phase questions are always mandatory'
                  : 'Non-initial phase questions are optional by default'
                }
              </span>
            </div>
          </div>

          <div className="create-form__actions">
            <button 
              type="button" 
              onClick={onCancel}
              disabled={isLoading}
              className="create-form__btn create-form__btn--cancel"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="create-form__btn create-form__btn--submit"
            >
              {isLoading ? 'Creating...' : t('create_question')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionManagement;