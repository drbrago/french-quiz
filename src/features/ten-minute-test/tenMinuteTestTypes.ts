import type { QuizQuestion, TestTag } from "../../data/chapter4";

export type TenMinuteTestPhase = "intro" | "running" | "results";

export type TenMinuteTestMixRule = {
  tag: TestTag;
  count: number;
};

export type TenMinuteTestBuildResult = {
  questions: QuizQuestion[];
  requestedCount: number;
  warning?: string;
};

export type TenMinuteTestAnswerMap = Record<string, string>;

export type TenMinuteTestQuestionResult = {
  question: QuizQuestion;
  userAnswer: string;
  isBlank: boolean;
  isCorrect: boolean;
};

export type TenMinuteTestResultSummary = {
  correct: number;
  total: number;
  percentage: number;
  timeUsedSeconds: number;
  feedbackText: string;
  items: TenMinuteTestQuestionResult[];
  wrongItems: TenMinuteTestQuestionResult[];
  blankItems: TenMinuteTestQuestionResult[];
  missedItems: TenMinuteTestQuestionResult[];
};

export type BuildTenMinuteTestOptions = {
  questionCount?: number;
  mixRules?: TenMinuteTestMixRule[];
  randomize?: <T>(items: T[]) => T[];
};
