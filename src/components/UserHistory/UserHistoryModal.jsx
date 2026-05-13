import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import { X, FileText, Target, TrendingUp, History } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/dateUtils';
import AnalysisContentManager from '../AnalysisContentManager';

const UserHistoryModal = ({ user, show, onHide }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('summary');
  const [userActivity, setUserActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (show && user) {
      // Fetch specific user history logic here
      // For now, using mock or simplified logic
    }
  }, [show, user]);

  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable className="user-history-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center">
          <div className="user-avatar me-3">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h4 className="mb-0">{user.name}</h4>
            <small className="text-muted">{user.email}</small>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-4">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 custom-tabs">
          <Tab eventKey="summary" title={<span><FileText size={16} className="me-2" />{t('Activity Summary')}</span>}>
             {/* Activity Summary Content */}
          </Tab>
          <Tab eventKey="businesses" title={<span><Target size={16} className="me-2" />{t('Businesses')}</span>}>
             {/* Businesses List */}
          </Tab>
          <Tab eventKey="full-history" title={<span><History size={16} className="me-2" />{t('Detailed Logs')}</span>}>
             {/* Detailed Logs */}
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide}>{t('Close')}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserHistoryModal;
