import React from 'react';
import { useAppSelector } from '@/store';
import './TaskHistory.css';

const fieldLabels: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  status: 'Status',
  priority: 'Priority',
  type: 'Type',
  assigneeId: 'Assignee',
  dueDate: 'Due date',
};

const statusLabels: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const priorityLabels: Record<string, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const typeLabels: Record<string, string> = {
  FEATURE: 'Feature',
  BUG: 'Bug',
  IMPROVEMENT: 'Improvement',
  DOCUMENTATION: 'Documentation',
};

export const TaskHistory: React.FC = () => {
  const { history } = useAppSelector((state) => state.tasks);

  const formatValue = (field: string, value: string | undefined): string => {
    if (!value) return 'None';

    switch (field) {
      case 'status':
        return statusLabels[value] || value;
      case 'priority':
        return priorityLabels[value] || value;
      case 'type':
        return typeLabels[value] || value;
      case 'dueDate':
        return new Date(value).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      default:
        return value;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getChangeIcon = (field: string) => {
    switch (field) {
      case 'status':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case 'priority':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
        );
      case 'assigneeId':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'dueDate':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        );
    }
  };

  if (history.length === 0) {
    return (
      <div className="task-history">
        <div className="task-history__empty">
          <p>No activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-history">
      <div className="task-history__list">
        {history.map((entry) => (
          <div key={entry.id} className="task-history__item">
            <div className="task-history__icon">
              {getChangeIcon(entry.field)}
            </div>
            <div className="task-history__content">
              <div className="task-history__message">
                <span className="task-history__user">User {entry.userId.slice(0, 8)}</span>
                {' changed '}
                <span className="task-history__field">{fieldLabels[entry.field] || entry.field}</span>
              </div>
              <div className="task-history__change">
                {entry.oldValue && (
                  <>
                    <span className="task-history__old-value">
                      {formatValue(entry.field, entry.oldValue)}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
                <span className="task-history__new-value">
                  {formatValue(entry.field, entry.newValue)}
                </span>
              </div>
              <div className="task-history__date">
                {formatDate(entry.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskHistory;
