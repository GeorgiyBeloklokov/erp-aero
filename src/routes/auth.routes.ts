import { Router } from 'express';
import { signup, signin, refreshToken, logout } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signin/new_token', refreshToken);
router.get('/logout', verifyToken, logout);

export default router;
