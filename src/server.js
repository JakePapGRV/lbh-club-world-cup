import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { seedIfEmpty } from './db/seed.js';
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

seedIfEmpty()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`World Cup Draft running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
