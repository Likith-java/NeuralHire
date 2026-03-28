export const mockSession = {
  sessionId: 'demo-1',
  jobRole: 'Backend Engineer',
  requiredSkills: ['Node.js', 'PostgreSQL', 'System Design'],
  difficulty: 'deep-dive',
  inputMode: 'text',
};

export const mockMessages = [
  {
    id: '1',
    role: 'aria',
    text: "Hello! I'm ARIA. Let's start with your experience in Node.js. How do you handle asynchronous operations at scale?",
    timestamp: '10:00 AM',
  },
  {
    id: '2',
    role: 'candidate',
    text: "I primarily use async/await and Promises. For scaling, I use worker threads or microservices to offload heavy tasks.",
    timestamp: '10:02 AM',
  },
  {
    id: '3',
    role: 'aria',
    text: "That's a solid approach. Regarding PostgreSQL, how do you optimize complex queries with multiple joins?",
    timestamp: '10:03 AM',
  },
  {
    id: '4',
    role: 'candidate',
    text: "I use indexing, analyze query plans, and sometimes denormalize data for read-heavy operations.",
    timestamp: '10:05 AM',
  },
  {
    id: '5',
    role: 'aria',
    text: "Good. Now, how would you design a distributed rate limiter for a high-traffic API?",
    timestamp: '10:06 AM',
  },
  {
    id: '6',
    role: 'candidate',
    text: "I'd use Redis with a sliding window algorithm to ensure consistency across multiple instances.",
    timestamp: '10:08 AM',
  },
];

export const mockScores = {
  problemSolving: 7.2,
  systemDesign: 6.8,
  communication: 8.5,
  codeQuality: 7.5,
  technicalDepth: 7.0,
  adaptability: 8.0,
};

export const mockReport = {
  sessionId: 'demo-1',
  candidateName: 'Priya Sharma',
  jobRole: 'Backend Engineer',
  overallScore: 7.5,
  scores: mockScores,
  confidenceScore: 8.2,
  clarityScore: 7.8,
  depthScore: 7.1,
  semanticMatch: 88,
  feedback: [
    "Strong understanding of Node.js event loop and scaling patterns.",
    "Good grasp of database optimization techniques.",
    "Excellent communication and clarity in explaining complex systems.",
    "Could improve on specific details of distributed consistency models."
  ],
  transcript: mockMessages,
};

export const profileA = {
  id: 'priya-1',
  name: 'Priya Sharma',
  role: 'Senior Backend Engineer',
  skills: ['Node.js', 'PostgreSQL', 'System Design', 'Redis', 'AWS'],
  experience: '6 years',
  strength: 'System Architecture',
  scenario: 'Strong Candidate Flow',
  bio: 'Passionate about building scalable distributed systems and optimizing database performance.',
  avatar: 'https://picsum.photos/seed/priya/200',
};

export const profileB = {
  id: 'rohan-1',
  name: 'Rohan Gupta',
  role: 'Full Stack Developer',
  skills: ['React', 'Node.js', 'MongoDB', 'Docker'],
  experience: '3 years',
  strength: 'Frontend Performance',
  scenario: 'Adaptive Drilling Flow',
  bio: 'Specializing in high-performance frontend applications and modern web technologies.',
  avatar: 'https://picsum.photos/seed/rohan/200',
};

export const profileC = {
  id: 'arjun-1',
  name: 'Arjun Das',
  role: 'Software Engineer (ASL)',
  skills: ['Python', 'Django', 'React', 'PostgreSQL'],
  experience: '4 years',
  strength: 'Algorithmic Thinking',
  scenario: 'Sign Language Demo',
  bio: 'Expert in Python backend development and accessibility-focused software design.',
  avatar: 'https://picsum.photos/seed/arjun/200',
};

export const MOCK_CANDIDATES = [profileA, profileB, profileC];
