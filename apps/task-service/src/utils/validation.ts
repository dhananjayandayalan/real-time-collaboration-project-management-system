import Joi from 'joi';

// Task validation schemas
export const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Task title is required',
    'string.min': 'Task title must be at least 1 character',
    'string.max': 'Task title must not exceed 200 characters',
  }),
  description: Joi.string().trim().max(5000).allow(null, '').optional().messages({
    'string.max': 'Description must not exceed 5000 characters',
  }),
  projectId: Joi.string().uuid().required().messages({
    'string.empty': 'Project ID is required',
    'string.guid': 'Invalid project ID format',
  }),
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'CANCELLED')
    .optional()
    .messages({
      'any.only':
        'Status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED, CANCELLED',
    }),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional().messages({
    'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT',
  }),
  type: Joi.string()
    .valid('TASK', 'BUG', 'FEATURE', 'IMPROVEMENT', 'EPIC')
    .optional()
    .messages({
      'any.only': 'Type must be one of: TASK, BUG, FEATURE, IMPROVEMENT, EPIC',
    }),
  assigneeId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'Invalid assignee ID format',
  }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'Due date must be a valid ISO date',
  }),
  startDate: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'Start date must be a valid ISO date',
  }),
  estimatedHours: Joi.number().min(0).allow(null).optional().messages({
    'number.min': 'Estimated hours must be non-negative',
  }),
  tags: Joi.array().items(Joi.string().trim()).optional(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional().messages({
    'string.empty': 'Task title cannot be empty',
    'string.min': 'Task title must be at least 1 character',
    'string.max': 'Task title must not exceed 200 characters',
  }),
  description: Joi.string().trim().max(5000).allow(null, '').optional().messages({
    'string.max': 'Description must not exceed 5000 characters',
  }),
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'CANCELLED')
    .optional()
    .messages({
      'any.only':
        'Status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED, CANCELLED',
    }),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional().messages({
    'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT',
  }),
  type: Joi.string()
    .valid('TASK', 'BUG', 'FEATURE', 'IMPROVEMENT', 'EPIC')
    .optional()
    .messages({
      'any.only': 'Type must be one of: TASK, BUG, FEATURE, IMPROVEMENT, EPIC',
    }),
  assigneeId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'Invalid assignee ID format',
  }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'Due date must be a valid ISO date',
  }),
  startDate: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'Start date must be a valid ISO date',
  }),
  estimatedHours: Joi.number().min(0).allow(null).optional().messages({
    'number.min': 'Estimated hours must be non-negative',
  }),
  actualHours: Joi.number().min(0).allow(null).optional().messages({
    'number.min': 'Actual hours must be non-negative',
  }),
  tags: Joi.array().items(Joi.string().trim()).optional(),
});

// Task comment validation schemas
export const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Comment content is required',
    'string.min': 'Comment must be at least 1 character',
    'string.max': 'Comment must not exceed 2000 characters',
  }),
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Comment content is required',
    'string.min': 'Comment must be at least 1 character',
    'string.max': 'Comment must not exceed 2000 characters',
  }),
});

// Task watcher validation schema
export const addWatcherSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.empty': 'User ID is required',
    'string.guid': 'Invalid user ID format',
  }),
});
