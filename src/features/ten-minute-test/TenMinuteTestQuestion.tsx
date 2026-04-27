import type { QuizQuestion } from "../../data/chapter4";
import { formatCountdown } from "./tenMinuteTestUtils";

type TenMinuteTestQuestionProps = {
  answeredCount: number;
  currentAnswer: string;
  currentIndex: number;
  onAnswerChange: (value: string) => void;
  onClearAnswer: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  question: QuizQuestion;
  timeRemainingSeconds: number;
  totalQuestions: number;
  warning?: string;
};

function TenMinuteTestQuestion({
  answeredCount,
  currentAnswer,
  currentIndex,
  onAnswerChange,
  onClearAnswer,
  onNext,
  onPrevious,
  onSubmit,
  question,
  timeRemainingSeconds,
  totalQuestions,
  warning,
}: TenMinuteTestQuestionProps) {
  const timerClassName = timeRemainingSeconds <= 60 ? "timer-chip is-urgent" : "timer-chip";

  return (
    <main className="page">
      <header className="content-card">
        <div className="timer-row">
          <div className="section-heading">
            <h1>Prov på 10 minuter</h1>
            <p>Svara i din egen takt och lämna in när du är klar. Tiden fortsätter tills provet skickas in.</p>
          </div>
          <div className={timerClassName}>
            <span>Tid kvar</span>
            <strong>{formatCountdown(timeRemainingSeconds)}</strong>
          </div>
        </div>

        <div className="badge-row">
          <span className="badge">
            Fråga {currentIndex + 1} av {totalQuestions}
          </span>
          <span className="badge badge-cool">Besvarade: {answeredCount}</span>
          <span className="badge">{question.category}</span>
        </div>

        {warning ? <div className="feedback-box is-info">{warning}</div> : null}
      </header>

      <section className="content-card">
        <div className="question-card">
          <h2>{question.prompt}</h2>

          {question.type === "multiple-choice" ? (
            <div className="option-grid">
              {question.options?.map((option) => {
                const isSelected = currentAnswer === option;
                const className = isSelected ? "option-button is-selected" : "option-button";

                return (
                  <button className={className} key={option} onClick={() => onAnswerChange(option)}>
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="answer-form">
              <label className="input-label" htmlFor={`${question.id}-ten-minute-answer`}>
                Skriv ditt svar
              </label>
              <input
                id={`${question.id}-ten-minute-answer`}
                className="answer-input"
                value={currentAnswer}
                onChange={(event) => onAnswerChange(event.target.value)}
                placeholder="Du kan lämna tomt om du vill hoppa över"
                autoComplete="off"
              />
            </div>
          )}
        </div>

        <div className="action-row">
          <button className="secondary-button" onClick={onPrevious} disabled={currentIndex === 0}>
            Föregående
          </button>
          <button className="secondary-button" onClick={onClearAnswer} disabled={!currentAnswer}>
            Rensa svar
          </button>
          <button className="secondary-button" onClick={onNext} disabled={currentIndex + 1 === totalQuestions}>
            Nästa
          </button>
          <button className="warning-button" onClick={onSubmit}>
            Lämna in provet
          </button>
        </div>
      </section>
    </main>
  );
}

export default TenMinuteTestQuestion;
