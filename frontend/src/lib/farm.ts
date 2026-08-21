/** Money Farm — pure economy engine. No React, no network: every function
 *  takes state and returns new state, so the whole game is testable and the
 *  UI is just buttons calling these. One real week = one farm month. */
import { brusselsDay } from "./format";
import { courseMaxLevel, locateLevel, tiersCompleted, type CourseId, type CourseQuestion } from "./courseBank";
export type { CourseId, CourseQuestion };

export const LIVING_COST = 800;
export const XP_TO_EUR = 10;
export const START_CASH = 2000;
export const LOAN_RATE_YEAR = 0.1;
export const LOAN_TERM_MONTHS = 24;
export const MAX_LOAN = 50_000;
export const INSPECT_COST = 50;

export type AssetKind = "savings" | "land" | "room" | "shop" | "coinvest" | "dubai" | "car" | "phone";

export interface AssetDef {
  kind: AssetKind;
  name: string;
  emoji: string;
  price: number;
  income: number; // € per month, base
  upkeep: number; // € per month
  appreciation: number; // fraction per month
  requiresTerm?: string;
  liability?: boolean;
  desc: string;
  lesson: string;
}

export const CATALOG: AssetDef[] = [
  { kind: "savings", name: "Savings account", emoji: "🏦", price: 500, income: 1, upkeep: 0, appreciation: 0, desc: "€500 parked at 2% a year.", lesson: "Safe, and quietly losing to inflation." },
  { kind: "land", name: "Estate plot, Lekki", emoji: "🟩", price: 4000, income: 0, upkeep: 0, appreciation: 0.01, desc: "Titled plot in a private estate. No income, steady growth.", lesson: "Land banking: patience is the product." },
  { kind: "room", name: "Rental room, Lagos", emoji: "🏠", price: 6000, income: 60, upkeep: 5, appreciation: 0.004, desc: "€60 rent a month, small upkeep.", lesson: "Cash flow. The thing that eventually replaces your salary." },
  { kind: "shop", name: "Small business", emoji: "🛍️", price: 3000, income: 60, upkeep: 10, appreciation: 0, desc: "Variable income. Sales skill raises it.", lesson: "Businesses pay the skilled, not the hopeful." },
  { kind: "coinvest", name: "Co-investment share", emoji: "🤝", price: 500, income: 5, upkeep: 0, appreciation: 0.008, requiresTerm: "co-investment", desc: "One slice of a €50k estate deal.", lesson: "Small money, big deal, together." },
  { kind: "dubai", name: "Dubai studio (off-plan)", emoji: "🏙️", price: 120_000, income: 900, upkeep: 100, appreciation: 0.005, requiresTerm: "off-plan", desc: "€900 rent, €100 service charge. You will need leverage.", lesson: "The deal Grace's clients make. Needs a bank." },
  { kind: "car", name: "Nice car", emoji: "🚗", price: 8000, income: 0, upkeep: 100, appreciation: -0.02, liability: true, desc: "Looks great. Costs €100 a month and melts in value.", lesson: "A liability dressed as success." },
  { kind: "phone", name: "Latest phone", emoji: "📱", price: 1200, income: 0, upkeep: 0, appreciation: -0.05, liability: true, desc: "Same calls, shinier.", lesson: "Lifestyle inflation in your pocket." },
];

export const ASSET_BY_KIND = new Map(CATALOG.map((a) => [a.kind, a]));

export interface CourseDef {
  id: CourseId;
  name: string;
  emoji: string;
  effect: string;
}
/** Prices and level counts live in courseBank.ts (per tier). */
export const COURSES: CourseDef[] = [
  { id: "sales", name: "Sales", emoji: "🗣️", effect: "+10% business income per level" },
  { id: "career", name: "Career", emoji: "🎓", effect: "+5% salary minting per level" },
  { id: "realestate", name: "Real Estate", emoji: "🏠", effect: "+3% rental income per level" },
  { id: "budgeting", name: "Money Management", emoji: "🧮", effect: "−€15 monthly living costs per level" },
  { id: "law", name: "Law & Due Diligence", emoji: "📜", effect: "each tier completed reveals more on every deal: papers → seller → site" },
  { id: "negotiation", name: "Negotiation", emoji: "🤝", effect: "−2% deal prices per level" },
];
export type Skills = Record<CourseId, number>;
export const EMPTY_SKILLS: Skills = { sales: 0, career: 0, realestate: 0, budgeting: 0, law: 0, negotiation: 0 };
export interface PendingExam {
  course: CourseId;
  level: number;
  attempts: number;
}

