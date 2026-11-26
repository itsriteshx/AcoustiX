# AcoustiTape: Mobile Room Acoustics Measurement Instrument
## Major Project Report | ISO 3382 Impulse Response Decay Analysis
**Project Code**: 2501010309  
**Platform**: React Native (JavaScript) + Expo SDK 58  
**Author**: Ritesh Kumar  

---

## 1. Abstract & Problem Statement

### 1.1 Problem Statement
Professional architectural acoustic assessment requires calibrated measurement microphones, omnidirectional dodecahedron sound sources, and expensive spectrum analyzers that cost thousands of dollars. As a result, educational institutions, podcasters, home studio creators, and office planners frequently operate in acoustically compromised environments without means of evaluation.

**AcoustiTape** implements the classical architectural acoustics standard (**ISO 3382**) on consumer mobile hardware. By producing a single impulsive sound (such as a handclap, balloon pop, or starter pistol), the application captures the audio waveform through the smartphone microphone, extracts uncompressed 16-bit linear PCM samples, analyzes energy decay through **Manfred Schroeder's Backward Integration**, and reports the room's **$RT_{60}$** (reverberation time) with an octave frequency breakdown and plain-language architectural recommendations.

AcoustiTape is positioned as a comparative and educational instrument rather than a certified laboratory device.

---

## 2. Mathematical & Acoustic Foundations

### 2.1 Sound Decay in Enclosures
In an enclosed room, sound waves reflect off boundaries (walls, floor, ceiling). The sound energy density $E(t)$ decays exponentially according to Sabine's reverberation theory:
$$p^2(t) = p_0^2 \cdot e^{-2\delta t}$$
where $\delta$ is the room damping factor and $p(t)$ is instantaneous acoustic pressure.

### 2.2 Why Direct Claps Fluctuates (The Need for Schroeder Integration)
A raw handclap recording contains intense stochastic pressure fluctuations caused by modal interference and standing waves. If one simply computes the raw envelope of $p^2(t)$, the curve is erratic and impossible to fit with a clean line.

In 1965, Dr. Manfred Schroeder published his landmark theorem proving that the average of an infinite ensemble of decays is mathematically equivalent to the **reverse integration of a single squared impulse response**:
$$EDC(t) = \int_{t}^{\infty} p^2(\tau) \, d\tau$$

In our discrete digital implementation with $N$ samples sampled at $f_s = 44,100\text{ Hz}$:
$$EDC[n] = \sum_{k=n}^{N-1} p^2[k]$$

This is computed via a fast backward cumulative sum in $O(N)$ time. Normalizing into decibels yields the **Energy Decay Curve (EDC)**:
$$EDC_{\text{dB}}[n] = 10 \cdot \log_{10}\left( \frac{EDC[n]}{EDC[0]} \right)$$

### 2.3 ISO 3382 Evaluation: $T_{20}$, $T_{30}$, and $EDT$
$RT_{60}$ is defined as the time required for sound energy to drop by $60\text{ dB}$. However, typical consumer smartphones in everyday rooms exhibit:
- Ambient noise floor: $-45\text{ dBFS}$ to $-55\text{ dBFS}$
- Peak handclap amplitude: $-5\text{ dBFS}$ to $-0\text{ dBFS}$
- Dynamic range ($SNR$): $40\text{ dB}$ to $50\text{ dB}$

Because consumer microphones hit the noise floor before achieving a full $60\text{ dB}$ drop, ISO 3382-2 defines standard linear regression methods:
1. **$T_{20}$ Evaluation**:
   - Fit an Ordinary Least Squares (OLS) line between $-5\text{ dB}$ and $-25\text{ dB}$ on the EDC curve.
   - Extrapolate to the full 60 dB drop:
     $$RT_{60} = 3 \times T_{20} = -\frac{60}{\text{slope}_{20}}$$
2. **$T_{30}$ Evaluation**:
   - Fit an OLS line between $-5\text{ dB}$ and $-35\text{ dB}$ (when SNR allows):
     $$RT_{60} = 2 \times T_{30} = -\frac{60}{\text{slope}_{30}}$$
3. **Early Decay Time ($EDT$)**:
   - Fit from $0\text{ dB}$ to $-10\text{ dB}$, extrapolated by a factor of 6:
     $$EDT = 6 \times T_{10}$$
   - Correlates directly with the human perception of room reverberance.

### 2.4 Ordinary Least Squares (OLS) Regression Math
Over sample indices $[n_{\text{start}}, n_{\text{end}}]$, we fit $y_i = m \cdot t_i + b$:
$$m = \frac{n \sum (t_i y_i) - \sum t_i \sum y_i}{n \sum t_i^2 - (\sum t_i)^2}$$
$$R^2 = \frac{\left( \sum (t_i - \bar{t})(y_i - \bar{y}) \right)^2}{\sum (t_i - \bar{t})^2 \sum (y_i - \bar{y})^2}$$

---

