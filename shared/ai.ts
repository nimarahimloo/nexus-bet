export type AiCandidate = {
  eventId: string;
  league: string;
  match: string;
  sport: string;
  marketLabel: string;
  marketName: string;
  odds: number;
  status: string;
  popularity: number;
};

export type AiPick = AiCandidate & {
  risk: "کم" | "متوسط" | "بالا";
  confidence: number;
  rationale: string;
  tags: string[];
};
