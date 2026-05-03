import { useCallback } from 'react';
import { useAppDispatch } from '@/store';
import {
  createTask,
  updateTask,
  optimisticTaskCreate,
  reconcileTaskCreate,
  rollbackTaskCreate,
  optimisticTaskUpdate,
  confirmTaskUpdate,
  rollbackTaskUpdate,
} from '@/store/slices/tasksSlice';
import { addNotification } from '@/store/slices/uiSlice';
import type { CreateTaskData, UpdateTaskData } from '@/types';

export const useOptimisticTask = () => {
  const dispatch = useAppDispatch();

  const createTaskOptimistically = useCallback(async (data: CreateTaskData) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Apply optimistic update immediately
    dispatch(optimisticTaskCreate({ tempId, task: data }));

    try {
      const realTask = await dispatch(createTask(data)).unwrap();
      // Reconcile with real task from server
      dispatch(reconcileTaskCreate({ tempId, realTask }));
      return realTask;
    } catch (error) {
      // Rollback on failure
      dispatch(rollbackTaskCreate(tempId));
      dispatch(addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create task',
      }));
      throw error;
    }
  }, [dispatch]);

  const updateTaskOptimistically = useCallback(async (id: string, updates: UpdateTaskData) => {
    // Apply optimistic update immediately
    dispatch(optimisticTaskUpdate({ id, updates }));

    try {
      const updatedTask = await dispatch(updateTask({ id, data: updates })).unwrap();
      // Confirm the update was successful
      dispatch(confirmTaskUpdate(id));
      return updatedTask;
    } catch (error) {
      // Rollback on failure
      dispatch(rollbackTaskUpdate(id));
      dispatch(addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update task',
      }));
      throw error;
    }
  }, [dispatch]);

  return {
    createTaskOptimistically,
    updateTaskOptimistically,
  };
};
