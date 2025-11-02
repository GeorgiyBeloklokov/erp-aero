import app from './index';

const port = process.env.PORT || 3000;

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
