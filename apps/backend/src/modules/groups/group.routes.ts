import { Router } from 'express';
import { authenticate } from '@/core/middleware/auth';
import { GroupController } from './group.controller';

const router = Router();
const controller = new GroupController();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, controller.create);
router.post('/join-handle', authenticate, controller.joinByHandle);
router.get('/:id', authenticate, controller.getById);
router.patch('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.delete);
router.post('/:id/join', authenticate, controller.join);
router.patch('/:id/members/:memberId', authenticate, controller.updateMemberRole);
router.delete('/:id/members/:memberId', authenticate, controller.removeMember);
router.patch('/:id/ranking-config', authenticate, controller.updateRankingConfig);
router.post('/:id/reset-rankings', authenticate, controller.resetRankings);
router.post('/:id/supported-games', authenticate, controller.addSupportedGame);
router.delete('/:id/supported-games/:game', authenticate, controller.removeSupportedGame);
router.post('/:id/invite', authenticate, controller.inviteUser);
router.post('/:id/invitations/:invitationId/accept', authenticate, controller.acceptInvitation);
router.post('/:id/invitations/:invitationId/reject', authenticate, controller.rejectInvitation);
router.post('/:id/invitations/:invitationId/cancel', authenticate, controller.cancelInvitation);
router.get('/search', authenticate, controller.searchGroups);

export const groupRoutes = router;
