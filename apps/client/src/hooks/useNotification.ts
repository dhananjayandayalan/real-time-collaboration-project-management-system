import { useCallback } from 'react';
import { useAppDispatch } from '@/store';
import { addNotification, removeNotification, clearNotifications } from '@/store/slices/uiSlice';

export const useNotification = () => {
  const dispatch = useAppDispatch();

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      dispatch(addNotification({ type: 'success', message, duration }));
    },
    [dispatch]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      dispatch(addNotification({ type: 'error', message, duration }));
    },
    [dispatch]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      dispatch(addNotification({ type: 'warning', message, duration }));
    },
    [dispatch]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      dispatch(addNotification({ type: 'info', message, duration }));
    },
    [dispatch]
  );

  const dismiss = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  const dismissAll = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismiss,
    dismissAll,
  };
};

export default useNotification;
