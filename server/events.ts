import { Router, type Request, type Response, type NextFunction } from 'express';

// Every successful change tells all open pages (server-sent events) to reload their state.
const listeners = new Set<Response>();
const broadcast = () => listeners.forEach(r => r.write('data: change\n\n'));

export const events = Router();
events.get('/', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  listeners.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
  req.on('close', () => { clearInterval(ping); listeners.delete(res); });
});

/** Middleware: broadcast after every successful non-GET request. */
export const notifyOnChange = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') res.on('finish', () => { if (res.statusCode < 400) broadcast(); });
  next();
};
