import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTranslation } from "../hooks/useTranslation";

const PricingPlanCard = ({ plan, isSelected, onSelect }) => {
    const features = plan.features && Array.isArray(plan.features) ? plan.features : [];
    const { t } = useTranslation();

    return (
        <motion.div
            className={`plan-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(plan._id)}
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="plan-header">
                <span className="plan-name">{t(plan.name)}</span>
                <div className="plan-price">
                    <span className="currency">$</span>
                    <span className="amount">{plan.price || plan.price_usd}</span>
                    <span className="period">/{plan.period === 'year' ? 'yr' : 'mo'}</span>
                </div>
            </div>
            <p className="plan-desc">{t(plan.description)}</p>
            <ul className="plan-features">
                {features.map((feature, idx) => (
                    <li key={idx}>
                        <FaCheckCircle className="check-icon" />
                        {t(feature)}
                    </li>
                ))}
            </ul>
            {isSelected && <div className="selected-indicator">{t("Selected")}</div>}
        </motion.div>
    );
};

export default PricingPlanCard;
