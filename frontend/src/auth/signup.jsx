// src/auth/signup.jsx
import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email and password are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await authAPI.signup(name, email, password);

      localStorage.setItem('token', data.token);
      localStorage.setItem('api_key', data.api_key);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 sm:p-8 font-sans text-white">
      <div className="flex flex-col md:flex-row w-full max-w-[1000px] h-auto md:h-[620px] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.01]">

        <div className="hidden md:flex w-1/2 bg-brand-light p-12 relative flex-col justify-between overflow-hidden">
          <div className="absolute top-10 left-10 w-10 h-16 bg-shape-pink opacity-80"></div>
          <div className="absolute top-10 right-10 w-16 h-32 bg-shape-pink opacity-80"></div>
          <div className="absolute top-28 right-24 w-10 h-10 bg-shape-pink opacity-80"></div>

          <div className="relative z-10">
            <h1 className="font-serif text-3xl font-bold text-black mb-6">mixpanel</h1>

            <div className="inline-flex items-center gap-2 bg-black text-white text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-full bg-brand-pink"></span>
              Patent Intelligence
            </div>

            <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight text-black mb-4">
              Start Exploring <span className="text-brand-pink">Patent Insights</span>
            </h2>

            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              Create your account, choose a plan, and unlock structured patent data for smarter research and product decisions.
            </p>
          </div>

          <div className="flex gap-6 relative z-10 text-black">
            <div>
              <div className="font-bold text-xl">5</div>
              <div className="text-xs text-gray-500">Free Searches</div>
            </div>
            <div>
              <div className="font-bold text-xl">30 Days</div>
              <div className="text-xs text-gray-500">Plan Validity</div>
            </div>
            <div>
              <div className="font-bold text-xl">API</div>
              <div className="text-xs text-gray-500">Access Key</div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 bg-brand-dark p-8 md:p-12 flex flex-col justify-center relative">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="absolute top-6 right-6 text-gray-500 hover:text-white border border-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">
              Create <span className="text-brand-pink">account</span>
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Sign up to access your patent intelligence dashboard.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <p className="text-brand-pink text-sm text-center bg-brand-pink/10 border border-brand-pink/30 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Full name</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">👤</span>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-input-bg border border-input-border rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:border-brand-pink transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">✉</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input-bg border border-input-border rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:border-brand-pink transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input-bg border border-input-border rounded-lg py-3 pl-12 pr-10 focus:outline-none focus:border-brand-pink transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-pink-start to-brand-pink-end text-white font-bold py-3 rounded-lg mt-6 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Signup'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link to="/login" className="text-brand-pink hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;