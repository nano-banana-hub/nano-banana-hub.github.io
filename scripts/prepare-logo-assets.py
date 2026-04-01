#!/usr/bin/env python3
"""Prepare BananaHub logo assets from a white-background source PNG.

This script removes near-white pixels to transparency and can derive
site-ready favicon assets from the cleaned source image.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare BananaHub logo assets")
    parser.add_argument("--input", required=True, help="Path to the source PNG")
    parser.add_argument("--transparent-output", required=True, help="Path to the cleaned transparent PNG")
    parser.add_argument("--favicon-output", help="Optional favicon PNG output path")
    parser.add_argument("--touch-output", help="Optional apple-touch-icon PNG output path")
    parser.add_argument(
        "--threshold",
        type=int,
        default=245,
        help="RGB threshold for removing near-white pixels (default: 245)",
    )
    parser.add_argument(
        "--favicon-size",
        type=int,
        default=256,
        help="Output size for favicon PNG (default: 256)",
    )
    parser.add_argument(
        "--touch-size",
        type=int,
        default=180,
        help="Output size for apple-touch-icon PNG (default: 180)",
    )
    return parser.parse_args()


def remove_white_background(image: Image.Image, threshold: int) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a and r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)

    return rgba


def save_resized(image: Image.Image, size: int, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.resize((size, size), Image.LANCZOS).save(output_path)


def main() -> None:
    args = parse_args()

    input_path = Path(args.input)
    transparent_output = Path(args.transparent_output)

    cleaned = remove_white_background(Image.open(input_path), args.threshold)
    transparent_output.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(transparent_output)

    if args.favicon_output:
        save_resized(cleaned, args.favicon_size, Path(args.favicon_output))

    if args.touch_output:
        save_resized(cleaned, args.touch_size, Path(args.touch_output))


if __name__ == "__main__":
    main()
