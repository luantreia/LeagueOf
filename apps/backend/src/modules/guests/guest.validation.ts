import Joi from 'joi';

export const createGuestSchema = Joi.object({
  group: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Group must be a valid MongoDB ObjectId',
      'any.required': 'Group is required',
    }),
  name: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 1 character long',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Email must be valid',
    }),
  phone: Joi.string()
    .optional()
    .messages({
      'string.base': 'Phone must be a string',
    }),
});

export const getGuestsByGroupSchema = Joi.object({
  groupId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Group ID must be a valid MongoDB ObjectId',
      'any.required': 'Group ID is required',
    }),
});

export const deleteGuestSchema = Joi.object({
  guestId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Guest ID must be a valid MongoDB ObjectId',
      'any.required': 'Guest ID is required',
    }),
});
