import app from './index';
import { config } from './config';

const port = config.PORT;

const server = app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  console.log('[server]: SIGTERM signal received. Closing HTTP server.');
  server.close(() => {
    console.log('[server]: HTTP server closed.');
    process.exit(0);
  });
});
