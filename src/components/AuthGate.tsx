import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';

const ADMIN_EMAIL = 'jfs10219@hotmail.com';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const email = currentUser.email?.trim().toLowerCase();
      if (email !== ADMIN_EMAIL || !currentUser.emailVerified) {
        await signOut(auth);
        setUser(null);
        setError('Esta conta não está autorizada como administradora. Entre com a conta Google autorizada.');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setError('');
      setLoading(false);
    });
  }, []);

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setSigningIn(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
      if (result.user.email?.trim().toLowerCase() !== ADMIN_EMAIL || !result.user.emailVerified) {
        await signOut(auth);
        throw new Error('Conta não autorizada ou e-mail ainda não verificado.');
      }
      setUser(result.user);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível entrar com e-mail e senha.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.trim().toLowerCase();
      if (email !== ADMIN_EMAIL || !result.user.emailVerified) {
        await signOut(auth);
        throw new Error('A conta Google selecionada não corresponde ao administrador autorizado.');
      }
      setUser(result.user);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível autenticar. Verifique se o login Google está habilitado no Firebase.');
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090A0F] text-white flex items-center justify-center">
        <div className="text-sm text-zinc-400">Verificando acesso seguro...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#090A0F] text-white flex items-center justify-center p-5">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#12141A] p-7 shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-2 text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Acesso restrito</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">OminiHub</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Entre com a conta Google autorizada para acessar o painel administrativo.
            </p>
          </div>
          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}
          <form onSubmit={handleEmailSignIn} className="mt-6 space-y-3">
            <label className="block text-xs font-medium text-zinc-300">Senha da conta administradora</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="w-full rounded-xl border border-white/10 bg-[#090A0F] px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
            />
            <button type="submit" disabled={signingIn} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-[#003731] transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">
              <LogIn className="h-4 w-4" />
              {signingIn ? 'Autenticando...' : 'Entrar com e-mail'}
            </button>
          </form>
          <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-zinc-600"><span className="h-px flex-1 bg-white/10" />ou<span className="h-px flex-1 bg-white/10" /></div>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={signingIn}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-[#003731] transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            Entrar com Google
          </button>
          <p className="mt-4 text-center text-[11px] text-zinc-500">
            Somente a conta administradora cadastrada pode acessar este ambiente.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
};
