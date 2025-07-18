// Dynamic Editable Brief Section - Fields based on answered questions
import React, { useState, useEffect } from 'react';
import { Edit3, Check, X } from 'lucide-react';

const EditableBriefSection = ({ businessData, onBusinessDataUpdate, questions = [], userAnswers = {} }) => {
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [briefFields, setBriefFields] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Generate brief fields based on answered questions
  useEffect(() => {
    if (questions.length > 0 && Object.keys(userAnswers).length > 0) {
      generateBriefFields();
    }
  }, [questions, userAnswers, businessData]);

  const generateBriefFields = () => {
    const fields = [];
    
    // Always show business name first if we have it
    if (businessData.name && businessData.name !== 'Your Business') {
      fields.push({
        key: 'name',
        label: 'Business name',
        value: businessData.name,
        multiline: false,
        source: 'extracted'
      });
    }
 
    Object.keys(userAnswers).forEach(questionId => {
      const question = questions.find(q => q.id === parseInt(questionId));
      const answer = userAnswers[questionId];
      
      if (question && answer && answer.trim()) {
        const qId = parseInt(questionId);
         
         fields.push({
            key: `question_${questionId}`,
            label: 'What we do',
            value: answer,
            multiline: true,
            source: 'question',
            questionId: qId,
            questionText: question.question
          });
      }
    });

    // Remove duplicates and sort by question ID
    const uniqueFields = fields.filter((field, index, self) => 
      index === self.findIndex(f => f.key === field.key)
    );

    // Sort: business name first, then by question ID
    uniqueFields.sort((a, b) => {
      if (a.key === 'name') return -1;
      if (b.key === 'name') return 1;
      if (a.questionId && b.questionId) return a.questionId - b.questionId;
      return 0;
    });

    setBriefFields(uniqueFields);
  };

  const handleEdit = (field, currentValue) => {
    setEditingField(field.key);
    setEditValues({ ...editValues, [field.key]: currentValue });
  };

  const handleSave = async (field) => {
    const newValue = editValues[field.key];
    if (newValue !== undefined && newValue.trim() !== '') {
      
      if (field.source === 'question' && field.questionId) {
        // Update the original answer
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
        } catch (error) {
          console.error('Error updating answer:', error);
        }
      } else if (field.key === 'name') {
        // Update business name
        onBusinessDataUpdate({ name: newValue.trim() });
      }

      // Trigger refresh of brief fields
      setTimeout(() => {
        generateBriefFields();
      }, 500);
    }
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const handleKeyPress = (e, field) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave(field);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const EditableField = ({ field }) => {
    const isEditing = editingField === field.key;
    const displayValue = field.value || `Add ${field.label.toLowerCase()}...`;
    const isEmpty = !field.value || field.value.trim() === '';

    return (
      <div className="brief-item">
        <div className="item-row">
          <span className="item-label">{field.label}:</span>
          {!isEditing && (
            <button
              className="edit-button"
              onClick={() => handleEdit(field, field.value)}
              aria-label={`Edit ${field.label}`}
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="edit-container">
            {field.multiline ? (
              <textarea
                className="edit-textarea"
                value={editValues[field.key] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                onKeyDown={(e) => handleKeyPress(e, field)}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                autoFocus
                rows={3}
              />
            ) : (
              <input
                type="text"
                className="edit-input"
                value={editValues[field.key] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                onKeyPress={(e) => handleKeyPress(e, field)}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                autoFocus
              />
            )}
            <div className="edit-actions">
              <button
                className="save-button"
                onClick={() => handleSave(field)}
                disabled={!editValues[field.key]?.trim()}
              >
                <Check size={14} />
              </button>
              <button
                className="cancel-button"
                onClick={handleCancel}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <p 
            className={`item-text ${isEmpty ? 'placeholder' : ''}`}
            onClick={() => handleEdit(field, field.value)}
          >
            {displayValue}
          </p>
        )}
        
        {/* Show source info */}
        {/* {field.source === 'question' && (
          <div className="field-source">
            From: {field.questionText}
          </div>
        )} */}
      </div>
    );
  };

  return (
    <div className="brief-section">
      <div className="brief-content">
        <h3 className="brief-title">Business Brief</h3>
        
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