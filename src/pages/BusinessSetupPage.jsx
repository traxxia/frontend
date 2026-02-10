import React from 'react';
import BusinessSetupPageOriginal from './BusinessSetupPageOriginal';
import BusinessSetupPageNew from './BusinessSetupPageNew';

const BusinessSetupPage = () => {
    const useNewUI = process.env.REACT_APP_USE_NEW_UI === 'true';

    if (useNewUI) {
        return <BusinessSetupPageNew />;
    }

    return <BusinessSetupPageOriginal />;
};

export default BusinessSetupPage;
