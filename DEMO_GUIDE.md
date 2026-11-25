# AcoustiTape: Project Demonstration Script
## Step-by-Step Presentation Guide for Class Teacher

Use this 3-minute walkthrough to demonstrate AcoustiTape to your teacher:

---

### Step 1: Open the App & Explain the Problem (30 seconds)
1. Launch the app with `npx expo start`.
2. Open the **Measure** screen.
3. **Say to your teacher**:
   > *"Good morning/afternoon, Sir/Ma'am. My major project is AcoustiTape. Professional room acoustic meters cost thousands of dollars and use calibrated dodecahedron speakers. AcoustiTape implements the international acoustic standard — ISO 3382 — right on a smartphone using Manfred Schroeder's backward integration technique from a single handclap."*

---

### Step 2: Show the Hardware Sensors & Placement Guard (45 seconds)
1. Point to the **Spirit Level Bubble** at the top of the screen:
   - Tilt your phone slightly: show how the bubble moves and warns when tilted.
   - Hold it steady and upright: show how it turns **Green** (*"Phone Steady & Level"*).
   - **Explain**: *"ISO 3382 requires microphones to remain stationary at ear/chest height. We use the phone's Accelerometer (`expo-sensors`) to ensure the user does not create motion friction artifacts during sound decay."*
2. Point to the **GPS Venue Pill**:
   - Show how the app automatically uses `expo-location` to reverse-geocode the classroom building or coordinates.
3. Tap **"Take Room Photo"**:
   - Snap a photo of the room or select surface materials (*"Carpet Floor"*, *"Acoustic Panels"*).

---

### Step 3: Produce the Impulse & View Results (60 seconds)
1. Tap **"Record Live Handclap"** (or tap *"Test with Demo Impulse"* if in a crowded room).
2. Look at the **Live VU Meter**: point out the ambient noise level in green below $-40\text{ dB}$.
3. Clap your hands once sharply!
4. The app transitions to the **Results** screen. Show the key outputs:
   - **Hero RT60**: *"Our classroom reverberation time is 0.58s."*
   - **Schroeder Decay Curve (EDC)**: *"This blue curve is Schroeder's reverse integral of squared sound pressure $p^2(t)$. Notice the rose dashed line — that is an Ordinary Least Squares regression fit between $-5\text{ dB}$ and $-25\text{ dB}$ ($T_{20}$), multiplied by 3 to estimate $RT_{60}$."*
   - **Fit Quality $R^2$**: *"The $R^2$ is over $98\%$, proving clean linear decay."*
   - **Octave Spectrum**: Show the 6-band bar chart (125 Hz to 4 kHz) and the **Bass Ratio** (*"Warm"* vs *"Bright"*).
   - **Room Suitability**: Show the ANSI S12.60 classroom pass badge.

---

### Step 4: Show History & Dual-Room Comparison (30 seconds)
1. Switch to the **History** tab:
   - Show saved audits with room photos and GPS venue tags.
2. Tap **"Compare"**:
   - Select 2 rooms (e.g. *"Classroom"* vs *"Tiled Corridor"*).
   - Show the **Comparison Modal**: point out the overlaid Schroeder decay curves and grouped octave bars showing the differential $\Delta RT_{60}$.

---

### Step 5: Advanced Features Walkthrough (30 seconds)
1. **Acoustic Clarity & STI Intelligibility**:
   - In **Results**, scroll to the *"Acoustic Clarity & Intelligibility"* card.
   - Point out **$C_{50}$ (Speech Clarity in dB)**, **$C_{80}$ (Music Clarity)**, and the **Speech Transmission Index (STI = 0.78 - Excellent)**.
   - Explain: *"ISO 3382 uses $C_{50}$ to measure the ratio of early direct sound to late reverberation. In classrooms, $C_{50} > 0\text{ dB}$ ensures students can understand speech consonants clearly."*
2. **Acoustic Treatment Simulator**:
   - Switch to the **Standards** tab and tap **"Treatment Simulator"**.
   - Pick *"Dense Rockwool Panels"* or *"Corner Bass Traps"*.
   - Show your teacher how the app dynamically calculates the exact number of panels ($m^2$) needed to achieve a target $RT_{60}$ and predicts post-treatment decay!
3. **In-App Test Signal Generator**:
   - On the **Measure** screen, tap **"Acoustic Signal Generator"**.
   - Tap **Play** on the *Dirac Acoustic Impulse Burst* or *Logarithmic Sine Sweep* to demonstrate how large auditoriums can be measured without handclapping by connecting the phone to external speakers!
4. Tap **"Export & Share Report"** on Results screen to show the native sharing card!

---

### Common Teacher Questions & Answers:

**Q: What is the difference between RT60 and Speech Clarity ($C_{50}$)?**
> *Answer*: "$RT_{60}$ measures how long sound lingers in a room until it decays by 60 dB. Speech Clarity ($C_{50}$) evaluates speech intelligibility by comparing early sound energy (first 50ms) to late reverberation energy. Even if $RT_{60}$ is acceptable, strong late reflections can mask consonants and ruin speech definition ($D_{50}$)."

**Q: How does the Acoustic Treatment Simulator work?**
> *Answer*: "It applies Sabine and Eyring absorption equations:
> $$A = \frac{0.161 \cdot V}{RT_{60}}$$
> By subtracting current room absorption from the target room absorption ($\Delta A = A_{\text{target}} - A_{\text{current}}$) and factoring in laboratory absorption coefficients ($\alpha$) of materials like 50mm Rockwool ($\alpha = 0.85$) or Corner Bass Traps ($\alpha = 0.80$), it solves for the exact square meters and panel counts required."

---

### Common Teacher Questions & Answers:

**Q: Why don't you just measure the time it takes to drop by 60 dB directly?**
> *Answer*: "A smartphone microphone in a standard room has an ambient noise floor around $-45\text{ dB}$ to $-50\text{ dB}$. Since a handclap peaks around $0\text{ dB}$ to $-5\text{ dB}$, the usable dynamic range is only $40\text{ dB}$ to $45\text{ dB}$. ISO 3382 specifically addresses this by defining $T_{20}$ ($-5\text{ dB}$ to $-25\text{ dB}$) and $T_{30}$ ($-5\text{ dB}$ to $-35\text{ dB}$), using linear regression to extrapolate the full 60 dB drop."

**Q: How does Schroeder backward integration work?**
> *Answer*: "In 1965, Manfred Schroeder proved that integrating the squared impulse response in reverse:
> $$EDC(t) = \int_t^{\infty} p^2(\tau) \, d\tau$$
> yields the exact average decay curve without the random modal interference and phase fluctuations of a single raw clap recording."

**Q: Is this written in React Native?**
> *Answer*: "Yes, built in pure JavaScript React Native with Expo SDK 58. The signal processing runs directly on mobile using typed Float32Arrays and digital biquad Butterworth filters."
