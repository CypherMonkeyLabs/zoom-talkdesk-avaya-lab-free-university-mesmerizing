#!/usr/bin/env python3
"""Draw original ZTA icons. No vendor mark. """
import pathlib
import struct
import zlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "icons"


def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path, w, h, pixel):
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            raw.extend(pixel(x, y, w, h))
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def inside_round(x, y, w, h, pad, radius):
    left, top, right, bottom = pad, pad, w - 1 - pad, h - 1 - pad
    if x < left or y < top or x > right or y > bottom:
        return False
    cx = min(max(x, left + radius), right - radius)
    cy = min(max(y, top + radius), bottom - radius)
    dx, dy = x - cx, y - cy
    return dx * dx + dy * dy <= radius * radius


def icon_pixel(maskable):
    def pixel(x, y, w, h):
        pad = int(w * (0.12 if maskable else 0.04))
        radius = int(w * 0.18)
        if not inside_round(x, y, w, h, pad, radius):
            return (0, 0, 0, 0) if not maskable else (15, 118, 110, 255)
        nx = (x + 0.5) / w
        ny = (y + 0.5) / h
        if (nx - 0.5) ** 2 + (ny - 0.46) ** 2 < 0.07:
            eye_l = (nx - 0.42) ** 2 * 2 + (ny - 0.44) ** 2 * 3 < 0.004
            eye_r = (nx - 0.58) ** 2 * 2 + (ny - 0.44) ** 2 * 3 < 0.004
            if eye_l or eye_r:
                return (15, 23, 42, 255)
            return (254, 243, 199, 255)
        return (15, 118, 110, 255)
    return pixel


def splash_pixel(x, y, w, h):
    nx = x / w
    if ny_band(y, h):
        return (8, 47, 46, 255)
    base = (15, 118, 110, 255) if nx < 0.55 else (30, 27, 75, 255)
    cx, cy = int(w * 0.5), int(h * 0.48)
    if (x - cx) ** 2 + (y - cy) ** 2 < (min(w, h) * 0.12) ** 2:
        return (254, 243, 199, 255)
    return base


def ny_band(y, h):
    return False


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    write_png(OUT / "icon-192.png", 192, 192, icon_pixel(False))
    write_png(OUT / "icon-512.png", 512, 512, icon_pixel(False))
    write_png(OUT / "icon-maskable-512.png", 512, 512, icon_pixel(True))
    write_png(OUT / "apple-touch-icon.png", 180, 180, icon_pixel(False))
    write_png(OUT / "splash.png", 640, 360, splash_pixel)
    print("icons", OUT)


if __name__ == "__main__":
    main()
