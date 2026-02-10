import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const SuperAdminNavigation = ({ activeTab, onTabChange, userRole }) => {
    const { t } = useTranslation();
    const isSuperAdmin = userRole === 'super_admin';

    const allTabs = [
        { id: 'companies', label: isSuperAdmin ? t('companies') : t('company'), icon: 'Building2' },
        { id: 'businesses', label: t('businesses') || 'Businesses', icon: 'Building2' },
        { id: 'user_management', label: t('user_management'), icon: 'CircleUserRound' },
        { id: 'access_management', label: t('access_management'), icon: 'Key', adminOnly: true },
        { id: 'history', label: t('user_history'), icon: 'History' },
        { id: 'audit', label: t('audit_trail'), icon: 'Activity' },
        { id: 'questions', label: t('questions'), icon: 'HelpCircle', superAdminOnly: true }
    ];

    const tabs = allTabs.filter((tab) => {
        if (tab.superAdminOnly && !isSuperAdmin) return false;
        if (tab.adminOnly && userRole !== 'company_admin') return false;
        return true;
    });

    const renderIcon = (iconName) => {
        const IconComponent = LucideIcons[iconName];
        return IconComponent ? <IconComponent size={18} /> : null;
    };

    return (
        <div className="admin-sidebar">
            <div className="admin-sidebar-nav"> 

                <div className="admin-nav-tabs-v2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`admin-nav-tab-v2 ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <div className="tab-icon-v2">
                                {renderIcon(tab.icon)}
                            </div>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="admin-sidebar-footer">
                <button
                    className="sidebar-footer-link"
                    onClick={() => window.location.href = '/dashboard'}
                >
                    <LucideIcons.LayoutDashboard size={14} />
                    <span>Dashboard</span>
                </button>
            </div>
        </div>
    );
};

export default SuperAdminNavigation;
