import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Notification, UserPresence, TypingUser } from '@/types';

interface UiState {
  notifications: Notification[];
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalType: string | null;
  modalData: unknown;
  onlineUsers: UserPresence[];
  typingUsers: TypingUser[];
  globalLoading: boolean;
}

const initialState: UiState = {
  notifications: [],
  sidebarOpen: true,
  modalOpen: false,
  modalType: null,
  modalData: null,
  onlineUsers: [],
  typingUsers: [],
  globalLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    // Modal
    openModal: (state, action: PayloadAction<{ type: string; data?: unknown }>) => {
      state.modalOpen = true;
      state.modalType = action.payload.type;
      state.modalData = action.payload.data;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalType = null;
      state.modalData = null;
    },

    // User presence
    setOnlineUsers: (state, action: PayloadAction<UserPresence[]>) => {
      state.onlineUsers = action.payload;
    },
    userOnline: (state, action: PayloadAction<UserPresence>) => {
      const exists = state.onlineUsers.find(u => u.userId === action.payload.userId);
      if (!exists) {
        state.onlineUsers.push(action.payload);
      } else {
        const index = state.onlineUsers.findIndex(u => u.userId === action.payload.userId);
        state.onlineUsers[index] = action.payload;
      }
    },
    userOffline: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(u => u.userId !== action.payload);
    },

    // Typing indicators
    userTyping: (state, action: PayloadAction<TypingUser>) => {
      const exists = state.typingUsers.find(
        u => u.userId === action.payload.userId && u.taskId === action.payload.taskId
      );
      if (!exists) {
        state.typingUsers.push(action.payload);
      }
    },
    userStoppedTyping: (state, action: PayloadAction<{ userId: string; taskId: string }>) => {
      state.typingUsers = state.typingUsers.filter(
        u => !(u.userId === action.payload.userId && u.taskId === action.payload.taskId)
      );
    },
    clearTypingUsers: (state) => {
      state.typingUsers = [];
    },

    // Global loading
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },

    // Reset
    resetUi: () => initialState,
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  setOnlineUsers,
  userOnline,
  userOffline,
  userTyping,
  userStoppedTyping,
  clearTypingUsers,
  setGlobalLoading,
  resetUi,
} = uiSlice.actions;

export default uiSlice.reducer;
