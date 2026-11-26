export function createLogoAudio() {
  let context;
  let voice;
  let ready = Promise.resolve();

  function unlock() {
    try {
      context ??= new AudioContext();
      if (context.state === "suspended") {
        // Allow the first note to wait for the audio device without stalling Logo.
        ready = Promise.race([
          context.resume().catch(() => {}),
          new Promise(resolve => setTimeout(resolve, 300)),
        ]);
      }
    } catch {
      // The program can still run if audio is unavailable.
    }
  }

  function stop() {
    if (!voice) return;
    voice.stop();
    voice = null;
  }

  function play(midi, milliseconds) {
    stop();
    if (context?.state !== "running") return false;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;
    const length = milliseconds / 1000;
    const envelope = Math.min(0.008, length / 3);

    oscillator.type = "triangle";
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + envelope);
    gain.gain.setValueAtTime(0.12, start + length - envelope);
    gain.gain.linearRampToValueAtTime(0, start + length);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      if (voice === oscillator) voice = null;
    };
    oscillator.start(start);
    oscillator.stop(start + length);
    voice = oscillator;
    return true;
  }

  function dispose() {
    stop();
    if (context) void context.close().catch(() => {});
    context = null;
  }

  return { unlock, whenReady: () => ready, play, stop, dispose };
}
