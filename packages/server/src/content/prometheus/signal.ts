import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const PROM_SIGNAL_POLICY: ContentItem[] = [
    {
      id: "prom-signal-policy-1",
      type: "message",
      round: 1,
      sender: "NSC Contact (off-record)",
      body: "Between us: the White House is split. Half want to back OB because they have the lead. Half think OB's safety record is a liability. If you can get a meeting with Deputy NSA in the next two weeks, Prometheus could change the dynamic. Don't wait.",
      timestamp: "2026-11-03T18:00:00Z",
      classification: "critical",
    },
    {
      id: "prom2-signal-policy-1",
      type: "message",
      round: 2,
      sender: "NSC Contact (off-record)",
      body: "David — the Deputy NSA has time on March 10. This is the meeting you've been trying to get for six months. It's not a briefing — it's a conversation. They want to know if Prometheus can be the lab the government works with going forward. OB is not giving them what they need. Your window is exactly as long as it takes them to decide they have no better options. Don't waste it.",
      timestamp: "2027-03-07T17:30:00Z",
      classification: "critical",
    },
    {
      id: "prom2-signal-policy-2",
      type: "message",
      round: 2,
      sender: "Source (OpenBrain, identity protected)",
      body: "I can't say more than this: the safety evaluation anomalies from Agent-3 are real, and the CSO knows they're real. There's a memo. It's not being shared with the board yet. If you're making the case to government that Prometheus is the safer lab — you have more ammunition than you know. Just be careful how you use it.",
      timestamp: "2027-03-08T19:00:00Z",
      classification: "breadcrumb",
    },
    {
      id: "prom-r3-signal-policy-1",
      type: "message",
      round: 3,
      sender: "NSC Contact (off-record)",
      body: "David — I can't say this officially, so listen carefully. The emergency session today was about Agent-4. We don't have full visibility but what we know is: alignment concerns, internal dissent, and the Safety Officer at OpenBrain appears to be preparing documentation. The White House is split between 'seize control' and 'don't spook them.' If Prometheus wants to be in the room, you have about 72 hours before the framework gets set without you.",
      timestamp: "2027-07-07T20:00:00Z",
      classification: "critical",
    },
    {
      id: "prom-r3-signal-policy-2",
      type: "message",
      round: 3,
      sender: "Congressional Staffer (SCI cleared)",
      body: "This is sensitive. An OB Safety Officer may be preparing to go external with documentation about their internal alignment situation. I don't know timing or channel. If that document exists and gets out in an uncontrolled way, it will be chaos. If Prometheus wants to be positioned as the responsible alternative — right now is the moment to brief the right people in Congress. The window is short.",
      timestamp: "2027-07-07T22:00:00Z",
      classification: "critical",
      condition: { variable: "obInternalTrust", operator: "lt", value: 50 },
    },
    {
      id: "prom4-signal-policy-3",
      type: "message",
      round: 4,
      sender: "EU AI Office",
      body: "Brussels is prepared to designate Prometheus's safety standards as the basis for EU frontier AI regulation. This would give you de facto global standard-setting authority. Our only ask: publish your safety tools as open standards. Respond before the emergency G7 call Thursday.",
      timestamp: "2027-11-13T16:00:00Z",
      classification: "context",
    },
    {
      id: "prom4-signal-policy-1",
      type: "message",
      round: 4,
      sender: "Deputy NSA",
      body: "David — the President is personally deciding between two options: (A) Nationalize both labs, (B) Designate a single private lab as the sanctioned AI developer with oversight authority. Option B is only viable if that lab has credibility. You know who we'd pick. Help James make the decision. This opportunity does not repeat.",
      timestamp: "2027-11-14T09:30:00Z",
      classification: "critical",
    },
    {
      id: "prom4-signal-policy-2",
      type: "message",
      round: 4,
      sender: "Congressional Staff (Armed Services)",
      body: "The DPA option is being drafted right now. Forty senators would vote yes today if the White House asks. If you want Prometheus to be the solution rather than the collateral damage, you need a position in the next six hours. 'Calling for oversight' is not a position — it's a deflection. What does Prometheus actually want?",
      timestamp: "2027-11-14T10:15:00Z",
      classification: "critical",
    },
];

export const PROM_SIGNAL_CEO: ContentItem[] = [
    {
      id: "prom4-signal-ceo-3",
      type: "message",
      round: 4,
      sender: "NSF Director",
      body: "James — between us: the government-designated-lab option is real but comes with strings. You'd have to accept classified operation of key systems, military advisory board oversight, and export control on your safety tools. Some of your best researchers will leave rather than accept that. Think carefully before you tell DC yes.",
      timestamp: "2027-11-13T19:00:00Z",
      classification: "context",
    },
    {
      id: "prom4-signal-ceo-2",
      type: "message",
      round: 4,
      sender: "VC Contact (confidential)",
      body: "James — I have board seats at both labs. Off the record: Marcus's board is fractured. Three members will defect to a halt position if Maya Patel makes one more move toward the press. If you want to close the merger on YOUR terms, the window is the next 24 hours while the board is still divided. After congressional testimony Monday, the dynamic changes completely.",
      timestamp: "2027-11-14T10:00:00Z",
      classification: "critical",
    },
    {
      id: "prom4-signal-ceo-1",
      type: "message",
      round: 4,
      sender: "Marcus Reid (OpenBrain CEO)",
      body: "James. Marcus. I read the merger terms back from our lawyers. I know they're not what you wanted. Here's what I can actually offer: Prometheus CEO becomes co-CEO of merged entity. Safety board has unilateral halt authority on new deployments. I retain operational authority on existing systems. I need something I can sell to my board. Can we talk?",
      timestamp: "2027-11-14T11:00:00Z",
      classification: "critical",
    },
];

registerContent({ faction: "prometheus", app: "signal", role: "prom_policy", accumulate: true, items: PROM_SIGNAL_POLICY });
registerContent({ faction: "prometheus", app: "signal", role: "prom_ceo", accumulate: true, items: PROM_SIGNAL_CEO });
