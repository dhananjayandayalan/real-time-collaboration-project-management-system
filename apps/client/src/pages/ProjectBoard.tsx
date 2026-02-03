import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { createTask } from '@/store/slices/tasksSlice';
import { openModal, addNotification } from '@/store/slices/uiSlice';
import { useOptimisticTask } from '@/hooks';
import { TaskCard, FilterPanel } from '@/components/tasks';
import { Button, LoadingSpinner } from '@/components/common';
import { TaskStatus, TaskPriority, TaskType } from '@/types';
import type { Task } from '@/types';
import './ProjectBoard.css';

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: TaskStatus.TODO, title: 'To Do', color: 'var(--color-status-todo)' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'var(--color-status-in-progress)' },
  { id: TaskStatus.IN_REVIEW, title: 'In Review', color: 'var(--color-status-in-review)' },
  { id: TaskStatus.DONE, title: 'Done', color: 'var(--color-status-done)' },
];

export const ProjectBoard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  const { currentProject } = useAppSelector((state) => state.projects);
  const { updateTaskOptimistically } = useOptimisticTask();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.status === newStatus) {
      return;
    }

    // Use optimistic update - UI updates immediately, rolls back on error
    try {
      await updateTaskOptimistically(draggedTask.id, { status: newStatus });
      dispatch(addNotification({
        type: 'success',
        message: `Task moved to ${columns.find(c => c.id === newStatus)?.title}`,
      }));
    } catch {
      // Error notification is handled by useOptimisticTask hook
      // Rollback is automatic
    }
  };

  const handleTaskClick = (task: Task) => {
    dispatch(openModal({ type: 'taskDetail', data: task }));
  };

  const handleCreateTask = () => {
    dispatch(openModal({ type: 'createTask' }));
  };

  const handleQuickCreateTask = async (status: TaskStatus) => {
    if (!currentProject) return;

    const title = window.prompt('Enter task title:');
    if (!title?.trim()) return;

    try {
      await dispatch(createTask({
        title: title.trim(),
        projectId: currentProject.id,
        priority: TaskPriority.MEDIUM,
        type: TaskType.FEATURE,
      })).unwrap();

      // If created task isn't in the TODO column, update it
      if (status !== TaskStatus.TODO) {
        // The task is created with TODO status by default,
        // we'd need to update it separately if needed
      }

      dispatch(addNotification({
        type: 'success',
        message: 'Task created successfully',
      }));
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to create task',
      }));
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="project-board project-board--loading">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  return (
    <div className="project-board">
      <div className="project-board__header">
        {currentProject && (
          <FilterPanel projectId={currentProject.id} />
        )}
        <div className="project-board__actions">
          <Button onClick={handleCreateTask}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Task
          </Button>
        </div>
      </div>

      <div className="project-board__columns">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isDragOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={`project-board__column ${isDragOver ? 'project-board__column--drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="project-board__column-header">
                <div className="project-board__column-title-wrapper">
                  <span
                    className="project-board__column-indicator"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="project-board__column-title">{column.title}</h3>
                  <span className="project-board__column-count">{columnTasks.length}</span>
                </div>
                <button
                  className="project-board__column-add"
                  onClick={() => handleQuickCreateTask(column.id)}
                  title="Quick add task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              <div className="project-board__column-tasks">
                {columnTasks.length === 0 ? (
                  <div className="project-board__column-empty">
                    <p>No tasks</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        isDragging={draggedTask?.id === task.id}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectBoard;
