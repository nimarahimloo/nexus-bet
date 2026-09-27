import { Bell, Bookmark, ChevronDown } from "lucide-react";
import type { MatchCardData } from "@shared/sports";
import { formatMatchKickoff, formatMatchOdds } from "@shared/sportsDisplay";

function apiTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? formatMatchKickoff(hour, minute) : time;
}

function isLiveStatus(status: string) {
  const s = status.trim();
  return s === "زنده" || s.toLowerCase() === "live" || /\d+'/.test(s);
}

export function SportsbookMatchCard({
  match,
  onSelect,
  onAdd,
  watched,
  onToggleWatch,
  selectedIds,
}: {
  match: MatchCardData;
  onSelect: (match: MatchCardData, isApi: boolean) => void;
  onAdd: (match: MatchCardData, market: MatchCardData["markets"][number]) => void;
  watched: boolean;
  onToggleWatch: (match: MatchCardData) => void;
  selectedIds?: Set<string>;
}) {
  const live = isLiveStatus(match.status);
  const preview = match.status === "نمونه";
  return (
    <article
      className={`sb-match glass-panel match-clickable ${live ? "is-live" : ""} ${preview ? "is-preview" : ""}`}
      onClick={() => onSelect(match, true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(match, true);
      }}
      role="button"
      tabIndex={0}
    >
      <div className="sb-match-meta">
        <div className="sb-match-meta-start">
          {live ? (
            <span className="sb-live-badge" aria-label="زنده">
              <span className="sb-live-dot" /> زنده
            </span>
          ) : null}
          <span className={`sample-chip ${preview ? "preview-chip" : ""}`}>{preview ? "نمونه" : match.league}</span>
          {!live && !preview ? <span className="sb-kickoff">{apiTime(match.time)}</span> : null}
          {live && match.minute ? <span className="sb-minute">{match.minute}</span> : null}
        </div>
        <button
          type="button"
          className={`watch-toggle ${watched ? "is-watched" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleWatch(match);
          }}
          aria-label={watched ? "حذف از پیگیری" : "افزودن به پیگیری"}
          disabled={preview}
        >
          {watched ? <Bell size={14} /> : <Bookmark size={14} />}
        </button>
      </div>
      <div className="sb-match-body">
        <div className="sb-teams">
          <div className="sb-team">
            <span className="sport-logo">{match.homeLogo ? <img src={match.homeLogo} alt="" /> : "⚽"}</span>
            <b>{match.home}</b>
          </div>
          <div className="sb-team">
            <span className="sport-logo">{match.awayLogo ? <img src={match.awayLogo} alt="" /> : "⚽"}</span>
            <b>{match.away}</b>
          </div>
        </div>
        <div className="sb-score-col" aria-hidden={!match.score}>
          {match.score ? (
            match.score.split(/[-:]/).map((part, i) => <strong key={i}>{part.trim()}</strong>)
          ) : (
            <span className="sb-vs">VS</span>
          )}
        </div>
      </div>
      <div className="sb-odds-row" role="group" aria-label="بازارهای اصلی">
        {match.markets.length ? (
          match.markets.slice(0, 3).map((market) => {
            const sid = `${match.id}-${market.label}`;
            const selected = selectedIds?.has(sid);
            return (
              <button
                key={market.name}
                type="button"
                className={`sb-odds-btn ${selected ? "is-selected" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onAdd(match, market);
                }}
                aria-pressed={selected}
                aria-label={`${market.label} ضریب ${formatMatchOdds(market.odds)}`}
              >
                <span className="sb-odds-label">{market.label}</span>
                <span className="sb-odds-value">{formatMatchOdds(market.odds)}</span>
              </button>
            );
          })
        ) : (
          <small className="sb-odds-empty">odds هنوز موجود نیست</small>
        )}
      </div>
      <div className="match-card-hint">
        جزئیات مسابقه <ChevronDown size={13} />
      </div>
    </article>
  );
}
