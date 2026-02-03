import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeModal, addNotification } from '@/store/slices/uiSlice';
import { useOptimisticTask } from '@/hooks';
import { Modal, Button, Input } from '@/components/common';
import { TaskPriority, TaskType } from '@/types';
import './CreateTaskModal.css';

export const CreateTaskModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { modalOpen, modalType } = useAppSelector((state) => state.ui);
  const { currentProject } = useAppSelector((state) => state.projects);
  const { isLoading } = useAppSelector((state) => state.tasks);
  const { createTaskOptimistically } = useOptimisticTask();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    type: TaskType.FEATURE,
    dueDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isOpen = modalOpen && modalType === 'createTask';

  const handleClose = () => {
    dispatch(closeModal());
    setFormData({
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      type: TaskType.FEATURE,
      dueDate: '',
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!currentProject) {
      newErrors.project = 'No project selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !currentProject) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Use optimistic create - task appears immediately, removed on error
      await createTaskOptimistically({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        projectId: currentProject.id,
        priority: formData.priority,
        type: formData.type,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      });

      dispatch(addNotification({
        type: 'success',
        message: 'Task created successfully',
      }));
      handleClose();
    } catch {
      // Error notification is handled by useOptimisticTask hook
      // Rollback is automatic
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      size="md"
    >
      <form onSubmit={handleSubmit} className="create-task-form">
        {errors.project && (
          <div className="create-task-form__error-banner">
            {errors.project}
          </div>
        )}

        <div className="create-task-form__field">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, title: e.target.value }));
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            placeholder="Enter task title"
            error={errors.title}
            autoFocus
          />
        </div>

        <div className="create-task-form__field">
          <label className="input__label">Description (Optional)</label>
          <textarea
            className="create-task-form__textarea"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Enter task description"
            rows={4}
          />
        </div>

        <div className="create-task-form__row">
          <div className="create-task-form__field">
            <label className="input__label">Type</label>
            <select
              className="create-task-form__select"
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as TaskType }))}
            >
              <option value={TaskType.FEATURE}>Feature</option>
              <option value={TaskType.BUG}>Bug</option>
              <option value={TaskType.IMPROVEMENT}>Improvement</option>
              <option value={TaskType.DOCUMENTATION}>Documentation</option>
            </select>
          </div>

          <div className="create-task-form__field">
            <label className="input__label">Priority</label>
            <select
              className="create-task-form__select"
              value={formData.priority}
              onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
            >
              <option value={TaskPriority.URGENT}>Urgent</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.LOW}>Low</option>
            </select>
          </div>
        </div>

        <div className="create-task-form__field">
          <label className="input__label">Due Date (Optional)</label>
          <input
            type="date"
            className="create-task-form__date"
            value={formData.dueDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="create-task-form__actions">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading || isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
