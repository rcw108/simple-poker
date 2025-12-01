import express from 'express';
import { getBalance, getDepositAddress, updateBalance, verifyUser, withdraw, } from './user.service.js';
const router = express.Router();
router.get('/getDepositAddress', getDepositAddress);
router.get('/getBalance', getBalance);
router.post('/withdraw', withdraw);
router.post('/updateBalance', updateBalance);
router.post('/verifyUser', verifyUser);
export default router;
