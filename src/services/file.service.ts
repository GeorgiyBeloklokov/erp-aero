import { ResultSetHeader } from 'mysql2/promise';
import pool from '../db';
import { File } from '../types/file';

export const saveFileMetadata = async (file: Omit<File, 'id' | 'upload_date'>): Promise<File> => {
  const { name, filename, extension, mime_type, size, user_id } = file;
  const upload_date = new Date();
  const [result] = await pool.execute(
    'INSERT INTO files (name, filename, extension, mime_type, size, upload_date, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, filename, extension, mime_type, size, upload_date, user_id],
  );
  const insertId = (result as ResultSetHeader).insertId;
  return { id: insertId, ...file, upload_date };
};

export const getFiles = async (userId: number, listSize: number, page: number): Promise<File[]> => {
  const offset = (page - 1) * listSize;
  const [rows] = await pool.execute(`SELECT * FROM files WHERE user_id = ? LIMIT ${listSize} OFFSET ${offset}`, [
    userId,
  ]);
  return rows as File[];
};

export const getFileById = async (id: number): Promise<File | null> => {
  const [rows] = await pool.execute('SELECT * FROM files WHERE id = ?', [id]);
  const files = rows as File[];
  if (files.length === 0) {
    return null;
  }
  return files[0];
};

export const deleteFileById = async (id: number): Promise<void> => {
  await pool.execute('DELETE FROM files WHERE id = ?', [id]);
};

export const updateFileById = async (id: number, file: Omit<File, 'id' | 'user_id' | 'upload_date'>): Promise<void> => {
  const { name, filename, extension, mime_type, size } = file;
  await pool.execute('UPDATE files SET name = ?, filename = ?, extension = ?, mime_type = ?, size = ? WHERE id = ?', [
    name,
    filename,
    extension,
    mime_type,
    size,
    id,
  ]);
};
