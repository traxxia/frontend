import React from 'react';
import DashboardOriginal from './DashboardOriginal';
import DashboardNew from './DashboardNew';

const Dashboard = () => {
    const useNewUI = process.env.REACT_APP_USE_NEW_UI === 'true';

    if (useNewUI) {
        return <DashboardNew />;
    }

    return <DashboardOriginal />;
};

export default Dashboard;
