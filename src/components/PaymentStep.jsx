import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, Loader } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import PaymentForm from './PaymentForm';

const PaymentStep = ({ onBack, onSubmit, isSubmitting, error, selectedPlanPrice, stripeComponents, stripe, elements }) => {
  const { t } = useTranslation();
  const { CardNumberElement } = stripeComponents;
  const [localError, setLocalError] = useState(null);
  const [cardHolderName, setCardHolderName] = useState('');

  const handlePayClick = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!cardHolderName.trim()) {
      setLocalError("Please enter card holder name.");
      return;
    }

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(cardHolderName.trim())) {
      setLocalError(t('card_holder_name_invalid') || "Card holder name can only contain letters.");
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setLocalError("Please complete the card details.");
      return;
    }

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardHolderName,
        }
      });

      if (stripeError) {
        setLocalError(stripeError.message);
        return;
      }

      setLocalError(null);
      onSubmit(paymentMethod.id, true);

    } catch (err) {
      setLocalError("An unexpected error occurred.");
      console.error(err);
    }
  };

  return (
    <motion.div
      key="tab3"
      className="register-form-grid fade-blur-in"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="full-width-field">
        <PaymentForm
          error={localError || error}
          isSubmitting={isSubmitting}
          cardHolderName={cardHolderName}
          onCardHolderNameChange={(name) => {
            setCardHolderName(name);
            if (localError) setLocalError(null);
          }}
          onCardChange={() => {
            if (localError) setLocalError(null);
          }}
          stripe={stripe}
          elements={elements}
          stripeComponents={stripeComponents}
        />
      </div>

      <div className="tab-navigation full-width-field">
        <button type="button" onClick={onBack} disabled={isSubmitting} className="btn-vibrant btn-secondary-vibrant">
          <ChevronLeft size={18} />{t("Previous")}
        </button>
        <button type="button" onClick={handlePayClick} disabled={isSubmitting} className="btn-vibrant btn-primary-vibrant create-account-btn">
          {isSubmitting ? <><Loader className="animate-spin" size={16} /> {t("Processing...")}</> : <><Check size={18} /> {t("Pay & Register")}</>}
        </button>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
