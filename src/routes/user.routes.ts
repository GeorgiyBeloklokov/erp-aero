import { Router } from 'express';
import { getInfo } from '../controllers/user.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/info', verifyToken, getInfo);

export default router;
