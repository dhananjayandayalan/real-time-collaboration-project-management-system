import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTasks, setCurrentTask } from '@/store/slices/tasksSlice';
import { LoadingSpinner } from '@/components/common';
import { TaskStatus, TaskPriority } from '@/types';
import type { Task } from '@/types';
import './MyTasks.css';

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.IN_REVIEW]: 'In Review',
  [TaskStatus.DONE]: 'Done',
};

const priorityColors: Record<TaskPriority, string> = {
  [TaskPriority.URGENT]: 'urgent',
  [TaskPriority.HIGH]: 'high',
  [TaskPriority.MEDIUM]: 'medium',
  [TaskPriority.LOW]: 'low',
};

type FilterTab = 'all' | TaskStatus.TODO | TaskStatus.IN_PROGRESS | TaskStatus.IN_REVIEW | TaskStatus.DONE;

export const MyTasks: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchTasks({ assigneeId: user.id }));
    }
  }, [dispatch, user?.id]);

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasks;
    return tasks.filter((t) => t.status === activeTab);
  }, [tasks, activeTab]);

  const counts = useMemo(() => ({
    all: tasks.length,
    [TaskStatus.TODO]: tasks.filter((t) => t.status === TaskStatus.TODO).length,
    [TaskStatus.IN_PROGRESS]: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    [TaskStatus.IN_REVIEW]: tasks.filter((t) => t.status === TaskStatus.IN_REVIEW).length,
    [TaskStatus.DONE]: tasks.filter((t) => t.status === TaskStatus.DONE).length,
  }), [tasks]);

  const handleTaskClick = (task: Task) => {
    dispatch(setCurrentTask(task));
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: TaskStatus.TODO, label: 'To Do' },
    { id: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { id: TaskStatus.IN_REVIEW, label: 'In Review' },
    { id: TaskStatus.DONE, label: 'Done' },
  ];

  if (isLoading) {
    return (
      <div className="my-tasks-page">
        <LoadingSpinner size="lg" text="Loading your tasks..." />
      </div>
    );
  }

  return (
    <div className="my-tasks-page">
      <div className="my-tasks-page__header">
        <div>
          <h1 className="my-tasks-page__title">My Tasks</h1>
          <p className="my-tasks-page__subtitle">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} assigned to you
          </p>
        </div>
      </div>

      <div className="my-tasks-page__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`my-tasks-tab ${activeTab === tab.id ? 'my-tasks-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className="my-tasks-tab__count">
              {counts[tab.id as keyof typeof counts] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="my-tasks-page__empty">
          <div className="my-tasks-page__empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h2 className="my-tasks-page__empty-title">
            {activeTab === 'all' ? 'No tasks assigned to you' : `No ${statusLabels[activeTab as TaskStatus]} tasks`}
          </h2>
          <p className="my-tasks-page__empty-text">
            {activeTab === 'all'
              ? 'Tasks assigned to you across all projects will appear here'
              : 'Switch to another tab to see your other tasks'}
          </p>
          <button
            type="button"
            className="my-tasks-page__browse-btn"
            onClick={() => navigate('/projects')}
          >
            Browse Projects
          </button>
        </div>
      ) : (
        <div className="my-tasks-list">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="my-task-item"
              onClick={() => handleTaskClick(task)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleTaskClick(task);
              }}
            >
              <div className="my-task-item__left">
                <span className={`my-task-item__priority my-task-item__priority--${priorityColors[task.priority]}`} />
                <div className="my-task-item__info">
                  <span className="my-task-item__id">{task.taskId}</span>
                  <span className="my-task-item__title">{task.title}</span>
                </div>
              </div>
              <div className="my-task-item__right">
                {task.dueDate && (
                  <span className={`my-task-item__due ${new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE ? 'my-task-item__due--overdue' : ''}`}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span className={`my-task-item__status my-task-item__status--${task.status.toLowerCase().replace('_', '-')}`}>
                  {statusLabels[task.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
