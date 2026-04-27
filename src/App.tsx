import { useEffect, useState } from "react";
import {
  allPracticeQuestions,
  faireExercises,
  flashcards,
  focusedPracticeModes,
  miniTestQuestions,
  quizQuestions,
  sentenceExercises,
  studyTips,
  translationExercises,
  type Flashcard,
  type PracticeItem,
  type QuizQuestion,
  type Tip,
} from "./data/chapter4";
import {
  buildQuizRound,
  buildWeakPracticeList,
  calculateQuizScore,
  filterItemsByCategories,
  isAnswerCorrect,
  shuffleArray,
  type QuizResult,
  type WeakPracticeItem,
} from "./utils/study";
import TenMinuteTest from "./features/ten-minute-test/TenMinuteTest";

type Mode =
  | "home"
  | "flashcards"
  | "faire"
  | "sentences"
  | "quiz"
  | "mini-test"
  | "tenMinuteTest"
  | "focused"
  | "weak";
type SentenceTab = "fill" | "translation";
type CardSide = "french" | "swedish";

type LastScore = {
  correct: number;
  total: number;
  savedAt: string;
};

type FlashcardSessionItem = {
  card: Flashcard;
  frontSide: CardSide;
};

type WeakSessionItem =
  | {
      id: string;
      kind: "flashcard";
      category: string;
      prompt: string;
      answer: string;
    }
  | {
      id: string;
      kind: "question";
      category: string;
      prompt: string;
      answer: string;
      explanation?: string;
    };

function createFlashcardSession(cards: Flashcard[]): FlashcardSessionItem[] {
  return shuffleArray(cards).map((card) => ({
    card,
    frontSide: Math.random() > 0.5 ? "french" : "swedish",
  }));
}

function createWeakSession(items: WeakPracticeItem[]): WeakSessionItem[] {
  return shuffleArray(items).map((item) => {
    if (item.kind === "flashcard") {
      const frontSide = Math.random() > 0.5 ? "french" : "swedish";
      return {
        id: item.id,
        kind: "flashcard",
        category: item.category,
        prompt: frontSide === "french" ? item.french : item.swedish,
        answer: frontSide === "french" ? item.swedish : item.french,
      };
    }

    return item;
  });
}

function createQuizSession(questions: QuizQuestion[], count: number): QuizQuestion[] {
  return buildQuizRound(questions, Math.min(count, questions.length));
}

function getTipsByIds(tipIds?: string[]): Tip[] {
  if (!tipIds || tipIds.length === 0) {
    return [];
  }

  const tipIdSet = new Set(tipIds);
  return studyTips.filter((tip) => tipIdSet.has(tip.id));
}

