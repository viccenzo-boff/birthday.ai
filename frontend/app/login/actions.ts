"use server";

import { createClient } from "@/utils/supabase/server";

export interface LoginActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function login(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message: "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
    };
  }

  return {
    status: "success",
    message: "Login realizado com sucesso! Redirecionando para o painel...",
  };
}
