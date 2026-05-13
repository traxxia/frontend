import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { Search, ChevronDown, User as UserIcon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/dateUtils';

const UserHistoryTable = ({ users, onSelectUser, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="text-center py-5">Loading users...</div>;
  }

  return (
    <div className="table-responsive">
      <Table hover className="user-history-table align-middle">
        <thead>
          <tr>
            <th>{t('Name')}</th>
            <th>{t('Email')}</th>
            <th>{t('Role')}</th>
            <th>{t('Joined')}</th>
            <th>{t('Actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>
                <div className="d-flex align-items-center">
                  <div className="user-avatar-small me-2">
                    <UserIcon size={16} />
                  </div>
                  <span className="fw-medium">{user.name}</span>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <Badge bg={user.role_name === 'super_admin' ? 'danger' : 'primary'} pill>
                  {user.role_name || user.role}
                </Badge>
              </td>
              <td className="text-muted">{formatDate(user.created_at)}</td>
              <td>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => onSelectUser(user)}
                >
                  {t('View History')}
                </Button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center py-4 text-muted">
                {t('No users found matching your criteria.')}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default UserHistoryTable;
