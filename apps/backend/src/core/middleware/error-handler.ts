import { Request, Response, NextFunction } from 'express';
import { logger } from '@/core/logging/logger';
import { AppError } from '@/shared/utils/app-error';
import { config } from '@/config/environment';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    return next(err);
  }

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Handle known errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details,
      ...(config.env === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const mongoErr = err as any;
    const errors = Object.keys(mongoErr.errors).map((key) => ({
      field: key,
      message: mongoErr.errors[key].message,
    }));

    // Si hay errores específicos, usamos el primero como mensaje principal para facilidad
    const mainMessage = errors.length > 0 ? errors[0].message : 'Error de validación';

    res.status(400).json({
      status: 'error',
      message: mainMessage,
      errors: errors,
    });
    return;
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const mongoErr = err as any;
    const field = Object.keys(mongoErr.keyPattern)[0];
    const message = field === 'name' 
      ? 'Ya existe un grupo con ese nombre' 
      : `El valor del campo ${field} ya está en uso`;

    res.status(409).json({
      status: 'error',
      message: message,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
    return;
  }

  // Default error
  res.status(500).json({
    status: 'error',
    message: config.env === 'development' ? err.message : 'Internal server error',
    ...(config.env === 'development' && { stack: err.stack }),
  });
};
