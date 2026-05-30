import { Router } from 'express';
import { requireAdmin } from '../middleware.js';
import { getAdminData, setScore, updatePlayerNames, setThirdPlace } from '../repo.js';
import { seed } from '../db/seed.js';

const router = Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const data = await getAdminData();
    res.render('admin', { title: 'Admin', active: 'admin', ...data });
  } catch (err) {
    next(err);
  }
});

router.post('/score', async (req, res, next) => {
  try {
    const { fixtureId, homeScore, awayScore, winnerTeamId } = req.body;
    await setScore(
      Number(fixtureId),
      Number(homeScore),
      Number(awayScore),
      winnerTeamId ? Number(winnerTeamId) : null
    );
    res.redirect('/admin#fx-' + fixtureId);
  } catch (err) {
    next(err);
  }
});

router.post('/players', async (req, res, next) => {
  try {
    await updatePlayerNames(req.body);
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/settings', async (req, res, next) => {
  try {
    await setThirdPlace(Boolean(req.body.scoreThirdPlace));
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/reseed', async (req, res, next) => {
  try {
    await seed();
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

export default router;
