import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateProject, deleteProject } from '@/store/slices/projectsSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { Button, Input, Modal } from '@/components/common';
import { ProjectStatus } from '@/types';
import './ProjectSettings.css';

export const ProjectSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProject, isLoading } = useAppSelector((state) => state.projects);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: ProjectStatus.ACTIVE,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description || '',
        status: currentProject.status,
      });
    }
  }, [currentProject]);

  useEffect(() => {
    if (currentProject) {
      const changed =
        formData.name !== currentProject.name ||
        formData.description !== (currentProject.description || '') ||
        formData.status !== currentProject.status;
      setHasChanges(changed);
    }
  }, [formData, currentProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProject || !hasChanges) return;

    try {
      await dispatch(updateProject({
        id: currentProject.id,
        data: formData,
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Project settings updated successfully',
      }));
      setHasChanges(false);
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update project settings',
      }));
    }
  };

  const handleDelete = async () => {
    if (!currentProject || deleteConfirmText !== currentProject.name) return;

    try {
      await dispatch(deleteProject(currentProject.id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Project deleted successfully',
      }));
      navigate('/projects');
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to delete project',
      }));
    }
  };

  const handleReset = () => {
    if (currentProject) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description || '',
        status: currentProject.status,
      });
    }
  };

  if (!currentProject) {
    return null;
  }

  return (
    <div className="project-settings">
      <div className="project-settings__section">
        <h2 className="project-settings__section-title">General Settings</h2>
        <p className="project-settings__section-description">
          Update your project's basic information.
        </p>

        <form onSubmit={handleSubmit} className="project-settings__form">
          <div className="project-settings__field">
            <Input
              label="Project Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
            />
          </div>

          <div className="project-settings__field">
            <label className="input__label">Project Key</label>
            <div className="project-settings__readonly">
              <span className="project-settings__key">{currentProject.key}</span>
              <span className="project-settings__readonly-hint">Project key cannot be changed</span>
            </div>
          </div>

          <div className="project-settings__field">
            <label className="input__label">Status</label>
            <select
              className="project-settings__select"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as ProjectStatus }))}
            >
              <option value={ProjectStatus.ACTIVE}>Active</option>
              <option value={ProjectStatus.PLANNING}>Planning</option>
              <option value={ProjectStatus.ARCHIVED}>Archived</option>
            </select>
          </div>

          <div className="project-settings__field">
            <label className="input__label">Description</label>
            <textarea
              className="project-settings__textarea"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
              rows={4}
            />
          </div>

          <div className="project-settings__actions">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      <div className="project-settings__section project-settings__section--danger">
        <h2 className="project-settings__section-title project-settings__section-title--danger">
          Danger Zone
        </h2>
        <p className="project-settings__section-description">
          Once you delete a project, there is no going back. Please be certain.
        </p>

        <div className="project-settings__danger-content">
          <div className="project-settings__danger-info">
            <h3>Delete this project</h3>
            <p>
              This will permanently delete the <strong>{currentProject.name}</strong> project,
              along with all tasks, comments, and attachments.
            </p>
          </div>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Project
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title="Delete Project"
        size="sm"
      >
        <div className="project-settings__delete-modal">
          <p className="project-settings__delete-warning">
            This action <strong>cannot be undone</strong>. This will permanently delete the
            <strong> {currentProject.name}</strong> project and all of its data.
          </p>

          <div className="project-settings__delete-confirm">
            <label className="input__label">
              Please type <strong>{currentProject.name}</strong> to confirm:
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Project name"
            />
          </div>

          <div className="project-settings__delete-actions">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteConfirmText !== currentProject.name}
              isLoading={isLoading}
            >
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectSettings;
