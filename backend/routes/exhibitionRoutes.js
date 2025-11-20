import express from 'express';
import { createExhibition, listExhibitions, duplicateExhibition, getLiveExhibitions, getExhibitionCards, deleteExhibition } from '../controllers/exhibitionController.js';

const router = express.Router();

router.post('/', createExhibition);
router.get('/', listExhibitions);
router.post('/:id/duplicate', duplicateExhibition);
router.get('/live/today', getLiveExhibitions);
router.get('/:id/cards', getExhibitionCards);
router.delete('/:id', deleteExhibition);

export default router;
