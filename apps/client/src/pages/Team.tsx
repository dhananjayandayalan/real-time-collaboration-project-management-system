import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProjects, fetchProjectMembers } from '@/store/slices/projectsSlice';
import { LoadingSpinner } from '@/components/common';
import './Team.css';

const roleColors: Record<string, string> = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

export const Team: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projects, projectMembers, isLoading } = useAppSelector((state) => state.projects);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (projects.length > 0) {
      dispatch(fetchProjectMembers(projects[0].id));
    }
  }, [projects, dispatch]);

  const uniqueMembers = React.useMemo(() => {
    const seen = new Set<string>();
    return projectMembers.filter((m) => {
      if (seen.has(m.userId)) return false;
      seen.add(m.userId);
      return true;
    });
  }, [projectMembers]);

  if (isLoading && projects.length === 0) {
    return (
      <div className="team-page">
        <LoadingSpinner size="lg" text="Loading team..." />
      </div>
    );
  }

  return (
    <div className="team-page">
      <div className="team-page__header">
        <div>
          <h1 className="team-page__title">Team</h1>
          <p className="team-page__subtitle">
            {uniqueMembers.length} {uniqueMembers.length === 1 ? 'member' : 'members'} across your projects
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="team-page__empty">
          <div className="team-page__empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="team-page__empty-title">No team members yet</h2>
          <p className="team-page__empty-text">Create a project and invite members to see your team here</p>
        </div>
      ) : (
        <div className="team-grid">
          {uniqueMembers.map((member) => {
            const isCurrentUser = member.userId === currentUser?.id;
            const shortId = member.userId.slice(0, 8).toUpperCase();
            return (
              <div key={member.userId} className="team-member-card">
                <div className="team-member-card__avatar">
                  {shortId.slice(0, 2)}
                </div>
                <div className="team-member-card__info">
                  <span className="team-member-card__name">
                    {isCurrentUser ? `${currentUser?.firstName} ${currentUser?.lastName}` : `Member ${shortId}`}
                    {isCurrentUser && <span className="team-member-card__you"> (You)</span>}
                  </span>
                  {isCurrentUser && (
                    <span className="team-member-card__email">{currentUser?.email}</span>
                  )}
                </div>
                <span className={`team-member-card__role team-member-card__role--${roleColors[member.role] ?? 'member'}`}>
                  {roleLabels[member.role] ?? member.role}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Team;
