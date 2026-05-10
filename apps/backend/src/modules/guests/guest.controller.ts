import { Request, Response, NextFunction } from 'express';
import { GuestService } from './guest.service';

const guestService = new GuestService();

export const createGuest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { group, name, email, phone } = req.body;
    
    const guest = await guestService.createGuest({
      group,
      name,
      email,
      phone,
    });

    res.status(201).json({
      success: true,
      data: guest,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const getGuestsByGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    
    const guests = await guestService.getGuestsByGroup(groupId);

    res.status(200).json({
      success: true,
      data: guests,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const deleteGuest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { guestId } = req.params;

    await guestService.deleteGuest(guestId);

    res.status(204).send();
    return;
  } catch (error) {
    next(error);
  }
};
