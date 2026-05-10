import { Router } from 'express';
import { validate } from '@/core/middleware/validator';
import { createGuest, getGuestsByGroup, deleteGuest } from './guest.controller';
import { createGuestSchema } from './guest.validation';

const router = Router();

router.post('/', validate(createGuestSchema), createGuest);
router.get('/group/:groupId', getGuestsByGroup);
router.delete('/:guestId', deleteGuest);

export default router;
