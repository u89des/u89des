import { passwordValidation } from "./auth-flow.js";

export async function requestPasswordReset(auth, email, redirectBase) {
  const { error } = await auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectBase });
  if (error) throw error;
}

export async function updateOwnPassword(auth, password, confirmation) {
  const validation = passwordValidation(password, confirmation);
  if (validation) throw new Error(validation);
  const { data, error } = await auth.updateUser({ password, data: { password_setup_complete: true } });
  if (error) throw error;
  return data.user;
}
