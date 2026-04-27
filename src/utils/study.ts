import type { Flashcard, PracticeItem, QuizQuestion } from "../data/chapter4";

export type QuizResult = {
  questionId: string;
  prompt: string;
  category: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation?: string;
};

export type WeakPracticeItem =
  | {
      id: string;
      kind: "flashcard";
      category: string;
      french: string;
      swedish: string;
    }
  | {
      id: string;
      kind: "question";
      category: string;
      prompt: string;
      answer: string;
      explanation?: string;
    };

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s+([?!.,;:])/g, "$1")
    .replace(/[?!.,;:]+$/g, "");
}

export function isAnswerCorrect(
  userAnswer: string,
  expectedAnswer: string,
  alternatives: string[] = [],
): boolean {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const acceptedAnswers = [expectedAnswer, ...alternatives].map(normalizeAnswer);
  return acceptedAnswers.includes(normalizedUserAnswer);
}

export function buildQuizRound(questions: QuizQuestion[], count: number): QuizQuestion[] {
  const multipleChoice = shuffleArray(questions.filter((question) => question.type === "multiple-choice"));
  const textQuestions = shuffleArray(questions.filter((question) => question.type === "text"));
  const targetTextCount = Math.min(Math.ceil(count / 2), textQuestions.length);
  const targetMultipleChoiceCount = Math.min(Math.floor(count / 2), multipleChoice.length);
  const firstPass = [
    ...textQuestions.slice(0, targetTextCount),
    ...multipleChoice.slice(0, targetMultipleChoiceCount),
  ];
  const usedIds = new Set(firstPass.map((question) => question.id));
  const remainder = shuffleArray(questions).filter((question) => !usedIds.has(question.id));
  return shuffleArray([...firstPass, ...remainder.slice(0, Math.max(0, count - firstPass.length))]).slice(0, count);
}

export function calculateQuizScore(results: QuizResult[]) {
  const correct = results.filter((result) => result.isCorrect).length;
  return {
    correct,
    total: results.length,
    incorrect: results.filter((result) => !result.isCorrect),
  };
}

export function buildWeakPracticeList(
  flashcards: Flashcard[],
  weakFlashcardIds: string[],
  questions: PracticeItem[],
  weakQuestionIds: string[],
): WeakPracticeItem[] {
  const flashcardIdSet = new Set(weakFlashcardIds);
  const questionIdSet = new Set(weakQuestionIds);

  return [
    ...flashcards
      .filter((flashcard) => flashcardIdSet.has(flashcard.id))
      .map<WeakPracticeItem>((flashcard) => ({
        id: flashcard.id,
        kind: "flashcard",
        category: flashcard.category,
        french: flashcard.french,
        swedish: flashcard.swedish,
      })),
    ...questions
      .filter((question) => questionIdSet.has(question.id))
      .map<WeakPracticeItem>((question) => ({
        id: question.id,
        kind: "question",
        category: question.category,
        prompt: question.prompt,
        answer: question.answer,
        explanation: question.explanation,
      })),
  ];
}
