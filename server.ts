/**
 * Custom Next.js server with Socket.io integration.
 * Run with: npx ts-node --project tsconfig.server.json server.ts
 */
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { initSocketServer } from './lib/socket-server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.io to the HTTP server
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Initialize the socket server with event handlers
  initSocketServer(io);

  httpServer.listen(port, () => {
    console.log(`> ViralBoost AI ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server attached on /api/socket`);
    console.log(`> Mode: ${dev ? 'development' : 'production'}`);
  });
});
