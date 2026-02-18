import React, { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaCreditCard, FaPaypal, FaUniversity, FaCheck, FaLock, FaMicrochip, FaCcVisa, FaCcMastercard, FaCcAmex, FaCcDiscover, FaCcDinersClub, FaCcJcb } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Register.css'; // Reusing Register styles for consistency

const PaymentForm = ({
    onSubmit,
    isSubmitting,
    error,
    submitLabel = "Pay & Register",
    showSaveCheckbox = true,
    hideHeader = false,
    isActive = true,
    onMethodSelect
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [localError, setLocalError] = useState(null);
    const [paymentMethodType, setPaymentMethodType] = useState('card');
    const [cardBrand, setCardBrand] = useState('unknown');
    const [cardComplete, setCardComplete] = useState(false);

    const handleMethodSelect = (type) => {
        setPaymentMethodType(type);
        if (onMethodSelect) onMethodSelect(type);
    };

    const stripeElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
                iconColor: '#666EE8',
            },
            invalid: {
                color: '#9e2146',
            },
        },
    };

    const getBrandIcon = (brand) => {
        switch (brand) {
            case 'visa': return <FaCcVisa size={40} />;
            case 'mastercard': return <FaCcMastercard size={40} />;
            case 'amex': return <FaCcAmex size={40} />;
            case 'discover': return <FaCcDiscover size={40} />;
            case 'diners': return <FaCcDinersClub size={40} />;
            case 'jcb': return <FaCcJcb size={40} />;
            default: return <FaCreditCard size={40} />;
        }
    };

    const handleCardNumberChange = (e) => {
        setCardBrand(e.brand || 'unknown');
        setCardComplete(e.complete);
        if (e.error) {
            setLocalError(e.error.message);
        } else {
            setLocalError(null);
        }
    };

    return (
        <div className="payment-form-container">
            <div className="full-width-field payment-section" style={{ border: 'none', padding: 0 }}>
                {!hideHeader && <h3 className="mb-4">Select Payment Method</h3>}

                <div className="payment-methods-grid">
                    <div
                        className={`payment-method-card ${isActive && paymentMethodType === 'card' ? 'active' : ''}`}
                        onClick={() => handleMethodSelect('card')}
                    >
                        <div className="pm-icon"><FaCreditCard /></div>
                        <span className="pm-name">Card</span>
                        {isActive && paymentMethodType === 'card' && <div className="pm-check"><FaCheck /></div>}
                    </div>

                    <div className="payment-method-card disabled">
                        <div className="pm-icon"><FaPaypal /></div>
                        <span className="pm-name">PayPal</span>
                        <span className="pm-badge">Soon</span>
                    </div>

                    <div className="payment-method-card disabled">
                        <div className="pm-icon"><FaUniversity /></div>
                        <span className="pm-name">Bank Transfer</span>
                        <span className="pm-badge">Soon</span>
                    </div>
                </div>

                {paymentMethodType === 'card' && isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="card-details-container mt-4"
                    >
                        {/* Visual Card Preview */}
                        <AnimatePresence>
                            {cardComplete && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="visual-card-wrapper"
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div className={`visual-card brand-${cardBrand}`}>
                                        <div className="card-chip"><FaMicrochip size={32} /></div>
                                        <div className="card-brand-logo">{getBrandIcon(cardBrand)}</div>
                                        <div className={`card-number-display ${cardComplete ? 'complete' : ''}`}>
                                            **** **** **** {cardComplete ? <span className="valid-check"><FaCheck /></span> : '****'}
                                        </div>
                                        <div className="card-meta">
                                            <div className="card-holder">
                                                <span className="meta-label">Card Holder</span>
                                                <span className="meta-value">YOUR NAME</span>
                                            </div>
                                            <div className="card-expiry">
                                                <span className="meta-label">Expires</span>
                                                <span className="meta-value">MM/YY</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="payment-header-row mb-3">
                            <h4 className="m-0">Payment Details</h4>
                        </div>

                        <div className="form-group mb-3">
                            <label>Card Number</label>
                            <div className="stripe-input-wrapper">
                                <CardNumberElement
                                    options={{ ...stripeElementOptions, showIcon: false }}
                                    onChange={handleCardNumberChange}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Expiry Date</label>
                                <div className="stripe-input-wrapper">
                                    <CardExpiryElement options={stripeElementOptions} />
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>CVC</label>
                                <div className="stripe-input-wrapper">
                                    <CardCvcElement options={stripeElementOptions} />
                                </div>
                            </div>
                        </div>


                    </motion.div>
                )}

                {(localError || error) && <div className="error-message mt-3">{localError || error}</div>}
            </div>
        </div>
    );
};

export default PaymentForm;
