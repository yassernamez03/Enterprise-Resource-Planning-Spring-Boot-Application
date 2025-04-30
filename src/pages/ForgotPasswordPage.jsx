import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';

// This component uses URL parameters to track the reset password flow state
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse URL parameters to determine the current step
  const queryParams = new URLSearchParams(location.search);
  const stepFromUrl = queryParams.get('step');
  const emailFromUrl = queryParams.get('email');
  
  // Initialize state from URL params or localStorage
  const [email, setEmail] = useState(emailFromUrl || localStorage.getItem('resetEmail') || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const recaptchaRef = useRef(null);
  
  // Get auth functions
  const { forgotPassword, verifyResetCode } = useAuth();
  
  // Log component mount/unmount to debug lifecycle issues
  useEffect(() => {
    console.log('ForgotPasswordPage mounted with step:', stepFromUrl);
    
    return () => {
      console.log('ForgotPasswordPage unmounted');
    };
  }, [stepFromUrl]);
  
  // When email changes, save to localStorage
  useEffect(() => {
    if (email) {
      localStorage.setItem('resetEmail', email);
    }
  }, [email]);
  
  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
  };
  
  // Request verification code
  const handleRequestCode = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Validate reCAPTCHA if on request step
    if ((!stepFromUrl || stepFromUrl === 'request') && !recaptchaValue) {
      setError('Veuillez confirmer que vous n\'êtes pas un robot');
      return;
    }
    
    console.log('Starting handleRequestCode with email:', email);
    setIsSubmitting(true);
    setError('');

    try {
      await forgotPassword(email, recaptchaValue);
      console.log('forgotPassword API call succeeded, navigating to verify step');
      
      // Instead of changing state, navigate to the same URL with a query parameter
      navigate(`/forgot-password?step=verify&email=${encodeURIComponent(email)}`, { replace: true });
      
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Échec de la demande de réinitialisation. Veuillez réessayer.');
      setIsSubmitting(false);
      // Reset reCAPTCHA on error
      recaptchaRef.current?.reset();
      setRecaptchaValue(null);
    }
  }, [email, forgotPassword, navigate, recaptchaValue, stepFromUrl]);

  // Verify code and reset password
  const handleVerifyCode = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    setIsSubmitting(true);
    setError('');

    try {
      await verifyResetCode(email, verificationCode);
      console.log('verifyResetCode API call succeeded, navigating to success step');
      
      // Navigate to success step
      navigate(`/forgot-password?step=success&email=${encodeURIComponent(email)}`, { replace: true });
      
    } catch (err) {
      console.error('Verification error:', err);
      setError('Code de vérification invalide ou expiré. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  }, [email, verificationCode, verifyResetCode, navigate]);
  
  // Render loading spinner
  const renderLoadingSpinner = () => (
    <span className="flex items-center justify-center">
      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
      {stepFromUrl === 'verify' ? 'Vérification en cours...' : 'Envoi en cours...'}
    </span>
  );

  console.log('Rendering component with step from URL:', stepFromUrl);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xl mr-2">
              B
            </div>
            <h1 className="text-xl font-semibold text-gray-800">SecureOps</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Mot de passe oublié</h2>
          
          {(!stepFromUrl || stepFromUrl === 'request') && (
            <p className="text-gray-500">Entrez votre email pour recevoir un code de vérification</p>
          )}
          
          {stepFromUrl === 'verify' && (
            <p className="text-gray-500">Entrez le code de vérification reçu par email</p>
          )}
          
          {stepFromUrl === 'success' && (
            <p className="text-gray-500">Votre mot de passe a été réinitialisé avec succès</p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Request verification code */}
        {(!stepFromUrl || stepFromUrl === 'request') && (
          <form onSubmit={handleRequestCode} data-testid="request-form">
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="votre@email.com"
                required
                disabled={isSubmitting}
                data-testid="email-input"
              />
            </div>
            
            {/* Add reCAPTCHA */}
            <div className="mb-6 flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6Ldv1igrAAAAAEv8TVD1OeZ5UkFW3Cs_jIpYa7g4"
                onChange={handleRecaptchaChange}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !recaptchaValue}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
              data-testid="request-button"
            >
              {isSubmitting ? renderLoadingSpinner() : 'Envoyer le code de vérification'}
            </button>

            <div className="text-center mt-6">
              <Link to="/login" className="text-indigo-600 font-medium hover:underline text-sm">
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Enter verification code */}
        {stepFromUrl === 'verify' && (
          <form onSubmit={handleVerifyCode} data-testid="verify-form">
            <div className="mb-6">
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-800 mb-2">
                Code de vérification
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="Entrez le code à 6 chiffres"
                required
                maxLength={6}
                disabled={isSubmitting}
                data-testid="code-input"
              />
              <p className="mt-2 text-sm text-gray-500">
                Le code a été envoyé à {email}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
              data-testid="verify-button"
            >
              {isSubmitting ? renderLoadingSpinner() : 'Vérifier et réinitialiser le mot de passe'}
            </button>

            <div className="text-center mt-6 flex flex-col space-y-2">
              <button 
                type="button"
                onClick={() => handleRequestCode()}
                className="text-indigo-600 font-medium hover:underline text-sm"
                disabled={isSubmitting}
                data-testid="resend-button"
              >
                Renvoyer le code
              </button>
              <Link to="/login" className="text-indigo-600 font-medium hover:underline text-sm">
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}

        {/* Step 3: Success message */}
        {stepFromUrl === 'success' && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6" data-testid="success-message">
            <h3 className="font-medium text-lg mb-2">Mot de passe réinitialisé!</h3>
            <p>Votre nouveau mot de passe a été envoyé à votre adresse email.</p>
            <div className="mt-4">
              <Link
                to="/login"
                className="inline-block text-indigo-600 font-medium hover:underline"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}