import Joi from 'joi';

// Workspace validation schemas
export const createWorkspaceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Workspace name is required',
    'string.min': 'Workspace name must be at least 1 character',
    'string.max': 'Workspace name must not exceed 100 characters',
  }),
  description: Joi.string().trim().max(500).allow(null, '').optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Workspace slug is required',
      'string.pattern.base':
        'Slug must contain only lowercase letters, numbers, and hyphens',
      'string.min': 'Slug must be at least 3 characters',
      'string.max': 'Slug must not exceed 50 characters',
    }),
});

export const updateWorkspaceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'Workspace name cannot be empty',
    'string.min': 'Workspace name must be at least 1 character',
    'string.max': 'Workspace name must not exceed 100 characters',
  }),
  description: Joi.string().trim().max(500).allow(null, '').optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
});

// Project validation schemas
export const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Project name is required',
    'string.min': 'Project name must be at least 1 character',
    'string.max': 'Project name must not exceed 100 characters',
  }),
  description: Joi.string().trim().max(500).allow(null, '').optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  key: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9]+$/)
    .min(2)
    .max(10)
    .required()
    .messages({
      'string.empty': 'Project key is required',
      'string.pattern.base': 'Key must contain only uppercase letters and numbers',
      'string.min': 'Key must be at least 2 characters',
      'string.max': 'Key must not exceed 10 characters',
    }),
  workspaceId: Joi.string().uuid().required().messages({
    'string.empty': 'Workspace ID is required',
    'string.guid': 'Invalid workspace ID format',
  }),
  status: Joi.string()
    .valid('ACTIVE', 'ARCHIVED', 'ON_HOLD', 'COMPLETED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: ACTIVE, ARCHIVED, ON_HOLD, COMPLETED',
    }),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'Project name cannot be empty',
    'string.min': 'Project name must be at least 1 character',
    'string.max': 'Project name must not exceed 100 characters',
  }),
  description: Joi.string().trim().max(500).allow(null, '').optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  status: Joi.string()
    .valid('ACTIVE', 'ARCHIVED', 'ON_HOLD', 'COMPLETED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: ACTIVE, ARCHIVED, ON_HOLD, COMPLETED',
    }),
});

// Project member validation schemas
export const addProjectMemberSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.empty': 'User ID is required',
    'string.guid': 'Invalid user ID format',
  }),
  role: Joi.string().valid('OWNER', 'ADMIN', 'MEMBER', 'VIEWER').optional().messages({
    'any.only': 'Role must be one of: OWNER, ADMIN, MEMBER, VIEWER',
  }),
});

export const updateProjectMemberSchema = Joi.object({
  role: Joi.string().valid('OWNER', 'ADMIN', 'MEMBER', 'VIEWER').required().messages({
    'string.empty': 'Role is required',
    'any.only': 'Role must be one of: OWNER, ADMIN, MEMBER, VIEWER',
  }),
});