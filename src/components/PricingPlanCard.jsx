import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const PricingPlanCard = ({ plan, isSelected, onSelect }) => {
    const features = plan.name === 'Essential'
        ? ['Full Strategic Insights', 'PMF Validation Flow', 'Unlimited Initiatives', '1 Workspace Limit']
        : ['Everything in Essential', 'Up to 3 Workspaces', 'Initiative to Project Conversion', '3 Collaborator Seats'];

    return (
        <div
            className={`plan-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(plan._id)}
        >
            <div className="plan-header">
                <span className="plan-name">{plan.name}</span>
                <div className="plan-price">
                    <span className="currency">$</span>
                    <span className="amount">{plan.price || plan.price_usd}</span>
                    <span className="period">/mo</span>
                </div>
            </div>
            <p className="plan-desc">{plan.description}</p>
            <ul className="plan-features">
                {features.map((feature, idx) => (
                    <li key={idx}>
                        <FaCheckCircle className="check-icon" />
                        {feature}
                    </li>
                ))}
            </ul>
            {isSelected && <div className="selected-indicator">Selected</div>}
        </div>
    );
};

export default PricingPlanCard;
