#!/usr/bin/env python3
"""Prepare BananaHub logo assets from a white-background source PNG.

This script removes near-white pixels to transparency and can derive
site-ready favicon assets from the cleaned source image. It can also
remove the outer ring and export a GitHub-friendly square logo.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare BananaHub logo assets")
    parser.add_argument("--input", required=True, help="Path to the source PNG")
    parser.add_argument("--transparent-output", help="Path to the cleaned transparent PNG")
    parser.add_argument("--favicon-output", help="Optional favicon PNG output path")
    parser.add_argument("--touch-output", help="Optional apple-touch-icon PNG output path")
    parser.add_argument(
        "--ringless-output",
        help="Optional transparent PNG output path with the outer ring removed",
    )
    parser.add_argument(
        "--github-output",
        help="Optional square PNG output path for a GitHub org/user logo",
    )
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
    parser.add_argument(
        "--github-size",
        type=int,
        default=1024,
        help="Output size for GitHub logo PNG (default: 1024)",
    )
    parser.add_argument(
        "--github-padding",
        type=float,
        default=0.12,
        help="Transparent padding ratio around the ringless logo (default: 0.12)",
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


def find_opaque_components(image: Image.Image) -> list[dict[str, object]]:
    alpha = image.getchannel("A")
    pixels = alpha.load()
    width, height = image.size
    seen = bytearray(width * height)
    components: list[dict[str, object]] = []

    for y in range(height):
        for x in range(width):
            index = y * width + x
            if seen[index] or pixels[x, y] == 0:
                continue

            queue: deque[tuple[int, int]] = deque([(x, y)])
            seen[index] = 1
            coords: list[tuple[int, int]] = []
            min_x = max_x = x
            min_y = max_y = y

            while queue:
                current_x, current_y = queue.popleft()
                coords.append((current_x, current_y))
                min_x = min(min_x, current_x)
                min_y = min(min_y, current_y)
                max_x = max(max_x, current_x)
                max_y = max(max_y, current_y)

                for next_x, next_y in (
                    (current_x + 1, current_y),
                    (current_x - 1, current_y),
                    (current_x, current_y + 1),
                    (current_x, current_y - 1),
                ):
                    if not (0 <= next_x < width and 0 <= next_y < height):
                        continue

                    next_index = next_y * width + next_x
                    if seen[next_index] or pixels[next_x, next_y] == 0:
                        continue

                    seen[next_index] = 1
                    queue.append((next_x, next_y))

            bbox = (min_x, min_y, max_x, max_y)
            bbox_area = (max_x - min_x + 1) * (max_y - min_y + 1)
            components.append(
                {
                    "coords": coords,
                    "bbox": bbox,
                    "bbox_area": bbox_area,
                    "size": len(coords),
                }
            )

    return components


def remove_component(image: Image.Image, component: dict[str, object]) -> Image.Image:
    updated = image.copy()
    pixels = updated.load()

    for x, y in component["coords"]:
        pixels[x, y] = (0, 0, 0, 0)

    return updated


def remove_outer_ring(image: Image.Image) -> Image.Image:
    width, height = image.size
    candidates: list[tuple[int, dict[str, object]]] = []

    for component in find_opaque_components(image):
        min_x, min_y, max_x, max_y = component["bbox"]
        bbox_width = max_x - min_x + 1
        bbox_height = max_y - min_y + 1
        fill_ratio = component["size"] / component["bbox_area"]

        if bbox_width / width >= 0.85 and bbox_height / height >= 0.85 and fill_ratio <= 0.25:
            candidates.append((component["bbox_area"], component))

    if not candidates:
        raise ValueError("Could not identify an outer ring to remove")

    _, ring_component = max(candidates, key=lambda item: item[0])
    return remove_component(image, ring_component)


def export_square_logo(image: Image.Image, size: int, padding: float) -> Image.Image:
    if not 0 <= padding < 0.5:
        raise ValueError("Padding must be between 0 and 0.5")

    alpha_bbox = image.getchannel("A").getbbox()
    if not alpha_bbox:
        raise ValueError("Image has no visible pixels to export")

    cropped = image.crop(alpha_bbox)
    crop_width, crop_height = cropped.size
    available = max(1, round(size * (1 - padding * 2)))
    scale = min(available / crop_width, available / crop_height)
    resized = cropped.resize(
        (
            max(1, round(crop_width * scale)),
            max(1, round(crop_height * scale)),
        ),
        Image.LANCZOS,
    )

    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - resized.width) // 2, (size - resized.height) // 2)
    square.alpha_composite(resized, dest=offset)
    return square


def main() -> None:
    args = parse_args()
    if not any(
        (
            args.transparent_output,
            args.favicon_output,
            args.touch_output,
            args.ringless_output,
            args.github_output,
        )
    ):
        raise SystemExit("Provide at least one output path")

    input_path = Path(args.input)
    cleaned = remove_white_background(Image.open(input_path), args.threshold)
    ringless = None

    if args.transparent_output:
        transparent_output = Path(args.transparent_output)
        transparent_output.parent.mkdir(parents=True, exist_ok=True)
        cleaned.save(transparent_output)

    if args.favicon_output:
        save_resized(cleaned, args.favicon_size, Path(args.favicon_output))

    if args.touch_output:
        save_resized(cleaned, args.touch_size, Path(args.touch_output))

    if args.ringless_output or args.github_output:
        ringless = remove_outer_ring(cleaned)

    if args.ringless_output:
        ringless_output = Path(args.ringless_output)
        ringless_output.parent.mkdir(parents=True, exist_ok=True)
        ringless.save(ringless_output)

    if args.github_output:
        github_output = Path(args.github_output)
        github_output.parent.mkdir(parents=True, exist_ok=True)
        export_square_logo(ringless, args.github_size, args.github_padding).save(github_output)


if __name__ == "__main__":
    main()
