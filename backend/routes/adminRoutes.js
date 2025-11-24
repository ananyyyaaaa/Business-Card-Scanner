import express from 'express';
import { adminLogin, getIpRequests, approveIpRequest } from '../controllers/adminController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/ip-requests', adminProtect, getIpRequests);
router.put('/ip-requests/:id', adminProtect, approveIpRequest);

export default router;

