import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Project, Workspace, ProjectMember, CreateProjectData, UpdateProjectData } from '@/types';
import { projectService } from '@/services/api/projectService';

interface ProjectsState {
  workspaces: Workspace[];
  projects: Project[];
  currentProject: Project | null;
  projectMembers: ProjectMember[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  workspaces: [],
  projects: [],
  currentProject: null,
  projectMembers: [],
  isLoading: false,
  error: null,
};

// Workspace thunks
export const fetchWorkspaces = createAsyncThunk(
  'projects/fetchWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      return await projectService.getWorkspaces();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch workspaces';
      return rejectWithValue(message);
    }
  }
);

export const createWorkspace = createAsyncThunk(
  'projects/createWorkspace',
  async (data: { name: string; slug: string; description?: string }, { rejectWithValue }) => {
    try {
      return await projectService.createWorkspace(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create workspace';
      return rejectWithValue(message);
    }
  }
);

// Project thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (workspaceId?: string, { rejectWithValue }) => {
    try {
      return await projectService.getProjects(workspaceId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects';
      return rejectWithValue(message);
    }
  }
);

export const fetchProject = createAsyncThunk(
  'projects/fetchProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getProject(projectId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch project';
      return rejectWithValue(message);
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (data: CreateProjectData, { rejectWithValue }) => {
    try {
      return await projectService.createProject(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      return rejectWithValue(message);
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }: { id: string; data: UpdateProjectData }, { rejectWithValue }) => {
    try {
      return await projectService.updateProject(id, data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      return rejectWithValue(message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId);
      return projectId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      return rejectWithValue(message);
    }
  }
);

// Project members thunks
export const fetchProjectMembers = createAsyncThunk(
  'projects/fetchProjectMembers',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getProjectMembers(projectId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch project members';
      return rejectWithValue(message);
    }
  }
);

export const addProjectMember = createAsyncThunk(
  'projects/addProjectMember',
  async ({ projectId, userId, role }: { projectId: string; userId: string; role: string }, { rejectWithValue }) => {
    try {
      return await projectService.addProjectMember(projectId, userId, role);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add project member';
      return rejectWithValue(message);
    }
  }
);

export const removeProjectMember = createAsyncThunk(
  'projects/removeProjectMember',
  async ({ projectId, userId }: { projectId: string; userId: string }, { rejectWithValue }) => {
    try {
      await projectService.removeProjectMember(projectId, userId);
      return userId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove project member';
      return rejectWithValue(message);
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    updateProjectInList: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
    },
    resetProjects: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch workspaces
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workspaces = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create workspace
    builder
      .addCase(createWorkspace.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workspaces.push(action.payload);
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch single project
    builder
      .addCase(fetchProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create project
    builder
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update project
    builder
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete project
    builder
      .addCase(deleteProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch project members
    builder
      .addCase(fetchProjectMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projectMembers = action.payload;
      })
      .addCase(fetchProjectMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add project member
    builder
      .addCase(addProjectMember.fulfilled, (state, action) => {
        state.projectMembers.push(action.payload);
      });

    // Remove project member
    builder
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        state.projectMembers = state.projectMembers.filter(m => m.userId !== action.payload);
      });
  },
});

export const { clearError, setCurrentProject, updateProjectInList, resetProjects } = projectsSlice.actions;
export default projectsSlice.reducer;
