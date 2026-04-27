import { describe, expect, it } from "vitest";
import type { Flashcard, PracticeItem, QuizQuestion } from "../data/chapter4";
import {
  buildQuizRound,
  buildWeakPracticeList,
  calculateQuizScore,
  filterItemsByCategories,
  isAnswerCorrect,
} from "./study";

describe("calculateQuizScore", () => {
  it("counts correct and incorrect answers", () => {
    const score = calculateQuizScore([
      {
        questionId: "one",
        prompt: "Q1",
        category: "Test",
        correctAnswer: "a",
        userAnswer: "a",
        isCorrect: true,
      },
      {
        questionId: "two",
        prompt: "Q2",
        category: "Test",
        correctAnswer: "b",
        userAnswer: "c",
        isCorrect: false,
      },
    ]);

    expect(score.correct).toBe(1);
    expect(score.total).toBe(2);
    expect(score.incorrect).toHaveLength(1);
    expect(score.incorrect[0]?.questionId).toBe("two");
  });
});

describe("buildWeakPracticeList", () => {
  it("keeps only weak flashcards and weak questions", () => {
    const flashcards: Flashcard[] = [
      { id: "flash-1", category: "Dagar", french: "lundi", swedish: "mandag" },
      { id: "flash-2", category: "Familj", french: "maman", swedish: "mamma" },
    ];
    const questions: PracticeItem[] = [
      { id: "question-1", category: "Faire", prompt: "tu ____", answer: "fais" },
      { id: "question-2", category: "Vader", prompt: "Det regnar.", answer: "Il pleut." },
    ];

    const weakItems = buildWeakPracticeList(flashcards, ["flash-2"], questions, ["question-1"]);

    expect(weakItems).toEqual([
      {
        id: "flash-2",
        kind: "flashcard",
        category: "Familj",
        french: "maman",
        swedish: "mamma",
      },
      {
        id: "question-1",
        kind: "question",
        category: "Faire",
        prompt: "tu ____",
        answer: "fais",
        explanation: undefined,
      },
    ]);
  });
});

describe("buildQuizRound", () => {
  it("returns the requested amount with both question types when available", () => {
    const questions: QuizQuestion[] = [
      {
        id: "mc-1",
        category: "Dagar",
        type: "multiple-choice",
        prompt: "MC 1",
        answer: "A",
        options: ["A", "B"],
      },
      {
        id: "mc-2",
        category: "Dagar",
        type: "multiple-choice",
        prompt: "MC 2",
        answer: "A",
        options: ["A", "B"],
      },
      {
        id: "text-1",
        category: "Faire",
        type: "text",
        prompt: "Text 1",
        answer: "fais",
      },
      {
        id: "text-2",
        category: "Faire",
        type: "text",
        prompt: "Text 2",
        answer: "fait",
      },
    ];

    const round = buildQuizRound(questions, 4);

    expect(round).toHaveLength(4);
    expect(round.some((question) => question.type === "multiple-choice")).toBe(true);
    expect(round.some((question) => question.type === "text")).toBe(true);
  });
});

describe("filterItemsByCategories", () => {
  it("keeps only items that belong to the requested categories", () => {
    const items: PracticeItem[] = [
      { id: "one", category: "Väder och årstider", prompt: "Q1", answer: "A1" },
      { id: "two", category: "Tal 80–200", prompt: "Q2", answer: "A2" },
      { id: "three", category: "Väder och årstider", prompt: "Q3", answer: "A3" },
    ];

    expect(filterItemsByCategories(items, ["Väder och årstider"])).toEqual([
      { id: "one", category: "Väder och årstider", prompt: "Q1", answer: "A1" },
      { id: "three", category: "Väder och årstider", prompt: "Q3", answer: "A3" },
    ]);
  });
});

describe("isAnswerCorrect", () => {
  it("accepts answers case-insensitively", () => {
    expect(isAnswerCorrect("SUÉDOISE", "suédoise")).toBe(true);
    expect(isAnswerCorrect("Il pleut.", "il pleut")).toBe(true);
  });

  it("accepts answers with different punctuation apostrophes", () => {
    expect(isAnswerCorrect("Qu'est-ce que tu fais", "Qu'est-ce que tu fais ?")).toBe(true);
    expect(isAnswerCorrect("il n'a pas le temps", "Il n’a pas le temps.")).toBe(true);
  });

  it("trims surrounding whitespace from answers", () => {
    expect(isAnswerCorrect("   cent   ", "cent")).toBe(true);
    expect(isAnswerCorrect("\n  Je joue au tennis. \t", "Je joue au tennis.")).toBe(true);
  });
});
