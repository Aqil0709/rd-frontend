import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Phone, Lock, LogIn, CheckCircle, Send, KeyRound } from 'lucide-react';

// The 'view' prop can be 'login' or 'register' to set the initial mode
const AuthPage = ({ view }) => {
    // --- CONTEXT & NAVIGATION ---
    const { 
        login, register, navigate, authError, authLoading, t, 
        sendOtp, verifyOtp, 
        sendPasswordResetOtp,
        resetPassword
    } = useContext(AppContext);

    // --- STATE MANAGEMENT ---
    // Mode determines which form is shown: 'login', 'register', or 'forgotPassword'
    const [mode, setMode] = useState(view || 'login'); 

    // Form input states
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    // --- NEW ---: State for the age confirmation checkbox
    const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

    // Error and message states
    const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // UI flow and loading states
    const [otpSessionId, setOtpSessionId] = useState(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [showResetPasswordFields, setShowResetPasswordFields] = useState(false);
    const [loading, setLoading] = useState(false);

    // Effect to switch mode when the view prop changes (e.g., via routing)
    useEffect(() => {
        setMode(view || 'login');
        // Reset all fields and errors when mode changes
        setMobileNumber('');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
        setFormError(null);
        setSuccessMessage(null);
        setShowOtpInput(false);
        setShowResetPasswordFields(false);
        setOtpSessionId(null);
        setIsAgeConfirmed(false); // --- MODIFIED ---: Reset age confirmation on mode change
    }, [view]);

    // --- HANDLER FUNCTIONS ---

    const clearMessages = () => {
        setFormError(null);
        setSuccessMessage(null);
    };

    // Main handler that delegates based on the current mode and step
    const handleSubmit = async (e) => {
        e.preventDefault();
        clearMessages();

        if (password && confirmPassword && password !== confirmPassword) {
            setFormError(t('passwordsDontMatch'));
            return;
        }

        setLoading(true);
        try {
            if (mode === 'login') {
                await login({ mobileNumber, password });
            } else if (mode === 'register') {
                if (!showOtpInput) await handleSendRegistrationOtp();
                else await handleVerifyRegistrationOtp();
            } else if (mode === 'forgotPassword') {
                if (!showOtpInput && !showResetPasswordFields) await handleSendResetOtp();
                else if (showOtpInput && !showResetPasswordFields) await handleVerifyResetOtp();
                else if (showResetPasswordFields) await handleResetPassword();
            }
        } catch (error) {
            console.error("Submission Error:", error);
            setFormError(error.message || t('somethingWentWrong'));
        } finally {
            setLoading(false);
        }
    };

    const handleSendRegistrationOtp = async () => {
        const response = await sendOtp(mobileNumber);
        if (response.success) {
            setOtpSessionId(response.sessionId);
            setShowOtpInput(true);
            setSuccessMessage(t('otpSentToMobile', { mobile: mobileNumber }));
        } else {
            setFormError(response.message || t('failedToSendOtp'));
        }
    };

    const handleVerifyRegistrationOtp = async () => {
        const response = await verifyOtp(mobileNumber, otp, otpSessionId);
        if (response.success) {
            await register({ mobileNumber, password });
        } else {
            setFormError(response.message || t('invalidOtp'));
        }
    };
    
    // --- Forgot Password Handlers ---

    const handleSendResetOtp = async () => {
        const response = await sendPasswordResetOtp(mobileNumber);
        if (response.success) {
            setOtpSessionId(response.sessionId);
            setShowOtpInput(true);
            setSuccessMessage(t('otpSentForReset', { mobile: mobileNumber }));
        } else {
            setFormError(response.message || t('failedToSendOtp'));
        }
    };

    const handleVerifyResetOtp = async () => {
        const response = await verifyOtp(mobileNumber, otp, otpSessionId);
        if (response.success) {
            setShowOtpInput(false);
            setShowResetPasswordFields(true);
            setSuccessMessage(t('otpVerifiedResetNow'));
        } else {
            setFormError(response.message || t('invalidOtp'));
        }
    };

    const handleResetPassword = async () => {
        const response = await resetPassword({ mobileNumber, password, otpSessionId });
        if (response.success) {
            setSuccessMessage(t('passwordResetSuccess'));
            setTimeout(() => setMode('login'), 2000);
        } else {
            setFormError(response.message || t('passwordResetFailed'));
        }
    };
    
    // --- DYNAMIC CONTENT ---

    const getTitle = () => {
        if (mode === 'login') return t('loginTitle');
        if (mode === 'register') return t('Looks like you are new here!');
        if (mode === 'forgotPassword') return t('Reset Your Password');
        return '';
    };

    const getSubtitle = () => {
        if (mode === 'login') return t('Get access to your Orders, Wishlist and Recommendations');
        if (mode === 'register') return t('Sign up with your mobile number to get started');
        if (mode === 'forgotPassword') {
            if (showResetPasswordFields) return t('Enter your new password.');
            if (showOtpInput) return t('Verify the OTP sent to your mobile.');
            return t('Enter your registered mobile number to continue.');
        }
        return '';
    };

    const getButtonText = () => {
        if (loading) {
            if (mode === 'login') return t('loggingIn');
            if (mode === 'register') return showOtpInput ? t('verifyingOtp') : t('sendingOtp');
            if (mode === 'forgotPassword') {
                if (showResetPasswordFields) return t('resettingPassword');
                if (showOtpInput) return t('verifyingOtp');
                return t('sendingOtp');
            }
        }
        if (mode === 'login') return t('login');
        if (mode === 'register') return showOtpInput ? t('Verify & Register') : t('Get Verification Code');
        if (mode === 'forgotPassword') {
            if (showResetPasswordFields) return t('Reset Password');
            if (showOtpInput) return t('Verify OTP');
            return t('Send OTP');
        }
        return 'Submit';
    };

    const getButtonIcon = () => {
        if (mode === 'login') return <LogIn className="h-5 w-5 mr-2" />;
        if (mode === 'register' || mode === 'forgotPassword') {
            if (showOtpInput) return <CheckCircle className="h-5 w-5 mr-2" />;
            if (showResetPasswordFields) return <KeyRound className="h-5 w-5 mr-2" />;
            return <Send className="h-5 w-5 mr-2" />;
        }
        return null;
    };


    // --- RENDER ---
    return (
        <div className="flex items-center justify-center min-h-screen bg-blue-50 p-4 font-inter">
            <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden">
                {/* Left/Top Section: Promotional Content */}
                

                {/* Right/Bottom Section: Auth Form */}
                <div className="p-8 md:p-12 w-full md:w-3/5">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* --- Mobile Number Input (Visible in all modes initially) --- */}
                        {(!showResetPasswordFields) && (
                            <div>
                                <label htmlFor="mobileNumber" className="sr-only">{t('mobileNumber')}</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input type="tel" id="mobileNumber" value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        className="w-full pl-10 pr-3 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
                                        placeholder={t('Enter Mobile Number')} required
                                        disabled={loading || (showOtpInput && (mode === 'register' || mode === 'forgotPassword'))}
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- Password Inputs (Login, Register, and Reset Password Step) --- */}
                        {(mode === 'login' || (mode === 'register' && !showOtpInput) || showResetPasswordFields) && (
                            <>
                                <div>
                                    <label htmlFor="password" className="sr-only">{t('password')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                        <input type="password" id="password" value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-3 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
                                            placeholder={showResetPasswordFields ? t('Enter New Password') : t('Enter Password')} required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                {(mode === 'register' || showResetPasswordFields) && (
                                    <div>
                                        <label htmlFor="confirmPassword" className="sr-only">{t('confirmPassword')}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                            <input type="password" id="confirmPassword" value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full pl-10 pr-3 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
                                                placeholder={showResetPasswordFields ? t('Confirm New Password') : t('confirmYourPassword')} required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* --- OTP Input (Register and Forgot Password flows) --- */}
                        {showOtpInput && (
                            <div>
                                <label htmlFor="otp" className="sr-only">{t('otp')}</label>
                                <div className="relative">
                                    <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input type="text" id="otp" value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full pl-10 pr-3 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
                                        placeholder={t('enterOtp')} maxLength="6" required disabled={loading}
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* --- Messages and Errors --- */}
                        {formError && <p className="text-red-600 text-sm text-center font-medium">{formError}</p>}
                        {authError && <p className="text-red-600 text-sm text-center font-medium">{authError}</p>}
                        {successMessage && <p className="text-green-600 text-sm text-center font-medium">{successMessage}</p>}
                        
                        {/* --- NEW ---: Age Confirmation Checkbox --- */}
                        {(mode === 'login' || mode === 'register') && (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="ageConfirm"
                                    checked={isAgeConfirmed}
                                    onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="ageConfirm" className="text-sm text-gray-600">
                                    {t('I certify that I am 18 years of age or older.')}
                                </label>
                            </div>
                        )}

                        {/* --- Submit Button --- */}
                        <div>
                            <button type="submit"
                                className="w-full py-3 px-4 bg-orange-500 text-white font-semibold rounded-md shadow-md hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                // --- MODIFIED ---: Add age confirmation to the disabled logic
                                disabled={
                                    loading || 
                                    authLoading || 
                                    ((mode === 'login' || mode === 'register') && !isAgeConfirmed)
                                }>
                                {loading || authLoading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div> : getButtonIcon()}
                                {getButtonText()}
                            </button>
                        </div>
                    </form>

                    {/* --- Bottom Links to switch modes --- */}
                    <div className="text-center text-gray-700 mt-6">
                        {mode === 'login' && (
                            <p>{t('New to RD Pan Shop ?')}{' '}
                                <button onClick={() => setMode('register')} className="text-blue-600 hover:underline font-medium">{t('Create an Account')}</button>
                            </p>
                        )}
                        {mode === 'register' && (
                            <p>{t('alreadyHaveAccount')}{' '}
                                <button onClick={() => setMode('login')} className="text-blue-600 hover:underline font-medium">{t('loginHere')}</button>
                            </p>
                        )}
                        {/* Show "Forgot Password" on login, and "Back to Login" on other pages */}
                        {mode === 'login' && (
                             <button onClick={() => setMode('forgotPassword')} className="text-sm text-blue-600 hover:underline font-medium mt-2">
                                {t('Forgot Password?')}
                            </button>
                        )}
                        {(mode === 'register' || mode === 'forgotPassword') && (
                            <button onClick={() => setMode('login')} className="text-sm text-blue-600 hover:underline font-medium mt-2">
                                {t('Back to Login')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
