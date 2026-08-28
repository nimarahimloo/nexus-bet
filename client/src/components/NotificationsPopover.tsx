import { Bell, Check, ExternalLink, LoaderCircle, X } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const typeLabels: Record<string, string> = {
  bet: "بلیت",
  wallet: "کیف پول",
  reward: "پاداش",
  sports: "ورزش",
  system: "سیستم",
};

function formatNotificationDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function NotificationsPopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAuthenticated } = useAuth();
  const listQuery = trpc.notifications.list.useQuery(undefined, { enabled: open && isAuthenticated, staleTime: 15_000 });
  const unreadQuery = trpc.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => { void utils.notifications.list.invalidate(); void utils.notifications.unreadCount.invalidate(); } });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => { void utils.notifications.list.invalidate(); void utils.notifications.unreadCount.invalidate(); } });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;
  const notifications = listQuery.data ?? [];
  return <>
    <button className="notifications-backdrop" type="button" aria-label="بستن اعلان‌ها" onClick={onClose} />
    <section className="notifications-popover glass-panel" role="dialog" aria-modal="false" aria-labelledby="notifications-title">
      <div className="notifications-head"><div><span className="section-kicker">مرکز پیام</span><h2 id="notifications-title">اعلان‌ها {unreadQuery.data ? <em>{unreadQuery.data}</em> : null}</h2></div><div className="notifications-head-actions"><button type="button" onClick={() => markAllRead.mutate()} disabled={!unreadQuery.data || markAllRead.isPending} aria-label="خواندن همهٔ اعلان‌ها"><Check size={15} /></button><button type="button" onClick={onClose} aria-label="بستن اعلان‌ها"><X size={16} /></button></div></div>
      {!isAuthenticated ? <div className="notifications-state"><Bell size={20} /><span>برای مشاهدهٔ اعلان‌ها وارد حساب شو.</span><button className="notifications-login" type="button" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("nexus:auth-open", { detail: { mode: "login" } })); }}>ورود به حساب</button></div> : listQuery.isLoading ? <div className="notifications-state"><LoaderCircle className="spin" size={20} />در حال دریافت اعلان‌ها…</div> : listQuery.error ? <div className="notifications-state notifications-error">اعلان‌ها فعلاً در دسترس نیستند.</div> : notifications.length ? <div className="notifications-list">{notifications.map((item) => { const body = <><span className="notification-type">{typeLabels[item.type] ?? "پیام"}</span><strong>{item.title}</strong><p>{item.message}</p><small>{formatNotificationDate(item.createdAt)}</small></>; return <article className={`notification-item ${item.readAt ? "is-read" : "is-unread"}`} key={item.id} onClick={() => { if (!item.readAt) markRead.mutate({ notificationId: item.id }); }}>{item.href ? <Link href={item.href} onClick={onClose}>{body}<ExternalLink size={13} /></Link> : <div>{body}</div>}</article>; })}</div> : <div className="notifications-state"><Bell size={20} />هنوز اعلان جدیدی نداری.</div>}
    </section>
  </>;
}
