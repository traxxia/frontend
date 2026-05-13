import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Users, Building2, User, Activity } from 'lucide-react';
import MetricCard from '../MetricCard';
import { useTranslation } from '../../hooks/useTranslation';

const UserHistoryMetrics = ({ users }) => {
  const { t } = useTranslation();

  const metrics = [
    {
      title: t('Total Users'),
      value: users.length,
      icon: <Users size={20} />,
      variant: 'primary'
    },
    {
      title: t('Admins'),
      value: users.filter(u => ['super_admin', 'company_admin'].includes(u.role_name || u.role)).length,
      icon: <User size={20} />,
      variant: 'success'
    },
    {
      title: t('Companies'),
      value: new Set(users.map(u => u.company_id).filter(Boolean)).size,
      icon: <Building2 size={20} />,
      variant: 'info'
    },
    {
      title: t('Active Today'),
      value: users.filter(u => {
        const lastActive = new Date(u.updated_at || u.created_at);
        const today = new Date();
        return lastActive.toDateString() === today.toDateString();
      }).length,
      icon: <Activity size={20} />,
      variant: 'warning'
    }
  ];

  return (
    <Row className="mb-4 g-3">
      {metrics.map((metric, index) => (
        <Col key={index} xs={12} sm={6} lg={3}>
          <MetricCard {...metric} />
        </Col>
      ))}
    </Row>
  );
};

export default UserHistoryMetrics;
