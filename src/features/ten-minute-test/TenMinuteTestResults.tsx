import { formatCountdown, TEN_MINUTE_TEST_DURATION_SECONDS } from "./tenMinuteTestUtils";
import type { TenMinuteTestResultSummary } from "./tenMinuteTestTypes";

type TenMinuteTestResultsProps = {
  onBack: () => void;
  onOpenWeak: () => void;
  onRestart: () => void;
  result: TenMinuteTestResultSummary;
  warning?: string;
};

function TenMinuteTestResults({
  onBack,
  onOpenWeak,
  onRestart,
  result,
  warning,
}: TenMinuteTestResultsProps) {
  return (
    <main className="page">
      <header className="content-card">
        <div className="header-row">
          <button className="ghost-button" onClick={onBack}>
            Till startsidan
          </button>
        </div>
        <div className="section-heading">
          <h1>Resultat: Prov på 10 minuter</h1>
          <p>Alla fel och tomma svar är sparade till svagträningen.</p>
        </div>
      </header>

      <section className="content-card">
        <div className="result-card">
          <h2>{result.feedbackText}</h2>
          <p className="score-value">
            {result.correct} / {result.total}
          </p>
          <p className="muted-text">{result.percentage}% rätt.</p>
          <p className="muted-text">
            Tid använd: {formatCountdown(result.timeUsedSeconds)} av {formatCountdown(TEN_MINUTE_TEST_DURATION_SECONDS)}
          </p>
          <p className="muted-text">
            Fel svar: {result.wrongItems.length}. Tomma svar: {result.blankItems.length}.
          </p>

          {warning ? <div className="feedback-box is-info">{warning}</div> : null}

          <div className="action-row">
            <button className="primary-button" onClick={onOpenWeak}>
              Träna på mina fel
            </button>
            <button className="secondary-button" onClick={onRestart}>
              Gör nytt 10-minutersprov
            </button>
            <button className="secondary-button" onClick={onBack}>
              Till startsidan
            </button>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h2>Fel och tomma svar</h2>
          <p>Här ser du allt som behöver repeteras från provrundan.</p>
        </div>

        {result.missedItems.length > 0 ? (
          <div className="result-list">
            {result.missedItems.map((item) => (
              <article className="result-item" key={item.question.id}>
                <div className="badge-row">
                  <span className="badge">{item.question.category}</span>
                  <span className={item.isBlank ? "badge badge-warm" : "badge badge-cool"}>
                    {item.isBlank ? "Blankt svar" : "Fel svar"}
                  </span>
                </div>
                <h3>{item.question.prompt}</h3>
                <p>Du svarade: {item.userAnswer.trim() ? item.userAnswer : "Inget svar"}</p>
                <p>Rätt svar: {item.question.answer}</p>
                {item.question.explanation ? <p>{item.question.explanation}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="feedback-box is-correct">
            <strong>Alla rätt.</strong>
            <p>Du hade inga fel eller tomma svar i den här rundan.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default TenMinuteTestResults;
