import mne
import numpy as np

# Frequency bands used in your training code
_BANDS = {
    "delta": (0.5, 4),
    "theta": (4, 8),
    "alpha": (8, 13),
    "beta":  (13, 25),
    "gamma": (25, 45),
}

def _compute_rbp_from_epochs(epochs, fmin=0.5, fmax=45.0):
    """
    Compute Relative Band Power (RBP) per epoch and channel, then reshape to (epochs, channels, 5, 1).
    """
    psd = epochs.compute_psd(method="welch", fmin=fmin, fmax=fmax)
    psds, freqs = psd.get_data(return_freqs=True)  # (n_epochs, n_channels, n_freqs)

    band_power = []
    for band, (lo, hi) in _BANDS.items():
        idx = np.logical_and(freqs >= lo, freqs <= hi)
        band_power.append(psds[:, :, idx].mean(axis=-1))  # (n_epochs, n_channels)

    bp_abs = np.stack(band_power, axis=-1)  # (n_epochs, n_channels, 5)
    total = bp_abs.sum(axis=-1, keepdims=True) + 1e-12
    rbp = bp_abs / total  # (n_epochs, n_channels, 5)
    rbp = rbp[..., np.newaxis]  # (n_epochs, n_channels, 5, 1)
    return rbp

def preprocess_eeg_to_model_input(file_path: str):
    """
    Reads an EEGLAB .set file and produces a model-ready tensor.
    Your training pipeline used:
      - Bandpass 0.5–45 Hz
      - Fixed-length epochs: 2s with 1s overlap
      - Welch PSD -> Relative Band Power for 5 bands
      - Input to model shaped like (batch, channels=19, bands=5, 1)

    Strategy:
      - Compute RBP per epoch (N, 19, 5, 1)
      - Aggregate across epochs by mean to get (19, 5, 1)
      - Return (19, 5, 1); caller can expand to (1, 19, 5, 1)
    """
    # Load EEG .set (if there is a paired .fdt, MNE will look for it in same dir with the same basename)
    raw = mne.io.read_raw_eeglab(file_path, preload=True, verbose="ERROR")
    raw.filter(0.5, 45.0, fir_design="firwin", verbose="ERROR")

    # Create 2s epochs with 1s overlap
    epochs = mne.make_fixed_length_epochs(raw, duration=2.0, overlap=1.0, preload=True, verbose="ERROR")

    rbp = _compute_rbp_from_epochs(epochs, fmin=0.5, fmax=45.0)  # (n_epochs, n_channels, 5, 1)

    # Aggregate across epochs to one sample (mean). You could also choose median or another stat.
    rbp_mean = rbp.mean(axis=0)  # (n_channels, 5, 1)

    # Return (channels, 5, 1); the caller will add batch dim as needed
    return rbp_mean
