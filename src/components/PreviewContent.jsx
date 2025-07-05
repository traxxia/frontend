// PreviewContent.js - Safe Version
import React, { useEffect, useState } from 'react';
import { Badge, Card, Row, Col } from 'react-bootstrap';

const PreviewContent = ({ categories = [], answers = {}, t }) => {
  const [localTranslations, setLocalTranslations] = useState({});

  // Safe translation function
  const translate = (key) => {
    try {
      if (t && typeof t === 'function') {
        const result = t(key);
        return typeof result === 'string' ? result : String(result);
      }
      if (window.getTranslation) {
        const result = window.getTranslation(key);
        return typeof result === 'string' ? result : String(result);
      }
      const result = localTranslations[key] || key;
      return typeof result === 'string' ? result : String(result);
    } catch (error) {
      console.error('Translation error for key:', key, error);
      return String(key);
    }
  };

  // Update translations when language changes (fallback if t is not passed)
  useEffect(() => {
    if (!t) {
      const updateTranslations = () => {
        try {
          const currentLang = window.currentAppLanguage || 'en';
          const currentTranslations = window.appTranslations?.[currentLang] || {};
          setLocalTranslations(currentTranslations);
        } catch (error) {
          console.error('Error updating translations:', error);
          setLocalTranslations({});
        }
      };

      updateTranslations();
      window.addEventListener('languageChanged', updateTranslations);

      return () => {
        window.removeEventListener('languageChanged', updateTranslations);
      };
    }
  }, [t]);

  // Helper function to get answer text
  const getAnswerText = (questionId) => {
    try {
      for (const category of categories) {
        const question = category.questions.find(q => (q.question_id || q.id) === questionId);
        if (question && question.answer) {
          return String(question.answer);
        }
      }

      // Retrieve the answer object for the questionId
      const answer = answers[questionId] || {};

      // Check for different answer types and ensure string return
      if (answer.selectedOption) return String(answer.selectedOption);
      if (answer.selectedOptions && answer.selectedOptions.length > 0) {
        return answer.selectedOptions.map(opt => String(opt)).join(', ');
      }
      if (answer.rating) return `${translate('rating')}: ${String(answer.rating)}`;
      if (answer.answer) return String(answer.answer);
      if (answer.description) return String(answer.description);

      return '';
    } catch (error) {
      console.error('Error getting answer text for question:', questionId, error);
      return '';
    }
  };

  // Helper function to check if question is answered
  const isQuestionAnswered = (questionId) => {
    try {
      const answerText = getAnswerText(questionId);
      return answerText.trim().length > 0;
    } catch (error) {
      console.error('Error checking if question is answered:', questionId, error);
      return false;
    }
  };

  // Get total statistics
  const getTotalStats = () => {
    try {
      const allQuestions = categories.flatMap(category =>
        category.questions.map(question => ({
          ...question,
          categoryName: category.category_name || category.name
        }))
      );

      const totalQuestions = allQuestions.length;
      const answeredQuestions = allQuestions.filter(q =>
        isQuestionAnswered(q.question_id || q.id)
      ).length;

      return { totalQuestions, answeredQuestions, allQuestions };
    } catch (error) {
      console.error('Error getting total stats:', error);
      return { totalQuestions: 0, answeredQuestions: 0, allQuestions: [] };
    }
  };

  const { totalQuestions, answeredQuestions } = getTotalStats();
  const completionPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  return (
    <div className="preview-content">
      {/* Overall Statistics */}
      <Card className="">
        <Card.Header className="">
          <h6 className="mb-0">📋 {translate('summary')}</h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <ul className="list-unstyled">
                <li><strong>{translate('total_questions')}:</strong> {totalQuestions}</li>
                <li><strong>{translate('answered_questions')}:</strong> {answeredQuestions}</li>
                <li><strong>{translate('pending_questions')}:</strong> {totalQuestions - answeredQuestions}</li>
              </ul>
            </Col>
            <Col md={6}>
              <ul className="list-unstyled">
                <li><strong>{translate('completion_rate')}:</strong> {completionPercentage}%</li>
                <li><strong>{translate('categories')}:</strong> {categories.length}</li>
                <li><strong>{translate('status')}:</strong>
                  <Badge bg={completionPercentage === 100 ? "success" : "warning"} className="ms-2">
                    {completionPercentage === 100 ?
                      translate('complete') :
                      translate('in_progress')
                    }
                  </Badge>
                </li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card><br></br>

      {/* Questions by Category */}
      {categories.map((category) => {
        try {
          const categoryQuestions = category.questions || [];
          const categoryAnswered = categoryQuestions.filter(q =>
            isQuestionAnswered(q.question_id || q.id)
          ).length;
          const categoryTotal = categoryQuestions.length;
          const categoryCompletion = categoryTotal > 0 ? Math.round((categoryAnswered / categoryTotal) * 100) : 0;

          return (
            <Card key={category.category_id || category.id} className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  📁 {String(category.category_name || category.name)}
                </h6>
                <div className="d-flex align-items-center gap-2">
                  <Badge bg={categoryCompletion === 100 ? "success" : categoryCompletion > 0 ? "warning" : "secondary"}>
                    {categoryAnswered}/{categoryTotal}
                  </Badge>
                  {/* <Badge bg={categoryCompletion === 100 ? "success" : "light"} text="dark">
                    {categoryCompletion}%
                  </Badge> */}
                </div>
              </Card.Header>
              <Card.Body>
                {categoryQuestions.length === 0 ? (
                  <p className="text-muted text-center">
                    {translate('no_questions_category')}
                  </p>
                ) : (
                  categoryQuestions.map((question, index) => {
                    try {
                      const questionId = question.question_id || question.id;
                      const answerText = getAnswerText(questionId);
                      const isAnswered = isQuestionAnswered(questionId);

                      return (
                        <div
                          key={questionId}
                          className={`question-preview mb-3 p-3 border rounded ${isAnswered ? 'border-success ' : 'border-warning '
                            }`}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="question-text mb-0">
                              <Badge bg="secondary" className="me-2">
                                {translate('question_short')}{index + 1}
                              </Badge>
                              {String(question.question_text || question.question)}
                            </h6>
                            <span> {isAnswered ? "✅" : "⏳"}</span>
                          </div>

                          {/* Question Type Badge */}
                          <div className="mb-2">
                            {/* <Badge bg="info" className="me-2">
                              {String(question.question_type || question.type || 'text')}
                            </Badge> */}
                            {question.options && question.options.length > 0 && (
                              <Badge bg="secondary">
                                {question.options.length} {translate('options')}
                              </Badge>
                            )}
                          </div>

                          {/* Answer Display */}
                          <div className="answer-section">
                            <strong>{translate('answer')}:</strong>
                            <div className={`mt-1 p-2 rounded`}>
                              {isAnswered ? (
                                <div
                                  className="answer-text"
                                  dangerouslySetInnerHTML={{
                                    __html: String(answerText).replace(/\n/g, '<br>')
                                  }}
                                />
                              ) : (
                                <span className="text-muted fst-italic">
                                  {translate('no_answer_provided')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Show options for multiple choice questions */}
                          {question.options && question.options.length > 0 && (
                            <div className="mt-2">
                              <small className="text-muted">
                                {translate('available_options')}:
                              </small>
                              <div className="d-flex flex-wrap gap-1 mt-1">
                                {question.options.map((option, optIndex) => (
                                  <Badge
                                    key={optIndex}
                                    bg={answerText.includes(String(option)) ? "primary" : "light"}
                                    text={answerText.includes(String(option)) ? "white" : "dark"}
                                    className="small"
                                  >
                                    {String(option)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering question:', question, error);
                      return (
                        <div key={question.question_id || question.id} className="alert alert-warning">
                          Error rendering question
                        </div>
                      );
                    }
                  })
                )}
              </Card.Body>
            </Card>
          );
        } catch (error) {
          console.error('Error rendering category:', category, error);
          return (
            <Card key={category.category_id || category.id} className="mb-4">
              <Card.Body>
                <div className="alert alert-warning">
                  Error rendering category: {String(category.category_name || category.name)}
                </div>
              </Card.Body>
            </Card>
          );
        }
      })}
    </div>
  );
};

export default PreviewContent;