import { User, IUser } from './user.model';
import { AppError } from '@/shared/utils/app-error';

export class UserService {
  async updateProfile(userId: string, updates: Partial<IUser>): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Validar displayName si se está actualizando
    if (updates.displayName !== undefined) {
      if (updates.displayName.length < 3 || updates.displayName.length > 50) {
        throw new AppError('El nombre debe tener entre 3 y 50 caracteres', 400);
      }
      user.displayName = updates.displayName;
    }

    // Actualizar avatar si se proporciona
    if (updates.avatar !== undefined) {
      user.avatar = updates.avatar;
    }

    // Actualizar preferencias si se proporcionan
    if (updates.preferences !== undefined) {
      user.preferences = { ...user.preferences, ...updates.preferences };
    }

    return await user.save();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Validar contraseña actual
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('La contraseña actual es incorrecta', 400);
    }

    // Validar nueva contraseña
    if (newPassword.length < 6) {
      throw new AppError('La nueva contraseña debe tener al menos 6 caracteres', 400);
    }

    user.password = newPassword;
    await user.save();
  }

  async deactivateAccount(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    user.isActive = false;
    await user.save();
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return user;
  }
}
