import { Router } from 'express';
import { signup, signin, refreshToken, logout } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { signupSchema, signinSchema, refreshTokenSchema, logoutSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/signin', validate(signinSchema), signin);
router.post('/signin/new_token', validate(refreshTokenSchema), refreshToken);
router.post('/logout', validate(logoutSchema), logout);

export default router;
