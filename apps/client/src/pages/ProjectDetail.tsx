import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProject } from '@/store/slices/projectsSlice';
import { fetchTasks, setFilters } from '@/store/slices/tasksSlice';
import { LoadingSpinner, Button, OnlineUsersIndicator } from '@/components/common';
import { useSocket } from '@/hooks';
import './ProjectDetail.css';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { joinProject, leaveProject } = useSocket();
  const { currentProject, isLoading, error } = useAppSelector((state) => state.projects);
  const { projectViewers } = useAppSelector((state) => state.ui);

  // Get viewers for current project, excluding current user
  const viewers = useMemo(() => {
    if (!id) return [];
    const allViewers = projectViewers[id] || [];
    return allViewers.map(v => ({
      id: v.userId,
      name: v.userName,
      status: 'online' as const,
    }));
  }, [id, projectViewers]);

  useEffect(() => {
    if (id) {
      dispatch(fetchProject(id));
      dispatch(setFilters({ projectId: id }));
      dispatch(fetchTasks({ projectId: id }));
      joinProject(id);
    }

    return () => {
      if (id) {
        leaveProject(id);
      }
    };
  }, [id, dispatch, joinProject, leaveProject]);

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location.pathname.includes('/board')) return 'board';
    if (location.pathname.includes('/list')) return 'list';
    if (location.pathname.includes('/settings')) return 'settings';
    if (location.pathname.includes('/members')) return 'members';
    return 'board';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    if (tab === 'board') {
      navigate(`/projects/${id}/board`);
    } else if (tab === 'list') {
      navigate(`/projects/${id}/list`);
    } else if (tab === 'settings') {
      navigate(`/projects/${id}/settings`);
    } else if (tab === 'members') {
      navigate(`/projects/${id}/members`);
    }
  };

  if (isLoading && !currentProject) {
    return (
      <div className="project-detail">
        <LoadingSpinner size="lg" text="Loading project..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-detail">
        <div className="project-detail__error">
          <p>{error}</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="project-detail">
        <div className="project-detail__error">
          <p>Project not found</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail">
      <div className="project-detail__header">
        <div className="project-detail__header-left">
          <button
            className="project-detail__back-btn"
            onClick={() => navigate('/projects')}
            aria-label="Back to projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="project-detail__title-wrapper">
            <div className="project-detail__key-status">
              <span className="project-detail__key">{currentProject.key}</span>
              <span className={`project-detail__status project-detail__status--${currentProject.status.toLowerCase()}`}>
                {currentProject.status}
              </span>
            </div>
            <h1 className="project-detail__title">{currentProject.name}</h1>
            {currentProject.description && (
              <p className="project-detail__description">{currentProject.description}</p>
            )}
          </div>
        </div>
        <div className="project-detail__header-right">
          {viewers.length > 0 && (
            <OnlineUsersIndicator users={viewers} label="viewing" />
          )}
        </div>
      </div>

      <nav className="project-detail__tabs">
        <button
          className={`project-detail__tab ${activeTab === 'board' ? 'project-detail__tab--active' : ''}`}
          onClick={() => handleTabChange('board')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Board
        </button>
        <button
          className={`project-detail__tab ${activeTab === 'list' ? 'project-detail__tab--active' : ''}`}
          onClick={() => handleTabChange('list')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          List
        </button>
        <button
          className={`project-detail__tab ${activeTab === 'members' ? 'project-detail__tab--active' : ''}`}
          onClick={() => handleTabChange('members')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Members
        </button>
        <button
          className={`project-detail__tab ${activeTab === 'settings' ? 'project-detail__tab--active' : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </button>
      </nav>

      <div className="project-detail__content">
        <Outlet />
      </div>
    </div>
  );
};

export default ProjectDetail;
