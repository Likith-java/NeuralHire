export interface SeedQuestion {
  prompt: string;
  idealAnswer: string;
  category: string;
}

export const QUESTION_BANK: SeedQuestion[] = [
  {
    prompt: 'Tell me about a project where you had to make a difficult technical trade-off.',
    idealAnswer: 'A strong answer explains the context, alternatives, trade-offs, final decision, measurable impact, and lessons learned.',
    category: 'problem_solving',
  },
  {
    prompt: 'How do you design a frontend system that stays maintainable as product requirements evolve?',
    idealAnswer: 'A strong answer covers modular architecture, state boundaries, API contracts, testing, and observability for regressions.',
    category: 'system_design',
  },
  {
    prompt: 'How do you communicate technical risk to non-technical stakeholders during delivery pressure?',
    idealAnswer: 'A strong answer explains translating risk into business impact, options, trade-offs, and a recommendation with timelines.',
    category: 'communication',
  },
  {
    prompt: 'What does high-quality code mean to you in a collaborative engineering team?',
    idealAnswer: 'A strong answer mentions readability, correctness, testing, reviews, observability, and maintainability over cleverness.',
    category: 'code_quality',
  },
  {
    prompt: 'How would you improve latency in a system with both UI and ML inference in the request path?',
    idealAnswer: 'A strong answer discusses profiling, batching, async boundaries, caching, graceful degradation, and clear SLOs.',
    category: 'technical_depth',
  },
  {
    prompt: 'Describe a time you had to learn a new tool or domain quickly to keep a project moving.',
    idealAnswer: 'A strong answer covers fast learning, experimentation, validation, seeking help efficiently, and applying the new knowledge.',
    category: 'adaptability',
  },
];
