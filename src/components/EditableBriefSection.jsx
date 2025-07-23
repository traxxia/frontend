import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X } from 'lucide-react';

const EditableBriefSection = ({ questions = [], userAnswers = {}, onAnswerUpdate }) => {
  const [editingField, setEditingField] = useState(null);
  const [briefFields, setBriefFields] = useState([]);
  const [editedFields, setEditedFields] = useState(new Set());
  
  const inputRefs = useRef({});
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  useEffect(() => {
    if (questions.length > 0 && Object.keys(userAnswers).length > 0) {
      generateBriefFields();
    }
  }, [questions, userAnswers]);

  const generateBriefFields = () => {
    const fields = [];
 
    Object.keys(userAnswers).forEach(questionId => {
      const question = questions.find(q => q.id === parseInt(questionId));
      const answer = userAnswers[questionId];
      
      if (question && answer && answer.trim()) {
        fields.push({
          key: `question_${questionId}`,
          label: question.question,
          value: answer,
          questionId: parseInt(questionId)
        });
      }
    });

    fields.sort((a, b) => a.questionId - b.questionId);
    setBriefFields(fields);
  };

  const handleEdit = (field) => {
    setEditingField(field.key);
    
    setTimeout(() => {
      const input = inputRefs.current[field.key];
      if (input) {
        input.focus({ preventScroll: true });
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 50);
  };

  const handleSave = async (field) => {
    const input = inputRefs.current[field.key];
    const newValue = input?.value || '';
    
    if (newValue.trim()) {
      try {
        const token = getAuthToken();
        await fetch(`${API_BASE_URL}/api/answers/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            question_id: field.questionId,
            answer: newValue.trim()
          })
        });

        if (onAnswerUpdate) {
          onAnswerUpdate(field.questionId, newValue.trim());
        }

        setEditedFields(prev => new Set([...prev, field.key]));
      } catch (error) {
        console.error('Error updating answer:', error);
      }
    }
    
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const handleKeyPress = (e, field) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const EditableField = ({ field }) => {
    const isEditing = editingField === field.key;
    const isEmpty = !field.value || field.value.trim() === '';
    const isEdited = editedFields.has(field.key);

    return (
      <div className={`brief-item ${isEdited ? 'edited' : ''}`}>
        <div className="item-row">
          <span className="item-label">{field.label}:</span>
          {!isEditing && (
            <button
              className="edit-button"
              onClick={() => handleEdit(field)}
              type="button"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="edit-container">
            <textarea
              ref={el => {
                if (el) inputRefs.current[field.key] = el;
              }}
              className="edit-textarea"
              defaultValue={field.value || ''}
              onKeyDown={(e) => handleKeyPress(e, field)}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              style={{ 
                minHeight: '100px',
                maxHeight: '200px',
                resize: 'vertical'
              }}
            />
            <div className="edit-actions">
              <button
                className="save-button"
                onClick={() => handleSave(field)}
                type="button"
              >
                <Check size={14} />
              </button>
              <button
                className="cancel-button"
                onClick={handleCancel}
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <p 
            className={`item-text ${isEmpty ? 'placeholder' : ''}`}
            onClick={() => handleEdit(field)}
            style={{ cursor: 'pointer' }}
          >
            {field.value || `Add ${field.label.toLowerCase()}...`}
            {isEdited && <span className="edited-indicator"> ✏️</span>}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="brief-section">
      <div className="brief-content"> 
        <div className="brief-list">
          {briefFields.length > 0 ? (
            briefFields.map((field) => (
              <EditableField key={field.key} field={field} />
            ))
          ) : (
            <div className="no-data">
              <p>Your business information will appear here as you answer questions in the chat.</p>
            </div>
          )}
        </div>
        
        {briefFields.length > 0 && (
          <div className="brief-footer">
            <p className="brief-note">
              💡 Fields are automatically generated from your chat responses. Click any field to edit.
            </p>
          </div>
        )}
      </div> 
    </div>
  );
};

export default EditableBriefSection;