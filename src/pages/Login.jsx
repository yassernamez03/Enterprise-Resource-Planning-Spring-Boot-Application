import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../Components/Common/LoadingSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate('/'); // Redirect to home page on successful login
    } catch (err) {
      setError('Échec de la connexion. Veuillez vérifier vos identifiants.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Connexion</h2>
          <p className="text-gray-500">Accédez à votre espace de travail</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

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
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                Se souvenir de moi
              </label>
            </div>
            <div>
              <Link to="/forgot-password" className="text-indigo-600 text-sm font-medium hover:underline">
                Mot de passe oublié?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors disabled:bg-indigo-400"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                Connexion en cours...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Pas encore de compte?{" "}
            <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}