function App() {
  const [mode, setMode] = useState<Mode>("home");
  const [sentenceTab, setSentenceTab] = useState<SentenceTab>("fill");
  const [selectedFocusId, setSelectedFocusId] = useState("all-questions");
  const [weakFlashcardIds, setWeakFlashcardIds] = useLocalStorageState<string[]>("chapter4-weak-flashcards", []);
  const [weakQuestionIds, setWeakQuestionIds] = useLocalStorageState<string[]>("chapter4-weak-questions", []);
  const [lastScore, setLastScore] = useLocalStorageState<LastScore | null>("chapter4-last-score", null);

  const weakPracticeItems = buildWeakPracticeList(
    flashcards,
    weakFlashcardIds,
    allPracticeQuestions,
    weakQuestionIds,
  );

  const selectedFocus = focusedPracticeModes.find((item) => item.id === selectedFocusId);
  const focusedItems =
    selectedFocus?.source === "questions"
      ? filterItemsByCategories(allPracticeQuestions, selectedFocus.categories)
      : [];

  function addWeakFlashcard(id: string) {
    setWeakFlashcardIds((currentIds) => (currentIds.includes(id) ? currentIds : [...currentIds, id]));
  }

  function removeWeakFlashcard(id: string) {
    setWeakFlashcardIds((currentIds) => currentIds.filter((currentId) => currentId !== id));
  }

  function addWeakQuestion(id: string) {
    setWeakQuestionIds((currentIds) => (currentIds.includes(id) ? currentIds : [...currentIds, id]));
  }

  function removeWeakQuestion(id: string) {
    setWeakQuestionIds((currentIds) => currentIds.filter((currentId) => currentId !== id));
  }

  function openFocusedMode(focusId: string) {
    const nextFocus = focusedPracticeModes.find((item) => item.id === focusId);

    if (!nextFocus) {
      return;
    }

    setSelectedFocusId(focusId);

    if (nextFocus.source === "flashcards") {
      setMode("flashcards");
      return;
    }

    if (nextFocus.source === "sentences") {
      setSentenceTab("fill");
      setMode("sentences");
      return;
    }

    if (nextFocus.source === "faire") {
      setMode("faire");
      return;
    }

    if (nextFocus.source === "weak") {
      setMode("weak");
      return;
    }

    setMode("focused");
  }

  let page: JSX.Element;

  if (mode === "home") {
    page = <StartPage lastScore={lastScore} onOpenMode={setMode} onOpenFocusedMode={openFocusedMode} />;
  } else if (mode === "flashcards") {
    page = (
      <FlashcardsPage
        cards={flashcards}
        weakFlashcardIds={weakFlashcardIds}
        onBack={() => setMode("home")}
        onMarkKnown={removeWeakFlashcard}
        onMarkWeak={addWeakFlashcard}
      />
    );
  } else if (mode === "faire") {
    page = (
      <TextPracticePage
        title="Träna verbet faire"
        subtitle="Fyll i rätt form av faire. Du får direkt återkoppling efter varje svar."
        items={faireExercises}
        inputLabel="Skriv den saknade formen"
        inputPlaceholder="Till exempel: fais"
        tips={studyTips.filter((tip) => tip.id === "tip-faire" || tip.id === "tip-il-fait")}
        onBack={() => setMode("home")}
        onMarkKnown={removeWeakQuestion}
        onMarkWeak={addWeakQuestion}
      />
    );
  } else if (mode === "sentences") {
    page = (
      <SentencePracticePage
        sentenceTab={sentenceTab}
        onChangeTab={setSentenceTab}
        onBack={() => setMode("home")}
        onMarkKnown={removeWeakQuestion}
        onMarkWeak={addWeakQuestion}
      />
    );
  } else if (mode === "quiz") {
    page = (
      <QuizPage
        questions={quizQuestions}
        questionCount={15}
        title="Quizläge"
        description="Femton blandade frågor från hela kapitlet. Resultatet sparas lokalt så att du kan följa senaste rundan."
        resultTitle="Quizet är klart"
        tips={studyTips.filter((tip) => tip.id === "tip-jouer" || tip.id === "tip-weekdays")}
        onBack={() => setMode("home")}
        onMarkWeak={addWeakQuestion}
        onSaveScore={setLastScore}
      />
    );
  } else if (mode === "mini-test") {
    page = (
      <QuizPage
        questions={miniTestQuestions}
        questionCount={20}
        title="Provträning"
        description="Tjugo frågor med glosor, luckor, faire, väder, länder, tal och läsförståelse. Alla fel går att träna direkt efteråt."
        resultTitle="Provträningen är klar"
        restartLabel="Gör ett nytt prov"
        enableRetryIncorrect
        tips={getTipsByIds(["tip-faire", "tip-countries", "tip-weather-seasons", "tip-numbers"])}
        onBack={() => setMode("home")}
        onMarkWeak={addWeakQuestion}
        onSaveScore={setLastScore}
      />
    );
  } else if (mode === "tenMinuteTest") {
    page = (
      <TenMinuteTest
        questions={quizQuestions}
        onBack={() => setMode("home")}
        onMarkWeak={addWeakQuestion}
        onOpenWeak={() => setMode("weak")}
      />
    );
  } else if (mode === "focused" && selectedFocus?.source === "questions") {
    page = (
      <TextPracticePage
        title={selectedFocus.title}
        subtitle={selectedFocus.description}
        items={focusedItems}
        inputLabel="Skriv ditt svar"
        inputPlaceholder="Skriv här"
        tips={getTipsByIds(selectedFocus.tipIds)}
        onBack={() => setMode("home")}
        onMarkKnown={removeWeakQuestion}
        onMarkWeak={addWeakQuestion}
      />
    );
  } else {
    page = (
      <WeakPracticePage
        items={weakPracticeItems}
        onBack={() => setMode("home")}
        onRemoveFlashcard={removeWeakFlashcard}
        onRemoveQuestion={removeWeakQuestion}
      />
    );
  }

  return <div className="app-shell">{page}</div>;
}

