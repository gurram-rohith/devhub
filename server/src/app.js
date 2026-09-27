import authRoutes from './routes/auth.js';
// ...
import workspaceRoutes from './routes/workspaceRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import AppError from './utils/AppError.js';
import errorHandler from './middleware/errorHandler.js';
import taskRoutes from './routes/taskRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

// routes mounted here later:
// import authRoutes from './routes/auth.js';
// app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/workspaces', statsRoutes);

app.all('*', (req, res, next) =>
  next(new AppError(`Route ${req.originalUrl} not found`, 404)));

app.use(errorHandler);

export default app;