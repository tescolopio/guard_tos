#!/usr/bin/env python3
"""Export a fine-tuned category model to ONNX and optionally TF.js formats.

The script primarily targets ONNX because it is well-supported by Hugging Face
Transformers. TF.js export is attempted via the ONNX→TF→TF.js toolchain when the
required dependencies are installed (`onnx`, `onnx-tf`, `tensorflow`, `tensorflowjs`).

Example:

```bash
python scripts/ml/export_category_model.py \
  --model artifacts/models/data_collection/v2025.09.30 \
  --output-dir dist/models/data_collection/v2025.09.30 \
  --opset 14 \
  --tfjs
```
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from transformers import AutoConfig, AutoTokenizer, AutoModelForSequenceClassification  # type: ignore
from transformers.onnx import FeaturesManager, export  # type: ignore


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, help="Directory containing fine-tuned model")
    parser.add_argument("--output-dir", required=True, help="Where to store exported artifacts")
    parser.add_argument("--opset", type=int, default=13, help="ONNX opset version")
    parser.add_argument("--tfjs", action="store_true", help="Attempt TF.js conversion (requires tensorflowjs converter)")
    return parser.parse_args()


def export_onnx(model_path: Path, output_dir: Path, opset: int) -> Path:
    config = AutoConfig.from_pretrained(model_path)
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)

    model_kind, onnx_config_cls = FeaturesManager.check_supported_model_or_raise(
        model,
        feature="sequence-classification",
    )
    onnx_config = onnx_config_cls(config)

    output_dir.mkdir(parents=True, exist_ok=True)
    onnx_path = output_dir / "model.onnx"
    export(
        tokenizer=tokenizer,
        model=model,
        config=onnx_config,
        opset=opset,
        output=onnx_path,
    )
    return onnx_path


def try_convert_to_tfjs(onnx_path: Path, output_dir: Path) -> None:
    tfjs_dir = output_dir / "tfjs"
    tfjs_dir.mkdir(parents=True, exist_ok=True)

    try:
        import onnx  # type: ignore
        from onnx_tf.backend import prepare  # type: ignore
        import tensorflow as tf  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "TF.js conversion requires `onnx`, `onnx-tf`, and `tensorflow`. "
            "Install the extras or rerun without --tfjs."
        ) from exc

    # Convert ONNX -> TensorFlow SavedModel
    model = onnx.load(str(onnx_path))
    tf_rep = prepare(model)
    saved_model_dir = tfjs_dir / "saved_model"
    tf_rep.export_graph(str(saved_model_dir))

    # Convert SavedModel -> TF.js format via tensorflowjs_converter
    converter_cmd = [
        "tensorflowjs_converter",
        "--input_format",
        "tf_saved_model",
        str(saved_model_dir),
        str(tfjs_dir),
    ]
    subprocess.run(converter_cmd, check=True)


def main() -> None:
    args = parse_args()
    model_path = Path(args.model)
    output_dir = Path(args.output_dir)

    onnx_path = export_onnx(model_path, output_dir, args.opset)
    print(f"Exported ONNX model to {onnx_path}")

    if args.tfjs:
        try:
            try_convert_to_tfjs(onnx_path, output_dir)
            print(f"TF.js assets written to {output_dir / 'tfjs'}")
        except SystemExit as exc:
            raise
        except Exception as exc:
            raise SystemExit(f"TF.js conversion failed: {exc}") from exc


if __name__ == "__main__":
    main()
