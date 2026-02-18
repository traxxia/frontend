import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import '../styles/AdminTableStyles.css';

/**
 * MetricCard — reusable stat card for admin panels.
 *
 * Props:
 *  label       {string}          Card title, e.g. "Total Businesses"
 *  value       {string|number}   Main displayed value
 *  icon        {React.Component} Lucide icon component
 *  iconColor   {string}          One of: green | blue | orange | purple | red | teal
 *  trend       {number}          Optional percentage (positive = up, negative = down, 0 = neutral)
 *  trendLabel  {string}          Optional label after trend, e.g. "vs last month"
 */
const MetricCard = ({
    label,
    value,
    icon: Icon,
    iconColor = 'blue',
    trend,
    trendLabel = 'vs last month',
}) => {
    const hasTrend = trend !== undefined && trend !== null;
    const trendDir = hasTrend ? (trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral') : null;

    return (
        <div className="admin-metric-card">
            <div className="admin-metric-left">
                <span className="admin-metric-label">{label}</span>
                <span className="admin-metric-value">{value}</span>
                {hasTrend && (
                    <div className={`admin-metric-trend ${trendDir}`}>
                        {trendDir === 'up' && <TrendingUp size={13} />}
                        {trendDir === 'down' && <TrendingDown size={13} />}
                        {trendDir === 'neutral' && <Minus size={13} />}
                        <span>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                        <span className="admin-metric-trend-label">{trendLabel}</span>
                    </div>
                )}
            </div>
            {Icon && (
                <div className={`admin-metric-icon-wrap ${iconColor}`}>
                    <Icon size={20} />
                </div>
            )}
        </div>
    );
};

export default MetricCard;
