import { ArrowDownLeft, ArrowUpRight, CheckCircle2, CircleAlert, WalletCards } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatFaDecimal } from "@shared/format";

type AssetLike = { code: string; name: string; symbol: string; decimals: number; isBase: number; status: "active" | "maintenance" | "disabled"; networks: string[]; availableBalance?: number; lockedBalance?: number };

export function MultiAssetWallet() {
  const { isAuthenticated } = useAuth();
  const [currency, setCurrency] = useState("USDT");
  const [network, setNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const assetsQuery = trpc.assets.active.useQuery(undefined, { staleTime: 60_000 });
  const portfolioQuery = trpc.wallet.portfolio.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const transactionsQuery = trpc.wallet.transactions.useQuery(undefined, { enabled: isAuthenticated });
  const providerQuery = trpc.wallet.providerStatus.useQuery(undefined, { staleTime: 30_000 });
  const providerReady = providerQuery.data?.enabled === true;
  const utils = trpc.useUtils();
  const requestMutation = trpc.wallet.request.useMutation({ onSuccess: (data) => { setAmount(""); setAddress(""); toast.success(`درخواست ${data.currency} ثبت شد.`); void transactionsQuery.refetch(); void portfolioQuery.refetch(); }, onError: (error) => toast.error(error.message.includes("INSUFFICIENT") ? "موجودی این دارایی کافی نیست." : "درخواست ثبت نشد؛ مقدار و اطلاعات را بررسی کن.") });
  const assets = (isAuthenticated ? portfolioQuery.data : assetsQuery.data) as AssetLike[] | undefined;
  const selectedAsset = assets?.find((asset) => asset.code === currency) ?? assets?.[0];
  const selectedBalance = portfolioQuery.data?.find((asset) => asset.code === selectedAsset?.code);
  const selectedNetwork = network || selectedAsset?.networks[0] || "";
  const submitRequest = (type: "deposit" | "withdrawal") => {
    const value = Number(amount.replace(",", "."));
    if (!selectedAsset || !Number.isFinite(value) || value <= 0) return toast.error("دارایی و مبلغ معتبر را انتخاب کن.");
    if (type === "withdrawal" && !address.trim()) return toast.error("آدرس برداشت را وارد کن.");
    requestMutation.mutate({ type, currency: selectedAsset.code, amount: value, network: selectedNetwork, address: address.trim() || undefined });
  };
  const selectAsset = (code: string) => { setCurrency(code); setNetwork(""); };

  return <PageShell title="کیف پول" heroImage="/manus-storage/nexus-bet-wallet-hero-v2_884a12f2.png">
    <section className="wallet-portfolio" aria-label="پورتفولیوی دارایی‌ها"><div className="wallet-section-head"><div><WalletCards size={20} /><h2>دارایی‌ها</h2></div><span>USDT ارز پایه</span></div>{assetsQuery.isLoading || portfolioQuery.isLoading ? <div className="empty-state glass-panel">در حال دریافت دارایی‌ها…</div> : assetsQuery.error || portfolioQuery.error ? <div className="empty-state glass-panel"><CircleAlert size={22} /><p>پورتفولیو موقتاً در دسترس نیست.</p><button className="outline-cta" onClick={() => { void assetsQuery.refetch(); void portfolioQuery.refetch(); }}>تلاش دوباره</button></div> : <div className="wallet-asset-grid">{(assets ?? []).map((asset) => <button type="button" className={`wallet-asset-card glass-panel ${asset.code === selectedAsset?.code ? "selected" : ""}`} key={asset.code} onClick={() => selectAsset(asset.code)}><span className="asset-symbol">{asset.symbol}</span><strong>{isAuthenticated ? formatFaDecimal(asset.availableBalance ?? 0, Math.min(asset.decimals, 8)) : "—"}</strong><span>{asset.name}</span><small>{isAuthenticated ? `${formatFaDecimal(asset.lockedBalance ?? 0, Math.min(asset.decimals, 8))} قفل‌شده` : "برای موجودی وارد شوید"}</small></button>)}</div>}</section>
    <section className="balance-hero glass-panel"><span>موجودی قابل‌استفاده · {selectedAsset?.symbol ?? "USDT"}</span><strong>{isAuthenticated ? formatFaDecimal(selectedBalance?.availableBalance ?? 0, Math.min(selectedAsset?.decimals ?? 6, 8)) : "—"} <small>{selectedAsset?.symbol ?? "USDT"}</small></strong><div><span>قفل‌شده در شرط‌های باز</span><b>{isAuthenticated ? formatFaDecimal(selectedBalance?.lockedBalance ?? 0, Math.min(selectedAsset?.decimals ?? 6, 8)) : "—"} {selectedAsset?.symbol ?? "USDT"}</b></div>{!isAuthenticated && <p className="data-state">برای مشاهدهٔ موجودی واقعی وارد حساب شوید.</p>}</section>
    {isAuthenticated && <section className="standalone-card glass-panel wallet-request"><div className="wallet-section-head"><div><WalletCards size={19} /><h2>درخواست کیف پول</h2></div><span>{selectedAsset?.symbol ?? "USDT"}</span></div><div className="wallet-form-grid"><label><span>دارایی</span><select value={selectedAsset?.code ?? currency} onChange={(event) => selectAsset(event.target.value)}>{(assets ?? []).map((asset) => <option value={asset.code} key={asset.code}>{asset.symbol} · {asset.name}</option>)}</select></label><label><span>شبکه</span><select value={selectedNetwork} onChange={(event) => setNetwork(event.target.value)}>{(selectedAsset?.networks ?? []).map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label><span>مبلغ</span><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="مثلاً ۰٫۱" /></label><label className="wide"><span>آدرس برداشت (برای برداشت لازم است)</span><input value={address} onChange={(event) => setAddress(event.target.value)} inputMode="text" placeholder="آدرس شبکه" /></label></div><div className="wallet-request-actions"><button className="solid-cta" disabled={requestMutation.isPending || !providerReady} onClick={() => submitRequest("deposit")}><ArrowDownLeft size={16} /> ثبت واریز</button><button className="outline-cta" disabled={requestMutation.isPending || !providerReady} onClick={() => submitRequest("withdrawal")}><ArrowUpRight size={16} /> ثبت برداشت</button></div><p className="data-state">درخواست‌ها تا بررسی provider و ادمین در وضعیت pending باقی می‌مانند.</p></section>}
    <section className="standalone-card glass-panel"><h2>تاریخچه تراکنش‌ها</h2>{!isAuthenticated ? <p className="data-state">برای مشاهدهٔ تاریخچه وارد حساب شوید.</p> : transactionsQuery.isLoading ? <p className="data-state">در حال دریافت…</p> : transactionsQuery.data?.length ? transactionsQuery.data.map((transaction) => <div className="reward-history-row" key={transaction.id}><WalletCards size={16} /><div><b>{transaction.type} · {transaction.currency}</b><span>{new Date(transaction.createdAt).toLocaleString("fa-IR")} · {transaction.status}</span></div><strong>{formatFaDecimal(transaction.amount)} {transaction.currency}</strong></div>) : <p className="data-state">هنوز تراکنشی ثبت نشده است.</p>}</section>
    <section className="wallet-provider-note glass-panel"><CheckCircle2 size={17} /><span>{providerQuery.isLoading ? "در حال بررسی provider پرداخت…" : providerReady ? "provider پرداخت آماده است." : "واریز و برداشت واقعی پس از تنظیم provider پرداخت فعال می‌شود؛ هیچ تراکنش ساختگی ثبت نمی‌شود."} هر دارایی فقط از catalog backend و شبکه‌های ثبت‌شده قابل انتخاب است.</span></section>
  </PageShell>;
}
