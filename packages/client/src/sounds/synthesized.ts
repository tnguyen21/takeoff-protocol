// Web Audio API synthesized sound effects

/** macOS-style notification chime: two-tone sine wave A5 -> C#6, 0.5s decay */
export function playNotificationChime(ctx: AudioContext): void {
  const now = ctx.currentTime;

  // First tone: A5 (880 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 880;
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.45);

  // Second tone: C#6 (1109 Hz), offset 120ms
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 1109;
  gain2.gain.setValueAtTime(0.001, now + 0.12);
  gain2.gain.linearRampToValueAtTime(0.25, now + 0.18);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.6);
}

/** macOS-style pop: sine sweep 400 Hz -> 150 Hz, 0.15s */
export function playPop(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

/** Timer warning: 3 rapid square-wave beeps at 1 kHz */
export function playTimerWarning(ctx: AudioContext): void {
  const now = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1000;
    const t = now + i * 0.16;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.setValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }
}

/** Phase transition: rising sawtooth + sine sweep 100 Hz -> 800 Hz, 1.2s decay */
export function playPhaseTransition(ctx: AudioContext): void {
  const now = ctx.currentTime;

  // Sawtooth rising sweep
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(100, now);
  osc1.frequency.exponentialRampToValueAtTime(800, now + 1.0);
  gain1.gain.setValueAtTime(0.08, now);
  gain1.gain.linearRampToValueAtTime(0.18, now + 0.4);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 1.2);

  // Sine accompaniment, one octave up
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(200, now);
  osc2.frequency.exponentialRampToValueAtTime(1600, now + 1.0);
  gain2.gain.setValueAtTime(0.06, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 1.2);
}

/** Slack knock: two quick bandpass-filtered triangle wave knocks */
export function playSlackKnock(ctx: AudioContext): void {
  const now = ctx.currentTime;
  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = "triangle";
    const t = now + i * 0.13;
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
    filter.type = "bandpass";
    filter.frequency.value = 400;
    filter.Q.value = 1.5;
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }
}

/** Message send: quick ascending two-tone sine */
export function playMessageSend(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const freqs = [440, 660];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = now + i * 0.07;
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  });
}
