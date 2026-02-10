import React from 'react';

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
                <span className="switch-knob"></span>
            </button>
            <span className={isNewCompany ? 'active-label' : ''}>Create</span>
        </div>
    );
};

export default RegistrationToggle;
