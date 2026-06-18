import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default function LoginPage() {
  const login = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("🔥 ERRO REAL DO SUPABASE:", error);
      
      // Isso vai jogar a mensagem original do banco na sua URL
      return redirect(`/login?error=${error.message}`);
    }

    // Se o login for bem-sucedido, redireciona para o painel principal
    redirect('/');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <form
        className="flex flex-col gap-4 w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-slate-100"
        action={login}
      >
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Birthday.ai</h1>
          <p className="text-sm text-slate-500">Acesso Administrativo</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">
            E-mail
          </label>
          <input 
            id="email"
            name="email"
            type="email"
            required
            className="border border-slate-300 p-2.5 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder="Seu e-mail de administrador"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-slate-700">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="border border-slate-300 p-2.5 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder="Sua senha segura"
          />
        </div>

        <button
          type="submit"
          className="bg-slate-900 text-white p-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors mt-4"
        >
          Acessar Painel
        </button>
      </form>
    </div>
  );
}
