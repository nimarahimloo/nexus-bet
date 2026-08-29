import { useState } from "react";
import { Bot, Headphones, X } from "lucide-react";
import { useEffect } from "react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const initialMessages: Message[] = [{ role: "system", content: "Nexus AI support" }];

export function InPlatformSupport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [contextPrompt, setContextPrompt] = useState<string | null>(null);
  useEffect(() => {
    const onContext = (event: Event) => setContextPrompt((event as CustomEvent<{ prompt?: string }>).detail?.prompt ?? null);
    window.addEventListener("nexus:ai-context", onContext);
    return () => window.removeEventListener("nexus:ai-context", onContext);
  }, []);
  const chatMutation = trpc.support.chat.useMutation({
    onSuccess: (result) => setMessages((current) => [...current, { role: "assistant", content: result.content }]),
    onError: () => setMessages((current) => [...current, { role: "assistant", content: "اتصال به پشتیبانی هوشمند در این لحظه برقرار نشد. پیام قبلی حفظ شده است؛ دوباره تلاش کن." }]),
  });
  if (!open) return null;
  const send = (content: string) => {
    const next = [...messages, { role: "user" as const, content: content.trim().slice(0, 2_000) }];
    setMessages(next);
    const conversation = next.filter((message) => message.role !== "system").slice(-10).map((message) => ({ role: message.role as "user" | "assistant", content: String(message.content).slice(0, 2_000) }));
    chatMutation.mutate({ messages: conversation });
  };
  return <div className="support-layer" role="presentation" onMouseDown={onClose}><section className="support-panel glass-panel" role="dialog" aria-modal="true" aria-label="پشتیبانی هوشمند Nexus" onMouseDown={(event) => event.stopPropagation()}><header className="support-head"><span className="support-avatar"><Bot size={19} /></span><div><span>NEXUS ASSIST</span><b>پشتیبانی هوشمند</b><small>{isAuthenticated ? "متصل به اطلاعات read-only حساب" : "برای اطلاعات حساب، ابتدا وارد شوید"}</small></div><button onClick={onClose} aria-label="بستن پشتیبانی"><X size={19} /></button></header><AIChatBox className="nexus-support-chat" height="min(62dvh, 560px)" messages={messages} onSendMessage={send} isLoading={chatMutation.isPending} placeholder="سؤال خودت را بنویس…" emptyStateMessage="در مورد مسابقات، کیف پول، بلیت یا حساب بپرس." suggestedPrompts={[...(contextPrompt ? [contextPrompt] : []), "چطور بلیت ثبت کنم؟", "وضعیت کیف پول را کجا ببینم؟", "گردونه شانس چطور کار می‌کند؟"]} /><footer className="support-foot"><Headphones size={14} /> پاسخ‌های Nexus AI راهنمای عمومی پلتفرم هستند.</footer></section></div>;
}
