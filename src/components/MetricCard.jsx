import React from 'react';
import '../styles/MetricCard.css';

const MetricCard = ({ title, value, icon: Icon, active = false }) => {
    return (
        <div className={`metric-card glass-panel ${active ? 'active' : ''}`}>
            <div className="metric-header">
                <span className="metric-title">{title}</span>
                {Icon && <Icon className="metric-icon" />}
            </div>
            <div className="metric-value">
                {value}
            </div>
        </div>
    );
};

export default MetricCard;
