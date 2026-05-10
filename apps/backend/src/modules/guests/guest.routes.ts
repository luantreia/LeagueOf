import { Router } from 'express';
import { createGuest, getGuestsByGroup, deleteGuest } from './guest.controller';

const router = Router();

router.post('/', createGuest);
router.get('/group/:groupId', getGuestsByGroup);
router.delete('/:guestId', deleteGuest);

export default router;
