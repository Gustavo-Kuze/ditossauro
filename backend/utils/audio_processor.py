import queue
import threading
from typing import Optional, Tuple

import numpy as np
import sounddevice as sd
import soundfile as sf


class AudioRecorder:
    def __init__(self, samplerate: int = 16000, channels: int = 1, dtype: str = 'float32') -> None:
        self.samplerate = samplerate
        self.channels = channels
        self.dtype = dtype
        self._queue: "queue.Queue[np.ndarray]" = queue.Queue()
        self._stream: Optional[sd.InputStream] = None
        self._recording = False
        self._lock = threading.Lock()

    def _callback(self, indata, frames, time, status):  # type: ignore[no-untyped-def]
        if status:
            # print(status)
            pass
        if self._recording:
            self._queue.put(indata.copy())

    def start(self) -> None:
        with self._lock:
            if self._recording:
                return
            self._recording = True
            self._stream = sd.InputStream(
                samplerate=self.samplerate,
                channels=self.channels,
                dtype=self.dtype,
                callback=self._callback,
            )
            self._stream.start()

    def stop_and_save(self, output_path: str) -> Tuple[int, int]:
        with self._lock:
            self._recording = False
            if self._stream is not None:
                self._stream.stop()
                self._stream.close()
                self._stream = None

        # Collect all chunks
        chunks = []
        while not self._queue.empty():
            chunks.append(self._queue.get())

        if not chunks:
            # Write a tiny silence to avoid downstream errors
            data = np.zeros((int(self.samplerate * 0.2), self.channels), dtype=self.dtype)
        else:
            data = np.concatenate(chunks, axis=0)

        # Normalize to int16 PCM WAV
        if data.dtype != np.float32:
            data = data.astype(np.float32)
        peak = max(np.max(np.abs(data)), 1e-6)
        data = (data / peak) * 0.8

        sf.write(output_path, data, self.samplerate, format='WAV', subtype='PCM_16')
        num_samples = data.shape[0]
        return num_samples, self.samplerate

