import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import {useAuth} from '../../Context/Authcontext.jsx';
import toast from 'react-hot-toast';

export default function Verification() {
  const location = useLocation();
  const navigate = useNavigate(); // Added this
  const formdata = location.state?.formData || {};
  
  const {register, loading, resendCode, verifyCode } = useAuth();
  const [code, setCode] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false); // Renamed for clarity
  const [isComplete, setIsComplete] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    console.log(formdata.email);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    setIsComplete(code.every(digit => digit !== ''));
  }, [code]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isComplete) return;
    
    const verificationCode = code.join('');
    setIsVerifying(true); // Set local loading state
    
    try {
      const response = await verifyCode(formdata.email, verificationCode);
      if(response.success) {
        // Register the user 
        const res = await register(formdata);
        if(res.success) {
          toast.success("Registration Successful");
          navigate('/uploadpfp') // Fixed: use navigate instead of Navigate
        } else {
          toast.error(res.message || "Registration failed");
        }
      } else {
        toast.error(response.message || "Verification failed");
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false); // Always reset loading state
    }
  };

  const handleResend = async () => {
    setCode(['', '', '', '']);
    setIsComplete(false);
    inputRefs.current[0]?.focus();
    
    try {
      const res = await resendCode(formdata.email);
      if(res.success) {
        toast.success(res.message || "Verification code resent to your email");
      } else {
        toast.error(res.message || "Failed to resend code");
      }
    } catch (error) {
      console.error('Resend failed:', error);
      toast.error('Failed to resend code. Please try again.');
    }
  };

  // Use local loading state for the verify button
  const isButtonLoading = isVerifying || loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button className="mb-8 flex items-center text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Sign In
        </button>

        {/* Main Card */}
        <div className="bg-teal-800/30 backdrop-blur-sm border border-teal-600/30 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-400/20 rounded-full mb-4">
              <Mail className="w-8 h-8 text-cyan-300" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              Verify Your Email
            </h1>
            <p className="text-teal-200/80 text-sm">
              We've sent a verification code to<br />
              <span className="text-cyan-300">{formdata.email}</span>
            </p>
          </div>

          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-teal-200 text-sm font-medium mb-4">
              Enter 4-digit code
            </label>
            
            <div className="flex justify-center gap-4 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-14 h-14 text-center text-2xl font-bold bg-teal-700/40 border-2 rounded-xl text-white placeholder-teal-400 transition-all focus:outline-none focus:border-cyan-400 focus:bg-teal-700/60 ${
                    digit ? 'border-cyan-400' : 'border-teal-600/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={!isComplete || isButtonLoading}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all transform ${
              isComplete && !isButtonLoading
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 hover:scale-[1.02] shadow-lg'
                : 'bg-teal-600/50 cursor-not-allowed'
            }`}
          >
            {isButtonLoading ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </button>

          {/* Resend Code */}
          <div className="text-center mt-6">
            <p className="text-teal-200/70 text-sm mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              className="text-cyan-300 hover:text-cyan-200 font-medium text-sm transition-colors"
            >
              Resend verification code
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-6">
          <p className="text-teal-300/60 text-sm">
            Check your spam folder if you don't see the email
          </p>
        </div>
      </div>
    </div>
  );
}