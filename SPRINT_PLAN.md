# AcoustiTape: 10-Day Accelerated Sprint Plan
**Mobile Application for Room Acoustics Measurement (ISO 3382)**  
**Tech Stack**: React Native (Pure JavaScript) + Expo SDK 58 + DSP + Hardware Sensors

---

## Architecture & Sensor Overview

AcoustiTape combines **classical architectural acoustics (ISO 3382)** with **mobile hardware sensors**:
1. **Device Microphone**: Captures uncompressed physical sound pressure samples $p(t)$ from a single handclap.
2. **DSP Engine (JavaScript Float32)**: Schroeder backward integration, biquad octave bandpass filters, linear regression for $T_{20}$, $T_{30}$, and $EDT$.
3. **Accelerometer (`expo-sensors`)**: ISO 3382 stability guard (ensures user holds phone steady at chest height without hand tremors or motion artifacts).
4. **Location (`expo-location`)**: Geo-tags acoustic measurements for campus/building architectural audits.
5. **Camera (`expo-camera` / `expo-image-picker`)**: Visual room documentation (attaching room photos and surface materials to the acoustic report).

---

## 10-Day Schedule

| Day | Focus Area | Deliverables |
| :--- | :--- | :--- |
| **Day 1** ✅ | **Project Setup & Architecture** | React Native Expo pure JS, ISO 3382 dashboard, SVG Schroeder decay curve, Octave bar chart, Sabine calculator, Git setup. |
| **Day 2** | **Audio Capture & PCM Extraction** | Uncompressed Linear PCM WAV ($44.1\text{ kHz}$ mono, $16\text{-bit}$), `wavParser.js`, `Float32Array` buffer, ambient VU meter. |
| **Day 3** | **Impulse Detection & Noise Floor** | Peak amplitude trigger ($t_0$), signal trimming, pre-impulse noise floor RMS, dynamic range validation ($SNR \ge 30\text{ dB}$). |
| **Day 4** | **Schroeder Integration & RT60 Engine** | Schroeder backward cumulative energy decay curve, OLS linear regression, $T_{20}$, $T_{30}$, $EDT$, and $R^2$ fit quality validation. |
| **Day 5** | **6-Band Octave Frequency Filter** | Digital biquad IIR bandpass filters (125 Hz – 4 kHz), per-octave RT60, Bass Ratio (warmth), Treble Ratio (brilliance). |
| **Day 6** | **Accelerometer Stability Guard** | `expo-sensors` integration: real-time phone level bubble, tremor detection, bump/motion artifact rejection. |
| **Day 7** | **GPS Geo-Tagging & Venue Map** | `expo-location` integration: automatic coordinates, reverse geocoding, campus acoustic mapping. |
| **Day 8** | **Camera Room Documentation** | `expo-camera` / `expo-image-picker`: room photo capture, surface material tagging, photo attachment to report. |
| **Day 9** | **History & Room Comparison** | Persistent storage (`AsyncStorage`), compare Room A vs Room B, dual decay curve overlay, exportable acoustic audit card. |
| **Day 10** | **Testing, Calibration & Report** | Real-world validation (bedroom vs hallway vs auditorium), academic project report, presentation guide for teacher. |
