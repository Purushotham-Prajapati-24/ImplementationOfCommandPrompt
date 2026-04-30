
import Terminal from './components/Terminal';

function App() {
  return (
    <div className="flex h-screen w-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl h-full max-h-[800px] border border-gray-700/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(88,166,255,0.15)] backdrop-blur-xl bg-[#0d1117]/95 relative group">
        {/* Mac-like header bar */}
        <div className="h-8 w-full bg-[#161b22] border-b border-gray-800 flex items-center px-4 space-x-2 relative z-10">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer transition-colors" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 cursor-pointer transition-colors" />
          <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 cursor-pointer transition-colors" />
          <div className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-500 font-mono select-none">HyperOS Terminal</div>
        </div>
        <div className="h-[calc(100%-2rem)] w-full">
          <Terminal />
        </div>
      </div>
    </div>
  );
}

export default App;
