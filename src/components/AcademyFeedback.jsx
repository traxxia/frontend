import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/academy.css';

const AcademyFeedback = ({ articleId }) => {
    const [submitted, setSubmitted] = useState(false);
    const [feedbackType, setFeedbackType] = useState(null); // 'yes' or 'no'
    const [feedbackText, setFeedbackText] = useState('');
    const [showTextarea, setShowTextarea] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleFeedback = (type) => {
        setFeedbackType(type);
        // Show textarea for both positive and negative feedback
        setShowTextarea(true);
    };

    const submitFeedback = async (type, text) => {
        const payload = {
            articleId,
            helpful: type === 'yes',
            feedback: text
        };
        try {
            // App stores ID in sessionStorage as "userId" during login
            const storedUserId = sessionStorage.getItem('userId');
            if (storedUserId) {
                payload.userId = storedUserId;
            }
        } catch (e) {
            console.warn('Could not read userId from sessionStorage', e);
        }

        try {
            // Using the base URL from the environment variables
            const baseUrl = process.env.REACT_APP_BACKEND_URL || '';
            const response = await fetch(`${baseUrl}/api/academy-feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error('Failed to submit feedback', await response.text());
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }

        setSubmitted(true);
        setTimeout(() => {
            setShowTextarea(false);
        }, 2000);
    };

    const validateFeedback = (text) => {
        const trimmedText = text.trim();
        
        if (!trimmedText) {
            return t('business_purpose_required') || 'Business Purpose is required';
        }
        if (trimmedText.length < 10) {
            return t('description_min_length') || 'Business description must be at least 10 characters long';
        }
        if (!/[A-Za-z]/.test(trimmedText)) {
            return t('business_purpose_must_contain_alphabetic_characters') || 'Business purpose must contain alphabetic characters';
        }
        if (/[0-9]{5,}/.test(trimmedText)) {
            return t('description_consecutive_numbers') || 'Too many consecutive numbers are not allowed';
        }
        if (/[^A-Za-z0-9\s]{5,}/.test(trimmedText)) {
            return t('description_consecutive_special') || 'Too many consecutive special characters are not allowed';
        }
        return '';
    };

    const handleSubmitText = () => {
        const validationError = validateFeedback(feedbackText);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError('');
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
                        placeholder={
                            feedbackType === 'yes'
                                ? "What did you like about it? (optional)"
                                : "What could we improve? (optional)"
                        }
                        value={feedbackText}
                        onChange={(e) => {
                            setFeedbackText(e.target.value);
                            if (error) setError('');
                        }}
                        rows={3}
                    />
                    {error && <div className="feedback-error-message" style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '5px', marginBottom: '5px' }}>{error}</div>}
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
