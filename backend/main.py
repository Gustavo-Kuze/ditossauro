import argparse
import json
import signal
import sys
import time
from pathlib import Path

from utils.audio_processor import AudioRecorder


def cmd_record(output: Path) -> None:
    recorder = AudioRecorder()

    def handle_sigint(signum, frame):  # type: ignore[no-untyped-def]
        # Stop and flush audio
        recorder.stop_and_save(str(output))
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_sigint)

    recorder.start()
    # Block until killed by SIGINT from Tauri
    try:
        while True:
            time.sleep(0.25)
    except KeyboardInterrupt:
        pass


def cmd_transcribe(input_path: Path, model: str) -> None:
    from faster_whisper import WhisperModel  # lazy import for faster startup

    model_obj = WhisperModel(model, device="auto")
    segments, info = model_obj.transcribe(str(input_path), vad_filter=True)
    text = "".join(seg.text for seg in segments).strip()
    print(json.dumps({"text": text}, ensure_ascii=False))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="OpenWispr backend controller")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_rec = sub.add_parser("record", help="Start recording until SIGINT; write to output")
    p_rec.add_argument("--output", type=Path, required=True)

    p_tr = sub.add_parser("transcribe", help="Transcribe an input audio file")
    p_tr.add_argument("--input", type=Path, required=True)
    p_tr.add_argument("--model", type=str, default="tiny")

    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.cmd == "record":
        cmd_record(args.output)
    elif args.cmd == "transcribe":
        cmd_transcribe(args.input, args.model)
    else:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

