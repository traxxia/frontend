import React from 'react';
import { Trash2 } from "lucide-react";

const BusinessRow = ({ business, isCollaborator, isViewer, onBusinessClick, onDeleteClick, t }) => {
  const isDeleted = business.status === 'deleted';
  const state = isDeleted ? 'DELETED' : (business.has_projects ? 'EXECUTION' : 'CREATED');
  const stateClass = `state-${state.toLowerCase()}`;
  const date = business.created_at ? new Date(business.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }) : 'N/A';

  const activeBets = business.project_count || business.question_statistics?.total_projects || 0;
  const collaborators = business.collaborators_count ?? (business.company_admin_id?.length || 1);

  const statusLower = (business.status || '').toLowerCase();
  const accessLower = (business.access_mode || '').toLowerCase();
  const isActuallyArchived = statusLower === 'archived' || accessLower === 'archived';
  const isActuallyDeleted = statusLower === 'deleted';

  const displayStatus = isActuallyDeleted ? 'Deleted' : (isActuallyArchived ? 'Archived' : 'Active');
  const statusBadgeClass = isActuallyDeleted ? 'status-deleted' : (isActuallyArchived ? 'status-archived' : 'status-active');

  return (
    <tr
      onClick={!isDeleted ? () => onBusinessClick(business) : undefined}
      className={isDeleted ? 'row-deleted' : ''}
    >
      <td className="business-name-cell">{business.business_name}</td>
      <td>
        <span className={`state-badge ${stateClass}`}>{state}</span>
      </td>
      <td className="date-cell">{date}</td>
      <td className="status-response-cell">
        <span className={`status-badge ${statusBadgeClass}`}>
          {displayStatus}
        </span>
      </td>
      <td className="stats-cell">{activeBets}</td>
      <td className="stats-cell">{collaborators}</td>
      {(!isCollaborator && !isViewer) && (
        <td className="stats-cell">
          {!isDeleted && (
            <button
              className="btn-delete-business"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(business);
              }}
              title={t('delete_business')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </td>
      )}
    </tr>
  );
};

const BusinessTable = ({ businesses, isCollaborator, isViewer, onBusinessClick, onDeleteClick, t }) => {
  return (
    <div className="businesses-table-wrapper">
      <table className="businesses-table">
        <thead>
          <tr>
            <th>{t('business_column') || "BUSINESS"}</th>
            <th>{t('state_column') || "STATE"}</th>
            <th className="th-date">{t('date_of_creation_column') || "DATE OF CREATION"}</th>
            <th>{t('status_column') || "STATUS"}</th>
            <th>{t('active_bets_column') || "# BETS"}</th>
            <th>{t('collaborators_column') || "# COLLABORATORS"}</th>
            {(!isCollaborator && !isViewer) && <th>{t('action_column') || "ACTION"}</th>}
          </tr>
        </thead>
        <tbody>
          {businesses.length === 0 ? (
            <tr>
              <td colSpan={(!isCollaborator && !isViewer) ? "7" : "6"} className="text-center py-5 text-muted">
                {t('no_businesses_yet')}
              </td>
            </tr>
          ) : (
            businesses.map((business) => (
              <BusinessRow
                key={business._id || business.id}
                business={business}
                isCollaborator={isCollaborator}
                isViewer={isViewer}
                onBusinessClick={onBusinessClick}
                onDeleteClick={onDeleteClick}
                t={t}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BusinessTable;
