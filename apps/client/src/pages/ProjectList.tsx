import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { openModal, addNotification } from '@/store/slices/uiSlice';
import { updateTask } from '@/store/slices/tasksSlice';
import { FilterPanel } from '@/components/tasks';
import { Button, LoadingSpinner } from '@/components/common';
import { TaskStatus, TaskPriority, TaskType } from '@/types';
import type { Task } from '@/types';
import './ProjectList.css';

type SortField = 'taskId' | 'title' | 'status' | 'priority' | 'type' | 'dueDate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.IN_REVIEW]: 'In Review',
  [TaskStatus.DONE]: 'Done',
};

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.URGENT]: 'Urgent',
  [TaskPriority.HIGH]: 'High',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.LOW]: 'Low',
};

const typeLabels: Record<TaskType, string> = {
  [TaskType.FEATURE]: 'Feature',
  [TaskType.BUG]: 'Bug',
  [TaskType.IMPROVEMENT]: 'Improvement',
  [TaskType.DOCUMENTATION]: 'Docs',
};

export const ProjectList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  const { currentProject } = useAppSelector((state) => state.projects);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'taskId':
          comparison = a.taskId.localeCompare(b.taskId);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status': {
          const statusOrder = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE];
          comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          break;
        }
        case 'priority': {
          const priorityOrder = [TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];
          comparison = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
          break;
        }
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'dueDate': {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
        }
        case 'createdAt': {
          const aCreated = new Date(a.createdAt).getTime();
          const bCreated = new Date(b.createdAt).getTime();
          comparison = aCreated - bCreated;
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleTaskClick = (task: Task) => {
    dispatch(openModal({ type: 'taskDetail', data: task }));
  };

  const handleCreateTask = () => {
    dispatch(openModal({ type: 'createTask' }));
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)));
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await dispatch(updateTask({
        id: task.id,
        data: { status: newStatus },
      })).unwrap();
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update task status',
      }));
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="sort-icon sort-icon--inactive" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 15l5 5 5-5" />
          <path d="M7 9l5-5 5 5" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="sort-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    ) : (
      <svg className="sort-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="M19 12l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="project-list project-list--loading">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  return (
    <div className="project-list">
      <div className="project-list__header">
        {currentProject && (
          <FilterPanel projectId={currentProject.id} />
        )}
        <div className="project-list__actions">
          <Button onClick={handleCreateTask}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Task
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="project-list__empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <h3>No tasks yet</h3>
          <p>Create your first task to get started</p>
          <Button onClick={handleCreateTask}>Create Task</Button>
        </div>
      ) : (
        <div className="project-list__table-wrapper">
          <table className="project-list__table">
            <thead>
              <tr>
                <th className="project-list__th project-list__th--checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size === tasks.length && tasks.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="project-list__th project-list__th--sortable" onClick={() => handleSort('taskId')}>
                  <span>ID</span>
                  <SortIcon field="taskId" />
                </th>
                <th className="project-list__th project-list__th--sortable project-list__th--title" onClick={() => handleSort('title')}>
                  <span>Title</span>
                  <SortIcon field="title" />
                </th>
                <th className="project-list__th project-list__th--sortable" onClick={() => handleSort('status')}>
                  <span>Status</span>
                  <SortIcon field="status" />
                </th>
                <th className="project-list__th project-list__th--sortable" onClick={() => handleSort('priority')}>
                  <span>Priority</span>
                  <SortIcon field="priority" />
                </th>
                <th className="project-list__th project-list__th--sortable" onClick={() => handleSort('type')}>
                  <span>Type</span>
                  <SortIcon field="type" />
                </th>
                <th className="project-list__th project-list__th--sortable" onClick={() => handleSort('dueDate')}>
                  <span>Due Date</span>
                  <SortIcon field="dueDate" />
                </th>
                <th className="project-list__th project-list__th--sortable" onClick={() => handleSort('createdAt')}>
                  <span>Created</span>
                  <SortIcon field="createdAt" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task) => (
                <tr
                  key={task.id}
                  className={`project-list__row ${selectedTasks.has(task.id) ? 'project-list__row--selected' : ''}`}
                >
                  <td className="project-list__td project-list__td--checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={() => handleSelectTask(task.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="project-list__td project-list__td--id" onClick={() => handleTaskClick(task)}>
                    <span className="project-list__task-id">{task.taskId}</span>
                  </td>
                  <td className="project-list__td project-list__td--title" onClick={() => handleTaskClick(task)}>
                    <span className="project-list__task-title">{task.title}</span>
                  </td>
                  <td className="project-list__td">
                    <select
                      className={`project-list__status-select project-list__status-select--${task.status.toLowerCase().replace('_', '-')}`}
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="project-list__td">
                    <span className={`project-list__priority project-list__priority--${task.priority.toLowerCase()}`}>
                      {priorityLabels[task.priority]}
                    </span>
                  </td>
                  <td className="project-list__td">
                    <span className={`project-list__type project-list__type--${task.type.toLowerCase()}`}>
                      {typeLabels[task.type]}
                    </span>
                  </td>
                  <td className="project-list__td project-list__td--date">
                    {formatDate(task.dueDate)}
                  </td>
                  <td className="project-list__td project-list__td--date">
                    {formatDate(task.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
