export function Header() {
  return (
    <header className="header">
      <span className="logo">IPlusFlow Research</span>
      <h1>EEG Alzheimer&apos;s Analysis</h1>

      <div className="trust-badges">
        <div className="badge"><i className="fas fa-microchip" /> CNN-BiLSTM</div>
        <div className="badge"><i className="fas fa-check-circle" /> 83.8% Acc</div>
        <div className="badge"><i className="fas fa-chart-area" /> 0.95 AUC</div>
        <div className="badge"><i className="fas fa-database" /> OpenNeuro</div>
        <div className="badge"><i className="fas fa-cloud" /> AWS Lambda</div>
      </div>
    </header>
  );
}
