import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { seedIfEmpty } from './db/seed.js';
import { syncFromApi } from './api/sync.js';
import { attachLocals } from './middleware.js';
import pageRoutes from './routes/pages.js';
import authRoutes from './routes/auth.js';
import draftRoutes from './routes/draft.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('view engine', 'ejs');
app.set('views', join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, '..', 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(attachLocals);

app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/draft', draftRoutes);
app.use('/admin', adminRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Error', active: '', message: err.message });
});

const PORT = process.env.PORT || 3000;

function startScoreSync() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  const expr = process.env.SCORE_SYNC_CRON || '*/5 * * * *';
  if (!token) {
    console.log('[sync] auto score sync disabled (set FOOTBALL_DATA_TOKEN to enable).');
    return;
  }
  if (!cron.validate(expr)) {
    console.warn(`[sync] invalid SCORE_SYNC_CRON "${expr}" — auto sync not scheduled.`);
    return;
  }
  cron.schedule(expr, async () => {
    try {
      const { updated } = await syncFromApi(token);
      if (updated) console.log(`[sync] updated ${updated} fixture(s) from football-data.org`);
    } catch (err) {
      console.error('[sync] failed:', err.message);
    }
  });
  console.log(`[sync] auto score sync enabled (${expr}).`);
}

seedIfEmpty()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`World Cup Draft running on http://localhost:${PORT}`);
      startScoreSync();
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
