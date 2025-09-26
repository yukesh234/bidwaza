import express from 'express';
import dotenv from "dotenv";
import authcontroller from '../Controller/auth.Controller.js'

dotenv.config();

const router = express.Router();

router.post('/register', authcontroller.register );
router.post('/login', authcontroller.login );
router.post('/logout', authcontroller.logout );
router.post('/getCurrentUser', authcontroller.getCurrentUser );
router.post('/sendverificationCode', authcontroller.sendVerificationCode);
router.post('/verifyCode', authcontroller.verifyEmailCode);
router.post('/resendCode', authcontroller.resendVerificationCode);


export default router;