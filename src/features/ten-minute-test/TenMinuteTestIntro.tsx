type TenMinuteTestIntroProps = {
  onBack: () => void;
  onStart: () => void;
};

function TenMinuteTestIntro({ onBack, onStart }: TenMinuteTestIntroProps) {
  return (
    <main className="page">
      <header className="content-card">
        <div className="header-row">
          <button className="ghost-button" onClick={onBack}>
            Till startsidan
          </button>
        </div>
        <div className="section-heading">
          <h1>Prov på 10 minuter</h1>
          <p>
            Ett separat tidsprov med 20 blandade frågor. Du får ingen rättning under tiden och alla fel eller
            tomma svar sparas till svagträningen efteråt.
          </p>
        </div>
      </header>

      <section className="content-card">
        <div className="badge-row">
          <span className="badge">20 frågor</span>
          <span className="badge badge-warm">10:00 minuter</span>
        </div>

        <div className="result-card">
          <h2>Så fungerar det</h2>
          <p>Frågorna hämtas från kapitel 4 och blandas om varje gång.</p>
          <p>Du kan gå framåt och bakåt mellan frågorna och lämna svar tomma om du vill.</p>
          <p>Provet skickas in automatiskt när tiden tar slut, men du kan också lämna in manuellt tidigare.</p>
        </div>

        <div className="action-row">
          <button className="primary-button" onClick={onStart}>
            Starta provet
          </button>
        </div>
      </section>
    </main>
  );
}

export default TenMinuteTestIntro;
