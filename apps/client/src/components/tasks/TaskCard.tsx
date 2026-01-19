import React from 'react';
import type { Task, TaskPriority, TaskType } from '@/types';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  URGENT: { label: 'Urgent', className: 'task-card__priority--urgent' },
  HIGH: { label: 'High', className: 'task-card__priority--high' },
  MEDIUM: { label: 'Medium', className: 'task-card__priority--medium' },
  LOW: { label: 'Low', className: 'task-card__priority--low' },
};

const typeConfig: Record<TaskType, { label: string; icon: JSX.Element }> = {
  FEATURE: {
    label: 'Feature',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  BUG: {
    label: 'Bug',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  IMPROVEMENT: {
    label: 'Improvement',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  DOCUMENTATION: {
    label: 'Documentation',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isDragging = false }) => {
  const priority = priorityConfig[task.priority];
  const type = typeConfig[task.type];

  const formatDueDate = (date: Date | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(d);
    taskDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', className: 'task-card__due-date--overdue' };
    } else if (diffDays === 0) {
      return { text: 'Today', className: 'task-card__due-date--today' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', className: 'task-card__due-date--soon' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, className: 'task-card__due-date--soon' };
    } else {
      return {
        text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        className: '',
      };
    }
  };

  const dueDate = formatDueDate(task.dueDate);

  return (
    <div
      className={`task-card ${isDragging ? 'task-card--dragging' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <div className="task-card__header">
        <span className="task-card__id">{task.taskId}</span>
        <span className={`task-card__type task-card__type--${task.type.toLowerCase()}`} title={type.label}>
          {type.icon}
        </span>
      </div>

      <h4 className="task-card__title">{task.title}</h4>

      {task.description && (
        <p className="task-card__description">{task.description}</p>
      )}

      <div className="task-card__footer">
        <span className={`task-card__priority ${priority.className}`}>
          {priority.label}
        </span>

        {dueDate && (
          <span className={`task-card__due-date ${dueDate.className}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {dueDate.text}
          </span>
        )}

        {task.assigneeId && (
          <div className="task-card__assignee" title="Assigned">
            <div className="task-card__avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
