import { useEffect, useRef, useState } from "react";
import type { QuizQuestion } from "../../data/chapter4";
import TenMinuteTestIntro from "./TenMinuteTestIntro";
import TenMinuteTestQuestion from "./TenMinuteTestQuestion";
import TenMinuteTestResults from "./TenMinuteTestResults";
import type { TenMinuteTestAnswerMap, TenMinuteTestBuildResult, TenMinuteTestPhase, TenMinuteTestResultSummary } from "./tenMinuteTestTypes";
import {
  buildTenMinuteTest,
  calculateTenMinuteTestResults,
  normalizeAnswer,
  TEN_MINUTE_TEST_DURATION_SECONDS,
} from "./tenMinuteTestUtils";

type TenMinuteTestProps = {
  onBack: () => void;
  onMarkWeak: (id: string) => void;
  onOpenWeak: () => void;
  questions: QuizQuestion[];
};

function TenMinuteTest({ onBack, onMarkWeak, onOpenWeak, questions }: TenMinuteTestProps) {
  const [phase, setPhase] = useState<TenMinuteTestPhase>("intro");
  const [buildResult, setBuildResult] = useState<TenMinuteTestBuildResult | null>(null);
  const [answers, setAnswers] = useState<TenMinuteTestAnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(TEN_MINUTE_TEST_DURATION_SECONDS);
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [result, setResult] = useState<TenMinuteTestResultSummary | null>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (phase !== "running" || deadlineMs === null) {
      return;
    }

    const activeDeadlineMs = deadlineMs;

    function updateTimeRemaining() {
      const nextRemaining = Math.max(0, Math.ceil((activeDeadlineMs - Date.now()) / 1000));
      setTimeRemainingSeconds(nextRemaining);
    }

    updateTimeRemaining();
    const intervalId = window.setInterval(updateTimeRemaining, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [deadlineMs, phase]);

  useEffect(() => {
    if (phase === "running" && timeRemainingSeconds === 0) {
      submitTest(0);
    }
  }, [phase, timeRemainingSeconds]);

  function startTest() {
    const nextBuildResult = buildTenMinuteTest(questions);

    hasSubmittedRef.current = false;
    setBuildResult(nextBuildResult);
    setAnswers({});
    setCurrentIndex(0);
    setTimeRemainingSeconds(TEN_MINUTE_TEST_DURATION_SECONDS);
    setDeadlineMs(Date.now() + TEN_MINUTE_TEST_DURATION_SECONDS * 1000);
    setResult(null);
    setPhase("running");
  }

  function submitTest(remainingSecondsOverride = timeRemainingSeconds) {
    if (phase !== "running" || !buildResult || hasSubmittedRef.current) {
      return;
    }

    hasSubmittedRef.current = true;
    const timeUsedSeconds = Math.max(0, TEN_MINUTE_TEST_DURATION_SECONDS - remainingSecondsOverride);
    const nextResult = calculateTenMinuteTestResults(buildResult.questions, answers, timeUsedSeconds);

    nextResult.missedItems.forEach((item) => {
      onMarkWeak(item.question.id);
    });

    setDeadlineMs(null);
    setResult(nextResult);
    setPhase("results");
  }

  if (phase === "intro") {
    return <TenMinuteTestIntro onBack={onBack} onStart={startTest} />;
  }

  if (!buildResult) {
    return <TenMinuteTestIntro onBack={onBack} onStart={startTest} />;
  }

  if (phase === "results" && result) {
    return (
      <TenMinuteTestResults
        onBack={onBack}
        onOpenWeak={onOpenWeak}
        onRestart={startTest}
        result={result}
        warning={buildResult.warning}
      />
    );
  }

  const currentQuestion = buildResult.questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] ?? "" : "";
  const answeredCount = buildResult.questions.filter((question) => normalizeAnswer(answers[question.id] ?? "") !== "").length;

  if (!currentQuestion) {
    return (
      <TenMinuteTestResults
        onBack={onBack}
        onOpenWeak={onOpenWeak}
        onRestart={startTest}
        result={
          result ??
          calculateTenMinuteTestResults(
            buildResult.questions,
            answers,
            TEN_MINUTE_TEST_DURATION_SECONDS - timeRemainingSeconds,
          )
        }
        warning={buildResult.warning}
      />
    );
  }

  return (
    <TenMinuteTestQuestion
      answeredCount={answeredCount}
      currentAnswer={currentAnswer}
      currentIndex={currentIndex}
      onAnswerChange={(value) => {
        setAnswers((currentAnswers) => ({
          ...currentAnswers,
          [currentQuestion.id]: value,
        }));
      }}
      onClearAnswer={() => {
        setAnswers((currentAnswers) => ({
          ...currentAnswers,
          [currentQuestion.id]: "",
        }));
      }}
      onNext={() => {
        setCurrentIndex((index) => Math.min(buildResult.questions.length - 1, index + 1));
      }}
      onPrevious={() => {
        setCurrentIndex((index) => Math.max(0, index - 1));
      }}
      onSubmit={() => submitTest()}
      question={currentQuestion}
      timeRemainingSeconds={timeRemainingSeconds}
      totalQuestions={buildResult.questions.length}
      warning={buildResult.warning}
    />
  );
}

export default TenMinuteTest;
