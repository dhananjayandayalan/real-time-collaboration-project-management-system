import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { openModal, closeModal } from '@/store/slices/uiSlice';

export const useModal = () => {
  const dispatch = useAppDispatch();
  const { modalOpen, modalType, modalData } = useAppSelector((state) => state.ui);

  const open = useCallback(
    (type: string, data?: unknown) => {
      dispatch(openModal({ type, data }));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const isOpen = useCallback(
    (type?: string) => {
      if (type) {
        return modalOpen && modalType === type;
      }
      return modalOpen;
    },
    [modalOpen, modalType]
  );

  return {
    isOpen,
    modalType,
    modalData,
    open,
    close,
  };
};

export default useModal;
