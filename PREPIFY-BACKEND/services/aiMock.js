// Deterministic stand-ins for Gemini, used when AI_MOCK=true (local dev without a key, and tests).

export function mcq({ domain, level, numQuestions }) {
  return Array.from({ length: numQuestions }, (_, i) => ({
    id: i + 1,
    question: `[mock] ${domain} question ${i + 1}?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: "Option A",
    explanation: "Option A is correct in mock mode.",
    topic: i % 2 === 0 ? `${domain} basics` : `${domain} advanced`,
    type: "MCQ",
    difficulty: level,
  }));
}

export function voicePlan({ role, numQuestions }) {
  return Array.from({ length: numQuestions }, (_, i) => ({
    id: i + 1,
    question: `[mock] Tell me about ${role} topic number ${i + 1}.`,
    focus: "Clear explanation with an example",
  }));
}

export function voiceFeedback({ questions }) {
  return {
    overallScore: 72,
    summary: "Mock feedback: solid answers with room to add structure.",
    scores: { communication: 75, technicalAccuracy: 70, structure: 65, confidence: 78 },
    fillerWords: { count: 4, examples: ["um", "like"] },
    perQuestion: questions.map((q) => ({
      question: q.question,
      answerSummary: "Mock answer summary",
      score: 72,
      feedback: "Add a concrete example.",
    })),
    strengths: ["Clear voice", "Good examples", "Stayed on topic"],
    improvements: ["Use STAR", "Fewer fillers", "Quantify impact"],
  };
}

export function resume() {
  return {
    summary: "Mock candidate: a developer with full-stack project experience.",
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    projects: ["Prepify — AI interview prep platform"],
    experienceLevel: "junior",
    suggestedRoles: ["Frontend Developer", "Full-Stack Developer"],
    gaps: ["System design", "Testing"],
  };
}

export function codeReview() {
  return {
    summary: "Mock review: correct approach.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    quality: 80,
    suggestions: ["Handle empty input explicitly"],
  };
}
