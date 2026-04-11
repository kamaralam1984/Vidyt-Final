/**
 * Custom Next.js server with Socket.io integration and Express for larger uploads.
 * Run with: npx ts-node --project tsconfig.server.json server.ts
 */
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { initSocketServer } from './lib/socket-server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create Express app for middleware support
  const expressApp = express();
  
  // Configure body parser for large file uploads (500MB limit)
  expressApp.use(express.json({ limit: '500mb' }));
  expressApp.use(express.urlencoded({ limit: '500mb', extended: true }));
  
  // Create HTTP server from Express app
  const httpServer = createServer(expressApp);

  // Handler for all requests
  expressApp.use((req: Request, res: Response) => {
    handle(req, res);
  });

  // Attach Socket.io to the HTTP server
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || '*',
      methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 500 * 1024 * 1024, // 500MB for socket uploads
  });

  // Initialize the socket server with event handlers
  initSocketServer(io);

  httpServer.listen(port, () => {
    console.log(`> ViralBoost AI ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server attached on /api/socket`);
    console.log(`> Request body size limit: 500MB`);
    console.log(`> Mode: ${dev ? 'development' : 'production'}`);
  });
}).catch((err) => {
  console.error('[StartupError] App failed to prepare:', err);
  process.exit(1);
});
