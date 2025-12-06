import transporter from '../utils/transporter.js'
import redis from 'redis';
import dotenv from 'dotenv';
dotenv.config();

//redis client setup 
const redisClient = redis.createClient({
    url:process.env.REDIS_URL
})

redisClient.on('error',(error)=>{
    console.error('Redis connection error:', error);
})
await redisClient.connect();

// Generic function to send verification code
const sendCode = async(email, purpose = 'verification') => {
    try {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const redisKey = `${purpose}Code:${email}`;
        await redisClient.setEx(redisKey, 600, code);

        const emailTemplates = {
            verification: {
                subject: 'BidWaza - Verify Your Email',
                title: 'Verify Your Email',
                message: 'Your verification code is:'
            },
            passwordReset: {
                subject: 'BidWaza - Reset Your Password',
                title: 'Reset Your Password',
                message: 'Your password reset code is:'
            }
        };

        const template = emailTemplates[purpose];

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: template.subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0891b2; margin-bottom: 10px;">BidWaza</h1>
                        <h2 style="color: #333; margin-bottom: 20px;">${template.title}</h2>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                        <p style="color: #666; margin-bottom: 20px; font-size: 16px;">
                            ${template.message}
                        </p>
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h1 style="color: #0891b2; font-size: 32px; letter-spacing: 8px; margin: 0;">
                                ${code}
                            </h1>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            This code expires in <strong>10 minutes</strong>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #999; font-size: 12px;">
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true, message: "Code sent to your email" }
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: "Failed to send code" }
    }
}

// Email verification functions
export const sendverificationCode = async(email) => {
    return await sendCode(email, 'verification');
}

// Password reset functions
export const sendPasswordResetCode = async(email) => {
    return await sendCode(email, 'passwordReset');
}

// Generic verify function
const verifyGenericCode = async(email, code, purpose = 'verification') => {
    try {
        const redisKey = `${purpose}Code:${email}`;
        const storedCode = await redisClient.get(redisKey);
        
        if (!storedCode) {
            return { success: false, message: "Code expired or not found" }
        }
        
        if (storedCode === code) {
            await redisClient.del(redisKey);
            return { success: true, message: "Code verified successfully" }
        }

        return { success: false, message: 'Invalid code' };

    } catch (error) {
        console.error('Error verifying code:', error);
        return { success: false, message: 'Failed to verify code' };
    }
}

// Verify email verification code
export const verifyCode = async(email, code) => {
    return await verifyGenericCode(email, code, 'verification');
}

// Verify password reset code
export const verifyPasswordResetCode = async(email, code) => {
    return await verifyGenericCode(email, code, 'passwordReset');
}

// Generic resend function
const resendGenericCode = async(email, purpose = 'verification') => {
    try {
        const redisKey = `${purpose}Code:${email}`;
        await redisClient.del(redisKey);
        return await sendCode(email, purpose);
    } catch (error) {
        console.error('Error resending code:', error);
        return { success: false, message: "Failed to resend code" }
    }
}

// Resend email verification code
export const resendCode = async(email) => {
    return await resendGenericCode(email, 'verification');
}

// Resend password reset code
export const resendPasswordResetCode = async(email) => {
    return await resendGenericCode(email, 'passwordReset');
}