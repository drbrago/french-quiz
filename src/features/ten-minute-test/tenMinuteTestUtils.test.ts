import { describe, expect, it } from "vitest";
import type { QuizQuestion, TestTag } from "../../data/chapter4";
import {
  buildTenMinuteTest,
  calculateResultPercentage,
  isCorrectAnswer,
  normalizeAnswer,
  TEN_MINUTE_TEST_MIX,
} from "./tenMinuteTestUtils";

function createQuestion(id: string, testTags: TestTag[] = []): QuizQuestion {
  return {
    id,
    category: "Test",
    type: "text",
    prompt: `Prompt ${id}`,
    answer: `answer-${id}`,
    testTags,
  };
}

describe("normalizeAnswer", () => {
  it("trims, lowercases, normalizes apostrophes, punctuation, and accents", () => {
    expect(normalizeAnswer("  Écouter ! ")).toBe("ecouter");
    expect(normalizeAnswer("Qu’est-ce que tu fais?")).toBe("qu'est-ce que tu fais");
  });
});

describe("isCorrectAnswer", () => {
  it("accepts accent-insensitive answers", () => {
    expect(isCorrectAnswer("ecouter", "écouter")).toBe(true);
    expect(isCorrectAnswer("francais", "français")).toBe(true);
  });

  it("treats blank answers as incorrect", () => {
    expect(isCorrectAnswer("", "bonjour")).toBe(false);
    expect(isCorrectAnswer("   ", "bonjour")).toBe(false);
  });
});

describe("buildTenMinuteTest", () => {
  it("builds a balanced 20-question selection when enough tagged questions exist", () => {
    const questions = [
      createQuestion("v1", ["vocabulary"]),
      createQuestion("v2", ["vocabulary"]),
      createQuestion("v3", ["vocabulary"]),
      createQuestion("s1", ["sentence"]),
      createQuestion("s2", ["sentence"]),
      createQuestion("s3", ["sentence"]),
      createQuestion("f1", ["faire"]),
      createQuestion("f2", ["faire"]),
      createQuestion("f3", ["faire"]),
      createQuestion("w1", ["weather"]),
      createQuestion("w2", ["weather"]),
      createQuestion("w3", ["weather"]),
      createQuestion("c1", ["country"]),
      createQuestion("c2", ["country"]),
      createQuestion("c3", ["country"]),
      createQuestion("n1", ["numbers"]),
      createQuestion("n2", ["numbers"]),
      createQuestion("n3", ["numbers"]),
      createQuestion("k1", ["comprehension"]),
      createQuestion("k2", ["comprehension"]),
    ];

    const result = buildTenMinuteTest(questions, {
      randomize: <T>(items: T[]) => [...items],
    });

    expect(result.questions).toHaveLength(20);

    for (const rule of TEN_MINUTE_TEST_MIX) {
      expect(result.questions.filter((question) => question.testTags?.includes(rule.tag)).length).toBe(rule.count);
    }
  });

  it("never returns duplicate questions", () => {
    const questions = [
      createQuestion("v1", ["vocabulary"]),
      createQuestion("v2", ["vocabulary"]),
      createQuestion("v3", ["vocabulary"]),
      createQuestion("extra-1"),
      createQuestion("extra-2"),
      createQuestion("extra-3"),
    ];

    const result = buildTenMinuteTest(questions, {
      questionCount: 5,
      mixRules: [{ tag: "vocabulary", count: 3 }],
      randomize: <T>(items: T[]) => [...items],
    });

    expect(new Set(result.questions.map((question) => question.id)).size).toBe(result.questions.length);
  });

  it("fills with unused fallback questions when a tag does not have enough matches", () => {
    const questions = [
      createQuestion("v1", ["vocabulary"]),
      createQuestion("extra-1"),
      createQuestion("extra-2"),
      createQuestion("extra-3"),
    ];

    const result = buildTenMinuteTest(questions, {
      questionCount: 4,
      mixRules: [{ tag: "vocabulary", count: 3 }],
      randomize: <T>(items: T[]) => [...items],
    });

    expect(result.questions).toHaveLength(4);
    expect(result.questions.map((question) => question.id)).toEqual(["v1", "extra-1", "extra-2", "extra-3"]);
  });
});

describe("calculateResultPercentage", () => {
  it("calculates rounded percentage scores", () => {
    expect(calculateResultPercentage(15, 20)).toBe(75);
    expect(calculateResultPercentage(0, 20)).toBe(0);
  });
});
