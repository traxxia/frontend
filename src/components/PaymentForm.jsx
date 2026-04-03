import React, { useState } from 'react';
// Stripe imports removed for lazy loading
import { FaCreditCard, FaPaypal, FaUniversity, FaCheck, FaLock, FaMicrochip, FaCcVisa, FaCcMastercard, FaCcAmex, FaCcDiscover, FaCcDinersClub, FaCcJcb } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from "../hooks/useTranslation";
import '../styles/Register.css'; // Reusing Register styles for consistency

const PaymentForm = ({
    onSubmit,
    isSubmitting,
    error,
    submitLabel = "Pay & Register",
    showSaveCheckbox = true,
    hideHeader = false,
    isActive = true,
    onMethodSelect,
    cardHolderName = '',
    onCardHolderNameChange = () => { },
    onCardChange = () => { },
    stripe,
    elements,
    stripeComponents
}) => {
    const { t } = useTranslation();
    const { CardNumberElement, CardExpiryElement, CardCvcElement } = stripeComponents || {};
    
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
        disabled: isSubmitting,
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

    const handleStripeChange = (e) => {
        if (e.elementType === 'cardNumber') {
            setCardBrand(e.brand || 'unknown');
            setCardComplete(e.complete);
        }
        if (onCardChange) onCardChange(e);
        if (e.error) {
            setLocalError(e.error.message);
        } else {
            setLocalError(null);
        }
    };

    return (
        <div className="payment-form-container">
            <div className="full-width-field payment-section" style={{ border: 'none', padding: 0 }}>
                {!hideHeader && <h3 className="mb-4">{t("Select Payment Method")}</h3>}

                <div className="payment-methods-grid">
                    <div
                        className={`payment-method-card ${isActive && paymentMethodType === 'card' ? 'active' : ''}`}
                        onClick={() => handleMethodSelect('card')}
                    >
                        <div className="pm-icon"><FaCreditCard /></div>
                        <span className="pm-name">{t("Card")}</span>
                        {isActive && paymentMethodType === 'card' && <div className="pm-check"><FaCheck /></div>}
                    </div>

                    <div className="payment-method-card disabled">
                        <div className="pm-icon"><FaPaypal /></div>
                        <span className="pm-name">PayPal</span>
                        <span className="pm-badge">{t("Soon")}</span>
                    </div>

                    <div className="payment-method-card disabled">
                        <div className="pm-icon"><FaUniversity /></div>
                        <span className="pm-name">{t("Bank Transfer")}</span>
                        <span className="pm-badge">{t("Soon")}</span>
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
  <span className="meta-label">{t("Card Holder")}</span>
  <span className="meta-value">{(cardHolderName || t("YOUR NAME")).toUpperCase()}</span>
</div>

<div className="card-expiry">
  <span className="meta-label">{t("Expires")}</span>
  <span className="meta-value">MM/YY</span>
</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="payment-header-row mb-3">
                            <h4 className="m-0">{t("Payment Details")}</h4>
                        </div>

                        <div className="form-group mb-3">
                            <label>{t("Full Name")}</label>
                            <div className="stripe-input-wrapper">
                                <input
                                    type="text"
                                    placeholder={t("Card Holder Name")}
                                    value={cardHolderName}
                                    onChange={(e) => onCardHolderNameChange && onCardHolderNameChange(e.target.value)}
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        color: isSubmitting ? '#aab7c4' : '#424770',
                                        fontSize: '16px',
                                        padding: 0,
                                        margin: 0,
                                        boxShadow: 'none',
                                        borderRadius: 0,
                                        cursor: isSubmitting ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="form-group mb-3">
                            <label>{t("Card Number")}</label>
                            <div className="stripe-input-wrapper">
                                <CardNumberElement
                                    options={{ ...stripeElementOptions, showIcon: false }}
                                    onChange={handleStripeChange}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>{t("Expiry Date")}</label>
                                <div className="stripe-input-wrapper">
                                    <CardExpiryElement
                                        options={stripeElementOptions}
                                        onChange={handleStripeChange}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>CVC</label>
                                <div className="stripe-input-wrapper">
                                    <CardCvcElement
                                        options={stripeElementOptions}
                                        onChange={handleStripeChange}
                                    />
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
