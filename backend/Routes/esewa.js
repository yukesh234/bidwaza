import {Router} from 'express';
import { pay, verify } from '../Controller/esewa.Controller.js';
import {authenticateToken} from '../middleware/auth.middleware.js'



const router = Router();


router.post('/pay',authenticateToken, pay ) 
router.post('/verify',authenticateToken, verify)



export default router;