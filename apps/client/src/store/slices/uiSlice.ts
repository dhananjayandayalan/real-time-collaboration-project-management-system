import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Notification, UserPresence, TypingUser } from '@/types';

// Room viewer type
export interface RoomViewer {
  userId: string;
  userName: string;
  email?: string;
  joinedAt: string;
}

interface UiState {
  notifications: Notification[];
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalType: string | null;
  modalData: unknown;
  onlineUsers: UserPresence[];
  typingUsers: TypingUser[];
  globalLoading: boolean;
  // Room-based presence
  projectViewers: Record<string, RoomViewer[]>;
  taskViewers: Record<string, RoomViewer[]>;
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
  projectViewers: {},
  taskViewers: {},
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

    // Room presence - Projects
    setProjectViewers: (state, action: PayloadAction<{ projectId: string; viewers: RoomViewer[] }>) => {
      state.projectViewers[action.payload.projectId] = action.payload.viewers;
    },
    userJoinedProject: (state, action: PayloadAction<{ projectId: string; user: RoomViewer }>) => {
      const { projectId, user } = action.payload;
      if (!state.projectViewers[projectId]) {
        state.projectViewers[projectId] = [];
      }
      const exists = state.projectViewers[projectId].some(v => v.userId === user.userId);
      if (!exists) {
        state.projectViewers[projectId].push(user);
      }
    },
    userLeftProject: (state, action: PayloadAction<{ projectId: string; userId: string }>) => {
      const { projectId, userId } = action.payload;
      if (state.projectViewers[projectId]) {
        state.projectViewers[projectId] = state.projectViewers[projectId].filter(v => v.userId !== userId);
      }
    },
    clearProjectViewers: (state, action: PayloadAction<string>) => {
      delete state.projectViewers[action.payload];
    },

    // Room presence - Tasks
    setTaskViewers: (state, action: PayloadAction<{ taskId: string; viewers: RoomViewer[] }>) => {
      state.taskViewers[action.payload.taskId] = action.payload.viewers;
    },
    userJoinedTask: (state, action: PayloadAction<{ taskId: string; user: RoomViewer }>) => {
      const { taskId, user } = action.payload;
      if (!state.taskViewers[taskId]) {
        state.taskViewers[taskId] = [];
      }
      const exists = state.taskViewers[taskId].some(v => v.userId === user.userId);
      if (!exists) {
        state.taskViewers[taskId].push(user);
      }
    },
    userLeftTask: (state, action: PayloadAction<{ taskId: string; userId: string }>) => {
      const { taskId, userId } = action.payload;
      if (state.taskViewers[taskId]) {
        state.taskViewers[taskId] = state.taskViewers[taskId].filter(v => v.userId !== userId);
      }
    },
    clearTaskViewers: (state, action: PayloadAction<string>) => {
      delete state.taskViewers[action.payload];
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
  setProjectViewers,
  userJoinedProject,
  userLeftProject,
  clearProjectViewers,
  setTaskViewers,
  userJoinedTask,
  userLeftTask,
  clearTaskViewers,
  resetUi,
} = uiSlice.actions;

export default uiSlice.reducer;
