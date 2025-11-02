export interface File {
  id: number;
  name: string;
  filename: string;
  extension: string;
  mime_type: string;
  size: number;
  upload_date: Date;
  user_id: number;
}
