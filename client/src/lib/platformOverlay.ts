export type AuthMode = "login" | "signup" | "forgot";

const dispatch = (name: string, detail?: unknown) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

export const openAuthModal = (mode: AuthMode = "login") => dispatch("nexus:auth-open", { mode });
export const openSupportPanel = () => dispatch("nexus:support-open");