## 3. Octave Band Frequency Spectrum & Acoustic Balance

Rooms do not absorb all frequencies equally. AcoustiTape filters the impulse response through **6 standard ISO 3382 octave bands**:
$$\text{125 Hz, 250 Hz, 500 Hz, 1000 Hz, 2000 Hz, 4000 Hz}$$

### 3.1 Digital Biquad Butterworth Bandpass Filter
Direct Form II Transposed difference equations:
$$y[n] = b_0 x[n] + d_1[n-1]$$
$$d_1[n] = b_1 x[n] - a_1 y[n] + d_2[n-1]$$
$$d_2[n] = b_2 x[n] - a_2 y[n]$$
with $Q = \sqrt{2} \approx 1.414$ for a 1-octave bandwidth.

### 3.2 Acoustic Coloration Indices
- **Bass Ratio (Warmth)**:
  $$BR = \frac{RT_{125} + RT_{250}}{RT_{500} + RT_{1000}}$$
  - $BR > 1.15$: **Warm** (rich bass sustain, ideal for classical music and concert halls).
  - $0.95 \le BR \le 1.15$: **Neutral** (balanced response).
  - $BR < 0.95$: **Bright / Thin** (excessive low-frequency absorption or lack of resonance).
- **Treble Ratio (Brilliance)**:
  $$TR = \frac{RT_{2000} + RT_{4000}}{RT_{500} + RT_{1000}}$$

### 3.3 ISO 3382 Speech Clarity ($C_{50}$), Music Clarity ($C_{80}$), Definition ($D_{50}$) & STI
Beyond reverberation duration, modern architectural acoustics measures sound intelligibility and musical separation through early-to-late energy ratios:

1. **Speech Clarity ($C_{50}$)**:
   Ratio of early sound energy (first 50 ms) to late reverberation energy:
   $$C_{50} = 10 \cdot \log_{10} \left( \frac{\int_0^{50\text{ms}} p^2(t) \, dt}{\int_{50\text{ms}}^{\infty} p^2(t) \, dt} \right) \text{ dB}$$
   - $C_{50} \ge +2\text{ dB}$: High speech articulation (ANSI S12.60 classroom compliance).
   - $C_{50} < 0\text{ dB}$: Speech consonants are masked by room reflections.

2. **Music Clarity ($C_{80}$)**:
   Ratio of sound energy arriving within the first 80 ms versus late diffuse decay:
   $$C_{80} = 10 \cdot \log_{10} \left( \frac{\int_0^{80\text{ms}} p^2(t) \, dt}{\int_{80\text{ms}}^{\infty} p^2(t) \, dt} \right) \text{ dB}$$
   - Target range: $-2\text{ dB} \le C_{80} \le +4\text{ dB}$ for balanced orchestral and symphonic performance.

3. **Sound Definition / Deutlichkeit ($D_{50}$)**:
   $$D_{50} = \frac{\int_0^{50\text{ms}} p^2(t) \, dt}{\int_0^{\infty} p^2(t) \, dt} \times 100\%$$

4. **Speech Transmission Index (STI)** (IEC 60268-16):
   Empirical mapping based on $C_{50}$ and signal-to-noise ratio:
   $$STI \approx \text{clamp}\left( \frac{C_{50} + 15}{30} \times (0.75 + 0.25 \times \text{SNR factor}), 0.0, 1.0 \right)$$
   Categorized into standard qualitative bands: *Bad (< 0.30)*, *Poor (0.30 - 0.44)*, *Fair (0.45 - 0.59)*, *Good (0.60 - 0.74)*, and *Excellent ($\ge 0.75$)*.

---

## 4. Mobile Sensor & Hardware Integrations

Beyond digital signal processing, AcoustiTape integrates mobile hardware sensors:

1. **Microphone Capture Engine** (`expo-av`, `expo-audio`):
   - Uncompressed 16-bit signed Linear PCM `.wav` at $44,100\text{ Hz}$ mono.
   - Bypasses software automatic gain control (AGC) where supported.
2. **Accelerometer Stability Guard** (`expo-sensors`):
   - Real-time $G$-force magnitude: $G = \sqrt{x^2 + y^2 + z^2}$.
   - Pitch & Roll spirit level bubble: confirms phone is held steady and upright at ear/chest height ($1.2\text{m} - 1.5\text{m}$) per ISO 3382 recommendations.
   - Motion artifact rejection: flags bumps ($> 1.75g$) during the decay window.
3. **GPS Location & Campus Mapping** (`expo-location`):
   - Automatically geo-tags measurement records with Latitude, Longitude, and Altitude.
   - Reverse-geocodes street addresses and campus building names.
4. **Camera Room Visual Audit** (`expo-image-picker`):
   - Captures photos of room boundaries.
   - Tags surface finishes (Carpet, Concrete, Glass, Wood, Acoustic Baffles).
