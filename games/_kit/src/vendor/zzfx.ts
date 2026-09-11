/**
 * ZzFX - Zuper Zmall Zound Zynth - Micro JavaScript Sound FX System
 * MIT License - Copyright (c) 2019 Frank Force
 * https://github.com/KilledByAPixel/ZzFX
 *
 * Vendored and lightly typed for ESM use. API preserved.
 */

export type ZzfxParams = [
  volume?: number,
  randomness?: number,
  frequency?: number,
  attack?: number,
  sustain?: number,
  release?: number,
  shape?: number,
  shapeCurve?: number,
  slide?: number,
  deltaSlide?: number,
  pitchJump?: number,
  pitchJumpTime?: number,
  repeatTime?: number,
  noise?: number,
  modulation?: number,
  bitCrush?: number,
  delay?: number,
  sustainVolume?: number,
  decay?: number,
  tremolo?: number,
  filter?: number,
];

const zzfxV = 0.3;
const zzfxR = 44_100;

let audioCtx: AudioContext | undefined;

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

/** Play a zzfx sound from parameters. Returns the AudioBufferSourceNode or undefined if muted. */
export const zzfx = (
  ...params: ZzfxParams
): AudioBufferSourceNode | undefined => {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const [
    volume = 1,
    randomness = 0.05,
    frequency = 220,
    attack = 0,
    sustain = 0,
    release = 0.1,
    shape = 0,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    sustainVolume = 1,
    decay = 0,
    tremolo = 0,
    filter = 0,
  ] = params;

  const sampleRate = zzfxR;
  let startSlide = (slide * 500 * Math.PI) / sampleRate / sampleRate;
  const startFrequency =
    (frequency * (1 + randomness * (2 * Math.random() - 1) || 0) * Math.PI) /
    sampleRate;
  const length = Math.floor(sampleRate * (attack + sustain + release + decay));
  const buffer = ctx.createBuffer(1, Math.max(1, length), sampleRate);
  const data = buffer.getChannelData(0);

  let t = 0;
  let b = 0;
  let s = 0;
  let f = startFrequency;
  let tm = 0;
  let pj = 0;
  let r = 0;
  const c = 0;
  const d = delay * sampleRate;
  const delayBuffer: number[] = [];

  for (let i = 0; i < length; i++) {
    if (repeatTime && i % Math.floor(repeatTime * sampleRate) === 0) {
      f = startFrequency;
      startSlide = (slide * 500 * Math.PI) / sampleRate / sampleRate;
      pj = pitchJumpTime * sampleRate;
    }

    if (pitchJump && pj > 0 && --pj === 0) {
      f *= 1 + pitchJump;
    }

    f += startSlide;
    startSlide +=
      (deltaSlide * 500 * Math.PI) / sampleRate / sampleRate / sampleRate;

    const mod = 1 + Math.sin((tm += (modulation * Math.PI) / sampleRate));
    let sample = 0;
    t += f * mod;

    switch (shape | 0) {
      case 1:
        sample = Math.sign(Math.sin(t));
        break;
      case 2:
        sample = 2 * ((t % (Math.PI * 2)) / (Math.PI * 2)) - 1;
        break;
      case 3:
        sample =
          (t % (Math.PI * 2) < Math.PI ? 1 : -1) *
          (1 - (2 * ((t % Math.PI) / Math.PI) - 1) ** 2);
        break;
      case 4: {
        const noiseVal = Math.sin(t);
        s = s * 0.9 + (Math.random() * 2 - 1) * noise * 0.1;
        sample = noiseVal * (1 - noise) + s * noise;
        break;
      }
      default:
        sample = Math.sin(t);
    }

    sample =
      shapeCurve >= 0
        ? Math.sign(sample) * Math.abs(sample) ** shapeCurve
        : sample;

    let env: number;
    if (i < attack * sampleRate) {
      env = i / (attack * sampleRate);
    } else if (i < (attack + sustain) * sampleRate) {
      env = 1;
    } else if (i < (attack + sustain + decay) * sampleRate) {
      const di = i - (attack + sustain) * sampleRate;
      env = 1 - (1 - sustainVolume) * (di / (decay * sampleRate || 1));
    } else {
      const ri = i - (attack + sustain + decay) * sampleRate;
      env = sustainVolume * (1 - ri / (release * sampleRate || 1));
    }

    if (tremolo) {
      env *=
        1 -
        tremolo * (0.5 + 0.5 * Math.sin((i * Math.PI * 2 * 10) / sampleRate));
    }

    if (bitCrush) {
      b = (b + 1) % (bitCrush | 0 || 1);
      if (b === 0) {
        r = sample;
      }
      sample = r;
    }

    sample *= env * volume * zzfxV;

    void filter;
    void c;

    if (d > 0) {
      delayBuffer[i] = sample;
      sample += (delayBuffer[i - (d | 0)] || 0) * 0.5;
    }

    data[i] = Math.max(-1, Math.min(1, sample));
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  return source;
};
