import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { createProject, fetchWorkspaces, createWorkspace } from '@/store/slices/projectsSlice';
import { closeModal, addNotification } from '@/store/slices/uiSlice';
import { Modal, Button, Input } from '@/components/common';
import './CreateProjectModal.css';

export const CreateProjectModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { modalOpen, modalType } = useAppSelector((state) => state.ui);
  const { workspaces, isLoading } = useAppSelector((state) => state.projects);

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    workspaceId: '',
  });
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [workspaceErrors, setWorkspaceErrors] = useState<Record<string, string>>({});

  const isOpen = modalOpen && modalType === 'createProject';

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchWorkspaces());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    // Auto-select first workspace if available
    if (workspaces.length > 0 && !formData.workspaceId) {
      setFormData((prev) => ({ ...prev, workspaceId: workspaces[0].id }));
    }
  }, [workspaces, formData.workspaceId]);

  const handleClose = () => {
    dispatch(closeModal());
    setFormData({ name: '', key: '', description: '', workspaceId: '' });
    setShowNewWorkspace(false);
    setNewWorkspaceName('');
    setErrors({});
  };

  const generateKey = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 5);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  };

  const handleWorkspaceNameChange = (value: string) => {
    setNewWorkspaceName(value);
    if (!newWorkspaceSlug || newWorkspaceSlug === generateSlug(newWorkspaceName)) {
      setNewWorkspaceSlug(generateSlug(value));
    }
    if (workspaceErrors.name) {
      setWorkspaceErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleWorkspaceSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50);
    setNewWorkspaceSlug(slug);
    if (workspaceErrors.slug) {
      setWorkspaceErrors((prev) => ({ ...prev, slug: '' }));
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      key: prev.key || generateKey(name),
    }));
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, key }));
    if (errors.key) {
      setErrors((prev) => ({ ...prev, key: '' }));
    }
  };

  const validateWorkspace = () => {
    const errors: Record<string, string> = {};

    if (!newWorkspaceName.trim()) {
      errors.name = 'Workspace name is required';
    }

    if (!newWorkspaceSlug.trim()) {
      errors.slug = 'Workspace slug is required';
    } else if (newWorkspaceSlug.length < 3) {
      errors.slug = 'Slug must be at least 3 characters';
    } else if (!/^[a-z0-9-]+$/.test(newWorkspaceSlug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    setWorkspaceErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateWorkspace = async () => {
    if (!validateWorkspace()) {
      return;
    }

    try {
      const workspace = await dispatch(createWorkspace({
        name: newWorkspaceName.trim(),
        slug: newWorkspaceSlug.trim(),
      })).unwrap();
      setFormData((prev) => ({ ...prev, workspaceId: workspace.id }));
      setShowNewWorkspace(false);
      setNewWorkspaceName('');
      setNewWorkspaceSlug('');
      setWorkspaceErrors({});
      dispatch(addNotification({
        type: 'success',
        message: 'Workspace created successfully',
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: (error as string) || 'Failed to create workspace',
      }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.key.trim()) {
      newErrors.key = 'Project key is required';
    } else if (formData.key.length < 2) {
      newErrors.key = 'Project key must be at least 2 characters';
    }

    if (!formData.workspaceId) {
      newErrors.workspaceId = 'Please select or create a workspace';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await dispatch(createProject(formData)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Project created successfully',
      }));
      handleClose();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error as string || 'Failed to create project',
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      size="md"
    >
      <form onSubmit={handleSubmit} className="create-project-form">
        <div className="create-project-form__field">
          <Input
            label="Project Name"
            value={formData.name}
            onChange={handleNameChange}
            placeholder="Enter project name"
            error={errors.name}
            autoFocus
          />
        </div>

        <div className="create-project-form__field">
          <Input
            label="Project Key"
            value={formData.key}
            onChange={handleKeyChange}
            placeholder="e.g., PROJ"
            error={errors.key}
          />
          <p className="create-project-form__hint">
            Used as a prefix for task IDs (e.g., {formData.key || 'PROJ'}-1)
          </p>
        </div>

        <div className="create-project-form__field">
          <label className="input__label">Workspace</label>
          {!showNewWorkspace ? (
            <>
              <select
                className="create-project-form__select"
                value={formData.workspaceId}
                onChange={(e) => setFormData((prev) => ({ ...prev, workspaceId: e.target.value }))}
              >
                <option value="">Select a workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
              {errors.workspaceId && (
                <span className="input__error">{errors.workspaceId}</span>
              )}
              <button
                type="button"
                className="create-project-form__link"
                onClick={() => setShowNewWorkspace(true)}
              >
                + Create new workspace
              </button>
            </>
          ) : (
            <div className="create-project-form__new-workspace">
              <Input
                label="Name"
                value={newWorkspaceName}
                onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                placeholder="Workspace name"
                error={workspaceErrors.name}
              />
              <div className="create-project-form__slug-field">
                <Input
                  label="Slug"
                  value={newWorkspaceSlug}
                  onChange={(e) => handleWorkspaceSlugChange(e.target.value)}
                  placeholder="workspace-slug"
                  error={workspaceErrors.slug}
                />
                <p className="create-project-form__hint">
                  URL-friendly identifier (lowercase letters, numbers, hyphens)
                </p>
              </div>
              <div className="create-project-form__new-workspace-actions">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCreateWorkspace}
                  disabled={!newWorkspaceName.trim() || !newWorkspaceSlug.trim()}
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewWorkspace(false);
                    setNewWorkspaceName('');
                    setNewWorkspaceSlug('');
                    setWorkspaceErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="create-project-form__field">
          <label className="input__label">Description (Optional)</label>
          <textarea
            className="create-project-form__textarea"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Enter project description"
            rows={3}
          />
        </div>

        <div className="create-project-form__actions">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
