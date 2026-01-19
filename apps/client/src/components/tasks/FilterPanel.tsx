import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setFilters, clearFilters, fetchTasks } from '@/store/slices/tasksSlice';
import { Button, Input } from '@/components/common';
import { TaskStatus, TaskPriority, TaskType } from '@/types';
import type { TaskFilters } from '@/types';
import './FilterPanel.css';

interface FilterPanelProps {
  projectId: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.tasks);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleFilterChange = (key: keyof TaskFilters, value: string | undefined) => {
    const newFilters: TaskFilters = {
      ...filters,
      projectId,
      [key]: value || undefined,
    };
    dispatch(setFilters(newFilters));
    dispatch(fetchTasks(newFilters));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('search', searchValue || undefined);
  };

  const handleClearFilters = () => {
    setSearchValue('');
    const clearedFilters: TaskFilters = { projectId };
    dispatch(clearFilters());
    dispatch(setFilters(clearedFilters));
    dispatch(fetchTasks(clearedFilters));
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'projectId' && value !== undefined
  ).length;

  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <form onSubmit={handleSearchSubmit} className="filter-panel__search">
          <div className="filter-panel__search-input">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchValue}
              onChange={handleSearchChange}
              className="filter-panel__input"
            />
            {searchValue && (
              <button
                type="button"
                className="filter-panel__clear-search"
                onClick={() => {
                  setSearchValue('');
                  handleFilterChange('search', undefined);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </form>

        <button
          className={`filter-panel__toggle ${isExpanded ? 'filter-panel__toggle--active' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="filter-panel__badge">{activeFilterCount}</span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            className="filter-panel__clear"
            onClick={handleClearFilters}
          >
            Clear all
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="filter-panel__content">
          <div className="filter-panel__group">
            <label className="filter-panel__label">Status</label>
            <select
              className="filter-panel__select"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value as TaskStatus || undefined)}
            >
              <option value="">All statuses</option>
              <option value={TaskStatus.TODO}>To Do</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.IN_REVIEW}>In Review</option>
              <option value={TaskStatus.DONE}>Done</option>
            </select>
          </div>

          <div className="filter-panel__group">
            <label className="filter-panel__label">Priority</label>
            <select
              className="filter-panel__select"
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value as TaskPriority || undefined)}
            >
              <option value="">All priorities</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.LOW}>Low</option>
            </select>
          </div>

          <div className="filter-panel__group">
            <label className="filter-panel__label">Type</label>
            <select
              className="filter-panel__select"
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value as TaskType || undefined)}
            >
              <option value="">All types</option>
              <option value={TaskType.FEATURE}>Feature</option>
              <option value={TaskType.BUG}>Bug</option>
              <option value={TaskType.IMPROVEMENT}>Improvement</option>
              <option value={TaskType.DOCUMENTATION}>Documentation</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
