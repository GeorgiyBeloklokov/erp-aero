import { Request, Response } from 'express';
import { saveFileMetadata, getFiles as getFilesService, getFileById, deleteFileById, updateFileById } from '../services/file.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage }).single('file');

export const uploadFile = (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'File upload failed', error: err });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { originalname, filename, mimetype, size } = req.file;
    const extension = path.extname(originalname);
    const name = path.basename(originalname, extension);
    const user_id = req.user!.id;

    try {
      const file = await saveFileMetadata({ name, filename, extension, mime_type: mimetype, size, user_id });
      res.status(201).json(file);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
};

export const getFiles = async (req: Request, res: Response) => {
  const user_id = req.user!.id;
  const list_size = parseInt(req.query.list_size as string) || 10;
  const page = parseInt(req.query.page as string) || 1;

  try {
    const files = await getFilesService(user_id, list_size, page);
    res.status(200).json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  const fileId = parseInt(req.params.id);
  const userId = req.user!.id;

  try {
    const file = await getFileById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const filePath = `./uploads/${file.filename}`;

    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error deleting file from storage' });
      }

      await deleteFileById(fileId);
      res.status(200).json({ message: 'File deleted successfully' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getFile = async (req: Request, res: Response) => {
  const fileId = parseInt(req.params.id);
  const userId = req.user!.id;

  try {
    const file = await getFileById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.status(200).json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const downloadFile = async (req: Request, res: Response) => {
  const fileId = parseInt(req.params.id);
  const userId = req.user!.id;

  try {
    const file = await getFileById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const filePath = `./uploads/${file.filename}`;
    res.download(filePath, file.name + file.extension);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateFile = async (req: Request, res: Response) => {
  const fileId = parseInt(req.params.id);
  const userId = req.user!.id;

  try {
    const oldFile = await getFileById(fileId);

    if (!oldFile) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (oldFile.user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'File upload failed', error: err });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const oldFilePath = `./uploads/${oldFile.filename}`;
      fs.unlink(oldFilePath, async (err) => {
        if (err) {
          console.error(err);
        }
      });

      const { originalname, filename, mimetype, size } = req.file;
      const extension = path.extname(originalname);
      const name = path.basename(originalname, extension);

      try {
        await updateFileById(fileId, { name, filename, extension, mime_type: mimetype, size });
        res.status(200).json({ message: 'File updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