function StartPage({
  lastScore,
  onOpenMode,
  onOpenFocusedMode,
}: {
  lastScore: LastScore | null;
  onOpenMode: (mode: Mode) => void;
  onOpenFocusedMode: (focusId: string) => void;
}) {
  const formattedScoreDate = lastScore
    ? new Date(lastScore.savedAt).toLocaleString("sv-SE", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <main className="page">
      <section className="hero-card">
        <div className="eyebrow">Kapitel 4</div>
        <h1>Franskaprov kapitel 4</h1>
        <p className="hero-copy">
          Öva glosor, väder, faire, Kanada och Québec, länder och nationaliteter, tal, beskrivningar
          och läsförståelse från kapitel 4. Allt fungerar lokalt i mobilen eller på datorn.
        </p>

        {lastScore ? (
          <div className="score-chip">
            Senaste sparade resultat: <strong>{lastScore.correct} / {lastScore.total}</strong>
            {formattedScoreDate ? <span>· {formattedScoreDate}</span> : null}
          </div>
        ) : null}

        <div className="button-grid">
          <button className="primary-button" onClick={() => onOpenMode("flashcards")}>
            Träna glosor
          </button>
          <button className="primary-button" onClick={() => onOpenMode("faire")}>
            Träna verbet faire
          </button>
          <button className="primary-button" onClick={() => onOpenMode("sentences")}>
            Träna meningar
          </button>
          <button className="primary-button" onClick={() => onOpenMode("quiz")}>
            Quizläge
          </button>
          <button className="primary-button" onClick={() => onOpenMode("mini-test")}>
            Provträning
          </button>
          <button className="primary-button" onClick={() => onOpenMode("tenMinuteTest")}>
            Prov på 10 minuter
          </button>
          <button className="secondary-button" onClick={() => onOpenMode("weak")}>
            Fel jag behöver öva på
          </button>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h2>Fokusträning</h2>
          <p>Välj ett område om du vill träna en smalare del av kapitlet i stället för hela blandningen.</p>
        </div>
        <div className="button-grid">
          {focusedPracticeModes.map((focus) => (
            <button className="secondary-button" key={focus.id} onClick={() => onOpenFocusedMode(focus.id)}>
              {focus.label}
            </button>
          ))}
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h2>Vad du tränar här</h2>
          <p>Kapitel 4 blandar glosor, korta meningar, översättning och läsförståelse i båda riktningarna.</p>
        </div>
        <div className="pill-row">
          <span className="pill">Dagar</span>
          <span className="pill">Familj</span>
          <span className="pill">Sport och aktiviteter</span>
          <span className="pill">Väder och årstider</span>
          <span className="pill">Faire</span>
          <span className="pill">Kanada och Québec</span>
          <span className="pill">Länder och nationaliteter</span>
          <span className="pill">Beskriva personer</span>
          <span className="pill">Mes copains</span>
          <span className="pill">Tal</span>
        </div>
      </section>

      <TipsSection tips={studyTips} />
    </main>
  );
}

