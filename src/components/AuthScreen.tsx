import React, { useState } from 'react';
import { api } from '../utils/api';
import { useTerminalStore } from '../store/terminalStore';

export const AuthScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin ? { username, password } : { username, email, password };
      const data = await api.post(endpoint, payload);
      api.setToken(data.token);
      
      // Load remote state if exists
      try {
         const remoteState = await api.get('/state');
         if (remoteState && remoteState.fs) {
            useTerminalStore.setState({
               fs: remoteState.fs,
               history: remoteState.history || [],
               env: remoteState.env || { USER: username, HOST: 'hyperos-cloud' }
            });
         }
      } catch (err) {
         console.error('Could not load remote state, using default/local', err);
      }

      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center font-mono text-[#c9d1d9] bg-[#0d1117] relative">
      <div className="absolute top-10 flex flex-col items-center opacity-80">
         <pre className="text-[#58a6ff] text-xs sm:text-sm md:text-base leading-tight font-bold mb-4">
{`
  _   _                       ___  ____  
 | | | |_   _ _ __   ___ _ __/ _ \\/ ___| 
 | |_| | | | | '_ \\ / _ \\ '__| | | \\___ \\ 
 |  _  | |_| | |_) |  __/ |  | |_| |___) |
 |_| |_|\\__, | .__/ \\___|_|   \\___/|____/ 
        |___/|_|                          
`}
         </pre>
         <p className="text-gray-400">Secure Cloud Terminal Access</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm mt-20 border border-gray-700/50 p-6 rounded-xl bg-[#161b22] shadow-2xl">
        <h2 className="text-xl font-bold mb-6 text-center text-white">{isLogin ? 'AUTHENTICATE' : 'INITIALIZE USER'}</h2>
        
        {error && <div className="mb-4 p-2 bg-red-900/50 border border-red-500 text-red-200 text-sm rounded">{error}</div>}
        
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">USERNAME</label>
          <input 
            type="text" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
            required
            autoFocus
          />
        </div>

        {!isLogin && (
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
              required
            />
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">PASSWORD</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
            required
          />
        </div>

        {!isLogin && (
          <div className="mb-6">
            <label className="block text-xs text-gray-400 mb-1">CONFIRM PASSWORD</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#58a6ff]"
              required
            />
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition-colors mt-2"
        >
          {loading ? 'PROCESSING...' : (isLogin ? 'LOGIN' : 'SIGN UP')}
        </button>

        <div className="mt-4 text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-[#58a6ff] hover:underline text-sm"
          >
            {isLogin ? 'Create new account' : 'Already have an account? Login'}
          </button>
        </div>
      </form>
    </div>
  );
};