export interface OwnedAsset {
  id: string;
  kind: AssetKind;
  name: string;
  boughtMonth: number;
  paid: number;
  value: number;
  papers: "verified" | "unverified" | "bad" | "n/a";
  flood: boolean;
}
export interface Loan {
  id: string;
  principal: number;
  balance: number;
  monthly: number;
  takenMonth: number;
}
export interface LogEntry {
  month: number;
  text: string;
  amount?: number;
}
export interface MonthReport {
  month: number;
  rent: number;
  upkeep: number;
  instalments: number;
  living: number;
  eventNet: number;
  net: number;
  netWorth: number;
  notes: string[];
}
export interface EventChoice {
  label: string;
  cash?: number;
  salaryLevel?: number;
  salesLevel?: number;
  moodDelta?: number;
  loseKind?: AssetKind;
  result: string;
}
export interface FarmEvent {
  id: string;
  emoji: string;
  title: string;
  text: string;
  choices: EventChoice[];
}
export interface Deal {
  id: string;
  kind: "land" | "room" | "coinvest";
  emoji: string;
  title: string;
  pitch: string;
  price: number;
  income: number;
  appreciation: number;
  hidden: { papers: "ok" | "bad"; scam: boolean; flood: boolean };
  revealed: { papers?: boolean; seller?: boolean; site?: boolean };
}
export interface PendingMarket {
  month: number;
  sunday: string;
  step: number;
  events: FarmEvent[];
  eventResult: (string | null)[];
  eventNet: number;
  deals: Deal[];
  dealResult: ("bought" | "passed" | "scammed" | null)[];
  quizGrade: string | null;
}
export interface FarmState {
  version: 1;
  startedOn: string;
  cash: number;
  month: number;
  lastClosedSunday: string | null;
  mintedThrough: string | null;
  totalMinted: number;
  assets: OwnedAsset[];
  loans: Loan[];
  skills: Skills;
  pendingExam: PendingExam | null;
  prepaid: Partial<Record<CourseId, number>>; // exam credits already paid for
  examVersion?: number;
  creditScore: number;
  marketMood: number;
  history: MonthReport[];
  log: LogEntry[];
  pending: PendingMarket | null;
  freedomOn: string | null;
  badges: string[];
  pops?: Record<string, string>; // day -> result text, once resolved
}

// ---------- helpers ----------

