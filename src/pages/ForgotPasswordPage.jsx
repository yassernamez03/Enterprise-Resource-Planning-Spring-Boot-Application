import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../Components/Common/LoadingSpinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('Échec de la demande de réinitialisation. Veuillez réessayer.');
      console.error('Forgot password error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xl mr-2">
              B
            </div>
            <h1 className="text-xl font-semibold text-gray-800">SecureOps</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Mot de passe oublié</h2>
          <p className="text-gray-500">Entrez votre email pour réinitialiser votre mot de passe</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-lg mb-2">Demande envoyée!</h3>
            <p>Si un compte est associé à cette adresse, vous recevrez bientôt un email avec les instructions pour réinitialiser votre mot de passe.</p>
            <div className="mt-4">
              <Link
                to="/login"
                className="inline-block text-indigo-600 font-medium hover:underline"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                  Envoi en cours...
                </span>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </button>

            <div className="text-center mt-6">
              <Link to="/login" className="text-indigo-600 font-medium hover:underline text-sm">
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}