function FlashcardsPage({
  cards,
  weakFlashcardIds,
  onBack,
  onMarkKnown,
  onMarkWeak,
}: {
  cards: Flashcard[];
  weakFlashcardIds: string[];
  onBack: () => void;
  onMarkKnown: (id: string) => void;
  onMarkWeak: (id: string) => void;
}) {
  const [session, setSession] = useState<FlashcardSessionItem[]>(() => createFlashcardSession(cards));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [weakCount, setWeakCount] = useState(0);

  const currentCard = session[currentIndex];

  function restart() {
    setSession(createFlashcardSession(cards));
    setCurrentIndex(0);
    setShowAnswer(false);
    setReviewedCount(0);
    setWeakCount(0);
  }

  function moveNext() {
    setReviewedCount((count) => count + 1);
    setShowAnswer(false);
    setCurrentIndex((index) => index + 1);
  }

  function handleKnown() {
    if (!currentCard) {
      return;
    }

    onMarkKnown(currentCard.card.id);
    moveNext();
  }

  function handleWeak() {
    if (!currentCard) {
      return;
    }

    onMarkWeak(currentCard.card.id);
    setWeakCount((count) => count + 1);
    moveNext();
  }

  const isFinished = currentIndex >= session.length;
  const alreadyWeak = currentCard ? weakFlashcardIds.includes(currentCard.card.id) : false;

  return (
    <main className="page">
      <StudyHeader
        title="Träna glosor"
        description="Kortleken visar franska eller svenska först. Välj om ordet sitter eller behöver extra övning."
        onBack={onBack}
      />

      <TipsSection tips={studyTips.filter((tip) => tip.id === "tip-weekdays" || tip.id === "tip-faire-activity")} />

      <section className="content-card">
        {isFinished ? (
          <CompletionCard
            title="Glosrundan är klar"
            summary={`Du gick igenom ${reviewedCount} kort och markerade ${weakCount} för extra träning.`}
            primaryLabel="Blanda korten igen"
            onPrimaryAction={restart}
          />
        ) : currentCard ? (
          <>
            <ProgressBar current={currentIndex + 1} total={session.length} />
            <div className="badge-row">
              <span className="badge">{currentCard.card.category}</span>
              {alreadyWeak ? <span className="badge badge-warm">Sparad för extra träning</span> : null}
            </div>
            <div className="flashcard">
              <p className="prompt-label">
                {currentCard.frontSide === "french" ? "Översätt från franska" : "Översätt från svenska"}
              </p>
              <h2>{currentCard.frontSide === "french" ? currentCard.card.french : currentCard.card.swedish}</h2>

              {showAnswer ? (
                <div className="answer-block">
                  <div>
                    <span>Franska</span>
                    <strong>{currentCard.card.french}</strong>
                  </div>
                  <div>
                    <span>Svenska</span>
                    <strong>{currentCard.card.swedish}</strong>
                  </div>
                </div>
              ) : (
                <p className="muted-text">Fundera först själv och visa sedan svaret.</p>
              )}
            </div>

            <div className="action-row">
              {!showAnswer ? (
                <button className="primary-button" onClick={() => setShowAnswer(true)}>
                  Visa svar
                </button>
              ) : (
                <>
                  <button className="success-button" onClick={handleKnown}>
                    Kunde
                  </button>
                  <button className="warning-button" onClick={handleWeak}>
                    Behöver öva
                  </button>
                </>
              )}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

function SentencePracticePage({
  sentenceTab,
  onChangeTab,
  onBack,
  onMarkKnown,
  onMarkWeak,
}: {
  sentenceTab: SentenceTab;
  onChangeTab: (tab: SentenceTab) => void;
  onBack: () => void;
  onMarkKnown: (id: string) => void;
  onMarkWeak: (id: string) => void;
}) {
  const isFillTab = sentenceTab === "fill";

  return (
    <main className="page">
      <StudyHeader
        title="Träna meningar"
        description="Här kan du växla mellan fyll-i-luckor och översättning. Fel svar sparas i extraövningen."
        onBack={onBack}
      />

      <section className="content-card">
        <div className="subnav">
          <button
            className={isFillTab ? "subnav-button is-active" : "subnav-button"}
            onClick={() => onChangeTab("fill")}
          >
            Fyll i luckan
          </button>
          <button
            className={!isFillTab ? "subnav-button is-active" : "subnav-button"}
            onClick={() => onChangeTab("translation")}
          >
            Översätt
          </button>
        </div>
      </section>

      {isFillTab ? (
        <TextPracticePage
          title="Fyll i rätt ord"
          subtitle="Kortare luckmeningar från kapitel 4. Svara med ett ord eller en kort verbform."
          items={sentenceExercises}
          inputLabel="Skriv ordet som saknas"
          inputPlaceholder="Till exempel: fait"
          tips={studyTips.filter((tip) => tip.id === "tip-il-fait" || tip.id === "tip-jouer")}
          onBack={onBack}
          onMarkKnown={onMarkKnown}
          onMarkWeak={onMarkWeak}
          compactHeader
        />
      ) : (
        <TextPracticePage
          title="Översättning"
          subtitle="Träna både svenska till franska och franska till svenska."
          items={translationExercises}
          inputLabel="Skriv översättningen"
          inputPlaceholder="Skriv ditt svar här"
          tips={studyTips.filter((tip) => tip.id === "tip-jouer" || tip.id === "tip-faire-activity")}
          onBack={onBack}
          onMarkKnown={onMarkKnown}
          onMarkWeak={onMarkWeak}
          compactHeader
        />
      )}
    </main>
  );
}

function TextPracticePage({
  title,
  subtitle,
  items,
  inputLabel,
  inputPlaceholder,
  tips,
  onBack,
  onMarkKnown,
  onMarkWeak,
  compactHeader = false,
}: {
  title: string;
  subtitle: string;
  items: PracticeItem[];
  inputLabel: string;
  inputPlaceholder: string;
  tips: Tip[];
  onBack: () => void;
  onMarkKnown: (id: string) => void;
  onMarkWeak: (id: string) => void;
  compactHeader?: boolean;
}) {
  const [session, setSession] = useState<PracticeItem[]>(() => shuffleArray(items));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentItem = session[currentIndex];

  function restart() {
    setSession(shuffleArray(items));
    setCurrentIndex(0);
    setAnswer("");
    setFeedback(null);
    setSavedNotice(false);
    setCorrectCount(0);
  }

  function submitAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentItem) {
      return;
    }

    const isCorrect = isAnswerCorrect(answer, currentItem.answer, currentItem.alternatives ?? []);
    setFeedback({ isCorrect, explanation: currentItem.explanation });

    if (isCorrect) {
      setCorrectCount((count) => count + 1);
      onMarkKnown(currentItem.id);
    } else {
      onMarkWeak(currentItem.id);
    }
  }

  function nextItem() {
    setCurrentIndex((index) => index + 1);
    setAnswer("");
    setFeedback(null);
    setSavedNotice(false);
  }

  function saveForLater() {
    if (!currentItem) {
      return;
    }

    onMarkWeak(currentItem.id);
    setSavedNotice(true);
  }

  const isFinished = currentIndex >= session.length;

  return (
    <>
      {!compactHeader ? <StudyHeader title={title} description={subtitle} onBack={onBack} /> : null}
      <TipsSection tips={tips} />

      <section className="content-card">
        {items.length === 0 ? (
          <div className="empty-state">
            <h2>Inga frågor i den här delen ännu</h2>
            <p>Den här fokusrundan saknar innehåll just nu.</p>
          </div>
        ) : isFinished ? (
          <CompletionCard
            title={`${title} är klar`}
            summary={`Du hade ${correctCount} rätt av ${session.length}. Du kan blanda om och köra en ny runda direkt.`}
            primaryLabel="Börja om"
            onPrimaryAction={restart}
          />
        ) : currentItem ? (
          <>
            <ProgressBar current={currentIndex + 1} total={session.length} />
            <div className="badge-row">
              <span className="badge">{currentItem.category}</span>
            </div>

            <div className="question-card">
              <h2>{currentItem.prompt}</h2>
              <form className="answer-form" onSubmit={submitAnswer}>
                <label className="input-label" htmlFor={`${currentItem.id}-input`}>
                  {inputLabel}
                </label>
                <input
                  id={`${currentItem.id}-input`}
                  className="answer-input"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder={inputPlaceholder}
                  autoComplete="off"
                  disabled={feedback !== null}
                />
                <button className="primary-button" type="submit" disabled={!answer.trim() || feedback !== null}>
                  Rätta svar
                </button>
              </form>

              {feedback ? (
                <div className={feedback.isCorrect ? "feedback-box is-correct" : "feedback-box is-wrong"}>
                  <strong>{feedback.isCorrect ? "Rätt svar." : "Inte riktigt."}</strong>
                  <p>Rätt svar: {currentItem.answer}</p>
                  {feedback.explanation ? <p>{feedback.explanation}</p> : null}
                </div>
              ) : null}

              {savedNotice ? <p className="saved-note">Sparad i "Fel jag behöver öva på".</p> : null}
            </div>

            {feedback ? (
              <div className="action-row">
                <button className="primary-button" onClick={nextItem}>
                  Nästa
                </button>
                {feedback.isCorrect ? (
                  <button className="secondary-button" onClick={saveForLater} disabled={savedNotice}>
                    {savedNotice ? "Redan sparad" : "Spara i extraövning"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </>
  );
}

function QuizPage({
  questions,
  questionCount,
  title,
  description,
  resultTitle,
  tips,
  onBack,
  onMarkWeak,
  onSaveScore,
  restartLabel = "Ny quizrunda",
  enableRetryIncorrect = false,
}: {
  questions: QuizQuestion[];
  questionCount: number;
  title: string;
  description: string;
  resultTitle: string;
  tips: Tip[];
  onBack: () => void;
  onMarkWeak: (id: string) => void;
  onSaveScore: (score: LastScore | null | ((current: LastScore | null) => LastScore | null)) => void;
  restartLabel?: string;
  enableRetryIncorrect?: boolean;
}) {
  const [session, setSession] = useState<QuizQuestion[]>(() => createQuizSession(questions, questionCount));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; userAnswer: string } | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isRetryRound, setIsRetryRound] = useState(false);

  const currentQuestion = session[currentIndex];
  const score = calculateQuizScore(results);
  const isFinished = currentIndex >= session.length;
  const percent = score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100);

  function restart() {
    setSession(createQuizSession(questions, questionCount));
    setCurrentIndex(0);
    setAnswer("");
    setFeedback(null);
    setResults([]);
    setIsRetryRound(false);
  }

  function retryIncorrect() {
    const incorrectQuestionIds = new Set(score.incorrect.map((result) => result.questionId));
    const incorrectQuestions = session.filter((question) => incorrectQuestionIds.has(question.id));

    if (incorrectQuestions.length === 0) {
      return;
    }

    setSession(shuffleArray(incorrectQuestions));
    setCurrentIndex(0);
    setAnswer("");
    setFeedback(null);
    setResults([]);
    setIsRetryRound(true);
  }

  function saveResult(userAnswer: string) {
    if (!currentQuestion) {
      return;
    }

    const isCorrect = isAnswerCorrect(userAnswer, currentQuestion.answer, currentQuestion.alternatives ?? []);
    const nextResults = [
      ...results,
      {
        questionId: currentQuestion.id,
        prompt: currentQuestion.prompt,
        category: currentQuestion.category,
        correctAnswer: currentQuestion.answer,
        userAnswer,
        isCorrect,
        explanation: currentQuestion.explanation,
      },
    ];

    if (!isCorrect) {
      onMarkWeak(currentQuestion.id);
    }

    setResults(nextResults);
    setFeedback({ isCorrect, userAnswer });

    if (nextResults.length === session.length && !isRetryRound) {
      const nextScore = calculateQuizScore(nextResults);
      onSaveScore({
        correct: nextScore.correct,
        total: nextScore.total,
        savedAt: new Date().toISOString(),
      });
    }
  }

  function submitTextAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveResult(answer);
  }

  function goNext() {
    setCurrentIndex((index) => index + 1);
    setAnswer("");
    setFeedback(null);
  }

  return (
    <main className="page">
      <StudyHeader title={title} description={description} onBack={onBack} />

      <TipsSection tips={tips} />

      <section className="content-card">
        {isFinished ? (
          <div className="result-card">
            <h2>{resultTitle}</h2>
            <p className="score-value">
              {score.correct} / {score.total}
            </p>
            <p className="muted-text">{percent}% rätt.</p>
            <p className="muted-text">Fel svar är sparade i "Fel jag behöver öva på".</p>

            {score.incorrect.length > 0 ? (
              <div className="result-list">
                {score.incorrect.map((result) => (
                  <div className="result-item" key={result.questionId}>
                    <div className="badge-row">
                      <span className="badge">{result.category}</span>
                    </div>
                    <h3>{result.prompt}</h3>
                    <p>Du svarade: {result.userAnswer || "Inget svar"}</p>
                    <p>Rätt svar: {result.correctAnswer}</p>
                    {result.explanation ? <p>{result.explanation}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="feedback-box is-correct">
                <strong>Alla rätt.</strong>
                <p>Du svarade rätt på samtliga frågor i denna runda.</p>
              </div>
            )}

            <div className="action-row">
              <button className="primary-button" onClick={restart}>
                {restartLabel}
              </button>
              {enableRetryIncorrect && score.incorrect.length > 0 ? (
                <button className="secondary-button" onClick={retryIncorrect}>
                  Träna bara på felen
                </button>
              ) : null}
            </div>
          </div>
        ) : currentQuestion ? (
          <>
            <ProgressBar current={currentIndex + 1} total={session.length} />
            <div className="badge-row">
              <span className="badge">{currentQuestion.category}</span>
              <span className="badge badge-cool">
                {currentQuestion.type === "multiple-choice" ? "Flerval" : "Skriv själv"}
              </span>
              {isRetryRound ? <span className="badge badge-warm">Bara tidigare fel</span> : null}
            </div>

            <div className="question-card">
              <h2>{currentQuestion.prompt}</h2>

              {currentQuestion.type === "multiple-choice" ? (
                <div className="option-grid">
                  {currentQuestion.options?.map((option) => {
                    const isSelected = feedback?.userAnswer === option;
                    const isCorrectOption = currentQuestion.answer === option;

                    let className = "option-button";
                    if (feedback && isSelected && !feedback.isCorrect) {
                      className += " is-wrong";
                    }
                    if (feedback && isCorrectOption) {
                      className += " is-correct";
                    }

                    return (
                      <button
                        key={option}
                        className={className}
                        onClick={() => saveResult(option)}
                        disabled={feedback !== null}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <form className="answer-form" onSubmit={submitTextAnswer}>
                  <label className="input-label" htmlFor={`${currentQuestion.id}-quiz`}>
                    Skriv ditt svar
                  </label>
                  <input
                    id={`${currentQuestion.id}-quiz`}
                    className="answer-input"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Skriv här"
                    autoComplete="off"
                    disabled={feedback !== null}
                  />
                  <button className="primary-button" type="submit" disabled={!answer.trim() || feedback !== null}>
                    Kontrollera
                  </button>
                </form>
              )}

              {feedback ? (
                <div className={feedback.isCorrect ? "feedback-box is-correct" : "feedback-box is-wrong"}>
                  <strong>{feedback.isCorrect ? "Rätt svar." : "Fel svar."}</strong>
                  <p>Rätt svar: {currentQuestion.answer}</p>
                  {currentQuestion.explanation ? <p>{currentQuestion.explanation}</p> : null}
                </div>
              ) : null}
            </div>

            {feedback ? (
              <div className="action-row">
                <button className="primary-button" onClick={goNext}>
                  {currentIndex + 1 === session.length ? "Se resultat" : "Nästa fråga"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

function WeakPracticePage({
  items,
  onBack,
  onRemoveFlashcard,
  onRemoveQuestion,
}: {
  items: WeakPracticeItem[];
  onBack: () => void;
  onRemoveFlashcard: (id: string) => void;
  onRemoveQuestion: (id: string) => void;
}) {
  const [session, setSession] = useState<WeakSessionItem[]>(() => createWeakSession(items));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const weakSessionKey = items.map((item) => item.id).join("|");

  useEffect(() => {
    setSession(createWeakSession(items));
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [weakSessionKey]);

  if (items.length === 0) {
    return (
      <main className="page">
        <StudyHeader
          title="Fel jag behöver öva på"
          description="Här samlas glosor och frågor som du markerat eller svarat fel på."
          onBack={onBack}
        />
        <section className="content-card empty-state">
          <h2>Inget att extraöva ännu</h2>
          <p>
            Markera glosor som "Behöver öva" eller svara fel i någon övning, så dyker de upp här automatiskt.
          </p>
        </section>
      </main>
    );
  }

  const currentItem = session[currentIndex];
  const isFinished = currentIndex >= session.length;

  function restart() {
    setSession(createWeakSession(items));
    setCurrentIndex(0);
    setShowAnswer(false);
  }

  function moveNext() {
    setCurrentIndex((index) => index + 1);
    setShowAnswer(false);
  }

  function handleClear() {
    if (!currentItem) {
      return;
    }

    if (currentItem.kind === "flashcard") {
      onRemoveFlashcard(currentItem.id);
    } else {
      onRemoveQuestion(currentItem.id);
    }

    moveNext();
  }

  function handleKeep() {
    moveNext();
  }

  return (
    <main className="page">
      <StudyHeader
        title="Fel jag behöver öva på"
        description="En extra runda med bara det som fortfarande känns osäkert."
        onBack={onBack}
      />

      <section className="content-card">
        {isFinished ? (
          <CompletionCard
            title="Extraövningen är klar"
            summary="Du har gått igenom allt som låg sparat för repetition. Kör en ny runda om du vill dubbelkolla."
            primaryLabel="Blanda om listan"
            onPrimaryAction={restart}
          />
        ) : currentItem ? (
          <>
            <ProgressBar current={currentIndex + 1} total={session.length} />
            <div className="badge-row">
              <span className="badge">{currentItem.category}</span>
              <span className="badge badge-cool">{currentItem.kind === "flashcard" ? "Glosa" : "Fråga"}</span>
            </div>

            <div className="flashcard">
              <p className="prompt-label">Fundera först själv</p>
              <h2>{currentItem.prompt}</h2>
              {showAnswer ? (
                <div className="answer-block">
                  <div>
                    <span>Svar</span>
                    <strong>{currentItem.answer}</strong>
                  </div>
                  {currentItem.kind === "question" && currentItem.explanation ? (
                    <div>
                      <span>Tips</span>
                      <strong>{currentItem.explanation}</strong>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="muted-text">Visa svaret när du är redo.</p>
              )}
            </div>

            <div className="action-row">
              {!showAnswer ? (
                <button className="primary-button" onClick={() => setShowAnswer(true)}>
                  Visa svar
                </button>
              ) : (
                <>
                  <button className="success-button" onClick={handleClear}>
                    Sitter nu
                  </button>
                  <button className="warning-button" onClick={handleKeep}>
                    Behöver mer övning
                  </button>
                </>
              )}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

function StudyHeader({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <header className="content-card">
      <div className="header-row">
        <button className="ghost-button" onClick={onBack}>
          Till startsidan
        </button>
      </div>
      <div className="section-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}

function TipsSection({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) {
    return null;
  }

  return (
    <section className="tip-grid">
      {tips.map((tip) => (
        <article className="tip-card" key={tip.id}>
          <h3>{tip.title}</h3>
          <p>{tip.text}</p>
        </article>
      ))}
    </section>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="progress-wrap" aria-label={`Framsteg ${current} av ${total}`}>
      <div className="progress-meta">
        <span>Framsteg</span>
        <strong>
          {current} / {total}
        </strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function CompletionCard({
  title,
  summary,
  primaryLabel,
  onPrimaryAction,
}: {
  title: string;
  summary: string;
  primaryLabel: string;
  onPrimaryAction: () => void;
}) {
  return (
    <div className="result-card">
      <h2>{title}</h2>
      <p>{summary}</p>
      <div className="action-row">
        <button className="primary-button" onClick={onPrimaryAction}>
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    const storedValue = window.localStorage.getItem(key);

    if (!storedValue) {
      return initialValue;
    }

    try {
      return JSON.parse(storedValue) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export default App;
