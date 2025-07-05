// CategoryItem.jsx - Fixed for Your Exact API Response Structure
import React from 'react';
import { Form, Collapse } from 'react-bootstrap';
import { ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';

const CategoryItem = ({
  category,
  isExpanded,
  isComplete,
  answeredCount,
  onToggle,
  onAnswerChange,
  t // Translation function
}) => {
  // Debug logging to help identify data structure issues
  console.log('CategoryItem received category:', category);
  console.log('Category questions:', category?.questions);

  return (
    <div className="category-accordion-item">
      <div
        onClick={onToggle}
        className="category-header"
      >
        <div className={`category-chevron ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {isExpanded ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </div>
        
        <div className="category-name">
          <span className="category-name-text">
            {/* Use the name property that was set in the transform function */}
            {category.name}
          </span>
        </div>
        
        <div>
          {isComplete ? (
            <CheckCircle size={20} className="category-status-icon completed" />
          ) : (
            <div className="category-status-number">
              {answeredCount}
            </div>
          )}
        </div>
      </div>
      
      <Collapse in={isExpanded}>
        <div>
          <div className="category-content-wrapper">
            {category.questions?.map((question) => {
              // Debug each question
              console.log('Rendering question:', question);
              
              return (
                <div key={question.id} className="question-item">
                  <label className="question-label" htmlFor={`question-${question.id}`}>
                    {/* Use the title property that was set in the transform function */}
                    {question.title}
                  </label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    id={`question-${question.id}`}
                    name={`question-${question.id}`}
                    value={question.answer || ""}
                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                    className="answer-textarea"
                    autoComplete="off"
                    spellCheck="true"
                    placeholder={t?.('enter_your_answer') || 'Enter your answer...'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Collapse>
    </div>
  );
};

export default CategoryItem;