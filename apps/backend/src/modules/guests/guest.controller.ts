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

    return res.status(201).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    next(error);
  }
};

export const getGuestsByGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;
    
    const guests = await guestService.getGuestsByGroup(groupId);

    return res.status(200).json({
      success: true,
      data: guests,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGuest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guestId } = req.params;

    await guestService.deleteGuest(guestId);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
