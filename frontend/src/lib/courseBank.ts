/** Farm course curriculum. Each course has tiers (Basics → Intermediate →
 *  Mastery); each tier has levels; each level has question variants — a wrong
 *  answer rotates to the next variant, so answers must be understood, not
 *  cycled. Skill level counts continuously across tiers. */
export type CourseId = "sales" | "career" | "realestate" | "budgeting" | "law" | "negotiation";

export interface CourseQuestion {
  q: string;
  options: [string, string, string, string];
  correct: number;
  why: string;
}

export interface CourseTier {
  name: "Basics" | "Intermediate" | "Mastery";
  price: number;
  levels: CourseQuestion[][];
}

const Q = (q: string, options: [string, string, string, string], correct: number, why: string): CourseQuestion => ({ q, options, correct, why });

export const COURSE_TIERS: Record<CourseId, CourseTier[]> = {
  sales: [
    { name: "Basics", price: 300, levels: [
      [ Q("What is a salesperson's first job in any conversation?", ["Present the price", "Understand the customer's problem before pitching anything", "List every feature", "Offer a discount"], 1, "People buy solutions to their problem, not your pitch. Diagnose before you prescribe."),
        Q("Why does anyone buy anything?", ["Because the seller insisted", "Because they believe the value exceeds the price", "Because it was cheap", "Because it was advertised"], 1, "Selling is communicating value until it clearly outweighs the price.") ],
      [ Q("A customer says 'It's too expensive.' Most often this really means…", ["They are broke", "They don't yet see enough value for that price", "They want it free", "They are rude"], 1, "Price objections are usually value objections. Raise the perceived value before cutting the price."),
        Q("The best response to a 'no' is to…", ["Argue", "Ask a question to understand the real objection", "Drop the price 50%", "Walk away immediately"], 1, "A 'no' is information. Understanding it saves the deal or saves your time.") ],
      [ Q("100 viewers → 20 enquiries → 5 calls → 2 sales. Where is the biggest leak?", ["Viewers to enquiries (80% lost)", "Enquiries to calls", "Calls to sales", "There is no leak"], 0, "Measure each stage: an 80% leak at the top means your hook or call-to-action is the priority."),
        Q("Most sales happen…", ["On the first contact", "After several follow-ups", "Only on discount days", "By luck"], 1, "Consistent, polite follow-up is where most sellers give up and most sales are won.") ],
      [ Q("You raise prices 10% and costs stay the same. Your profit rises by…", ["Exactly 10%", "More than 10%, because all of the extra is profit", "Less than 10%", "It falls"], 1, "On a 20% margin, a 10% price rise lifts profit by 50%. Pricing is the strongest lever."),
        Q("The most persuasive way to sell something expensive is to…", ["Shout louder", "Show the cost of NOT solving the problem", "Hide the price", "Offer it only to friends"], 1, "Grace: solve expensive problems. The price of inaction sells the solution.") ],
    ] },
    { name: "Intermediate", price: 450, levels: [
      [ Q("A prospect says 'let me think about it'. The strongest next move is…", ["Wait silently for weeks", "Ask what exactly they would need to be sure, then agree a follow-up date", "Send the price again", "Offer 20% off"], 1, "'Think about it' hides an unspoken objection. Surface it and put a date on the decision."),
        Q("A closing question that actually closes:", ["'Any questions?'", "'Is there anything stopping us from starting this week?'", "'Do you like it?'", "'Shall I call back next year?'"], 1, "A good close asks for the decision and exposes the last obstacle in one sentence.") ],
      [ Q("You sell a €600 programme; the customer only has €400. Better than discounting is to…", ["Give it for €400", "Offer a smaller €400 package and keep the €600 intact", "Refuse rudely", "Double the price"], 1, "Discounts train customers to wait. A smaller offer protects your price and still serves them."),
        Q("Bundling two services into one offer mainly raises…", ["Your costs", "Average order value without lowering perceived value", "Refund rates", "Nothing"], 1, "Bundles sell outcomes; each part reinforces the value of the other.") ],
      [ Q("The best moment to ask for a referral is…", ["Before delivering anything", "At the moment of delight, right after the result lands, and make it effortless", "Years later", "Never"], 1, "Referrals are emotional: ask when the customer is happiest and hand them the words."),
        Q("Testimonials work because they…", ["Are long", "Lower perceived risk through social proof", "Replace the product", "Are required by law"], 1, "Strangers trust other customers more than they trust you. Collect proof constantly.") ],
    ] },
    { name: "Mastery", price: 600, levels: [
      [ Q("To charge premium prices you should…", ["Sell to everyone", "Sell to people for whom the problem is expensive and urgent", "Compete on being cheapest", "Hide your prices"], 1, "Premium comes from the cost of the problem, not the polish of the pitch."),
        Q("Which number best predicts next quarter's sales?", ["Followers", "Qualified conversations × conversion rate", "Office size", "Number of logos"], 1, "Sales is arithmetic: more qualified conversations, better conversion. Track both weekly.") ],
      [ Q("A sales system in the OPT sense is…", ["A charismatic founder", "A repeatable process, scripts and stages that others can run without you", "A discount calendar", "A big launch"], 1, "If sales stop when you stop, you have a job, not a system."),
        Q("To scale sales beyond your own hours you…", ["Work nights", "Document scripts, train people, measure each stage, fix the leaks", "Cut prices", "Hope for virality"], 1, "Other people's time applied to a measured process is how sales scale.") ],
      [ Q("In Grace's framing, selling is ultimately…", ["Persuasion tricks", "Serving: solving a problem someone gladly pays to escape", "Luck", "Manipulation"], 1, "Stop hating sales. Served well, the customer thanks you and comes back."),
        Q("Long-term customers come from…", ["Aggressive closing", "Delivering the promised result and following through after the sale", "Constant discounts", "Big adverts"], 1, "The sale is the start of the relationship. Retention is the cheapest revenue you will ever earn.") ],
    ] },
  ],
  career: [
    { name: "Basics", price: 400, levels: [
      [ Q("A raise that is invested instead of spent is…", ["A missed chance to enjoy life", "The fastest way to widen the gap between earning and keeping", "Pointless", "Only for rich people"], 1, "Widen the gap; invest the gap. Raises are capital, not lifestyle."),
        Q("What most reliably raises your salary?", ["Working more hours", "A skill that solves a more expensive problem", "Complaining to HR", "Changing your outfit"], 1, "Income tracks the size of the problem you solve. Data that drives decisions is an expensive problem.") ],
      [ Q("When a job offer arrives, negotiate on…", ["Base salary only", "The total package and growth, not just base", "Nothing, accept fast", "The office chair"], 1, "Bonuses, training budget, remote days and title all compound into future income."),
        Q("Your personal brand is…", ["Your logo", "What people say about you when you're not in the room", "Your follower count", "Your CV font"], 1, "Reputation compounds like capital and lowers the cost of every future opportunity.") ],
      [ Q("Who tends to earn more over time?", ["Generalists who know a bit of everything", "Specialists in expensive problems who can still communicate broadly", "Whoever works the longest hours", "The loudest person"], 1, "Deep expertise plus the ability to sell it is the combination that gets paid."),
        Q("The best time to learn the next skill is…", ["After you lose your job", "While the current one still pays you", "Never", "At retirement"], 1, "Learn from a position of stability; desperate learning is expensive learning.") ],
      [ Q("In a wealth plan, a 9-to-5 job is best seen as…", ["A scam", "A stable engine that funds assets", "The finish line", "Something to hide"], 1, "Grace's book title says it: 9-5 is not a scam. The salary is seed capital for ownership."),
        Q("Your employer pays for…", ["Your time, forever", "The problems you solve; ownership is what pays you without a boss", "Your loyalty only", "Nothing"], 1, "Employees earn from salaries; owners earn from equity. Convert one into the other.") ],
    ] },
    { name: "Intermediate", price: 600, levels: [
      [ Q("The strongest evidence in a data job interview is…", ["A long list of tools", "A portfolio project that solved a real business problem with measured impact", "A high grade", "Confidence alone"], 1, "Employers buy outcomes. Show a problem, your pipeline, and the number that changed."),
        Q("The STAR method is for…", ["Salary maths", "Answering behavioural questions: situation, task, action, result", "Writing CVs", "Networking emails"], 1, "Structured stories with a result are remembered; vague claims are not.") ],
      [ Q("The employer cannot raise base salary. You ask for…", ["Nothing", "Training budget, remote days, title, bonus, and a review date", "A bigger desk", "Their car"], 1, "Total compensation has many levers; most candidates pull only one."),
        Q("The best moment to ask for a raise is…", ["Monday morning", "Right after a measurable win, with the numbers in hand", "During layoffs", "Never"], 1, "Timing plus evidence. A raise is a sale, and the product is your proven impact.") ],
      [ Q("Networking that actually works is…", ["Collecting business cards", "Giving value first and following up consistently", "Asking strangers for jobs", "Posting selfies"], 1, "Relationships compound when you are useful before you are needy."),
        Q("A good mentor at work is…", ["The most senior person available", "Someone two steps ahead whose advice you actually apply", "A friend who agrees with you", "A celebrity"], 1, "Proximity and application beat fame. Mentorship only works if you execute.") ],
    ] },
    { name: "Mastery", price: 800, levels: [
      [ Q("You turn a salary into ownership by…", ["Waiting for a windfall", "Investing a fixed percentage before lifestyle, every payday, into assets", "Spending to look successful", "Saving in cash only"], 1, "Pay yourself first, at scale, for years. Ownership is bought with discipline, not luck."),
        Q("The real output of a job in a wealth plan is…", ["Status", "Capital, skills and a network you convert into assets", "Free lunches", "Tenure"], 1, "Every job is a funding round for your future ownership.") ],
      [ Q("A side income while employed should…", ["Use company time", "Use a skill you already own and respect your contract", "Be secret from everyone", "Replace your job on day one"], 1, "Build the second stream legally and from strength. It is how 9-to-5 funds the farm."),
        Q("The highest-leverage career skill long term is…", ["Typing speed", "Communicating value (selling) on top of deep expertise", "Knowing every tool", "Seniority"], 1, "Expertise gets you in the room; selling it gets you paid.") ],
      [ Q("When is it wise to leave a good job for your own business?", ["On a bad Monday", "When business income is proven and runway is saved, not on hope", "Immediately after a motivational video", "Never"], 1, "Grace built Lifecard on proof, not vibes. Leap from a platform, not a cliff."),
        Q("Career risk is really managed by…", ["Job security", "Skills, savings and a network that make you hireable anywhere", "Loyalty", "Luck"], 1, "Security is not a job; it is your ability to earn regardless of the job.") ],
    ] },
  ],
  realestate: [
    { name: "Basics", price: 350, levels: [
      [ Q("Yearly rent €7,200 on a €60,000 flat. Gross rental yield?", ["8%", "12%", "15%", "7.2%"], 1, "7,200 ÷ 60,000 = 12%. Compare every deal with this number."),
        Q("Which one pays you every month?", ["Appreciation", "Cash flow", "A survey plan", "A mortgage"], 1, "Appreciation is a future bonus; cash flow is this month's income.") ],
      [ Q("Location matters most because…", ["It looks good on Instagram", "Demand sets rent and resale, and you cannot move the property", "Agents say so", "Taxes are lower"], 1, "You can renovate a building; you cannot renovate a location."),
        Q("A Dubai apartment's service charge reduces…", ["The purchase price", "Your net yield", "The building's height", "Nothing"], 1, "Net yield, not gross, pays your bills. Always subtract running costs.") ],
      [ Q("Land banking means…", ["Storing cash under land", "Buying early where the city is going and holding while development raises value", "A bank for farmers", "Renting land to banks"], 1, "Patience is the product. Land pays nothing monthly, so hold it with cash flow from elsewhere."),
        Q("Buying off-plan gives you…", ["Zero risk", "A cheaper entry and payment plan, with completion risk", "Immediate rent", "A guaranteed visa"], 1, "Developer reliability and escrow are your protection in off-plan deals.") ],
      [ Q("One empty month a year turns a 12% yield into roughly…", ["12%", "11%", "6%", "13%"], 1, "11 of 12 months of rent. Real yields budget for vacancy."),
        Q("With a small budget, the best first cash-flow property is usually…", ["A mansion", "A room in a high-demand area", "Empty land", "A shop in a quiet street"], 1, "Small, always-rented units have the highest yields and the lowest entry.") ],
    ] },
    { name: "Intermediate", price: 500, levels: [
      [ Q("Rent €7,200 a year, running costs €1,200, price €60,000. Net yield?", ["12%", "10%", "8%", "2%"], 1, "(7,200 − 1,200) ÷ 60,000 = 10%. Net is what you can actually spend."),
        Q("Cap rate is…", ["Rent ÷ mortgage", "Net operating income ÷ property price", "Price ÷ rent", "Deposit ÷ loan"], 1, "It lets you compare properties regardless of how they are financed.") ],
      [ Q("Due diligence on an estate plot covers…", ["The brochure only", "Title search, registered survey, developer track record and allocation terms", "The agent's promise", "A drone video"], 1, "Four checks, a few days, and most of the disasters become impossible."),
        Q("Flood risk is best checked by…", ["Asking the seller", "Visiting in rainy season and checking drainage and elevation", "Google Street View", "Guessing from the price"], 1, "Water does not read brochures. Site visits are due diligence.") ],
      [ Q("A Lagos tenant pays a full year upfront. The disciplined move is to…", ["Spend it, it's income", "Treat it as 12 monthly rents: budget it, reserve for repairs and vacancy", "Buy a car", "Lend it out"], 1, "Lump sums feel like wealth and behave like temptation. Annualise them."),
        Q("A 10% management fee on €600 monthly rent costs…", ["€6", "€60 a month", "€600 a year… wait", "€10"], 1, "€60 a month buys distance: someone else handles tenants while you live abroad.") ],
    ] },
    { name: "Mastery", price: 700, levels: [
      [ Q("The BRRR strategy is…", ["Buy, Relax, Rent, Retire", "Buy, Rehab, Rent, Refinance (then repeat)", "Borrow, Risk, Repeat, Regret", "Build, Rent, Resell, Rebuild"], 1, "Force value up, refinance the equity out, recycle the same capital into the next property."),
        Q("Refinancing a property lets you…", ["Avoid tax forever", "Pull out equity to buy the next asset while keeping the first", "Cancel the tenant", "Double the rent"], 1, "Equity is wealth you can redeploy. Refinance turns one door into two.") ],
      [ Q("The key protections in a Dubai off-plan purchase are…", ["A handshake", "An escrow account, a registered developer, and a strong delivery track record", "A celebrity endorsement", "Paying cash up front"], 1, "Escrow means the developer only draws funds as construction milestones are verified."),
        Q("Dubai's Golden Visa property threshold is roughly…", ["AED 200,000", "AED 2 million", "AED 20 million", "There is no threshold"], 1, "Around AED 2m of property qualifies the owner and family for a 10-year visa.") ],
      [ Q("A resilient property portfolio mixes…", ["Only land", "Cash-flow assets and appreciation assets, in more than one market", "Only off-plan", "Only one building"], 1, "Rent pays today; growth pays later; two markets mean one flood does not sink you."),
        Q("The exit plan for land bought for growth is…", ["Hope", "Sell when infrastructure lands, or refinance to hold and reinvest", "Never sell", "Give it away"], 1, "Decide the exit before you buy. Land without a plan is a hobby.") ],
    ] },
  ],
  budgeting: [
    { name: "Basics", price: 250, levels: [
      [ Q("'Pay yourself first' means…", ["Buy yourself a treat first", "Move money to investments on payday, before spending", "Pay bills last", "Ask for a raise first"], 1, "Invest first, live on the rest. The reverse leaves nothing to invest."),
        Q("An emergency fund should cover…", ["One week", "3 to 6 months of expenses", "Ten years", "A holiday"], 1, "It stops a surprise from forcing you to sell assets at the worst time.") ],
      [ Q("Living costs €800, income €1,200. The maximum you can sustainably invest per month is…", ["€1,200", "€400", "€800", "€50"], 1, "1,200 − 800 = 400. The gap is your investing power; widening it is the whole game."),
        Q("Lifestyle inflation is…", ["Prices rising in shops", "Your spending rising every time your income rises", "Buying groceries in bulk", "Saving too much"], 1, "The raise that becomes a bigger flat never becomes an asset.") ],
      [ Q("Inflation is 20% and your savings pay 5%. Your real return is about…", ["+5%", "−15%", "+25%", "0%"], 1, "Idle cash in high inflation quietly loses buying power. Assets are the shield."),
        Q("Which cut improves your net worth more over a year?", ["A €50 one-off purchase avoided", "A €50 monthly subscription cancelled", "They are equal", "Neither matters"], 1, "€50 a month is €600 a year, every year. Recurring costs compound against you.") ],
    ] },
    { name: "Intermediate", price: 400, levels: [
      [ Q("The 50/30/20 rule splits income into…", ["Rent/food/fun", "Needs / wants / saving and investing", "Taxes/tithe/rest", "Cash/card/crypto"], 1, "A starting frame. Grace would push the 20 higher as income grows."),
        Q("A sinking fund is…", ["A bad investment", "Saving a little monthly for a known future cost like rent renewal or a laptop", "A loan", "An overdraft"], 1, "Known expenses should never be emergencies.") ],
      [ Q("Paying off debts: the avalanche method…", ["Pays the smallest balance first", "Pays the highest interest rate first, cheapest overall", "Ignores interest", "Pays everyone equally"], 1, "Snowball wins on motivation; avalanche wins on maths. Pick one and finish."),
        Q("The minimum-payment trap means…", ["Paying nothing", "Interest eats most of the payment so the balance barely moves", "Paying too much", "Banks forgive you"], 1, "Minimums are designed to keep you paying. Overpay the expensive debt.") ],
      [ Q("The disciplined way to handle black tax is…", ["Say yes to every call", "A fixed monthly amount decided in advance, then protect your investing", "Block the family", "Borrow to give"], 1, "Generosity with a number is generosity that lasts."),
        Q("A no-spend week mainly teaches you…", ["To suffer", "The difference between wants and needs", "To hoard", "Nothing"], 1, "Awareness is the first budget. Most leaks are invisible until you stop.") ],
    ] },
    { name: "Mastery", price: 550, levels: [
      [ Q("Saving 30% of €1,200 for 12 months (no interest) gives…", ["€3,600", "€4,320", "€360", "€14,400"], 1, "360 a month × 12 = 4,320. Consistency beats intensity."),
        Q("Rule of 72: money at 7% a year doubles in about…", ["7 years", "10 years", "72 years", "2 years"], 1, "72 ÷ 7 ≈ 10. Use it to feel compounding before you calculate it.") ],
      [ Q("Savings that survive inflation are held in…", ["A drawer", "Assets that reprice: property, equities, a business", "Cash only", "Gift cards"], 1, "Cash is a loan to inflation. Assets float with prices."),
        Q("Saving in naira while earning euros exposes you to…", ["Nothing", "Devaluation eroding buying power; hold hard-currency assets for the core", "Higher returns always", "Tax bills"], 1, "Currency is a risk like any other. Grace's Dubai and co-investment plays are partly currency hedges.") ],
      [ Q("Your financial-freedom number is…", ["A million, always", "Monthly expenses covered by passive income (or ~25× annual expenses invested)", "Whatever your friends have", "Your salary × 10"], 1, "Freedom is a ratio, not a jackpot: passive income ≥ living costs."),
        Q("The purpose of a budget is…", ["Restriction", "Directing money to goals so spending is guilt-free and investing is automatic", "Punishment", "Impressing accountants"], 1, "A budget is permission, not a cage.") ],
    ] },
  ],
  law: [
    { name: "Basics", price: 350, levels: [
      [ Q("Before paying for land, the very first thing to do is…", ["Pay a deposit to hold it", "Verify the title at the land registry", "Start building", "Post it on Instagram"], 1, "No papers, no payment. A registry search costs little and saves fortunes."),
        Q("A Certificate of Occupancy (C of O) is…", ["A receipt", "The state's grant of the right to use land for up to 99 years", "A survey drawing", "A building permit"], 1, "The strongest title in Nigerian real estate, issued under the Land Use Act.") ],
      [ Q("Excised land is land that…", ["Has no owner", "Government formally released to the community, so it can be legitimately sold", "Is under water", "Is reserved for roads"], 1, "Un-excised community land cannot be validly sold, whatever the papers claim."),
        Q("Land 'under government acquisition' means…", ["The government will buy it from you at a premium", "The state holds it; buying risks demolition with no compensation", "It is tax free", "It is perfect for building"], 1, "The cheapest land is often cheap for exactly this reason.") ],
      [ Q("Governor's Consent is required when…", ["Painting your house", "Land with a C of O changes hands", "Renting a room", "Applying for a visa"], 1, "Without it the sale is not fully valid, however much money moved."),
        Q("Exposure to omo-onile demands is reduced by…", ["Paying them once", "Buying titled estate land with proper documentation", "Building at night", "Arguing"], 1, "Clear ownership and estates with documentation remove the ambiguity they feed on.") ],
    ] },
    { name: "Intermediate", price: 500, levels: [
      [ Q("Deed of assignment vs C of O:", ["They are the same", "The deed transfers the seller's interest; the C of O is the state's title", "The deed is stronger", "Neither matters"], 1, "You need the transfer document AND a valid underlying title."),
        Q("A registered survey plan shows…", ["House colours", "Exact coordinates and whether the land sits in acquisition or committed zones", "Rental prices", "The agent's name"], 1, "A survey search is how a lawyer sees what the seller will not say.") ],
      [ Q("Why does the gazette matter?", ["It is a newspaper", "It is the official public record proving an excision", "It lists prices", "It is optional"], 1, "If the excision is not gazetted, treat the land as not excised."),
        Q("Buying family land safely requires…", ["One family member's signature", "Consent of the principal family members, proper receipts and a registered deed", "Cash only", "A quick handshake"], 1, "One cousin selling without the others is tomorrow's court case.") ],
      [ Q("Your lawyer's job in a land purchase is…", ["To attend the party", "Title search, drafting the deed, registration and consent", "To negotiate rent", "Nothing"], 1, "Legal fees are the cheapest insurance in real estate."),
        Q("Even with a trusted agent you never pay before…", ["Lunch", "The documents are independently verified", "The weekend", "Seeing a photo"], 1, "Trust the process, not the person. Scammers are charming by profession.") ],
    ] },
    { name: "Mastery", price: 700, levels: [
      [ Q("Perfecting a title means…", ["Framing the document", "Completing consent and registration so your ownership is enforceable", "Paying the agent", "Fencing the plot"], 1, "An unperfected title is a risk you are carrying without noticing."),
        Q("Governor's Consent fees and timelines are…", ["Free and instant", "Real costs and months of delay to budget into the deal", "Optional", "Paid by the seller always"], 1, "Budget the full cost of ownership, not just the sale price.") ],
      [ Q("Building approval protects you from…", ["High rent", "Demolition for non-compliance, setbacks and drainage violations", "Bad tenants", "Nothing"], 1, "Approvals are boring until the bulldozer arrives."),
        Q("Checking an estate developer means…", ["Liking their page", "CAC registration, past allocations delivered, and the estate's title status", "Visiting the showroom", "Trusting the billboard"], 1, "A developer's history is the best predictor of your allocation.") ],
      [ Q("Land disputes are mostly avoided by…", ["Luck", "A complete paper trail, registration, and buying in documented estates", "Fighting back", "Paying omo-onile more"], 1, "Documentation is quiet until the day it is everything."),
        Q("A seller acting under power of attorney must…", ["Just say so", "Show a valid, registered power of attorney you verify", "Be a relative", "Be trusted"], 1, "Verify the authority, not the story.") ],
    ] },
  ],
  negotiation: [
    { name: "Basics", price: 300, levels: [
      [ Q("Your strongest negotiating position comes from…", ["Wanting the deal badly", "Being genuinely able to walk away", "Talking the most", "Bringing a big crowd"], 1, "Alternatives are power. Never negotiate a deal you cannot leave."),
        Q("Your first offer should be…", ["Whatever they ask", "Anchored in your favour and justified with facts", "Random", "Silent"], 1, "Anchors shape the whole negotiation; facts make them credible.") ],
      [ Q("'Distress sale, cash only, this week, no agent' signals…", ["A bargain to grab immediately", "Pressure tactics; slow down and verify everything", "Honesty", "A friendly seller"], 1, "Urgency plus secrecy is the scam recipe. Due diligence does not hurry."),
        Q("After you make an offer, silence is…", ["Rude", "A tool: let them fill it", "A sign to raise your offer", "A mistake"], 1, "Whoever speaks first after an offer usually concedes something.") ],
      [ Q("If the seller will not move on price, ask for…", ["Nothing, pay full", "Something else of value: papers processed, a payment plan, inclusions", "A fight", "A refund later"], 1, "Terms can be worth more than price: time, paperwork and inclusions all have value."),
        Q("Which usually adds more value in a big deal?", ["Shaving 2% off the price", "Better terms such as staged payments and verified documents", "A handshake", "A longer meeting"], 1, "Cash flow timing and certainty often matter more than a small price cut.") ],
    ] },
    { name: "Intermediate", price: 450, levels: [
      [ Q("BATNA stands for…", ["Best Attitude To Negotiate Anything", "Best Alternative To a Negotiated Agreement", "Buy All The Nice Assets", "Basic Agreement Terms"], 1, "Know your alternative before you sit down; it sets your walk-away point."),
        Q("Anchoring too aggressively…", ["Always works", "Can kill the deal; anchor high but justify it with facts", "Is illegal", "Is polite"], 1, "An anchor without a reason reads as disrespect.") ],
      [ Q("Asking 'what would make this work for you?' is meant to…", ["Waste time", "Uncover the interests behind their stated position", "Concede", "End the meeting"], 1, "Positions clash; interests can be traded."),
        Q("Concessions should be…", ["Given freely to be nice", "Traded: every give gets a get", "Hidden", "Avoided entirely"], 1, "Free concessions teach the other side to ask for more.") ],
      [ Q("Negotiating rent with a landlord, offer…", ["To pay late", "A longer tenancy or upfront payment in exchange for lower rent", "Insults", "Nothing"], 1, "Certainty is valuable to landlords; sell it."),
        Q("Your walk-away point should be decided…", ["In the heat of the moment", "Before the meeting, in writing", "By the other side", "Never"], 1, "Decisions made under pressure are made by pressure.") ],
    ] },
    { name: "Mastery", price: 600, levels: [
      [ Q("A win-win structure is one where…", ["You win twice", "Both sides' real interests are served so the deal survives and repeats", "Nobody is happy", "The lawyer wins"], 1, "Deals that hurt the other side get renegotiated, sabotaged or never repeated."),
        Q("In a co-investment pool you negotiate hardest on…", ["The group name", "Exit terms, decision rights and reporting", "The WhatsApp admin", "Who pays for drinks"], 1, "Entry is easy; the exit and the governance decide whether you ever get paid.") ],
      [ Q("Developers give off-plan discounts for…", ["Being nice", "Early or bulk buyers and flexible payment plans that help their cash flow", "Nothing", "Complaints"], 1, "Understand their cash-flow pain and you find the discount."),
        Q("When emotions rise in a negotiation…", ["Raise your voice", "Pause, reframe to interests, and return to facts", "Walk out every time", "Concede"], 1, "Calm is a negotiating advantage that costs nothing.") ],
      [ Q("Grace's principle about rooms and relationships means…", ["Win every argument", "Long-term reputation beats one-time wins; the next deal comes from this one", "Avoid people", "Only trust family"], 1, "Your reputation negotiates for you before you enter the room."),
        Q("The best negotiated outcome is…", ["The lowest price ever", "A deal you would happily sign again tomorrow, with a counterpart who would too", "A deal they regret", "The longest contract"], 1, "Sustainability is the mastery test of any deal.") ],
    ] },
  ],
};

export function courseMaxLevel(id: CourseId): number {
  return COURSE_TIERS[id].reduce((n, t) => n + t.levels.length, 0);
}

/** Where a given total level sits: which tier, and the index within it. */
export function locateLevel(id: CourseId, level: number): { tierIndex: number; tier: CourseTier; levelInTier: number; tierStart: number } {
  let start = 0;
  const tiers = COURSE_TIERS[id];
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    if (level < start + t.levels.length || i === tiers.length - 1) {
      return { tierIndex: i, tier: t, levelInTier: Math.min(level - start, t.levels.length), tierStart: start };
    }
    start += t.levels.length;
  }
  const last = tiers[tiers.length - 1];
  return { tierIndex: tiers.length - 1, tier: last, levelInTier: last.levels.length, tierStart: start };
}

/** Number of fully completed tiers at a given level. */
export function tiersCompleted(id: CourseId, level: number): number {
  let start = 0, done = 0;
  for (const t of COURSE_TIERS[id]) {
    if (level >= start + t.levels.length) done++;
    start += t.levels.length;
  }
  return done;
}
