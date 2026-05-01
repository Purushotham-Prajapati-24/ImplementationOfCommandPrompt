import { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import { AuthScreen } from './components/AuthScreen';
import { api } from './utils/api';
import { useTerminalStore } from './store/terminalStore';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!api.getToken());

  // Background sync state when changes happen
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Throttle saves slightly to avoid spamming the backend
    let timeout: ReturnType<typeof setTimeout>;
    const unsub = useTerminalStore.subscribe((state) => {
       clearTimeout(timeout);
       timeout = setTimeout(() => {
          api.post('/state', { fs: state.fs, history: state.history, env: state.env })
             .catch(console.error);
       }, 2000);
    });

    return () => unsub();
  }, [isAuthenticated]);

  return (
    <div className="flex h-screen w-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl h-full max-h-[800px] border border-gray-700/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(88,166,255,0.15)] backdrop-blur-xl bg-[#0d1117]/95 relative group">
        
        {isAuthenticated && (
           <div className="h-8 w-full bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-4 relative z-10">
             <div className="flex space-x-2">
               <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer transition-colors" />
               <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 cursor-pointer transition-colors" />
               <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 cursor-pointer transition-colors" />
             </div>
             <div className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-500 font-mono select-none">HyperOS Cloud</div>
             <button onClick={() => api.logout()} className="text-xs text-red-400 hover:text-red-300 font-mono">LOGOUT</button>
           </div>
        )}

        <div className={isAuthenticated ? "h-[calc(100%-2rem)] w-full" : "h-full w-full"}>
          {isAuthenticated ? <Terminal /> : <AuthScreen onLogin={() => setIsAuthenticated(true)} />}
        </div>
      </div>
    </div>
  );
}

export default App;
