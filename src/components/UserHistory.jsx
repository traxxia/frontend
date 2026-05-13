import React, { useState } from 'react';
import { Card, Form, InputGroup } from 'react-bootstrap';
import { Search } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

// Sub-components
import UserHistoryMetrics from '@/components/UserHistory/UserHistoryMetrics';
import UserHistoryTable from '@/components/UserHistory/UserHistoryTable';
import UserHistoryModal from '@/components/UserHistory/UserHistoryModal';

// Hooks
import { useUserHistory } from '@/components/UserHistory/hooks/useUserHistory';

import '../styles/UserHistory.css';

const UserHistory = () => {
  const { t } = useTranslation();
  const {
    users,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    refresh
  } = useUserHistory();

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <div className="user-history-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="section-title mb-0">{t('User History & Activity')}</h2>
      </div>

      <UserHistoryMetrics users={users} />

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          <div className="p-4 border-bottom bg-light d-flex flex-column flex-md-row gap-3">
            <InputGroup className="search-group">
              <InputGroup.Text className="bg-white border-end-0">
                <Search size={18} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                placeholder={t('Search users by name or email...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>

            <Form.Select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="role-select"
            >
              <option value="All Roles">{t('All Roles')}</option>
              <option value="super_admin">{t('Super Admin')}</option>
              <option value="company_admin">{t('Company Admin')}</option>
              <option value="user">{t('Regular User')}</option>
            </Form.Select>
          </div>

          <UserHistoryTable 
            users={users} 
            isLoading={isLoading} 
            onSelectUser={handleSelectUser}
          />
        </Card.Body>
      </Card>

      <UserHistoryModal 
        show={showModal} 
        user={selectedUser} 
        onHide={() => setShowModal(false)} 
      />
    </div>
  );
};

export default UserHistory;
