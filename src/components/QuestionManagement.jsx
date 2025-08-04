import React, { useState, useEffect } from 'react';
import { Plus, HelpCircle, Edit, Save, X, ChevronDown, ChevronRight, Trash2, GripVertical } from 'lucide-react';

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

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const getAuthToken = () => sessionStorage.getItem('token');

  const phases = ['initial', 'essential', 'good', 'excellent'];

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
        setQuestionsByPhase(data.questionsByPhase || {});
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

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingQuestionId(questionId);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/super-admin/global-questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onToast('Question deleted successfully', 'success');
        loadQuestions();
      } else {
        const error = await response.json();
        onToast(error.message || 'Failed to delete question', 'error');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      onToast('Error deleting question', 'error');
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const handleReorderQuestions = async (phase, reorderedQuestions) => {
    try {
      setIsReordering(true);
      const token = getAuthToken();

      const questionOrders = reorderedQuestions.map((question, index) => ({
        id: question._id,
        order: index + 1
      }));

      const response = await fetch(`${API_BASE_URL}/api/super-admin/global-questions/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase,
          questionOrders
        })
      });

      if (response.ok) {
        const result = await response.json(); 
        onToast(`Questions reordered in ${phase} phase`, 'success');
        loadQuestions();
      } else {
        const error = await response.json();
        console.error('Reorder error:', error);
        onToast(error.message || 'Failed to reorder questions', 'error');
      }
    } catch (error) {
      console.error('Error reordering questions:', error);
      onToast('Error reordering questions', 'error');
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

    // Reorder the array
    const [draggedQuestion] = phaseQuestions.splice(draggedIndex, 1);
    phaseQuestions.splice(targetIndex, 0, draggedQuestion);

    // Update local state immediately for better UX
    setQuestionsByPhase(prev => ({
      ...prev,
      [targetPhase]: phaseQuestions
    }));

    // Send reorder request to backend
    handleReorderQuestions(targetPhase, phaseQuestions);
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
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Loading questions...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Question Management</h2>
        <button 
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          Add Question
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            Reordering questions...
          </div>
        </div>
      )}

      {phases.map(phase => {
        const phaseQuestions = questionsByPhase[phase] || [];
        const isCollapsed = collapsedPhases[phase];

        return (
          <div key={phase} style={{ marginBottom: '30px' }}>
            <div 
              onClick={() => togglePhaseCollapse(phase)}
              style={{
                backgroundColor: '#f8f9fa',
                padding: '12px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                border: '1px solid #dee2e6'
              }}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              <strong>{phase.charAt(0).toUpperCase() + phase.slice(1)} Phase</strong>
              <span style={{ marginLeft: 'auto', color: '#6c757d' }}>
                {phaseQuestions.length} questions
              </span>
            </div>

            {!isCollapsed && (
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #dee2e6' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ width: '30px', padding: '12px 8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      Order
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                      Question Text
                    </th>
                    <th style={{ width: '100px', padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      Severity
                    </th>
                    <th style={{ width: '140px', padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {phaseQuestions.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#6c757d',
                        border: '1px solid #dee2e6'
                      }}>
                        <HelpCircle size={24} style={{ marginBottom: '8px' }} />
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
            )}
          </div>
        );
      })}

      {questions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d' }}>
          <HelpCircle size={48} style={{ marginBottom: '16px' }} />
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
    severity: question.severity
  });

  const handleSave = () => {
    onUpdate(question._id, {
      question_text: editForm.question_text
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
      <tr style={{ backgroundColor: '#fff3cd' }}>
        <td style={{ padding: '12px 8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <GripVertical size={14} style={{ color: '#6c757d' }} />
            {question.order || index + 1}
          </div>
        </td>
        
        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
          <textarea
            name="question_text"
            value={editForm.question_text}
            onChange={handleChange}
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
        </td>
        
        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: question.severity === 'mandatory' ? '#dc3545' : '#28a745',
            color: 'white'
          }}>
            {question.severity}
          </span>
        </td>
         
        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              style={{
                padding: '4px 8px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              <Save size={12} />
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isUpdating}
              style={{
                padding: '4px 8px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              <X size={12} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr 
      draggable
      onDragStart={(e) => onDragStart(e, question, phase)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, question, phase)}
      style={{ 
        backgroundColor: 'white',
        cursor: 'move'
      }}
    >
      <td style={{ 
        padding: '12px 8px', 
        textAlign: 'center', 
        border: '1px solid #dee2e6',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <GripVertical size={14} style={{ color: '#6c757d' }} />
          {question.order || index + 1}
        </div>
      </td>
       
      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
        {question.question_text}
      </td>
      
      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
        <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: question.severity === 'mandatory' ? '#dc3545' : '#28a745',
          color: 'white'
        }}>
          {question.severity}
        </span>
      </td>
       
      <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <button
            onClick={onEdit}
            disabled={isDeleting}
            style={{
              padding: '4px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: isDeleting ? 0.6 : 1
            }}
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => onDelete(question._id)}
            disabled={isDeleting}
            style={{
              padding: '4px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: isDeleting ? 0.6 : 1
            }}
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
  );
};

const CreateQuestionForm = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    question_text: '',
    phase: 'initial',
    severity: 'mandatory'
  });

  const getDefaultSeverity = (phase) => {
    return phase === 'initial' ? 'mandatory' : 'optional';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };
      
      if (name === 'phase') {
        newFormData.severity = getDefaultSeverity(value);
      }
      
      return newFormData;
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '500px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Question</h3>
        
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Question Text *
            </label>
            <textarea
              name="question_text"
              value={formData.question_text}
              onChange={handleChange}
              required
              rows="4"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                resize: 'vertical'
              }}
              placeholder="Enter your question here..."
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Phase *
            </label>
            <select
              name="phase"
              value={formData.phase}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            >
              <option value="initial">Initial</option>
              <option value="essential">Essential</option>
              <option value="good">Good</option>
              <option value="excellent">Excellent</option>
            </select>
          </div>

          <div style={{ 
            marginBottom: '20px', 
            padding: '12px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#6c757d', 
              marginBottom: '4px',
              fontWeight: 'bold'
            }}>
              Severity (Auto-assigned)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: formData.severity === 'mandatory' ? '#dc3545' : '#28a745',
                color: 'white'
              }}>
                {formData.severity}
              </span>
              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                {formData.phase === 'initial' 
                  ? 'Initial phase questions are always mandatory'
                  : 'Non-initial phase questions are optional by default'
                }
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onCancel}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isLoading ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionManagement;