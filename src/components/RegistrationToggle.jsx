import React from 'react';
import { motion } from 'framer-motion';

const RegistrationToggle = ({ isNewCompany, setIsNewCompany }) => {
    return (
        <div className="compact-toggle-container">
            <span className={!isNewCompany ? 'active-label' : ''}>Join</span>
            <button
                type="button"
                className={`small-switch ${isNewCompany ? 'on' : ''}`}
                onClick={() => setIsNewCompany(!isNewCompany)}
                aria-label="Toggle between join and create"
            >
                <motion.span
                    className="switch-knob"
                    animate={{ left: isNewCompany ? 16 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
            <span className={isNewCompany ? 'active-label' : ''}>Create</span>
        </div>
    );
};

export default RegistrationToggle;
