import express from 'express'
import { registerUser } from '../controllers/userController.js';
const router = express.Router();

router.post('/signup',registerUser);
//router.post('/login',);
//router.post('/logout',)
//router.post('/verify-otp',);
//router.post('/generate-otp',);
//router.post('/refresh-token',)

export default router;