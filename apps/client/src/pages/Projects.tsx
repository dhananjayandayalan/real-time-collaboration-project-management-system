import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProjects } from '@/store/slices/projectsSlice';
import { LoadingSpinner, Button } from '@/components/common';
import { openModal } from '@/store/slices/uiSlice';
import './Projects.css';

export const Projects: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projects, isLoading, error } = useAppSelector((state) => state.projects);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleCreateProject = () => {
    dispatch(openModal({ type: 'createProject' }));
  };

  if (isLoading) {
    return (
      <div className="projects-page">
        <LoadingSpinner size="lg" text="Loading projects..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="projects-page">
        <div className="projects-page__error">
          <p>{error}</p>
          <Button onClick={() => dispatch(fetchProjects())}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-page__header">
        <div>
          <h1 className="projects-page__title">Projects</h1>
          <p className="projects-page__subtitle">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <Button onClick={handleCreateProject}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="projects-page__empty">
          <div className="projects-page__empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="projects-page__empty-title">No projects yet</h2>
          <p className="projects-page__empty-text">
            Create your first project to get started
          </p>
          <Button onClick={handleCreateProject}>Create Project</Button>
        </div>
      ) : (
        <div className="projects-page__grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card__header">
                <span className="project-card__key">{project.key}</span>
                <span className={`project-card__status project-card__status--${project.status.toLowerCase()}`}>
                  {project.status}
                </span>
              </div>
              <h3 className="project-card__name">{project.name}</h3>
              {project.description && (
                <p className="project-card__description">{project.description}</p>
              )}
              <div className="project-card__footer">
                <span className="project-card__date">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
