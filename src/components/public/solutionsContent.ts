import {
  MessagesSquare,
  ShieldCheck,
  Users,
  Lock,
  EyeOff,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

/**
 * The public "Solutions" catalogue: one entry per marketing page.
 *
 * Single source of truth for BOTH the header dropdown and the pages themselves, so a solution can
 * never appear in the menu without a page behind it (or the reverse). Mirrors the pattern the
 * DocuIntelli landing uses — a content map plus one presentational component, rather than six
 * hand-written pages that drift apart.
 *
 * Every entry maps to a feature that genuinely ships (see README "Features"). Nothing aspirational:
 * a marketing page for something the product does not do is a promise the app then breaks.
 */

export type SolutionSlug =
  | 'anonymous-forums'
  | 'safe-spaces'
  | 'mentorship-matching'
  | 'encrypted-messaging'
  | 'identity-reveal'
  | 'ai-thread-analysis';

export interface SolutionSection {
  icon: LucideIcon;
  h2: string;
  p: string;
}

export interface Solution {
  slug: SolutionSlug;
  /** Menu label — short enough to sit on one line in the dropdown. */
  label: string;
  /** One-line description under the label in the dropdown. */
  desc: string;
  icon: LucideIcon;
  /** Page hero. */
  h1: string;
  intro: string;
  sections: SolutionSection[];
  faqs: { q: string; a: string }[];
}

export const SOLUTIONS: Solution[] = [
  {
    slug: 'anonymous-forums',
    label: 'Anonymous Forums',
    desc: 'Discuss openly, without your name attached',
    icon: MessagesSquare,
    h1: 'Anonymous Forums for Honest Workplace Conversations',
    intro:
      'Say the thing you cannot say in a company Slack channel. Affinity Echo forums are anonymous by default, organised by company and by global topic, so you can ask the real question without it following you into your next performance review.',
    sections: [
      {
        icon: EyeOff,
        h2: 'Anonymous by default, not by setting',
        p: 'Every post and comment starts anonymous. There is no toggle to forget and no profile photo quietly attached — identity is something you choose to add later, never something you have to remember to remove.',
      },
      {
        icon: Users,
        h2: 'Your company, or the whole industry',
        p: 'Scope a discussion to colleagues at your own company, or open it to everyone in tech. Category filters and nested threads keep long conversations readable instead of a wall of replies.',
      },
      {
        icon: Sparkles,
        h2: 'Reactions built for support, not applause',
        p: 'Four reactions — seen, validated, inspired, heard — because someone describing a hard week does not need a thumbs up. They need to know they were heard.',
      },
      {
        icon: ShieldCheck,
        h2: 'Moderated for safety',
        p: 'Content flags, reporting, and active moderation. Anonymity protects the person speaking; it is not cover for harassment.',
      },
    ],
    faqs: [
      {
        q: 'Can my employer see what I post?',
        a: 'No. Posts are anonymous and are never attributed to your real name or work email, including in company-scoped forums. Your employer cannot request a list of who posted what.',
      },
      {
        q: 'Is my identity ever revealed automatically?',
        a: 'Never. Identity reveal is opt-in and requires mutual consent from both people in a conversation. Nothing reveals you by default.',
      },
      {
        q: 'How is this different from an anonymous message board?',
        a: 'Forums here sit alongside mentorship, safe spaces and encrypted messaging, and are actively moderated. It is a professional community with anonymity, not an anonymous free-for-all.',
      },
    ],
  },
  {
    slug: 'safe-spaces',
    label: 'Nooks — Safe Spaces',
    desc: 'Small groups around a shared experience',
    icon: ShieldCheck,
    h1: 'Nooks: Safe Spaces for Communities in Tech',
    intro:
      'Nooks are small, topic-focused spaces for people who share an experience — not a follower count. Join one, or start one, and talk to people who already understand the context you would otherwise have to explain.',
    sections: [
      {
        icon: Users,
        h2: 'Built around a shared experience',
        p: 'Hashtag-categorised spaces you can create or join, focused on a specific community or situation rather than a broad channel nobody reads.',
      },
      {
        icon: MessagesSquare,
        h2: 'Real-time, and paced by the room',
        p: 'Messages arrive live. Urgency levels and temperature indicators show whether a Nook needs support right now or is a slow, steady conversation.',
      },
      {
        icon: EyeOff,
        h2: 'Anonymous inside the space',
        p: 'The same anonymity as the rest of the platform. Being in a Nook never publishes what you are dealing with to anyone outside it.',
      },
      {
        icon: ShieldCheck,
        h2: 'Held to the community guidelines',
        p: 'Reporting and moderation apply inside Nooks too, with crisis resources surfaced where they matter.',
      },
    ],
    faqs: [
      {
        q: 'Who can see that I joined a Nook?',
        a: 'Membership is not published to your profile or to your company. What happens in a Nook stays scoped to that Nook.',
      },
      {
        q: 'Can I start my own Nook?',
        a: 'Yes. Any member can create one, give it a focus and hashtags, and invite the community to join.',
      },
      {
        q: 'What if a Nook becomes unsafe?',
        a: 'Report it. Content flags and moderation cover Nooks the same as forums, and crisis resources are always one tap away.',
      },
    ],
  },
  {
    slug: 'mentorship-matching',
    label: 'Mentorship Matching',
    desc: 'Find a mentor who gets your context',
    icon: Users,
    h1: 'AI-Powered Mentorship Matching in Tech',
    intro:
      'Being told to "find a mentor" is not advice. Affinity Echo matches mentors and mentees on expertise, industry, career level and shared affinity — and lets you start the conversation anonymously.',
    sections: [
      {
        icon: Sparkles,
        h2: 'Matching with a compatibility score',
        p: 'AI-assisted matching weighs expertise, industry, career level and affinity tags, so the suggestions are people who can actually help with your situation.',
      },
      {
        icon: Users,
        h2: 'Filter to what matters to you',
        p: 'Narrow by career level, expertise and affinity tags. Someone two steps ahead in your exact field is often more useful than someone ten steps ahead in a different one.',
      },
      {
        icon: EyeOff,
        h2: 'Reach out without exposing yourself',
        p: 'Mentorship requests and conversations begin anonymously. You decide if and when to reveal who you are.',
      },
      {
        icon: MessagesSquare,
        h2: 'A real conversation, not a cold intro',
        p: 'Requests, a follow system, and dedicated mentorship threads keep the relationship in one place instead of scattered across DMs.',
      },
    ],
    faqs: [
      {
        q: 'Do I have to reveal my identity to get a mentor?',
        a: 'No. Mentorship conversations can run entirely anonymously. Reveal is optional and requires both people to agree.',
      },
      {
        q: 'How does the matching work?',
        a: 'It scores compatibility across expertise, industries, career level and affinity tags, then ranks mentors by fit. You can also browse and filter yourself.',
      },
      {
        q: 'Can I be both a mentor and a mentee?',
        a: 'Yes. Most people have something to learn and something to teach, and profiles support both.',
      },
    ],
  },
  {
    slug: 'encrypted-messaging',
    label: 'Encrypted Messaging',
    desc: 'End-to-end encrypted direct messages',
    icon: Lock,
    h1: 'End-to-End Encrypted Anonymous Messaging',
    intro:
      'Direct messages with end-to-end encryption and anonymity on both sides. Talk candidly about a manager, an offer, or a bad situation without leaving a trail that can be read by anyone else.',
    sections: [
      {
        icon: Lock,
        h2: 'End-to-end encrypted',
        p: 'Messages are encrypted so their contents stay between the two people in the conversation.',
      },
      {
        icon: EyeOff,
        h2: 'Anonymous on both sides',
        p: 'You can hold an entire conversation without either person knowing the other’s real name, and identity reveal needs mutual consent.',
      },
      {
        icon: MessagesSquare,
        h2: 'Live, with the signals you expect',
        p: 'Real-time delivery over WebSocket, typing indicators and read receipts — the messaging basics, without the identity cost.',
      },
      {
        icon: Users,
        h2: 'Mentorship kept separate',
        p: 'Mentorship conversations have their own view, so advice threads do not get buried under everything else.',
      },
    ],
    faqs: [
      {
        q: 'Can Affinity Echo read my messages?',
        a: 'Direct messages are end-to-end encrypted, so their contents are not readable in transit or at rest by the platform.',
      },
      {
        q: 'What happens if I reveal my identity and regret it?',
        a: 'Reveal applies to that conversation and requires both sides to agree first. It is deliberately a decision, not a slip.',
      },
      {
        q: 'Are messages moderated?',
        a: 'Harassment can be reported from any conversation. Reporting gives moderators what they need to act while keeping encryption intact for everyone else.',
      },
    ],
  },
  {
    slug: 'identity-reveal',
    label: 'Progressive Identity Reveal',
    desc: 'You choose when you stop being anonymous',
    icon: EyeOff,
    h1: 'Progressive Identity Reveal: Anonymity You Control',
    intro:
      'Most platforms make you choose once: real name or nothing. Affinity Echo treats identity as a dial. Everything starts anonymous, and you reveal — to one person, in one conversation — only when you want to.',
    sections: [
      {
        icon: EyeOff,
        h2: 'Anonymous is the starting state',
        p: 'Every interaction begins anonymous. There is nothing to switch on, and no default that quietly exposes you.',
      },
      {
        icon: Users,
        h2: 'Mutual consent, per conversation',
        p: 'Revealing requires both people to agree, and applies to that conversation only. Revealing to a mentor does not reveal you to a forum.',
      },
      {
        icon: ShieldCheck,
        h2: 'Privacy controls that stay yours',
        p: 'Per-field toggles for email, location and connections, so "revealed" never means "everything is public".',
      },
      {
        icon: Lock,
        h2: 'Your data, exportable',
        p: 'GDPR data export is built in. Knowing you can leave with your data is part of trusting a platform with it.',
      },
    ],
    faqs: [
      {
        q: 'Can I undo a reveal?',
        a: 'Reveal is scoped to a single conversation and needs mutual consent, so it is never accidental. Your other conversations and posts stay anonymous regardless.',
      },
      {
        q: 'Does my company know I am on Affinity Echo?',
        a: 'Selecting your company scopes which forums you can see. It does not tell your employer you are here or what you post.',
      },
      {
        q: 'What is actually shown when I reveal?',
        a: 'Only what your privacy toggles allow — email, location and connections are each controlled separately.',
      },
    ],
  },
  {
    slug: 'ai-thread-analysis',
    label: 'Okestra AI Analysis',
    desc: 'Summaries, themes and safety flags',
    icon: Sparkles,
    h1: 'Okestra AI: Understand a Thread in Seconds',
    intro:
      'Long threads hide the point. Okestra AI reads a discussion and gives you the summary, the themes, where people agree and disagree, and what you might do next — plus safety flags when a conversation needs care.',
    sections: [
      {
        icon: Sparkles,
        h2: 'TL;DR and key themes',
        p: 'A plain-language summary of a long thread, with the recurring themes pulled out so you can see the shape of the discussion at a glance.',
      },
      {
        icon: Users,
        h2: 'Consensus and disagreement',
        p: 'Shows where the community broadly agrees and where it genuinely splits, instead of flattening a debate into one answer.',
      },
      {
        icon: MessagesSquare,
        h2: 'Context-aware',
        p: 'A thread author and a community member need different things, so the analysis differs depending on which one you are.',
      },
      {
        icon: ShieldCheck,
        h2: 'Safety flags',
        p: 'Detects PII, self-harm signals and harassment in a thread, so risky content reaches a human rather than sitting unnoticed.',
      },
    ],
    faqs: [
      {
        q: 'Does the AI read my private messages?',
        a: 'No. Analysis runs on public threads such as forum topics. Direct messages are end-to-end encrypted and are not analysed.',
      },
      {
        q: 'Do the summaries replace reading the thread?',
        a: 'They are a way in, not a substitute. The full discussion is always there, and the summary points to the parts worth your time.',
      },
      {
        q: 'What happens when a safety flag fires?',
        a: 'It surfaces the content for moderation and, where relevant, shows crisis resources. Flags exist to get a person involved, not to auto-delete.',
      },
    ],
  },
];

/** Look up one solution by slug — used by the page route. */
export const solutionBySlug = (slug: string): Solution | undefined =>
  SOLUTIONS.find((s) => s.slug === slug);
