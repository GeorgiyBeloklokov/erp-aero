export interface RefreshToken {
  id: number;
  token: string;
  user_id: number;
  expires_at: Date;
}
