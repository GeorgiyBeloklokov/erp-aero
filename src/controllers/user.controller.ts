import { Request, Response } from 'express';

export const getInfo = (req: Request, res: Response) => {
  const userId = req.user!.id;
  res.status(200).json({ id: userId });
};
