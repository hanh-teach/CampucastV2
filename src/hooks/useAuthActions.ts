import { getSupabaseClientAsync } from "../services/supabaseClient";

export function useAuthActions() {
  const changePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const supabase = await getSupabaseClientAsync();
      if (!supabase) {
        return { error: "Supabase client is not configured or offline" };
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err.message || "An unknown error occurred" };
    }
  };

  const signOutCurrentDevice = async (): Promise<void> => {
    const supabase = await getSupabaseClientAsync();
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return { changePassword, signOutCurrentDevice };
}
