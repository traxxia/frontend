import React, { useState, useEffect } from 'react';
import { Plus, HelpCircle, Edit, Trash2, Loader, Save, X } from 'lucide-react';

const QuestionManagement = ({ onToast }) => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/super-admin/global-questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
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

      const response = await fetch(`${API_BASE_URL}/api/super-admin/global-questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onToast(`Question created and assigned to ${data.assigned_to_companies} companies`, 'success');
        setShowCreateForm(false);
        loadQuestions();
      } else {
        const error = await response.json();
        onToast(error.message || 'Failed to create question', 'error');
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

      const response = await fetch(`${API_BASE_URL}/api/super-admin/global-questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onToast('Question updated successfully', 'success');
        setEditingQuestion(null);
        loadQuestions();
      } else {
        const error = await response.json();
        onToast(error.message || 'Failed to update question', 'error');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      onToast('Error updating question', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader size={24} className="spinner" />
        <span>Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="question-management">
      <div className="section-header">
        <h2>Global Question Management</h2>
        <button 
          className="primary-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={16} />
          Create Question
        </button>
      </div>

      {showCreateForm && (
        <CreateQuestionForm
          onSubmit={handleCreateQuestion}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      )}

      <div className="questions-list">
        {questions.map(question => (
          <QuestionCard
            key={question._id}
            question={question}
            onEdit={setEditingQuestion}
            isEditing={editingQuestion?._id === question._id}
            onUpdate={handleUpdateQuestion}
            isUpdating={isUpdating}
            onCancelEdit={() => setEditingQuestion(null)}
          />
        ))}
      </div>

      {questions.length === 0 && (
        <div className="empty-state">
          <HelpCircle size={48} />
          <h3>No Questions Yet</h3>
          <p>Create your first global question to get started</p>
        </div>
      )}
    </div>
  );
};

// QuestionCard Component
const QuestionCard = ({ 
  question, 
  onEdit, 
  isEditing, 
  onUpdate, 
  isUpdating, 
  onCancelEdit 
}) => {
  const [editForm, setEditForm] = useState({
    question_text: question.question_text,
    phase: question.phase,
    severity: question.severity,
    order: question.order
  });

  const handleEdit = () => {
    setEditForm({
      question_text: question.question_text,
      phase: question.phase,
      severity: question.severity,
      order: question.order
    });
    onEdit(question);
  };

  const handleSave = () => {
    onUpdate(question._id, editForm);
  };

  const handleChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="question-card">
      <div className="question-header">
        <div className="question-meta">
          <span className="question-id">Q{question.question_id}</span>
          <span className={`phase-badge ${question.phase}`}>
            {question.phase}
          </span>
          <span className={`severity-badge ${question.severity}`}>
            {question.severity}
          </span>
        </div>
        <div className="question-actions">
          {!isEditing ? (
            <button className="edit-btn" onClick={handleEdit}>
              <Edit size={14} />
              Edit
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="save-btn"
                onClick={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader size={14} className="spinner" />
                ) : (
                  <Save size={14} />
                )}
                Save
              </button>
              <button 
                className="cancel-btn"
                onClick={onCancelEdit}
                disabled={isUpdating}
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="question-content">
        {isEditing ? (
          <div className="edit-form">
            <div className="form-field">
              <label>Question Text</label>
              <textarea
                name="question_text"
                value={editForm.question_text}
                onChange={handleChange}
                rows="3"
                className="question-textarea"
              />
            </div>
            
            <div className="form-grid">
              <div className="form-field">
                <label>Phase</label>
                <select
                  name="phase"
                  value={editForm.phase}
                  onChange={handleChange}
                >
                  <option value="initial">Initial</option>
                  <option value="essential">Essential</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>

              <div className="form-field">
                <label>Severity</label>
                <select
                  name="severity"
                  value={editForm.severity}
                  onChange={handleChange}
                >
                  <option value="mandatory">Mandatory</option>
                  <option value="optional">Optional</option>
                </select>
              </div>

              <div className="form-field">
                <label>Order</label>
                <input
                  type="number"
                  name="order"
                  value={editForm.order}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="question-text">{question.question_text}</p>
            <div className="question-details">
              <span className="detail-item">
                <strong>Order:</strong> {question.order}
              </span>
              <span className="detail-item">
                <strong>Assigned to:</strong> {question.assigned_to_companies} companies
              </span>
              <span className="detail-item">
                <strong>Created:</strong> {new Date(question.created_at).toLocaleDateString()}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// CreateQuestionForm Component
const CreateQuestionForm = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    question_id: '',
    question_text: '',
    phase: 'initial',
    severity: 'mandatory',
    order: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      question_id: parseInt(formData.question_id)
    });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Global Question</h3>
        </div>

        <form onSubmit={handleSubmit} className="question-form">
          <div className="form-field">
            <label>Question ID *</label>
            <input
              type="number"
              name="question_id"
              value={formData.question_id}
              onChange={handleChange}
              required
              placeholder="1"
              min="1"
            />
            <small>Unique identifier for this question</small>
          </div>

          <div className="form-field">
            <label>Question Text *</label>
            <textarea
              name="question_text"
              value={formData.question_text}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Enter your question here..."
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Phase *</label>
              <select
                name="phase"
                value={formData.phase}
                onChange={handleChange}
                required
              >
                <option value="initial">Initial</option>
                <option value="essential">Essential</option>
                <option value="good">Good</option>
                <option value="excellent">Excellent</option>
              </select>
            </div>

            <div className="form-field">
              <label>Severity *</label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
              >
                <option value="mandatory">Mandatory</option>
                <option value="optional">Optional</option>
              </select>
            </div>

            <div className="form-field">
              <label>Order</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="1"
                placeholder="1"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="secondary-btn"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={14} className="spinner" />
                  Creating...
                </>
              ) : (
                'Create Question'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionManagement;