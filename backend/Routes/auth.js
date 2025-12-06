import express from 'express';
import dotenv from "dotenv";
import authcontroller from '../Controller/auth.Controller.js'
import {authenticateToken} from '../middleware/auth.middleware.js'
dotenv.config();

const router = express.Router();

router.post('/register', authcontroller.register );
router.post('/login', authcontroller.login );
router.post('/logout', authcontroller.logout );
router.post('/getCurrentUser',authenticateToken ,authcontroller.getCurrentUser );
router.post('/sendverificationCode', authcontroller.sendVerificationCode);
router.post('/verifyCode', authcontroller.verifyEmailCode);
router.post('/resendCode', authcontroller.resendVerificationCode);
router.put("/update-password",authenticateToken,authcontroller.updatePassword)

router.post('/forgetpassword',authcontroller.forgotPassword);
router.post('/resend-password-reset-code',authcontroller.resendPasswordResetCodeController);
router.post('/verify-password-reset-code',authcontroller.verifyPasswordResetCodeController);
router.put('/reset-password',authcontroller.resetpassword);

export default router;