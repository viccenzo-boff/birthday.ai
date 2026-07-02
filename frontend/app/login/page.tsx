"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Toast, type ToastVariant } from "../components/Toast";
import { login, type LoginActionState } from "./actions";

const initialState: LoginActionState = { status: "idle" };
const REDIRECT_DELAY_MS = 1200;

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, initialState);

  // Reseta o fechamento manual do toast sempre que uma nova tentativa de login gera um novo estado.
  const [prevState, setPrevState] = useState(state);
  const [toastKey, setToastKey] = useState(0);
  const [toastDismissed, setToastDismissed] = useState(false);

  if (state !== prevState) {
    setPrevState(state);
    setToastKey((key) => key + 1);
    setToastDismissed(false);
  }

  useEffect(() => {
    if (state.status !== "success") return;

    const redirectTimer = window.setTimeout(() => {
      router.push("/");
      router.refresh();
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(redirectTimer);
  }, [state.status, router]);

  const toastVisible = state.status !== "idle" && !toastDismissed;
  const toastVariant: ToastVariant = state.status === "success" ? "success" : "warning";

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <form
        className="flex flex-col gap-4 w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-slate-100"
        action={formAction}
      >
        <div className="flex flex-col items-center gap-2 text-center mb-4">
          <Image src="/icon-192x192.png" alt="Birthday.ai" width={64} height={64} priority />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Birthday.ai</h1>
            <p className="text-sm text-slate-500">Acesso Administrativo</p>
          </div>
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
          disabled={isPending}
          className="bg-slate-900 text-white p-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors mt-4 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "Entrando..." : "Acessar Painel"}
        </button>
      </form>

      {toastVisible && state.message ? (
        <Toast
          key={toastKey}
          message={state.message}
          variant={toastVariant}
          onClose={() => setToastDismissed(true)}
        />
      ) : null}
    </div>
  );
}
