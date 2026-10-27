'use client'

import { useState } from 'react'
import {
  Activity,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from 'lucide-react'

const leagues = ['All Sports', 'Football', 'Basketball', 'Tennis', 'Baseball']

const games = [
  { league: 'NBA · Regular Season', time: '19:30', home: 'Boston Celtics', away: 'New York Knicks', homeForm: 'W W L W W', awayForm: 'L W W L W', homeOdds: '+115', awayOdds: '-135' },
  { league: 'NFL · Week 8', time: '20:15', home: 'Baltimore Ravens', away: 'Cleveland Browns', homeForm: 'W W W L W', awayForm: 'L L W L L', homeOdds: '-110', awayOdds: '-110' },
  { league: 'Premier League', time: '14:00', home: 'Arsenal', away: 'Liverpool', homeForm: 'W W D W W', awayForm: 'W W W D W', homeOdds: '+160', awayOdds: '+175' },
]

const quickPicks = [
  { label: 'Celtics to win', odds: '+115', color: 'from-violet-500/25' },
  { label: 'Ravens moneyline', odds: '-110', color: 'from-fuchsia-500/25' },
  { label: 'Arsenal or draw', odds: '-240', color: 'from-indigo-500/25' },
]

export default function Page() {
  const [activeLeague, setActiveLeague] = useState('All Sports')
  const [slipOpen, setSlipOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('Popular')

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#08060f] text-white selection:bg-violet-500/40">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#0b0815]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:px-8">
          <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Open navigation"><Menu /></button>
          <a href="#" className="flex items-center gap-2 text-lg font-bold tracking-tight"><span className="grid size-8 place-items-center rounded-lg bg-violet-500 shadow-[0_0_24px_rgba(139,92,246,.55)]"><Sparkles className="size-4" /></span><span>NEXUS<span className="text-violet-400">BET</span></span></a>
          <nav className="hidden items-center gap-1 text-sm text-white/60 lg:flex" aria-label="Main navigation">
            {['Sports', 'Live', 'Promos'].map((item) => <a key={item} href={`#${item.toLowerCase()}`} className={`rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white ${item === 'Sports' ? 'bg-white/10 text-white' : ''}`}>{item}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:border-white/20 hover:text-white sm:flex"><Search className="size-4" /> Search</button>
            <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Help"><CircleHelp className="size-5" /></button>
            <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"><UserRound className="size-4 text-violet-300" /><span className="hidden sm:inline">Sign in</span></button>
            <button className="rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold shadow-[0_0_20px_rgba(139,92,246,.35)] hover:bg-violet-400">Join now</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-3 py-4 sm:gap-6 sm:px-8 sm:py-6 lg:grid-cols-[210px_minmax(0,1fr)_330px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-6">
            <div><p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Browse</p><div className="flex flex-col gap-1">{['All Sports', 'Live Now', 'Upcoming', 'My Favorites'].map((item, index) => <button key={item} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${index === 0 ? 'bg-violet-500/15 font-medium text-violet-200' : 'text-white/55 hover:bg-white/[0.06] hover:text-white'}`}><span className="flex items-center gap-3">{index === 0 ? <Trophy className="size-4" /> : index === 1 ? <Activity className="size-4" /> : index === 2 ? <Clock3 className="size-4" /> : <Sparkles className="size-4" />}{item}</span>{index === 1 && <span className="rounded-full bg-fuchsia-500/20 px-1.5 text-[10px] text-fuchsia-200">8</span>}</button>)}</div></div>
            <div><p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Top leagues</p><div className="flex flex-col gap-1">{['NFL', 'NBA', 'Premier League', 'UFC'].map((item) => <button key={item} className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/55 hover:bg-white/[0.06] hover:text-white"><span className="grid size-6 place-items-center rounded-md bg-white/[0.07] text-[10px] font-bold text-white/60">{item.slice(0, 2)}</span>{item}</button>)}</div></div>
            <div className="rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/5 p-4"><ShieldCheck className="mb-3 size-5 text-violet-300" /><p className="text-sm font-medium">Play smart</p><p className="mt-1 text-xs leading-5 text-white/45">Set limits and keep sports fun. 21+ only.</p></div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-6 overflow-hidden rounded-2xl border border-violet-300/20 bg-gradient-to-br from-[#211141] via-[#180d2e] to-[#100a20] p-6 shadow-[0_0_60px_rgba(124,58,237,.12)] sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300"><Flame className="size-4" /> Tonight&apos;s spotlight</p><h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Your edge starts here.</h1><p className="mt-3 max-w-lg text-sm leading-6 text-white/55">Live lines, clear markets, and a sharper way to follow the moments that matter.</p><button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#170d2b] hover:bg-violet-100">Explore live odds <ChevronRight className="size-4" /></button></div><div className="relative mx-auto grid size-36 place-items-center rounded-full border border-violet-300/30 bg-violet-400/10 sm:mx-0"><div className="absolute inset-3 rounded-full border border-dashed border-fuchsia-300/30" /><Trophy className="size-12 text-violet-200" /></div></div>
          </div>

          <div className="mb-5 flex items-center gap-2 overflow-x-auto border-b border-white/[0.08] pb-1">{leagues.map((league) => <button key={league} onClick={() => setActiveLeague(league)} className={`whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm transition ${activeLeague === league ? 'border-b-2 border-violet-400 font-medium text-white' : 'text-white/45 hover:text-white'}`}>{league}</button>)}</div>
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Trending markets</h2><p className="mt-1 text-sm text-white/40">Popular picks from today&apos;s slate</p></div><button className="text-sm text-violet-300 hover:text-violet-200">View all <ChevronRight className="ml-1 inline size-4" /></button></div>
          <div className="flex flex-col gap-3">{games.map((game) => <article key={game.home} className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4 transition hover:border-violet-400/30 hover:bg-white/[0.055]"><div className="mb-4 flex items-center justify-between text-xs"><span className="font-medium text-violet-300">{game.league}</span><span className="flex items-center gap-1.5 text-white/40"><Clock3 className="size-3.5" /> {game.time}</span></div><div className="grid grid-cols-[1fr_auto] gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><div><p className="font-medium">{game.home}</p><p className="mt-1 text-xs text-white/35">{game.homeForm}</p></div><div className="hidden text-center text-xs text-white/25 sm:block">VS</div><div><p className="font-medium">{game.away}</p><p className="mt-1 text-xs text-white/35">{game.awayForm}</p></div><div className="col-span-2 flex gap-2 sm:col-span-1"><button className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-violet-200 hover:border-violet-400/50 hover:bg-violet-500/15">{game.homeOdds}</button><button className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-fuchsia-200 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/15">{game.awayOdds}</button></div></div></article>)}</div>

          <div className="mt-8 flex items-center gap-5 border-b border-white/[0.08] pb-3">{['Popular', 'Live', 'Starting soon'].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`text-sm ${activeTab === tab ? 'font-semibold text-white' : 'text-white/40 hover:text-white'}`}>{tab}{tab === 'Live' && <span className="ml-2 inline-block size-1.5 rounded-full bg-fuchsia-400 align-middle shadow-[0_0_8px_#e879f9]" />}</button>)}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">{quickPicks.map((pick) => <button key={pick.label} className={`rounded-xl border border-white/[0.08] bg-gradient-to-br ${pick.color} to-transparent p-4 text-left hover:border-violet-400/30`}><p className="text-sm text-white/65">{pick.label}</p><p className="mt-2 text-lg font-semibold">{pick.odds}</p><p className="mt-1 text-xs text-white/35">Moneyline <ChevronRight className="inline size-3" /></p></button>)}</div>
        </section>

        <aside className={`${slipOpen ? 'block' : 'hidden'} lg:block`}><div className="sticky top-24 rounded-2xl border border-white/[0.1] bg-[#100c1b] shadow-[0_0_35px_rgba(0,0,0,.25)]"><div className="flex items-center justify-between border-b border-white/[0.08] p-4"><div><h2 className="font-semibold">Bet slip</h2><p className="mt-1 text-xs text-white/40">Your selections appear here</p></div><button onClick={() => setSlipOpen(false)} className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close bet slip"><X className="size-4" /></button></div><div className="flex min-h-48 flex-col items-center justify-center p-6 text-center"><div className="mb-4 grid size-12 place-items-center rounded-full bg-violet-500/10 text-violet-300"><Plus className="size-5" /></div><p className="text-sm font-medium">Your bet slip is empty</p><p className="mt-2 max-w-[220px] text-xs leading-5 text-white/40">Tap any odds to add a selection and build your bet.</p></div><div className="border-t border-white/[0.08] p-4"><div className="mb-4 flex items-center justify-between text-sm"><span className="text-white/45">Potential payout</span><span className="font-semibold">—</span></div><button className="w-full rounded-lg bg-white/[0.08] py-3 text-sm font-semibold text-white/35" disabled>Review bet slip</button><p className="mt-3 text-center text-[10px] leading-4 text-white/25">Odds are for demonstration only. 21+.</p></div></div></aside>
      </div>
      {!slipOpen && <button onClick={() => setSlipOpen(true)} className="fixed bottom-5 right-5 flex items-center gap-2 rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold shadow-[0_0_24px_rgba(139,92,246,.5)] lg:hidden"><Plus className="size-4" /> Bet slip</button>}
    </main>
  )
}
