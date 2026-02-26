import express from 'express'
import { registerUser, refreshToken , sendOtp, verifyOtp, logout, login } from '../controllers/userController.js';

const router = express.Router();

router.post('/signup',registerUser);
router.post("/login", login);
router.post('/logout',logout)
router.post('/verify-otp',verifyOtp);
router.post('/generate-otp',sendOtp);
router.post('/refresh-token',refreshToken)

export default router;