import nodemailer from 'nodemailer';
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

//creating a transporter

const transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
})

export const sendverificationCode = async(email) =>{

    try {
          const code = Math.floor(1000 + Math.random() * 9000).toString();
         await redisClient.setEx(`verificationCode:${email}`,600,code);

         const mailOptions ={
            from: process.env.EMAIL_USER,
      to: email,
      subject: 'BidWaza - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0891b2; margin-bottom: 10px;">BidWaza</h1>
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <p style="color: #666; margin-bottom: 20px; font-size: 16px;">
              Your verification code is:
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
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
        </div>
      `
    };
        await transporter.sendMail(mailOptions);
        return { success:true, message:"Verification code sent to your email"}
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success:false, message:"Failed to send verification code"}
    }
}

export const verifyCode = async(email,code)=>{
  
    try {
        const storedcode = await redisClient.get(`verificationCode:${email}`);
        if(!storedcode)
        {

            return { success:false, message:"Verification code expired or not found" }
        }
        if(storedcode === code)
        {
            await redisClient.del(`verificationCode:${email}`);
            return { success:true, message:"Email verified successfully" }
        }

        return { success: false, message: 'Invalid verification code' };

    } catch (error) {
        console.error('Error verifying code:', error);
        return { success: false, message: 'Failed to verify code' };
    }
}

export const resendCode = async(email) =>{
    try {
        await redisClient.del(`verificationCode:${email}`);
        await sendverificationCode(email);
     
    } catch (error) {
        console.error('Error resending code:', error);
        return { success:false, message:"Failed to resend code" }
    }
}