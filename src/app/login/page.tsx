import { login } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900/50 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="text-center relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome back</h1>
          <p className="text-sm text-zinc-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center relative z-10">
            {error}
          </div>
        )}

        <form className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input name="email" type="email" required className="block w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
            <input name="password" type="password" required className="block w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all" placeholder="••••••••" />
          </div>
          <button formAction={login} className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-zinc-900 transition-all active:scale-[0.98]">
            Sign in
          </button>
        </form>
        
        <div className="text-center text-sm text-zinc-400 relative z-10">
          Don't have an account? <a href="/register" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">Register as candidate</a>
        </div>
      </div>
    </div>
  )
}
