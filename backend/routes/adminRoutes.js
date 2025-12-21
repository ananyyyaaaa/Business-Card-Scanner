import express from 'express';
import {
    adminLogin,
    getIpRequests,
    approveIpRequest,
    exportExhibitions,
    exportExhibitionCards,
    getUsers,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/adminController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/ip-requests', adminProtect, getIpRequests);
router.put('/ip-requests/:id', adminProtect, approveIpRequest);
router.get('/export/exhibitions', adminProtect, exportExhibitions);
router.get('/export/exhibitions/:id/cards', adminProtect, exportExhibitionCards);

// User Management Routes
router.route('/users')
    .get(adminProtect, getUsers)
    .post(adminProtect, createUser);

router.route('/users/:id')
    .put(adminProtect, updateUser)
    .delete(adminProtect, deleteUser);

export default router;

