import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTask, updateTask, deleteTask, fetchComments, fetchAttachments, fetchTaskHistory } from '@/store/slices/tasksSlice';
import { closeModal, addNotification } from '@/store/slices/uiSlice';
import { useSocket } from '@/hooks';
import { Modal, Button, LoadingSpinner } from '@/components/common';
import { TaskComments } from './TaskComments';
import { TaskAttachments } from './TaskAttachments';
import { TaskHistory } from './TaskHistory';
import { TaskStatus, TaskPriority, TaskType } from '@/types';
import type { Task } from '@/types';
import './TaskDetailModal.css';

type TabType = 'comments' | 'attachments' | 'history';

const statusOptions = [
  { value: TaskStatus.TODO, label: 'To Do' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { value: TaskStatus.IN_REVIEW, label: 'In Review' },
  { value: TaskStatus.DONE, label: 'Done' },
];

const priorityOptions = [
  { value: TaskPriority.URGENT, label: 'Urgent' },
  { value: TaskPriority.HIGH, label: 'High' },
  { value: TaskPriority.MEDIUM, label: 'Medium' },
  { value: TaskPriority.LOW, label: 'Low' },
];

const typeOptions = [
  { value: TaskType.FEATURE, label: 'Feature' },
  { value: TaskType.BUG, label: 'Bug' },
  { value: TaskType.IMPROVEMENT, label: 'Improvement' },
  { value: TaskType.DOCUMENTATION, label: 'Documentation' },
];

export const TaskDetailModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { modalOpen, modalType, modalData } = useAppSelector((state) => state.ui);
  const { currentTask, comments, attachments, history, isLoading } = useAppSelector((state) => state.tasks);
  const { joinTask, leaveTask } = useSocket();

  const [activeTab, setActiveTab] = useState<TabType>('comments');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Task>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOpen = modalOpen && modalType === 'taskDetail';
  const task = currentTask || (modalData as Task);

  useEffect(() => {
    if (isOpen && task) {
      dispatch(fetchTask(task.id));
      dispatch(fetchComments(task.id));
      dispatch(fetchAttachments(task.id));
      dispatch(fetchTaskHistory(task.id));
      joinTask(task.id);
    }

    return () => {
      if (task) {
        leaveTask(task.id);
      }
    };
  }, [isOpen, task?.id, dispatch, joinTask, leaveTask]);

  useEffect(() => {
    if (currentTask) {
      setEditData({
        title: currentTask.title,
        description: currentTask.description,
        status: currentTask.status,
        priority: currentTask.priority,
        type: currentTask.type,
        dueDate: currentTask.dueDate,
      });
    }
  }, [currentTask]);

  const handleClose = () => {
    dispatch(closeModal());
    setIsEditing(false);
    setActiveTab('comments');
    setShowDeleteConfirm(false);
  };

  const handleSave = async () => {
    if (!task) return;

    try {
      await dispatch(updateTask({
        id: task.id,
        data: editData,
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Task updated successfully',
      }));
      setIsEditing(false);
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update task',
      }));
    }
  };

  const handleFieldChange = async (field: keyof Task, value: unknown) => {
    if (!task) return;

    try {
      await dispatch(updateTask({
        id: task.id,
        data: { [field]: value },
      })).unwrap();
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update task',
      }));
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    try {
      await dispatch(deleteTask(task.id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Task deleted successfully',
      }));
      handleClose();
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to delete task',
      }));
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      showCloseButton={true}
    >
      <div className="task-detail">
        {/* Header */}
        <div className="task-detail__header">
          <div className="task-detail__header-left">
            <span className="task-detail__id">{task.taskId}</span>
            <span className={`task-detail__type task-detail__type--${task.type.toLowerCase()}`}>
              {typeOptions.find((t) => t.value === task.type)?.label}
            </span>
          </div>
          <div className="task-detail__header-actions">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} isLoading={isLoading}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="task-detail__body">
          {/* Main content */}
          <div className="task-detail__main">
            {/* Title */}
            {isEditing ? (
              <input
                type="text"
                className="task-detail__title-input"
                value={editData.title || ''}
                onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
              />
            ) : (
              <h2 className="task-detail__title">{currentTask?.title || task.title}</h2>
            )}

            {/* Description */}
            <div className="task-detail__section">
              <h3 className="task-detail__section-title">Description</h3>
              {isEditing ? (
                <textarea
                  className="task-detail__description-input"
                  value={editData.description || ''}
                  onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a description..."
                  rows={5}
                />
              ) : (
                <p className="task-detail__description">
                  {currentTask?.description || task.description || 'No description provided.'}
                </p>
              )}
            </div>

            {/* Tabs */}
            <div className="task-detail__tabs">
              <button
                className={`task-detail__tab ${activeTab === 'comments' ? 'task-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('comments')}
              >
                Comments ({comments.length})
              </button>
              <button
                className={`task-detail__tab ${activeTab === 'attachments' ? 'task-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('attachments')}
              >
                Attachments ({attachments.length})
              </button>
              <button
                className={`task-detail__tab ${activeTab === 'history' ? 'task-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                History ({history.length})
              </button>
            </div>

            <div className="task-detail__tab-content">
              {activeTab === 'comments' && <TaskComments taskId={task.id} />}
              {activeTab === 'attachments' && <TaskAttachments taskId={task.id} />}
              {activeTab === 'history' && <TaskHistory />}
            </div>
          </div>

          {/* Sidebar */}
          <div className="task-detail__sidebar">
            <div className="task-detail__field">
              <label className="task-detail__field-label">Status</label>
              <select
                className={`task-detail__field-select task-detail__status--${(currentTask?.status || task.status).toLowerCase().replace('_', '-')}`}
                value={currentTask?.status || task.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="task-detail__field">
              <label className="task-detail__field-label">Priority</label>
              <select
                className={`task-detail__field-select task-detail__priority--${(currentTask?.priority || task.priority).toLowerCase()}`}
                value={currentTask?.priority || task.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="task-detail__field">
              <label className="task-detail__field-label">Type</label>
              <select
                className="task-detail__field-select"
                value={currentTask?.type || task.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="task-detail__field">
              <label className="task-detail__field-label">Due Date</label>
              <input
                type="date"
                className="task-detail__field-input"
                value={formatDate(currentTask?.dueDate || task.dueDate)}
                onChange={(e) => handleFieldChange('dueDate', e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>

            <div className="task-detail__field">
              <label className="task-detail__field-label">Created</label>
              <span className="task-detail__field-value">
                {new Date(task.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="task-detail__field">
              <label className="task-detail__field-label">Updated</label>
              <span className="task-detail__field-value">
                {new Date(currentTask?.updatedAt || task.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="task-detail__delete-confirm">
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="task-detail__delete-actions">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isLoading}>
                Delete Task
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
