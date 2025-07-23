// Fixed Dynamic Editable Brief Section - Prevents page movement when editing
import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X } from 'lucide-react';

const EditableBriefSection = ({ businessData, onBusinessDataUpdate, questions = [], userAnswers = {}, onAnswerUpdate }) => {
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [briefFields, setBriefFields] = useState([]);
  const [editedFields, setEditedFields] = useState(new Set());
  
  // Refs to manage cursor position and prevent scrolling
  const inputRefs = useRef({});
  const cursorPosition = useRef({});
  const containerRef = useRef(null); // Reference to the main container
  const scrollPosition = useRef(0); // Store scroll position before editing

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
 
    Object.keys(userAnswers).forEach(questionId => {
      const question = questions.find(q => q.id === parseInt(questionId));
      const answer = userAnswers[questionId];
      
      if (question && answer && answer.trim()) {
        const qId = parseInt(questionId);
         
        fields.push({
          key: `question_${questionId}`,
          label:  question.question,
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

    // Sort by question ID
    uniqueFields.sort((a, b) => {
      if (a.questionId && b.questionId) return a.questionId - b.questionId;
      return 0;
    });

    setBriefFields(uniqueFields);
  };

  const handleEdit = (field, currentValue) => {
    // Store current scroll position before any DOM changes
    scrollPosition.current = window.pageYOffset || document.documentElement.scrollTop;
    
    setEditingField(field.key);
    setEditValues({ ...editValues, [field.key]: currentValue });
    
    // Store current cursor position
    cursorPosition.current[field.key] = 0;
    
    // Use requestAnimationFrame to ensure DOM updates are complete before focusing
    requestAnimationFrame(() => {
      const input = inputRefs.current[field.key];
      if (input) {
        // Focus without any scrolling behavior
        input.focus({ 
          preventScroll: true,
          focusVisible: false 
        });
        
        // Set cursor to end of text
        const length = (currentValue || '').length;
        if (input.setSelectionRange) {
          input.setSelectionRange(length, length);
        }
        
        // Restore scroll position after focus to prevent any movement
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPosition.current,
            behavior: 'instant'
          });
        });
      }
    });
  };

  const handleInputChange = (fieldKey, value) => {
    // Store current cursor position before state update
    const input = inputRefs.current[fieldKey];
    if (input && input.selectionStart !== undefined) {
      cursorPosition.current[fieldKey] = input.selectionStart;
    }
    
    setEditValues({ ...editValues, [fieldKey]: value });
  };

  // Restore cursor position after state update - with improved timing
  useEffect(() => {
    if (editingField && inputRefs.current[editingField]) {
      const input = inputRefs.current[editingField];
      const position = cursorPosition.current[editingField];
      
      if (position !== undefined) {
        // Use a more reliable timing mechanism
        const restoreCursor = () => {
          if (input && input.setSelectionRange) {
            input.setSelectionRange(position, position);
          }
        };
        
        // Try both immediate and delayed restoration
        restoreCursor();
        setTimeout(restoreCursor, 0);
        requestAnimationFrame(restoreCursor);
      }
    }
  });

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

          // Update the parent component's userAnswers state immediately
          if (onAnswerUpdate) {
            onAnswerUpdate(field.questionId, newValue.trim());
          }

          // Mark this field as edited for visual feedback
          setEditedFields(prev => new Set([...prev, field.key]));

        } catch (error) {
          console.error('Error updating answer:', error);
        }
      }
    }
    
    // Clean up and exit edit mode
    cleanupEdit();
  };

  const handleCancel = () => {
    cleanupEdit();
  };

  const cleanupEdit = () => {
    // Store current scroll position before cleanup
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Clean up refs and cursor position for the current editing field
    if (editingField) {
      delete cursorPosition.current[editingField];
      delete inputRefs.current[editingField];
    }
    
    setEditingField(null);
    setEditValues({});
    
    // Restore scroll position after state changes
    requestAnimationFrame(() => {
      window.scrollTo({
        top: currentScroll,
        behavior: 'instant'
      });
    });
  };

  const handleKeyPress = (e, field) => {
    if (e.key === 'Enter' && !e.shiftKey && !field.multiline) {
      e.preventDefault();
      e.stopPropagation();
      handleSave(field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  };

  // Prevent form submission and bubbling for all button clicks
  const handleButtonClick = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    // stopImmediatePropagation is not available on all React events
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }
    action();
  };

  const EditableField = ({ field }) => {
    const isEditing = editingField === field.key;
    const displayValue = field.value || `Add ${field.label.toLowerCase()}...`;
    const isEmpty = !field.value || field.value.trim() === '';
    const isEdited = editedFields.has(field.key);

    return (
      <div className={`brief-item ${isEdited ? 'edited' : ''}`}>
        <div className="item-row">
          <span className="item-label">{field.label}:</span>
          {!isEditing && (
            <button
              className="edit-button"
              onClick={(e) => handleButtonClick(e, () => handleEdit(field, field.value))}
              onMouseDown={(e) => e.preventDefault()} // Prevent focus change
              aria-label={`Edit ${field.label}`}
              type="button"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="edit-container">
            {field.multiline ? (
              <textarea
                ref={el => {
                  if (el) inputRefs.current[field.key] = el;
                }}
                className="edit-textarea"
                value={editValues[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, field)}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                onFocus={(e) => {
                  // Prevent page scroll on focus, but allow textarea to function normally
                  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                  
                  // Use setTimeout to ensure focus completes first
                  setTimeout(() => {
                    // Restore page scroll position if it changed
                    if (Math.abs((window.pageYOffset || document.documentElement.scrollTop) - currentScroll) > 5) {
                      window.scrollTo({
                        top: currentScroll,
                        behavior: 'instant'
                      });
                    }
                  }, 0);
                }}
                onWheel={(e) => {
                  // Allow scrolling within textarea, prevent page scroll
                  const textarea = e.currentTarget;
                  const scrollTop = textarea.scrollTop;
                  const scrollHeight = textarea.scrollHeight;
                  const height = textarea.clientHeight;
                  const deltaY = e.deltaY;
                  
                  // If trying to scroll up when already at top, or down when at bottom
                  if ((deltaY < 0 && scrollTop === 0) || 
                      (deltaY > 0 && scrollTop + height >= scrollHeight)) {
                    e.preventDefault(); // Prevent page scroll
                  }
                }}
                style={{ 
                  minHeight: '100px',
                  maxHeight: '200px',
                  height: 'auto',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  resize: 'none',
                  overscrollBehavior: 'contain'
                }}
              />
            ) : (
              <input
                ref={el => {
                  if (el) inputRefs.current[field.key] = el;
                }}
                type="text"
                className="edit-input"
                value={editValues[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, field)}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                onFocus={(e) => {
                  // Prevent any scroll on focus
                  e.preventDefault();
                  window.scrollTo({
                    top: scrollPosition.current,
                    behavior: 'instant'
                  });
                }}
              />
            )}
            <div className="edit-actions">
              <button
                className="save-button"
                onClick={(e) => handleButtonClick(e, () => handleSave(field))}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!editValues[field.key]?.trim()}
                type="button"
              >
                <Check size={14} />
              </button>
              <button
                className="cancel-button"
                onClick={(e) => handleButtonClick(e, handleCancel)}
                onMouseDown={(e) => e.preventDefault()}
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <p 
            className={`item-text ${isEmpty ? 'placeholder' : ''}`}
            onClick={(e) => handleButtonClick(e, () => handleEdit(field, field.value))}
            style={{ cursor: 'pointer' }}
          >
            {displayValue}
            {isEdited && <span className="edited-indicator"> ✏️</span>}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="brief-section" ref={containerRef}>
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