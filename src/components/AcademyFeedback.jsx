import React, { useState } from 'react';
import '../styles/academy.css';

/**
 * AcademyFeedback Component
 * 
 * Provides "Was this helpful?" feedback mechanism for articles
 */
const AcademyFeedback = ({ articleId }) => {
    const [submitted, setSubmitted] = useState(false);
    const [feedbackType, setFeedbackType] = useState(null); // 'yes' or 'no'
    const [feedbackText, setFeedbackText] = useState('');
    const [showTextarea, setShowTextarea] = useState(false);

    const handleFeedback = (type) => {
        setFeedbackType(type);

        if (type === 'no') {
            // Show textarea for negative feedback
            setShowTextarea(true);
        } else {
            // Submit immediately for positive feedback
            submitFeedback(type, '');
        }
    };

    const submitFeedback = (type, text) => {
        // TODO: In future phase, send to analytics/backend
        console.log('Feedback submitted:', {
            articleId,
            helpful: type === 'yes',
            feedback: text,
            timestamp: new Date().toISOString()
        });

        setSubmitted(true);

        // Hide textarea after submission
        setTimeout(() => {
            setShowTextarea(false);
        }, 2000);
    };

    const handleSubmitText = () => {
        submitFeedback(feedbackType, feedbackText);
    };

    if (submitted) {
        return (
            <div className="academy-feedback academy-feedback-submitted">
                <div className="feedback-thank-you">
                    <span className="feedback-icon">✓</span>
                    <span>Thank you for your feedback!</span>
                </div>
            </div>
        );
    }

    return (
        <div className="academy-feedback">
            <div className="feedback-question">Was this article helpful?</div>

            <div className="feedback-buttons">
                <button
                    className={`feedback-btn feedback-btn-yes ${feedbackType === 'yes' ? 'active' : ''}`}
                    onClick={() => handleFeedback('yes')}
                    disabled={feedbackType !== null}
                >
                    👍 Yes
                </button>
                <button
                    className={`feedback-btn feedback-btn-no ${feedbackType === 'no' ? 'active' : ''}`}
                    onClick={() => handleFeedback('no')}
                    disabled={feedbackType !== null}
                >
                    👎 No
                </button>
            </div>

            {showTextarea && (
                <div className="feedback-textarea-wrapper">
                    <textarea
                        className="feedback-textarea"
                        placeholder="What could we improve? (optional)"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        rows={3}
                    />
                    <button
                        className="feedback-submit-btn"
                        onClick={handleSubmitText}
                    >
                        Submit Feedback
                    </button>
                </div>
            )}
        </div>
    );
};

export default AcademyFeedback;