5. **Persistent History & Dual Comparison Engine** (`AsyncStorage`):
   - Saves room audits locally.
   - Dual-room comparative mode overlays two Schroeder curves and grouped octave bars (e.g. Before vs After acoustic treatment).
6. **Native Audit Report Sharing**:
   - Formats complete ISO 3382 audit scorecards for immediate export.
7. **Acoustic Treatment & Panel Simulator**:
   - Computes required absorption differential $\Delta A = A_{\text{target}} - A_{\text{current}}$.
   - Calculates exact panel quantities and surface area ($m^2$) for materials including 50mm Dense Rockwool ($\alpha = 0.85$), Pyramid Foam ($\alpha = 0.55$), Corner Bass Traps ($\alpha = 0.80$), and Heavy Velour Curtains.
   - Provides live post-treatment $RT_{60}$ prediction and installation placement advice.
8. **In-App Acoustic Audio Signal Generator**:
   - Synthesizes 16-bit PCM RIFF WAV audio in pure JavaScript.
   - Generates band-limited 1 kHz Dirac Impulse bursts, 2.5s Logarithmic Sine Sweeps (20 Hz - 20 kHz), and Calibrated Pink Noise (-3 dB/octave) for speaker playback.
9. **ISO 3382 3-Clap Averaging Mode & Live SPL Decibel Meter**:
   - Multi-position averaging computes mean $RT_{60}$, averaged Schroeder curves, and spatial standard deviation ($\sigma$) across 3 room locations.
   - Live SPL Decibel Meter (`dBA` estimate, Min/Avg/Peak Hold) monitors ambient noise with WHO/OSHA hearing safety zones.
10. **Room Modes & Standing Wave Calculator**:
   - Computes axial and tangential eigenfrequencies ($f_{n_x,n_y,n_z} = \frac{c}{2}\sqrt{(n_x/L)^2 + (n_y/W)^2 + (n_z/H)^2}$), Schroeder crossover frequency ($f_s = 2000\sqrt{RT_{60}/V}$), and Bolt-area dimension ratio warnings.
11. **Printable PDF Acoustic Compliance Certificate** (`expo-print`, `expo-sharing`):
   - Renders an A4 print-ready ISO 3382 certificate with room metadata, clarity indices ($C_{50}, C_{80}, D_{50}, STI$), octave breakdown table, and Pass/Fail compliance stamp.

---

## 5. System Architecture

```
[Phone Microphone] --> [Uncompressed WAV 44.1kHz] --> [wavParser: Float32Array]
                                                                |
                                                                v
[Accelerometer Sensor] ----> [Stability Guard] -------> [impulseDetector (t0, SNR)]
                                                                |
                                 +------------------------------+-------------------------------+
                                 |                                                              |
                                 v                                                              v
                     [Schroeder Backward Engine]                                [6-Band Biquad Octave Filters]
                     - Cumulative reverse sum                                   - 125Hz to 4000Hz bandpass
                     - dB normalization                                         - Per-band RT60
                     - OLS regression (T20, T30, EDT)                           - Bass Ratio & Treble Ratio
                                 |                                                              |
                                 +------------------------------+-------------------------------+
                                                                |
                                                                v
                                                    [acousticAnalyzer Engine]
                                                                |
                     +------------------------------------------+-----------------------------------------+
                     |                                          |                                         |
                     v                                          v                                         v
            [Interactive SVG Charts]                   [ISO 3382 Room Suitability]               [Audit History & Compare]
            - Schroeder EDC Curve                      - Classroom, Studio, Speech               - AsyncStorage persistence
            - Octave Frequency Bars                    - Sabine Absorption Advisor               - Dual Room Overlay
```

---

## 6. Experimental Validation & Results

| Test Space | Expected ISO Range | AcoustiTape Measured $RT_{60}$ | Fit Quality $R^2$ | Warmth (Bass Ratio) | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Small Carpeted Bedroom** | $0.25\text{s} - 0.40\text{s}$ | **$0.34\text{s}$** | $0.982$ | $0.91$ (Bright/Dry) | Recording Studio / Podcast |
| **College Classroom (302)** | $0.50\text{s} - 0.75\text{s}$ | **$0.58\text{s}$** | $0.988$ | $1.08$ (Neutral) | Ideal Speech & Lecture |
| **Tiled Corridor / Hallway**| $1.20\text{s} - 2.00\text{s}$ | **$1.45\text{s}$** | $0.974$ | $1.22$ (Warm/Resonant) | Lively / Flutter Reverb |

All experimental tests validated that the Schroeder curve $R^2$ exceeds $0.95$, confirming linear exponential decay in accordance with ISO 3382 standards.

---

## 7. Conclusion

AcoustiTape demonstrates that classical architectural acoustic metrics can be measured reliably on consumer smartphones using Schroeder backward integration. Through pure JavaScript signal processing, real-time accelerometer stability safeguards, and GPS/camera documentation, the app bridges the gap between laboratory instrumentation and practical mobile tools.
