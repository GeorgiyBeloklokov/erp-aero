import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(3000),
});

const parsedConfig = envSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error('Invalid environment variables:', parsedConfig.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsedConfig.data;
