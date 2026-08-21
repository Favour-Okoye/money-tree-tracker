/** Exam questions for farm courses. COURSE_QUESTIONS[courseId][level-1] is the
 *  list of variants for that level; a wrong answer rotates to the next variant. */
export type CourseId = "sales" | "career" | "realestate" | "budgeting" | "law" | "negotiation";

export interface CourseQuestion {
  q: string;
  options: [string, string, string, string];
  correct: number;
  why: string;
}

export const COURSE_QUESTIONS: Record<CourseId, CourseQuestion[][]> = {
  sales: [
    [
      { q: "What is a salesperson's first job in any conversation?", options: ["Present the price", "Understand the customer's problem before pitching anything", "List every feature", "Offer a discount"], correct: 1, why: "People buy solutions to their problem, not your pitch. Diagnose before you prescribe." },
      { q: "Why does anyone buy anything?", options: ["Because the seller insisted", "Because they believe the value exceeds the price", "Because it was cheap", "Because it was advertised"], correct: 1, why: "Selling is communicating value until it clearly outweighs the price." },
    ],
    [
      { q: "A customer says 'It's too expensive.' Most often this really means…", options: ["They are broke", "They don't yet see enough value for that price", "They want it free", "They are rude"], correct: 1, why: "Price objections are usually value objections. Raise the perceived value before cutting the price." },
      { q: "The best response to a 'no' is to…", options: ["Argue", "Ask a question to understand the real objection", "Drop the price 50%", "Walk away immediately"], correct: 1, why: "A 'no' is information. Understanding it saves the deal or saves your time." },
    ],
    [
      { q: "100 viewers → 20 enquiries → 5 calls → 2 sales. Where is the biggest leak?", options: ["Viewers to enquiries (80% lost)", "Enquiries to calls", "Calls to sales", "There is no leak"], correct: 0, why: "Measure each stage: 80% leak at the top means your hook or call-to-action is the priority." },
      { q: "Most sales happen…", options: ["On the first contact", "After several follow-ups", "Only on discount days", "By luck"], correct: 1, why: "Consistent, polite follow-up is where most sellers give up and most sales are won." },
    ],
    [
      { q: "You raise prices 10% and costs stay the same. Your profit rises by…", options: ["Exactly 10%", "More than 10%, because all of the extra is profit", "Less than 10%", "It falls"], correct: 1, why: "On a 20% margin, a 10% price rise lifts profit by 50%. Pricing is the strongest lever." },
      { q: "The most persuasive way to sell something expensive is to…", options: ["Shout louder", "Show the cost of NOT solving the problem", "Hide the price", "Offer it only to friends"], correct: 1, why: "Grace: solve expensive problems. The price of inaction sells the solution." },
    ],
  ],
  career: [
    [
      { q: "A raise that is invested instead of spent is…", options: ["A missed chance to enjoy life", "The fastest way to widen the gap between earning and keeping", "Pointless", "Only for rich people"], correct: 1, why: "Widen the gap; invest the gap. Raises are capital, not lifestyle." },
      { q: "What most reliably raises your salary?", options: ["Working more hours", "A skill that solves a more expensive problem", "Complaining to HR", "Changing your outfit"], correct: 1, why: "Income tracks the size of the problem you solve. Data that drives decisions is an expensive problem." },
    ],
    [
      { q: "When a job offer arrives, negotiate on…", options: ["Base salary only", "The total package and growth, not just base", "Nothing, accept fast", "The office chair"], correct: 1, why: "Bonuses, training budget, remote days and title all compound into future income." },
      { q: "Your personal brand is…", options: ["Your logo", "What people say about you when you're not in the room", "Your follower count", "Your CV font"], correct: 1, why: "Reputation compounds like capital and lowers the cost of every future opportunity." },
    ],
    [
      { q: "Who tends to earn more over time?", options: ["Generalists who know a bit of everything", "Specialists in expensive problems who can still communicate broadly", "Whoever works the longest hours", "The loudest person"], correct: 1, why: "Deep expertise plus the ability to sell it is the combination that gets paid." },
      { q: "The best time to learn the next skill is…", options: ["After you lose your job", "While the current one still pays you", "Never", "At retirement"], correct: 1, why: "Learn from a position of stability; desperate learning is expensive learning." },
    ],
    [
      { q: "In a wealth plan, a 9-to-5 job is best seen as…", options: ["A scam", "A stable engine that funds assets", "The finish line", "Something to hide"], correct: 1, why: "Grace's book title says it: 9-5 is not a scam. The salary is the seed capital for ownership." },
      { q: "Your employer pays for…", options: ["Your time, forever", "The problems you solve; ownership is what pays you without a boss", "Your loyalty only", "Nothing"], correct: 1, why: "Employees earn from salaries; owners earn from equity. Convert one into the other." },
    ],
  ],
  realestate: [
    [
      { q: "Yearly rent €7,200 on a €60,000 flat. Gross rental yield?", options: ["8%", "12%", "15%", "7.2%"], correct: 1, why: "7,200 ÷ 60,000 = 12%. Compare every deal with this number." },
      { q: "Which one pays you every month?", options: ["Appreciation", "Cash flow", "A survey plan", "A mortgage"], correct: 1, why: "Appreciation is a future bonus; cash flow is this month's income." },
    ],
    [
      { q: "Location matters most because…", options: ["It looks good on Instagram", "Demand sets rent and resale, and you cannot move the property", "Agents say so", "Taxes are lower"], correct: 1, why: "You can renovate a building; you cannot renovate a location." },
      { q: "A Dubai apartment's service charge reduces…", options: ["The purchase price", "Your net yield", "The building's height", "Nothing"], correct: 1, why: "Net yield, not gross, pays your bills. Always subtract running costs." },
    ],
    [
      { q: "Land banking means…", options: ["Storing cash under land", "Buying early where the city is going and holding while development raises value", "A bank for farmers", "Renting land to banks"], correct: 1, why: "Patience is the product. Land pays nothing monthly, so hold it with cash flow from elsewhere." },
      { q: "Buying off-plan gives you…", options: ["Zero risk", "A cheaper entry and payment plan, with completion risk", "Immediate rent", "A guaranteed visa"], correct: 1, why: "Developer reliability and escrow are your protection in off-plan deals." },
    ],
    [
      { q: "One empty month a year turns a 12% yield into roughly…", options: ["12%", "11%", "6%", "13%"], correct: 1, why: "11 of 12 months of rent. Real yields budget for vacancy." },
      { q: "With a small budget, the best first cash-flow property is usually…", options: ["A mansion", "A room in a high-demand area", "Empty land", "A shop in a quiet street"], correct: 1, why: "Small, always-rented units have the highest yields and the lowest entry." },
    ],
  ],
  budgeting: [
    [
      { q: "'Pay yourself first' means…", options: ["Buy yourself a treat first", "Move money to investments on payday, before spending", "Pay bills last", "Ask for a raise first"], correct: 1, why: "Invest first, live on the rest. The reverse leaves nothing to invest." },
      { q: "An emergency fund should cover…", options: ["One week", "3 to 6 months of expenses", "Ten years", "A holiday"], correct: 1, why: "It stops a surprise from forcing you to sell assets at the worst time." },
    ],
    [
      { q: "Living costs €800, income €1,200. The maximum you can sustainably invest per month is…", options: ["€1,200", "€400", "€800", "€50"], correct: 1, why: "1,200 − 800 = 400. The gap is your investing power; widening it is the whole game." },
      { q: "Lifestyle inflation is…", options: ["Prices rising in shops", "Your spending rising every time your income rises", "Buying groceries in bulk", "Saving too much"], correct: 1, why: "The raise that becomes a bigger flat never becomes an asset." },
    ],
    [
      { q: "Inflation is 20% and your savings pay 5%. Your real return is about…", options: ["+5%", "−15%", "+25%", "0%"], correct: 1, why: "Idle cash in high inflation quietly loses buying power. Assets are the shield." },
      { q: "Which cut improves your net worth more over a year?", options: ["A €50 one-off purchase avoided", "A €50 monthly subscription cancelled", "They are equal", "Neither matters"], correct: 1, why: "€50 a month is €600 a year, every year. Recurring costs compound against you." },
    ],
  ],
  law: [
    [
      { q: "Before paying for land, the very first thing to do is…", options: ["Pay a deposit to hold it", "Verify the title at the land registry", "Start building", "Post it on Instagram"], correct: 1, why: "No papers, no payment. A registry search costs little and saves fortunes." },
      { q: "A Certificate of Occupancy (C of O) is…", options: ["A receipt", "The state's grant of the right to use land for up to 99 years", "A survey drawing", "A building permit"], correct: 1, why: "The strongest title in Nigerian real estate, issued under the Land Use Act." },
    ],
    [
      { q: "Excised land is land that…", options: ["Has no owner", "Government formally released to the community, so it can be legitimately sold", "Is under water", "Is reserved for roads"], correct: 1, why: "Un-excised community land cannot be validly sold, whatever the papers claim." },
      { q: "Land 'under government acquisition' means…", options: ["The government will buy it from you at a premium", "The state holds it; buying risks demolition with no compensation", "It is tax free", "It is perfect for building"], correct: 1, why: "The cheapest land is often cheap for exactly this reason." },
    ],
    [
      { q: "Governor's Consent is required when…", options: ["Painting your house", "Land with a C of O changes hands", "Renting a room", "Applying for a visa"], correct: 1, why: "Without it the sale is not fully valid, however much money moved." },
      { q: "Exposure to omo-onile demands is reduced by…", options: ["Paying them once", "Buying titled estate land with proper documentation", "Building at night", "Arguing"], correct: 1, why: "Clear ownership and estates with documentation remove the ambiguity they feed on." },
    ],
  ],
  negotiation: [
    [
      { q: "Your strongest negotiating position comes from…", options: ["Wanting the deal badly", "Being genuinely able to walk away", "Talking the most", "Bringing a big crowd"], correct: 1, why: "Alternatives are power. Never negotiate a deal you cannot leave." },
      { q: "Your first offer should be…", options: ["Whatever they ask", "Anchored in your favour and justified with facts", "Random", "Silent"], correct: 1, why: "Anchors shape the whole negotiation; facts make them credible." },
    ],
    [
      { q: "'Distress sale, cash only, this week, no agent' signals…", options: ["A bargain to grab immediately", "Pressure tactics; slow down and verify everything", "Honesty", "A friendly seller"], correct: 1, why: "Urgency plus secrecy is the scam recipe. Due diligence does not hurry." },
      { q: "After you make an offer, silence is…", options: ["Rude", "A tool: let them fill it", "A sign to raise your offer", "A mistake"], correct: 1, why: "Whoever speaks first after an offer usually concedes something." },
    ],
    [
      { q: "If the seller will not move on price, ask for…", options: ["Nothing, pay full", "Something else of value: papers processed, a payment plan, inclusions", "A fight", "A refund later"], correct: 1, why: "Terms can be worth more than price: time, paperwork and inclusions all have value." },
      { q: "Which usually adds more value in a big deal?", options: ["Shaving 2% off the price", "Better terms such as staged payments and verified documents", "A handshake", "A longer meeting"], correct: 1, why: "Cash flow timing and certainty often matter more than a small price cut." },
    ],
  ],
};
