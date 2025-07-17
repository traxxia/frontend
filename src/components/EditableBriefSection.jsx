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

    // Generate fields for each answered question
    Object.keys(userAnswers).forEach(questionId => {
      const question = questions.find(q => q.id === parseInt(questionId));
      const answer = userAnswers[questionId];
      
      if (question && answer && answer.trim()) {
        // Skip if this is already covered by business name
        if (questionId === '1' && businessData.name && businessData.name !== 'Your Business') {
          // Show as "What we do" instead
          fields.push({
            key: `question_${questionId}`,
            label: 'What we do',
            value: answer,
            multiline: true,
            source: 'question',
            questionId: parseInt(questionId),
            questionText: question.question
          });
        } else {
          // Generate label from question text
          const label = generateFieldLabel(question.question, questionId);
          
          fields.push({
            key: `question_${questionId}`,
            label: label,
            value: answer,
            multiline: answer.length > 100, // Auto-detect if multiline needed
            source: 'question',
            questionId: parseInt(questionId),
            questionText: question.question
          });
        }
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

  const generateFieldLabel = (questionText, questionId) => {
    // Convert question text to appropriate field label
    const question = questionText.toLowerCase();
    
    // Mapping patterns to labels
    const patterns = [
      { pattern: /business.*name|company.*name|what.*called/i, label: 'Business name' },
      { pattern: /what.*do|describe.*business|business.*about/i, label: 'What we do' },
      { pattern: /target.*audience|who.*customers|target.*market/i, label: 'Target audience' },
      { pattern: /products|services|offerings|sell/i, label: 'Products/Services' },
      { pattern: /unique.*value|what.*makes.*unique|competitive.*advantage/i, label: 'Unique value proposition' },
      { pattern: /mission|purpose|why.*exist/i, label: 'Mission' },
      { pattern: /vision|future|where.*heading/i, label: 'Vision' },
      { pattern: /location|where.*based|office/i, label: 'Location' },
      { pattern: /team|employees|staff|people/i, label: 'Team' },
      { pattern: /experience|background|expertise/i, label: 'Experience' },
      { pattern: /challenge|problem|pain.*point/i, label: 'Challenges' },
      { pattern: /goal|objective|want.*achieve/i, label: 'Goals' },
      { pattern: /revenue|income|money|pricing/i, label: 'Revenue model' },
      { pattern: /market.*size|industry|sector/i, label: 'Market' },
      { pattern: /competitor|competition/i, label: 'Competition' },
      { pattern: /marketing|promotion|advertis/i, label: 'Marketing strategy' },
      { pattern: /technology|tools|software/i, label: 'Technology' }
    ];

    // Find matching pattern
    for (const { pattern, label } of patterns) {
      if (pattern.test(question)) {
        return label;
      }
    }

    // Fallback: create label from question number
    return `Question ${questionId}`;
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

      <style jsx>{`
        .brief-item {
          margin-bottom: 20px;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 12px;
          transition: all 0.2s ease;
        }

        .brief-item:hover {
          border-color: #e3e6ea;
          background-color: #f8f9fa;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .item-label {
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .edit-button {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          opacity: 0;
          transition: all 0.2s ease;
        }

        .brief-item:hover .edit-button {
          opacity: 1;
        }

        .edit-button:hover {
          background-color: #e9ecef;
          color: #495057;
        }

        .item-text {
          margin: 0;
          color: #212529;
          line-height: 1.5;
          cursor: pointer;
          min-height: 20px;
          padding: 4px 0;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .item-text:hover {
          background-color: #f8f9fa;
        }

        .item-text.placeholder {
          color: #adb5bd;
          font-style: italic;
        }

        .field-source {
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
          margin-top: 4px;
          padding: 4px 8px;
          background-color: #f8f9fa;
          border-radius: 4px;
          border-left: 3px solid #007bff;
        }

        .edit-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .edit-input,
        .edit-textarea {
          border: 2px solid #007bff;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .edit-input:focus,
        .edit-textarea:focus {
          border-color: #0056b3;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .edit-textarea {
          min-height: 80px;
        }

        .edit-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .save-button,
        .cancel-button {
          border: none;
          border-radius: 4px;
          padding: 6px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .save-button {
          background-color: #28a745;
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background-color: #218838;
        }

        .save-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }

        .cancel-button {
          background-color: #6c757d;
          color: white;
        }

        .cancel-button:hover {
          background-color: #545b62;
        }

        .no-data {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 2px dashed #dee2e6;
        }

        .brief-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }

        .brief-note {
          font-size: 12px;
          color: #6c757d;
          margin: 0;
          text-align: center;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .brief-item {
            padding: 8px;
          }

          .edit-button {
            opacity: 1;
          }

          .edit-input,
          .edit-textarea {
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .field-source {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default EditableBriefSection;