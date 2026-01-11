import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required',
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(1).max(50).required().messages({
    'string.min': 'Last name must be at least 1 character long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
  }),
  lastName: Joi.string().min(1).max(50).optional().messages({
    'string.min': 'Last name must be at least 1 character long',
    'string.max': 'Last name cannot exceed 50 characters',
  }),
  avatar: Joi.string().uri().optional().allow(null, '').messages({
    'string.uri': 'Avatar must be a valid URL',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'New password must be at least 8 characters long',
    'any.required': 'New password is required',
  }),
}).custom((value, helpers) => {
  if (value.currentPassword === value.newPassword) {
    return helpers.error('any.invalid', {
      message: 'New password must be different from current password',
    });
  }
  return value;
});