export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
export function nextSundayAfter(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  const add = (7 - d.getUTCDay()) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
const round = (n: number) => Math.round(n);
let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

export function newFarm(today = brusselsDay()): FarmState {
  return {
    version: 1,
    startedOn: today,
    cash: START_CASH,
    month: 1,
    lastClosedSunday: null,
    mintedThrough: shiftDay(today, -1),
    totalMinted: 0,
    assets: [],
    loans: [],
    skills: { ...EMPTY_SKILLS },
    pendingExam: null,
    prepaid: {},
    examVersion: 2,
    creditScore: 70,
    marketMood: 1,
    history: [],
    log: [{ month: 1, text: "You opened the farm with €2,000 of capital. Learning mints your salary." }],
    pending: null,
    freedomOn: null,
    badges: [],
  };
}

export function dueSunday(state: FarmState): string {
  return state.lastClosedSunday ? shiftDay(state.lastClosedSunday, 7) : nextSundayAfter(state.startedOn);
}
export function marketIsDue(state: FarmState, today = brusselsDay()): boolean {
  return dueSunday(state) <= today;
}

export function assetIncome(asset: OwnedAsset, state: FarmState): number {
  const def = ASSET_BY_KIND.get(asset.kind)!;
  switch (asset.kind) {
    case "room":
    case "dubai":
    case "coinvest":
      return def.income * state.marketMood * (1 + 0.03 * state.skills.realestate);
    case "shop":
      return def.income * (1 + 0.1 * state.skills.sales);
    case "savings":
      return asset.value * 0.0017;
    default:
      return 0;
  }
}
export function assetUpkeep(asset: OwnedAsset): number {
  return ASSET_BY_KIND.get(asset.kind)!.upkeep;
}
export function passiveIncome(state: FarmState): number {
  const income = state.assets.reduce((s, a) => s + assetIncome(a, state), 0);
  const upkeep = state.assets.reduce((s, a) => s + assetUpkeep(a), 0);
  const instalments = state.loans.reduce((s, l) => s + l.monthly, 0);
  return round(income - upkeep - instalments);
}
/** Money Management lowers the monthly living cost. */
export function livingCost(state: FarmState): number {
  return LIVING_COST - 15 * state.skills.budgeting;
}
/** Old saves predate some courses / the exam flow. */
export function normalizeFarm(raw: FarmState): FarmState {
  const legacy = raw.skills as unknown as { salary?: number };
  const { salary: _legacySalary, ...rawSkills } = raw.skills as Skills & { salary?: number };
  void _legacySalary;
  const skills: Skills = { ...EMPTY_SKILLS, ...rawSkills, career: raw.skills.career ?? legacy.salary ?? 0 };
  const prepaid: Partial<Record<CourseId, number>> = { ...(raw.prepaid ?? {}) };
  let log = raw.log;
  // Levels bought under the old one-tap system become prepaid exams:
  // tuition stays paid, the bar resets, each level must now be passed.
  if ((raw.examVersion ?? 1) < 2) {
    let converted = 0;
    for (const id of Object.keys(skills) as CourseId[]) {
      if (skills[id] > 0) {
        prepaid[id] = (prepaid[id] ?? 0) + skills[id];
        converted += skills[id];
        skills[id] = 0;
      }
    }
    if (converted) {
      log = [{ month: raw.month, text: `${converted} course level(s) converted to prepaid exams — pass them to earn the levels back` }, ...raw.log].slice(0, 40);
    }
  }
  return { ...raw, skills, prepaid, examVersion: 2, pendingExam: raw.pendingExam ?? null, log };
}
export function netWorth(state: FarmState): number {
  return round(
    state.cash + state.assets.reduce((s, a) => s + a.value, 0) - state.loans.reduce((s, l) => s + l.balance, 0)
  );
}
export function salaryMultiplier(state: FarmState): number {
  return 1 + 0.05 * state.skills.career;
}

// ---------- daily minting ----------

export function mintSalary(
  state: FarmState,
  xpDays: { happened_on: string; points: number }[],
  today = brusselsDay()
): { state: FarmState; minted: number } {
  const yesterday = shiftDay(today, -1);
  const from = state.mintedThrough ?? shiftDay(state.startedOn, -1);
  const points = xpDays
    .filter((d) => d.happened_on > from && d.happened_on <= yesterday)
    .reduce((s, d) => s + d.points, 0);
  const minted = round(points * XP_TO_EUR * salaryMultiplier(state));
  if (minted === 0 && from >= yesterday) return { state, minted: 0 };
  const next: FarmState = {
    ...state,
    cash: state.cash + minted,
    totalMinted: state.totalMinted + minted,
    mintedThrough: yesterday,
    log: minted
      ? [{ month: state.month, text: `Salary minted from ${points} XP of learning`, amount: minted }, ...state.log].slice(0, 40)
      : state.log,
  };
  return { state: next, minted };
}

// ---------- buying ----------

export function canBuy(def: AssetDef, state: FarmState, learned: Set<string>): { ok: boolean; reason?: string } {
  if (def.requiresTerm && !learned.has(def.requiresTerm)) {
    return { ok: false, reason: `Learn the Wealth Word “${def.requiresTerm.replace(/-/g, " ")}” first` };
  }
  if (state.cash < def.price) return { ok: false, reason: `Need €${def.price.toLocaleString()} cash` };
  return { ok: true };
}

export function buyAsset(state: FarmState, def: AssetDef, learned: Set<string> = new Set()): FarmState {
  if (!canBuy(def, state, learned).ok) return state;
  const asset: OwnedAsset = {
    id: newId(def.kind),
    kind: def.kind,
    name: def.name,
    boughtMonth: state.month,
    paid: def.price,
    value: def.price,
    papers: def.kind === "land" || def.kind === "room" ? "verified" : "n/a",
    flood: false,
  };
  const badges = [...state.badges];
  if (!def.liability && !badges.includes("first_asset")) badges.push("first_asset");
  return {
    ...state,
    cash: state.cash - def.price,
    assets: [...state.assets, asset],
    badges,
    log: [{ month: state.month, text: `Bought ${def.name}`, amount: -def.price }, ...state.log].slice(0, 40),
  };
}

export function sellAsset(state: FarmState, assetId: string): FarmState {
  const asset = state.assets.find((a) => a.id === assetId);
  if (!asset) return state;
  const proceeds = round(asset.value * 0.95); // 5% selling costs
  return {
    ...state,
    cash: state.cash + proceeds,
    assets: state.assets.filter((a) => a.id !== assetId),
    log: [{ month: state.month, text: `Sold ${asset.name} (5% fees)`, amount: proceeds }, ...state.log].slice(0, 40),
  };
}

export function enrolCourse(state: FarmState, course: CourseDef): FarmState {
  if (state.pendingExam) return state;
  const level = state.skills[course.id] + 1;
  const credits = state.prepaid[course.id] ?? 0;
  if (level > courseMaxLevel(course.id)) return state;
  const price = locateLevel(course.id, state.skills[course.id]).tier.price;
  if (credits === 0 && state.cash < price) return state;
  return {
    ...state,
    cash: credits ? state.cash : state.cash - price,
    prepaid: credits ? { ...state.prepaid, [course.id]: credits - 1 } : state.prepaid,
    pendingExam: { course: course.id, level, attempts: 0 },
    log: [
      credits
        ? { month: state.month, text: `Exam opened: ${course.name} level ${level} (prepaid)` }
        : { month: state.month, text: `Enrolled: ${course.name} level ${level} — pass the exam to level up`, amount: -price },
      ...state.log,
    ].slice(0, 40),
  };
}

/** The question for the exam in progress; wrong answers rotate variants. */
export function currentExamQuestion(state: FarmState): CourseQuestion | null {
  const p = state.pendingExam;
  if (!p) return null;
  const loc = locateLevel(p.course, p.level - 1);
  const variants = loc.tier.levels[Math.min(loc.levelInTier, loc.tier.levels.length - 1)];
  return variants[p.attempts % variants.length];
}

export function answerExam(state: FarmState, correct: boolean): FarmState {
  const p = state.pendingExam;
  if (!p) return state;
  if (!correct) return { ...state, pendingExam: { ...p, attempts: p.attempts + 1 } };
  const course = COURSES.find((c) => c.id === p.course)!;
  return {
    ...state,
    skills: { ...state.skills, [p.course]: p.level },
    pendingExam: null,
    log: [{ month: state.month, text: `${course.name} level ${p.level} passed ✓ (${p.attempts + 1} attempt${p.attempts ? "s" : ""})` }, ...state.log].slice(0, 40),
  };
}

export function maxLoan(state: FarmState): number {
  const monthlyIn = state.assets.reduce((s, a) => s + assetIncome(a, state), 0) + (state.totalMinted / Math.max(1, state.month)) * 0.25;
  return Math.min(MAX_LOAN, round(Math.max(0, monthlyIn * 12 * (state.creditScore / 70))));
}
export function loanInstalment(amount: number): number {
  const r = LOAN_RATE_YEAR / 12;
  return round((amount * r) / (1 - Math.pow(1 + r, -LOAN_TERM_MONTHS)));
}
export function takeLoan(state: FarmState, amount: number): FarmState {
  if (amount <= 0 || amount > maxLoan(state)) return state;
  const loan: Loan = { id: newId("loan"), principal: amount, balance: amount, monthly: loanInstalment(amount), takenMonth: state.month };
  return {
    ...state,
    cash: state.cash + amount,
    loans: [...state.loans, loan],
    log: [{ month: state.month, text: `Took a €${amount.toLocaleString()} loan at 10% — €${loan.monthly}/month for 24 months`, amount }, ...state.log].slice(0, 40),
  };
}

// ---------- events ----------

interface EventTemplate {
  id: string;
  emoji: string;
  title: string;
  text: string;
  choices: EventChoice[];
  weight: number;
  needs?: (s: FarmState) => boolean;
}
const EVENTS: EventTemplate[] = [
  { id: "aso-ebi", emoji: "👗", title: "Aso-ebi season", text: "Your cousin's wedding. The aso-ebi is €80 and the family WhatsApp is watching.", weight: 3, choices: [
    { label: "Pay €80 — family is family", cash: -80, result: "You paid. The photos were lovely. €80 gone." },
    { label: "Attend in something you own", cash: 0, result: "You wore your own outfit. Two aunties noticed. The money stayed in the farm." },
  ] },
  { id: "send-money", emoji: "📞", title: "\"Send me something\"", text: "An uncle calls. He needs €150 for a 'small problem'. It is the third call this year.", weight: 3, choices: [
    { label: "Send €150", cash: -150, result: "Sent. Goodwill +1, capital -150." },
    { label: "Send €50 and a kind word", cash: -50, result: "You sent what was budgeted. Black tax, planned, is not a tax." },
    { label: "Decline gently", cash: 0, result: "You said not this month. The sky did not fall." },
  ] },
  { id: "nepa", emoji: "🔌", title: "NEPA bill and generator fuel", text: "Light has been unstable. Your Lagos rental needs €40 of fuel and bills this month.", weight: 3, needs: (s) => s.assets.some((a) => a.kind === "room"), choices: [
    { label: "Pay €40", cash: -40, result: "Paid. Running costs are part of the yield, always." },
  ] },
  { id: "laptop", emoji: "💻", title: "Laptop died", text: "Mid-application, the screen went black. A replacement is €700. No laptop, no job hunt.", weight: 2, choices: [
    { label: "Buy the laptop — €700", cash: -700, result: "Essential tools are not lifestyle. Emergency fund, you were right." },
  ] },
  { id: "job-offer", emoji: "🎉", title: "Job offer!", text: "A Belgian data team wants you. Salary up. Your learning just paid off in the real world.", weight: 1, choices: [
    { label: "Accept 🎓", salaryLevel: 1, result: "Your salary multiplier rose permanently. Invest the raise, not the lifestyle." },
  ] },
  { id: "visa-fee", emoji: "🛂", title: "Permit renewal", text: "Immigration fees and documents: €300, no negotiation.", weight: 2, choices: [
    { label: "Pay €300", cash: -300, result: "Paid. Boring, mandatory, budgeted next time." },
  ] },
  { id: "detty-december", emoji: "🎄", title: "Detty December", text: "Lagos is calling: flights, outfits, events. €600 for the memories.", weight: 2, choices: [
    { label: "Go all out — €600", cash: -600, result: "Incredible month. The farm paused for it." },
    { label: "Go small — €200", cash: -200, result: "You went, you enjoyed, you kept €400 working." },
    { label: "Skip it this year", cash: 0, result: "Delayed gratification. Next December you go as a landlord." },
  ] },
  { id: "scam-call", emoji: "📲", title: "\"50% monthly returns, guaranteed\"", text: "A polished stranger offers a 'private investment' paying 50% a month. Minimum €1,000. Limited slots.", weight: 3, choices: [
    { label: "Invest €1,000", cash: -1000, result: "Gone. No product, no papers, no returns. Why smart people keep getting scammed: greed plus urgency." },
    { label: "Ask for the paperwork", cash: 0, result: "They vanished. Due diligence costs nothing and saves everything." },
  ] },
  { id: "tenant-arrears", emoji: "😬", title: "Tenant in arrears", text: "Your tenant is two months behind. Stories, apologies, no rent.", weight: 2, needs: (s) => s.assets.some((a) => a.kind === "room"), choices: [
    { label: "Give one more month", cash: -60, result: "Another month without rent. Kindness, with a deadline next time." },
    { label: "Enforce the contract", cash: -20, result: "Legal letter, €20. Rent resumed. Landlording is a business." },
  ] },
  { id: "dubai-boom", emoji: "📈", title: "Dubai market boom", text: "Prices in Dubai jumped. Everyone is talking about it.", weight: 1, needs: (s) => s.assets.some((a) => a.kind === "dubai"), choices: [
    { label: "Nice 😎", moodDelta: 0.05, result: "Your studio is worth more and rents are rising. Leverage working for you." },
  ] },
  { id: "lagos-flood", emoji: "🌧️", title: "Lagos floods", text: "Heavy rains. Low-lying plots are under water; buyers are nervous.", weight: 1, needs: (s) => s.assets.some((a) => a.kind === "land" || a.kind === "room"), choices: [
    { label: "Check your properties", result: "Plots on good ground held value. Flood-prone ones dipped. Site visits matter." },
  ] },
  { id: "rent-increase", emoji: "💶", title: "Rent review", text: "Market rents in your area rose. You can raise rent at renewal.", weight: 2, needs: (s) => s.assets.some((a) => a.kind === "room" || a.kind === "dubai"), choices: [
    { label: "Raise rent 5%", moodDelta: 0.05, result: "Rents up. Tenants grumbled, stayed." },
    { label: "Keep tenants happy", result: "No change. Loyalty has a price too." },
  ] },
  { id: "mentor-call", emoji: "🌳", title: "Grace goes live", text: "A surprise live session: sales secrets. You took notes.", weight: 2, choices: [
    { label: "Apply it", salesLevel: 1, result: "Sales skill +1. Free lessons are still lessons." },
  ] },
  { id: "owambe", emoji: "🥂", title: "Owambe weekend", text: "Three parties, one weekend. Outfits, gifts, transport: €120.", weight: 2, choices: [
    { label: "Do all three — €120", cash: -120, result: "Legendary weekend. €120 lighter." },
    { label: "Pick one — €40", cash: -40, result: "One party, full joy, €80 still invested." },
  ] },
  { id: "summit-ticket", emoji: "🎟️", title: "New Money Summit", text: "Grace's summit is in town. Standard ticket €60.", weight: 1, choices: [
    { label: "Buy a ticket — €60", cash: -60, salesLevel: 1, result: "You went, you networked, sales skill +1. Rooms change results." },
    { label: "Watch the recap", result: "You saved €60 and caught the highlights." },
  ] },
];

function drawEvents(state: FarmState, rnd: () => number, count: number): FarmEvent[] {
  const pool = EVENTS.filter((e) => !e.needs || e.needs(state));
  const out: FarmEvent[] = [];
  const used = new Set<string>();
  const total = pool.reduce((s, e) => s + e.weight, 0);
  for (let i = 0; i < count && used.size < pool.length; i++) {
    let r = rnd() * total;
    let pick = pool[pool.length - 1];
    for (const e of pool) {
      r -= e.weight;
      if (r <= 0) {
        pick = e;
        break;
      }
    }
    if (used.has(pick.id)) {
      i--;
      continue;
    }
    used.add(pick.id);
    out.push({ id: pick.id, emoji: pick.emoji, title: pick.title, text: pick.text, choices: pick.choices });
  }
  return out;
}

// ---------- deals ----------

interface DealTemplate {
  kind: Deal["kind"];
  emoji: string;
  title: string;
  pitch: string;
  price: [number, number];
  income: [number, number];
  appreciation: number;
  badPapers: number;
  scam: number;
  flood: number;
  requiresTerm?: string;
}
const DEALS: DealTemplate[] = [
  { kind: "land", emoji: "🌴", title: "Community plot, Ibeju-Lekki", pitch: "\"Omo-onile price! Road is coming. Buy now before the airport.\"", price: [1500, 2600], income: [0, 0], appreciation: 0.015, badPapers: 0.45, scam: 0.15, flood: 0.3 },
  { kind: "land", emoji: "🏗️", title: "Estate plot, Epe", pitch: "Developer-backed estate, allocation within 6 months, C of O in progress.", price: [2800, 3800], income: [0, 0], appreciation: 0.012, badPapers: 0.15, scam: 0.05, flood: 0.15 },
  { kind: "room", emoji: "🏘️", title: "Self-contain room, Yaba", pitch: "Student area, never empty. Tenant already inside, paying.", price: [5000, 7000], income: [55, 75], appreciation: 0.004, badPapers: 0.25, scam: 0.1, flood: 0.1 },
  { kind: "room", emoji: "🏚️", title: "\"Distress sale\" room, Ajah", pitch: "Owner travelling, must sell this week. Cash only. No agent.", price: [3000, 4200], income: [50, 65], appreciation: 0.004, badPapers: 0.5, scam: 0.4, flood: 0.35 },
  { kind: "coinvest", emoji: "🤝", title: "Co-investment pool, Sangotedo", pitch: "20 investors, one titled estate block. Quarterly reports, exit at year 3.", price: [500, 800], income: [5, 9], appreciation: 0.009, badPapers: 0.1, scam: 0.05, flood: 0.1, requiresTerm: "co-investment" },
  { kind: "land", emoji: "🛣️", title: "Roadside plot, Lagos-Ibadan expressway", pitch: "Commercial frontage. Survey available on request.", price: [3500, 5000], income: [0, 0], appreciation: 0.013, badPapers: 0.35, scam: 0.15, flood: 0.1 },
];

function drawDeals(state: FarmState, rnd: () => number, learned: Set<string>, count: number): Deal[] {
  const pool = DEALS.filter((d) => !d.requiresTerm || learned.has(d.requiresTerm));
  const out: Deal[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const t = pool[Math.floor(rnd() * pool.length)];
    const base = t.price[0] + rnd() * (t.price[1] - t.price[0]);
    const price = round((base * (1 - 0.02 * state.skills.negotiation)) / 50) * 50;
    const income = round(t.income[0] + rnd() * (t.income[1] - t.income[0]));
    out.push({
      id: `${t.title}-${state.month}-${i}`,
      kind: t.kind,
      emoji: t.emoji,
      title: t.title,
      pitch: t.pitch,
      price,
      income,
      appreciation: t.appreciation,
      hidden: { papers: rnd() < t.badPapers ? "bad" : "ok", scam: rnd() < t.scam, flood: rnd() < t.flood },
      revealed: {
        papers: tiersCompleted("law", state.skills.law) >= 1 ? true : undefined,
        seller: tiersCompleted("law", state.skills.law) >= 2 ? true : undefined,
        site: tiersCompleted("law", state.skills.law) >= 3 ? true : undefined,
      },
    });
  }
  return out;
}

export const MOOD_BY_GRADE: Record<string, number> = { A: 1.1, B: 1.05, C: 1.0, D: 0.97, F: 0.95 };

// ---------- market day ----------

export function prepareMarket(state: FarmState, learned: Set<string>, quizGrade: string | null, withDeals = true): FarmState {
  if (state.pending) return state;
  const sunday = dueSunday(state);
  const rnd = seededRandom(`${state.startedOn}:${sunday}`);
  const events = drawEvents(state, rnd, 2);
  const deals = withDeals ? drawDeals(state, rnd, learned, 3) : [];
  return {
    ...state,
    pending: {
      month: state.month,
      sunday,
      step: 0,
      events,
      eventResult: events.map(() => null),
      eventNet: 0,
      deals,
      dealResult: deals.map(() => null),
      quizGrade,
    },
  };
}

export function resolveEvent(state: FarmState, eventIdx: number, choiceIdx: number): FarmState {
  const p = state.pending;
  if (!p || p.eventResult[eventIdx]) return state;
  const choice = p.events[eventIdx].choices[choiceIdx];
  let next: FarmState = { ...state, cash: state.cash + (choice.cash ?? 0) };
  if (choice.salaryLevel) next.skills = { ...next.skills, career: Math.min(courseMaxLevel("career"), next.skills.career + choice.salaryLevel) };
  if (choice.salesLevel) next.skills = { ...next.skills, sales: Math.min(courseMaxLevel("sales"), next.skills.sales + choice.salesLevel) };
  if (choice.moodDelta) next.marketMood = Math.min(1.3, next.marketMood + choice.moodDelta);
  const eventResult = [...p.eventResult];
  eventResult[eventIdx] = choice.result;
  next = {
    ...next,
    pending: { ...p, eventResult, eventNet: p.eventNet + (choice.cash ?? 0) },
    log: [{ month: state.month, text: `${p.events[eventIdx].title}: ${choice.label}`, amount: choice.cash }, ...state.log].slice(0, 40),
  };
  return next;
}

export function inspectDeal(state: FarmState, dealIdx: number, what: "papers" | "seller" | "site"): FarmState {
  const p = state.pending;
  if (!p || state.cash < INSPECT_COST || p.deals[dealIdx].revealed[what]) return state;
  const deals = p.deals.map((d, i) => (i === dealIdx ? { ...d, revealed: { ...d.revealed, [what]: true } } : d));
  return { ...state, cash: state.cash - INSPECT_COST, pending: { ...p, deals } };
}

export function decideDeal(state: FarmState, dealIdx: number, buy: boolean): FarmState {
  const p = state.pending;
  if (!p || p.dealResult[dealIdx]) return state;
  const deal = p.deals[dealIdx];
  const dealResult = [...p.dealResult];
  if (!buy) {
    dealResult[dealIdx] = "passed";
    return { ...state, pending: { ...p, dealResult } };
  }
  if (state.cash < deal.price) return state;
  if (deal.hidden.scam) {
    dealResult[dealIdx] = "scammed";
    return {
      ...state,
      cash: state.cash - deal.price,
      creditScore: Math.max(0, state.creditScore - 5),
      pending: { ...p, dealResult },
      log: [{ month: state.month, text: `SCAM: "${deal.title}" — the seller never owned it. Money gone.`, amount: -deal.price }, ...state.log].slice(0, 40),
    };
  }
  const asset: OwnedAsset = {
    id: newId(deal.kind),
    kind: deal.kind,
    name: deal.title,
    boughtMonth: state.month,
    paid: deal.price,
    value: deal.price,
    papers: deal.hidden.papers === "bad" ? "bad" : deal.revealed.papers ? "verified" : "unverified",
    flood: deal.hidden.flood,
  };
  dealResult[dealIdx] = "bought";
  const badges = [...state.badges];
  if (!badges.includes("first_asset")) badges.push("first_asset");
  return {
    ...state,
    cash: state.cash - deal.price,
    assets: [...state.assets, asset],
    badges,
    pending: { ...p, dealResult },
    log: [{ month: state.month, text: `Bought ${deal.title}`, amount: -deal.price }, ...state.log].slice(0, 40),
  };
}

/** Close the month: income, costs, instalments, appreciation, title risks. */
export function finalizeMarket(state: FarmState, today = brusselsDay()): FarmState {
  const p = state.pending;
  if (!p) return state;
  const rnd = seededRandom(`${state.startedOn}:${p.sunday}:close`);
  const mood = p.quizGrade ? MOOD_BY_GRADE[p.quizGrade] ?? 1 : state.marketMood;
  const working: FarmState = { ...state, marketMood: mood };
  const notes: string[] = [];

  let rent = 0;
  let upkeep = 0;
  const assets: OwnedAsset[] = [];
  for (const a of working.assets) {
    let inc = assetIncome(a, working);
    if (a.kind === "shop") inc = round(inc * (0.5 + rnd()));
    rent += inc;
    upkeep += assetUpkeep(a);
    let value = round(a.value * (1 + ASSET_BY_KIND.get(a.kind)!.appreciation));
    if (a.flood && rnd() < 0.15) {
      value = round(value * 0.92);
      notes.push(`${a.name}: flood damage, value -8%`);
    }
    if (a.papers === "bad" && rnd() < 0.2) {
      if (rnd() < 0.5) {
        notes.push(`${a.name}: omo-onile came demanding fees — €300 paid to keep the peace`);
        working.cash -= 300;
      } else {
        notes.push(`${a.name}: DEMOLISHED — government acquisition. No papers, no compensation.`);
        continue;
      }
    }
    if (a.papers === "unverified" && rnd() < 0.06) {
      notes.push(`${a.name}: a dispute surfaced — pay €200 for a lawyer to regularise the title`);
      working.cash -= 200;
      assets.push({ ...a, value, papers: "verified" });
      continue;
    }
    assets.push({ ...a, value });
  }

  let instalments = 0;
  const loans: Loan[] = [];
  let credit = working.creditScore;
  for (const l of working.loans) {
    const pay = Math.min(l.monthly, l.balance + round(l.balance * (LOAN_RATE_YEAR / 12)));
    instalments += pay;
    const interest = round(l.balance * (LOAN_RATE_YEAR / 12));
    const balance = Math.max(0, l.balance + interest - pay);
    if (balance > 0) loans.push({ ...l, balance });
    else notes.push("A loan was fully repaid 🎉");
  }
  rent = round(rent);
  const living = livingCost(working);
  const net = round(rent - upkeep - instalments - living);
  let cash = working.cash + net;
  if (cash < 0) {
    credit = Math.max(0, credit - 10);
    notes.push("Cash went negative: overdraft at painful rates. Credit score -10.");
  } else if (instalments > 0) {
    credit = Math.min(100, credit + 2);
  }

  const closed: FarmState = {
    ...working,
    cash: round(cash),
    assets,
    loans,
    creditScore: credit,
    month: working.month + 1,
    lastClosedSunday: p.sunday,
    pending: null,
  };
  const report: MonthReport = {
    month: p.month,
    rent,
    upkeep,
    instalments,
    living,
    eventNet: p.eventNet,
    net,
    netWorth: netWorth(closed),
    notes,
  };
  const passive = passiveIncome(closed);
  const badges = [...closed.badges];
  let freedomOn = closed.freedomOn;
  if (passive >= livingCost(closed) && !freedomOn) {
    freedomOn = today;
    badges.push("financially_free");
    notes.push("🗽 FINANCIAL FREEDOM: passive income now covers your living costs.");
  }
  return {
    ...closed,
    freedomOn,
    badges,
    history: [report, ...closed.history].slice(0, 60),
    log: [{ month: p.month, text: `Month ${p.month} closed: rent €${rent}, costs €${upkeep + instalments + living}`, amount: net }, ...closed.log].slice(0, 40),
  };
}

// ---------- daily pops: tiny moments, at most one per day, ~40% of days ----------

export interface DailyPop {
  id: string;
  emoji: string;
  text: string;
  choices: { label: string; cash: number; result: string }[];
}
const POPS: DailyPop[] = [
  { id: "cab", emoji: "🚕", text: "Colleague suggests splitting a cab home instead of the bus.", choices: [{ label: "Cab — €15", cash: -15, result: "Comfortable. €15 gone." }, { label: "Bus", cash: 0, result: "Forty minutes of podcast. Free." }] },
  { id: "found", emoji: "💶", text: "You find €20 in an old jacket.", choices: [{ label: "Into the farm", cash: 20, result: "Found money invests best: it was never in your budget." }] },
  { id: "coffee", emoji: "☕", text: "Daily coffee out is €4. Make it at home this week?", choices: [{ label: "Home brew", cash: 12, result: "€12 kept this week. Tiny, repeated, real." }, { label: "Café", cash: -12, result: "Good coffee. €12 lighter." }] },
  { id: "data", emoji: "📶", text: "Your phone plan auto-renews at €30. A €18 plan does the same.", choices: [{ label: "Switch", cash: 12, result: "€12 a month, forever. Subscriptions are silent landlords." }, { label: "Leave it", cash: 0, result: "Convenience has a price." }] },
  { id: "aunt", emoji: "📱", text: "An auntie sends a 'small gift' of €50 for your graduation.", choices: [{ label: "Thank her, invest it", cash: 50, result: "Gifts planted grow into gifts given." }] },
  { id: "delivery", emoji: "🍔", text: "Tired. Delivery is €22; there are ingredients in the fridge.", choices: [{ label: "Cook", cash: 0, result: "Twenty minutes, €22 saved, better sleep." }, { label: "Order", cash: -22, result: "Hot food, €22 gone." }] },
  { id: "refund", emoji: "🧾", text: "A duplicate charge from last month gets refunded.", choices: [{ label: "Nice", cash: 35, result: "€35 back. Checking statements pays." }] },
  { id: "sale", emoji: "🛍️", text: "'70% off' on shoes you did not plan to buy.", choices: [{ label: "Buy — €45", cash: -45, result: "A discount on something you did not need is not a saving." }, { label: "Walk past", cash: 0, result: "The best discount is 100%." }] },
  { id: "tutoring", emoji: "📊", text: "A classmate offers €40 for an hour of Power BI help.", choices: [{ label: "Do it", cash: 40, result: "Skills you own pay without a boss." }] },
  { id: "parking", emoji: "🅿️", text: "Parking fine in the post: €35.", choices: [{ label: "Pay it", cash: -35, result: "Annoying. Budgeted surprises hurt less." }] },
  { id: "tenant", emoji: "💬", text: "Your tenant texts: a small repair, €25, or it gets worse.", choices: [{ label: "Fix it now", cash: -25, result: "Small repairs stay small when handled early." }, { label: "Wait", cash: 0, result: "Nothing broke today. Yet." }] },
  { id: "gig", emoji: "🎤", text: "A friend needs a logo and flyer by tomorrow. €60.", choices: [{ label: "Take the gig", cash: 60, result: "Side income from existing skills. The farm approves." }, { label: "Too busy", cash: 0, result: "Protecting your time is also a choice." }] },
];

export function todaysPop(state: FarmState, today = brusselsDay()): DailyPop | null {
  if (state.pops?.[today] !== undefined) return null;
  const rnd = seededRandom(`${state.startedOn}:pop:${today}`);
  if (rnd() > 0.4) return null;
  return POPS[Math.floor(rnd() * POPS.length)];
}

export function resolvePop(state: FarmState, choiceIdx: number, today = brusselsDay()): FarmState {
  const pop = todaysPop(state, today);
  if (!pop) return state;
  const choice = pop.choices[Math.min(choiceIdx, pop.choices.length - 1)];
  return {
    ...state,
    cash: state.cash + choice.cash,
    pops: { ...(state.pops ?? {}), [today]: choice.result },
    log: [{ month: state.month, text: `${pop.emoji} ${choice.label}: ${choice.result}`, amount: choice.cash || undefined }, ...state.log].slice(0, 40),
  };
}

/** Skipped weeks: close them with defaults (events declined, no deals). */
export function autoCloseMissed(state: FarmState, learned: Set<string>, today = brusselsDay()): FarmState {
  let s = state;
  let guard = 0;
  while (!s.pending && shiftDay(dueSunday(s), 7) <= today && guard++ < 52) {
    s = prepareMarket(s, learned, null, false);
    const p = s.pending!;
    p.events.forEach((e, i) => {
      const safest = e.choices.reduce((best, c, ci) => ((c.cash ?? 0) > (e.choices[best].cash ?? 0) ? ci : best), 0);
      s = resolveEvent(s, i, safest);
    });
    s = finalizeMarket(s, today);
    s = { ...s, log: [{ month: s.month - 1, text: "Market Day missed — month auto-closed with safe choices" }, ...s.log].slice(0, 40) };
  }
  return s;
}
