import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  Task,
  TaskComment,
  TaskAttachment,
  TaskHistory,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters
} from '@/types';
import { taskService } from '@/services/api/taskService';

interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  history: TaskHistory[];
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;
  // Optimistic update state
  pendingUpdates: Record<string, Task>;  // Original tasks for rollback
  optimisticTasks: string[];              // Temp task IDs
}

const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  comments: [],
  attachments: [],
  history: [],
  filters: {},
  isLoading: false,
  error: null,
  pendingUpdates: {},
  optimisticTasks: [],
};

// Task thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (filters: TaskFilters = {}, { rejectWithValue }) => {
    try {
      return await taskService.getTasks(filters);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
      return rejectWithValue(message);
    }
  }
);

export const fetchTask = createAsyncThunk(
  'tasks/fetchTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      return await taskService.getTask(taskId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch task';
      return rejectWithValue(message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (data: CreateTaskData, { rejectWithValue }) => {
    try {
      return await taskService.createTask(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      return rejectWithValue(message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }: { id: string; data: UpdateTaskData }, { rejectWithValue }) => {
    try {
      return await taskService.updateTask(id, data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      return rejectWithValue(message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(taskId);
      return taskId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      return rejectWithValue(message);
    }
  }
);

// Comment thunks
export const fetchComments = createAsyncThunk(
  'tasks/fetchComments',
  async (taskId: string, { rejectWithValue }) => {
    try {
      return await taskService.getComments(taskId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch comments';
      return rejectWithValue(message);
    }
  }
);

export const addComment = createAsyncThunk(
  'tasks/addComment',
  async ({ taskId, content }: { taskId: string; content: string }, { rejectWithValue }) => {
    try {
      return await taskService.addComment(taskId, content);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add comment';
      return rejectWithValue(message);
    }
  }
);

export const updateComment = createAsyncThunk(
  'tasks/updateComment',
  async ({ taskId, commentId, content }: { taskId: string; commentId: string; content: string }, { rejectWithValue }) => {
    try {
      return await taskService.updateComment(taskId, commentId, content);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update comment';
      return rejectWithValue(message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  'tasks/deleteComment',
  async ({ taskId, commentId }: { taskId: string; commentId: string }, { rejectWithValue }) => {
    try {
      await taskService.deleteComment(taskId, commentId);
      return commentId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete comment';
      return rejectWithValue(message);
    }
  }
);

// Attachment thunks
export const fetchAttachments = createAsyncThunk(
  'tasks/fetchAttachments',
  async (taskId: string, { rejectWithValue }) => {
    try {
      return await taskService.getAttachments(taskId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch attachments';
      return rejectWithValue(message);
    }
  }
);

export const uploadAttachment = createAsyncThunk(
  'tasks/uploadAttachment',
  async ({ taskId, file }: { taskId: string; file: File }, { rejectWithValue }) => {
    try {
      return await taskService.uploadAttachment(taskId, file);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload attachment';
      return rejectWithValue(message);
    }
  }
);

export const deleteAttachment = createAsyncThunk(
  'tasks/deleteAttachment',
  async ({ taskId, attachmentId }: { taskId: string; attachmentId: string }, { rejectWithValue }) => {
    try {
      await taskService.deleteAttachment(taskId, attachmentId);
      return attachmentId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete attachment';
      return rejectWithValue(message);
    }
  }
);

// History thunk
export const fetchTaskHistory = createAsyncThunk(
  'tasks/fetchTaskHistory',
  async (taskId: string, { rejectWithValue }) => {
    try {
      return await taskService.getTaskHistory(taskId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch task history';
      return rejectWithValue(message);
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    setFilters: (state, action: PayloadAction<TaskFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    // Real-time updates
    taskCreated: (state, action: PayloadAction<Task>) => {
      // Don't add if already exists (might be our own optimistic task that was reconciled)
      const exists = state.tasks.some(t => t.id === action.payload.id);
      if (!exists) {
        state.tasks.push(action.payload);
      }
    },
    taskUpdated: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        // Only update if we don't have a pending update (let reconciliation handle it)
        if (!state.pendingUpdates[action.payload.id]) {
          state.tasks[index] = action.payload;
        }
      }
      if (state.currentTask?.id === action.payload.id) {
        state.currentTask = action.payload;
      }
    },
    taskDeleted: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
      if (state.currentTask?.id === action.payload) {
        state.currentTask = null;
      }
    },
    commentAdded: (state, action: PayloadAction<TaskComment>) => {
      // Don't add duplicate comments
      const exists = state.comments.some(c => c.id === action.payload.id);
      if (!exists) {
        state.comments.push(action.payload);
      }
    },

    // Optimistic update actions
    optimisticTaskCreate: (state, action: PayloadAction<{ tempId: string; task: Partial<Task> }>) => {
      const { tempId, task } = action.payload;
      const optimisticTask: Task = {
        id: tempId,
        taskId: 'NEW',
        title: task.title || '',
        description: task.description,
        status: task.status || 'TODO' as Task['status'],
        priority: task.priority || 'MEDIUM' as Task['priority'],
        type: task.type || 'FEATURE' as Task['type'],
        projectId: task.projectId || '',
        reporterId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...task,
      } as Task;
      state.tasks.push(optimisticTask);
      state.optimisticTasks.push(tempId);
    },
    reconcileTaskCreate: (state, action: PayloadAction<{ tempId: string; realTask: Task }>) => {
      const { tempId, realTask } = action.payload;
      // Remove temp task and add real task
      state.tasks = state.tasks.filter(t => t.id !== tempId);
      state.optimisticTasks = state.optimisticTasks.filter(id => id !== tempId);
      // Add real task if not already present
      const exists = state.tasks.some(t => t.id === realTask.id);
      if (!exists) {
        state.tasks.push(realTask);
      }
    },
    rollbackTaskCreate: (state, action: PayloadAction<string>) => {
      const tempId = action.payload;
      state.tasks = state.tasks.filter(t => t.id !== tempId);
      state.optimisticTasks = state.optimisticTasks.filter(id => id !== tempId);
    },
    optimisticTaskUpdate: (state, action: PayloadAction<{ id: string; updates: Partial<Task> }>) => {
      const { id, updates } = action.payload;
      const index = state.tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        // Store original for rollback
        state.pendingUpdates[id] = { ...state.tasks[index] };
        // Apply optimistic update
        state.tasks[index] = { ...state.tasks[index], ...updates, updatedAt: new Date() };
      }
    },
    confirmTaskUpdate: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.pendingUpdates[id];
    },
    rollbackTaskUpdate: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const original = state.pendingUpdates[id];
      if (original) {
        const index = state.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
          state.tasks[index] = original;
        }
        delete state.pendingUpdates[id];
      }
    },

    resetTasks: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch tasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch single task
    builder
      .addCase(fetchTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create task
    builder
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update task
    builder
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete task
    builder
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Comments
    builder
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = state.comments.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.comments[index] = action.payload;
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter(c => c.id !== action.payload);
      });

    // Attachments
    builder
      .addCase(fetchAttachments.fulfilled, (state, action) => {
        state.attachments = action.payload;
      })
      .addCase(uploadAttachment.fulfilled, (state, action) => {
        state.attachments.push(action.payload);
      })
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        state.attachments = state.attachments.filter(a => a.id !== action.payload);
      });

    // History
    builder
      .addCase(fetchTaskHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentTask,
  setFilters,
  clearFilters,
  taskCreated,
  taskUpdated,
  taskDeleted,
  commentAdded,
  optimisticTaskCreate,
  reconcileTaskCreate,
  rollbackTaskCreate,
  optimisticTaskUpdate,
  confirmTaskUpdate,
  rollbackTaskUpdate,
  resetTasks,
} = tasksSlice.actions;

export default tasksSlice.reducer;
