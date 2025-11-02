import { Router } from 'express';
import { uploadFile, getFiles, deleteFile, getFile, downloadFile, updateFile } from '../controllers/file.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/upload', verifyToken, uploadFile);
router.get('/list', verifyToken, getFiles);
router.delete('/delete/:id', verifyToken, deleteFile);
router.get('/:id', verifyToken, getFile);
router.get('/download/:id', verifyToken, downloadFile);
router.put('/update/:id', verifyToken, updateFile);

export default router;
