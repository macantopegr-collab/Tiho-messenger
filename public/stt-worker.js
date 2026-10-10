/* Распознавание речи прямо на устройстве: модель Whisper (base), звук никуда не отправляется. */
import { pipeline, env } from '/ai/vendor/transformers.min.js';

env.allowLocalModels = false;
env.remoteHost = self.location.origin + '/ai/hf/';
env.remotePathTemplate = '{model}/resolve/{revision}/';
env.backends.onnx.wasm.wasmPaths = self.location.origin + '/ai/vendor/';
env.backends.onnx.wasm.numThreads = 1;

let asr = null;
const files = new Map();
function progress(p) {
  if (p.status === 'progress' && p.total) files.set(p.file, [p.loaded, p.total]);
  if (p.status === 'done' && files.has(p.file)) { const [, t] = files.get(p.file); files.set(p.file, [t, t]); }
  let l = 0, t = 0;
  for (const [a, b] of files.values()) { l += a; t += b; }
  if (t) self.postMessage({ type: 'progress', loaded: l, total: t });
}
self.onmessage = async ({ data }) => {
  try {
    if (!asr) {
      asr = pipeline('automatic-speech-recognition', 'onnx-community/whisper-base', {
        dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' }, device: 'wasm', progress_callback: progress,
      });
      asr.catch(() => { asr = null; });
    }
    const run = await asr;
    self.postMessage({ type: 'working', id: data.id });
    const out = await run(data.audio, { chunk_length_s: 30, stride_length_s: 5, task: 'transcribe', language: data.language || null, return_timestamps: false });
    self.postMessage({ type: 'done', id: data.id, text: String(out.text || '').trim() });
  } catch (e) {
    self.postMessage({ type: 'error', id: data.id, error: String(e?.message || e) });
  }
};
