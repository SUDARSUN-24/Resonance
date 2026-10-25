/* RESONANCE HD voice: runs Kokoro (open-source neural text to speech, Apache 2.0) off the page's main
   thread, so the page stays smooth while it works. Loaded by the Voice Lab as a module worker.
   in:  {type:'load'} · {type:'speak', id, text, voice, speed} · {type:'cancel'}
   out: {type:'progress', file, loaded, total} · {type:'ready'} · {type:'part', id, text, audio, sr}
        {type:'done', id} · {type:'error', id, message} */
import { KokoroTTS, TextSplitterStream } from 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
let loading = null, current = 0, queue = Promise.resolve();

function load() {
  if (!loading) loading = KokoroTTS.from_pretrained(MODEL, {
    dtype: 'q8', device: 'wasm',
    progress_callback: (p) => { if (p.status === 'progress') postMessage({ type: 'progress', file: p.file, loaded: p.loaded, total: p.total }); },
  }).catch((e) => { loading = null; throw e; });
  return loading;
}

async function speak({ id, text, voice, speed }) {
  if (current !== id) return;  /* replaced by a newer request while it waited */
  try {
    const t = await load();
    /* One sentence at a time, so the first one plays while the rest are made. The splitter is closed
       here because stream() keeps waiting for more text after the last sentence when given a string. */
    const sentences = new TextSplitterStream();
    sentences.push(text); sentences.close();
    for await (const part of t.stream(sentences, { voice, speed })) {
      if (current !== id) return;
      const audio = part.audio.audio;
      postMessage({ type: 'part', id, text: part.text, audio, sr: part.audio.sampling_rate }, [audio.buffer]);
    }
    if (current === id) postMessage({ type: 'done', id });
  } catch (e) {
    if (current === id) postMessage({ type: 'error', id, message: String(e && e.message || e) });
  }
}

onmessage = (e) => {
  const m = e.data;
  if (m.type === 'load') load().then(() => postMessage({ type: 'ready' }), (err) => postMessage({ type: 'error', id: 0, message: String(err && err.message || err) }));
  /* One request at a time on the model: a newer one stops the old one after its current sentence */
  else if (m.type === 'speak') { current = m.id; queue = queue.then(() => speak(m)); }
  else if (m.type === 'cancel') current = 0;
};
