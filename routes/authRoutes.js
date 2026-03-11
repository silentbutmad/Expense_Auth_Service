import express from 'express'
import { registerUser, refreshToken , sendOtp, verifyOtp, logout, login, sendEmailOtpController, verifyEmailOtpController, changePassword,resetPassword,forgotPassword} from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.post('/signup',registerUser);
router.post("/login", login);
router.post('/logout',logout)
router.post('/verify-otp',verifyOtp);
router.post('/generate-otp',sendOtp);
router.post('/refresh-token',refreshToken)
router.post('/emailOtp',sendEmailOtpController)
router.post('/verfiyemail',verifyEmailOtpController)

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password",authenticate,changePassword);

export default router;