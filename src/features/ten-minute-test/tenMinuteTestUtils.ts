import type { QuizQuestion } from "../../data/chapter4";
import { shuffleArray } from "../../utils/study";
import type {
  BuildTenMinuteTestOptions,
  TenMinuteTestAnswerMap,
  TenMinuteTestBuildResult,
  TenMinuteTestMixRule,
  TenMinuteTestQuestionResult,
  TenMinuteTestResultSummary,
} from "./tenMinuteTestTypes";

export const TEN_MINUTE_TEST_DURATION_SECONDS = 10 * 60;
export const TEN_MINUTE_TEST_QUESTION_COUNT = 20;

export const TEN_MINUTE_TEST_MIX: TenMinuteTestMixRule[] = [
  { tag: "vocabulary", count: 3 },
  { tag: "sentence", count: 3 },
  { tag: "faire", count: 3 },
  { tag: "weather", count: 3 },
  { tag: "country", count: 3 },
  { tag: "numbers", count: 3 },
  { tag: "comprehension", count: 2 },
];

function hasTag(question: QuizQuestion, tag: TenMinuteTestMixRule["tag"]): boolean {
  return question.testTags?.includes(tag) ?? false;
}

export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.?!])/g, "$1")
    .replace(/[.?!]+$/g, "");
}

export function isCorrectAnswer(
  userAnswer: string,
  correctAnswer: string,
  alternatives: string[] = [],
): boolean {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);

  if (!normalizedUserAnswer) {
    return false;
  }

  const acceptedAnswers = [correctAnswer, ...alternatives].map(normalizeAnswer);
  return acceptedAnswers.includes(normalizedUserAnswer);
}

export function buildTenMinuteTest(
  questions: QuizQuestion[],
  options: BuildTenMinuteTestOptions = {},
): TenMinuteTestBuildResult {
  const randomize = options.randomize ?? shuffleArray;
  const mixRules = options.mixRules ?? TEN_MINUTE_TEST_MIX;
  const requestedCount = options.questionCount ?? TEN_MINUTE_TEST_QUESTION_COUNT;
  const targetCount = Math.min(requestedCount, questions.length);
  const warning =
    questions.length < requestedCount
      ? `Det finns bara ${questions.length} frågor tillgängliga just nu, så provet använder alla som finns.`
      : undefined;

  const selected: QuizQuestion[] = [];
  const usedIds = new Set<string>();

  for (const rule of mixRules) {
    const matchingQuestions = randomize(
      questions.filter((question) => !usedIds.has(question.id) && hasTag(question, rule.tag)),
    );

    for (const question of matchingQuestions.slice(0, rule.count)) {
      selected.push(question);
      usedIds.add(question.id);
    }
  }

  const remainingQuestions = randomize(questions.filter((question) => !usedIds.has(question.id)));
  const fillerCount = Math.max(0, targetCount - selected.length);
  const completeSelection = randomize([...selected, ...remainingQuestions.slice(0, fillerCount)]);

  return {
    questions: completeSelection.slice(0, targetCount),
    requestedCount,
    warning,
  };
}

export function calculateResultPercentage(correct: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((correct / total) * 100);
}

export function getResultFeedback(percentage: number): string {
  if (percentage >= 90) {
    return "Starkt. Det här sitter.";
  }

  if (percentage >= 75) {
    return "Bra. Några luckor kvar.";
  }

  if (percentage >= 50) {
    return "Okej grund, men mer träning behövs.";
  }

  return "Här behöver vi nöta mer.";
}

export function calculateTenMinuteTestResults(
  questions: QuizQuestion[],
  answers: TenMinuteTestAnswerMap,
  timeUsedSeconds: number,
): TenMinuteTestResultSummary {
  const items = questions.map<TenMinuteTestQuestionResult>((question) => {
    const userAnswer = answers[question.id] ?? "";
    const isBlank = normalizeAnswer(userAnswer) === "";
    const isCorrect = !isBlank && isCorrectAnswer(userAnswer, question.answer, question.alternatives ?? []);

    return {
      question,
      userAnswer,
      isBlank,
      isCorrect,
    };
  });

  const correct = items.filter((item) => item.isCorrect).length;
  const wrongItems = items.filter((item) => !item.isCorrect && !item.isBlank);
  const blankItems = items.filter((item) => item.isBlank);
  const percentage = calculateResultPercentage(correct, questions.length);

  return {
    correct,
    total: questions.length,
    percentage,
    timeUsedSeconds,
    feedbackText: getResultFeedback(percentage),
    items,
    wrongItems,
    blankItems,
    missedItems: items.filter((item) => !item.isCorrect),
  };
}

export function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
