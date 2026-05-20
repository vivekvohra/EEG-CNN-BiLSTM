export function InfoGrid() {
  return (
    <div className="product-info">
      <div className="info-sec">
        <h3>Methodology &amp; Processing</h3>
        <p>
          Signals undergo a 0.5-45 Hz band-pass filter and are segmented into 2-second epochs (1s overlap).
          Welch&apos;s method computes the PSD to extract Relative Band Power across 5 frequency bands
          (Delta, Theta, Alpha, Beta, Gamma) over 19 channels.
        </p>
      </div>
      <div className="info-sec">
        <h3>Model Performance</h3>
        <p>
          Trained on the OpenNeuro dataset, the CNN-BiLSTM architecture achieves a Test Accuracy of <strong>83.81%</strong>,
          a Cohen&apos;s Kappa of <strong>0.7520</strong>, and an average AUC of <strong>0.9546</strong>, ensuring robust
          diagnostic separation across classes.
        </p>
      </div>
    </div>
  );
}