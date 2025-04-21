import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../Components/Common/LoadingSpinner';

function CreateAccountPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await register(fullName, email);
      setSuccess(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError('Échec de la création du compte. Veuillez réessayer.');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 md:p-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xl mr-2">
              B
            </div>
            <h1 className="text-xl font-semibold text-gray-800">SecureOps</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Créer un compte</h2>
          <p className="text-gray-500">Rejoignez-nous pour accéder à toutes nos applications</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 animate-pulse">
            <h3 className="font-medium text-lg mb-2">Compte créé avec succès!</h3>
            <p className="mb-2">Un administrateur examinera votre demande. Vous recevrez un email de confirmation une fois approuvée.</p>
            <div className="flex items-center justify-center mt-4">
              <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-green-600 rounded-full mr-2"></div>
              <p>Redirection vers la page de connexion...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-800 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="Votre nom complet"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="votre@email.com"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-gray-500 text-sm leading-relaxed">
                Votre demande d'inscription sera examinée par un administrateur. Vous recevrez un email de confirmation une fois approuvée.
              </p>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </span>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>
        )}
        
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Vous avez déjà un compte?{" "}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateAccountPage;