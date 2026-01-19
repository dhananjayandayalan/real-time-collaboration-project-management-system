import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProjectMembers, removeProjectMember } from '@/store/slices/projectsSlice';
import { addNotification, openModal } from '@/store/slices/uiSlice';
import { Button, Modal, LoadingSpinner } from '@/components/common';
import './ProjectMembers.css';

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

export const ProjectMembers: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentProject, projectMembers, isLoading } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; userName: string } | null>(null);

  useEffect(() => {
    if (currentProject) {
      dispatch(fetchProjectMembers(currentProject.id));
    }
  }, [currentProject, dispatch]);

  const handleAddMember = () => {
    dispatch(openModal({ type: 'addProjectMember' }));
  };

  const handleRemoveMember = async () => {
    if (!currentProject || !memberToRemove) return;

    try {
      await dispatch(removeProjectMember({
        projectId: currentProject.id,
        userId: memberToRemove.userId,
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Member removed successfully',
      }));
      setMemberToRemove(null);
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to remove member',
      }));
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading && projectMembers.length === 0) {
    return (
      <div className="project-members project-members--loading">
        <LoadingSpinner size="lg" text="Loading members..." />
      </div>
    );
  }

  return (
    <div className="project-members">
      <div className="project-members__header">
        <div>
          <h2 className="project-members__title">Project Members</h2>
          <p className="project-members__subtitle">
            {projectMembers.length} {projectMembers.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <Button onClick={handleAddMember}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Add Member
        </Button>
      </div>

      {projectMembers.length === 0 ? (
        <div className="project-members__empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3>No members yet</h3>
          <p>Add team members to collaborate on this project</p>
          <Button onClick={handleAddMember}>Add Member</Button>
        </div>
      ) : (
        <div className="project-members__list">
          {projectMembers.map((member) => (
            <div key={member.id} className="project-members__item">
              <div className="project-members__item-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="project-members__item-info">
                <div className="project-members__item-name">
                  User {member.userId.slice(0, 8)}
                  {member.userId === user?.id && (
                    <span className="project-members__item-you">(You)</span>
                  )}
                </div>
                <div className="project-members__item-meta">
                  Added {formatDate(member.addedAt)}
                </div>
              </div>
              <div className="project-members__item-role">
                <span className={`project-members__role-badge project-members__role-badge--${member.role.toLowerCase()}`}>
                  {roleLabels[member.role] || member.role}
                </span>
              </div>
              <div className="project-members__item-actions">
                {member.role !== 'OWNER' && member.userId !== user?.id && (
                  <button
                    className="project-members__remove-btn"
                    onClick={() => setMemberToRemove({ userId: member.userId, userName: `User ${member.userId.slice(0, 8)}` })}
                    title="Remove member"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        title="Remove Member"
        size="sm"
      >
        <div className="project-members__remove-modal">
          <p>
            Are you sure you want to remove <strong>{memberToRemove?.userName}</strong> from this project?
            They will lose access to all project resources.
          </p>
          <div className="project-members__remove-actions">
            <Button variant="ghost" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRemoveMember} isLoading={isLoading}>
              Remove Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectMembers;
