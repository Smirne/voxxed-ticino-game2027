#!/usr/bin/env python3
"""
Make our own venue photos safe to commit to this PUBLIC repo.

    python3 tools/photos/clean.py <input-folder> [--out media/welld] [--keep name.jpg:x0,y0,x1,y1 ...]
                                                  [--blur name.jpg:x0,y0,x1,y1 ...]

For every .jpg/.jpeg/.png in <input-folder>:
  - resize to 1600 px on the long side, JPEG q85
  - strip ALL metadata (EXIF, GPS, camera)
  - blur every face OpenCV's YuNet detector finds (full-res tiles at 3 scales)
and write the result to --out, plus a preview with the blurred boxes outlined to
--out/../_preview/ (gitignored) so a human can check every frame before committing.

The detector is a first pass, not the check: it misses profiles at the frame edge and
"finds" faces in paintings. --keep excludes a rectangle (1600-px coords) from blurring
(the foyer painting); --blur adds one by hand. Look at every preview.

Needs: pip install opencv-python-headless pillow numpy. Downloads the 230 KB YuNet model
(opencv_zoo, MIT) to ~/.cache/yunet.onnx on first use.
"""
import argparse, glob, os, sys, urllib.request
import cv2, numpy as np
from PIL import Image, ImageOps

MODEL_URL = 'https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx'


def rects(specs):
    out = {}
    for s in specs or []:
        name, r = s.rsplit(':', 1)
        out.setdefault(name, []).append(tuple(int(v) for v in r.split(',')))
    return out


def pixelate(img, x0, y0, x1, y1):
    roi = img[y0:y1, x0:x1]
    w, h = x1 - x0, y1 - y0
    small = cv2.resize(roi, (max(1, w // 8), max(1, h // 8)))
    k = max(15, (w // 2) | 1)
    img[y0:y1, x0:x1] = cv2.GaussianBlur(cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST), (k, k), 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('input')
    ap.add_argument('--out', default='media/welld')
    ap.add_argument('--keep', nargs='*')
    ap.add_argument('--blur', nargs='*')
    a = ap.parse_args()
    keep, manual = rects(a.keep), rects(a.blur)
    model = os.path.expanduser('~/.cache/yunet.onnx')
    if not os.path.exists(model):
        os.makedirs(os.path.dirname(model), exist_ok=True)
        urllib.request.urlretrieve(MODEL_URL, model)
    det = cv2.FaceDetectorYN.create(model, '', (320, 320), 0.35, 0.3, 5000)
    prev_dir = os.path.join(os.path.dirname(os.path.abspath(a.out)), '_preview')
    os.makedirs(a.out, exist_ok=True)
    os.makedirs(prev_dir, exist_ok=True)
    files = [f for f in sorted(glob.glob(os.path.join(a.input, '*'))) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    for f in files:
        name = os.path.splitext(os.path.basename(f))[0] + '.jpg'
        pil = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
        big = np.asarray(pil)[:, :, ::-1].copy()
        H, W = big.shape[:2]
        small_pil = pil.copy()
        small_pil.thumbnail((1600, 1600), Image.LANCZOS)
        out = np.asarray(small_pil)[:, :, ::-1].copy()
        k = out.shape[1] / W
        boxes = []
        for scale in (2.0, 1.0, 0.5):
            img = big if scale == 1 else cv2.resize(big, None, fx=scale, fy=scale)
            h, w = img.shape[:2]
            T = 1280
            for y0 in range(0, h, T // 2):
                for x0 in range(0, w, T // 2):
                    tile = img[y0:y0 + T, x0:x0 + T]
                    if min(tile.shape[:2]) < 64:
                        continue
                    det.setInputSize((tile.shape[1], tile.shape[0]))
                    _, faces = det.detect(tile)
                    for fc in faces if faces is not None else []:
                        x, y, bw, bh, sc = *fc[:4], float(fc[-1])
                        if (scale > 1 and sc < 0.6) or (scale <= 1 and sc < 0.4):
                            continue
                        if bw / scale > 0.12 * W or bh / bw > 1.8:
                            continue
                        boxes.append(((x + x0) / scale, (y + y0) / scale, bw / scale, bh / scale))
        prev = out.copy()
        for x, y, bw, bh in boxes:
            cx, cy = (x + bw / 2) * k, (y + bh / 2) * k
            rw, rh = bw * k * 0.85, bh * k
            x0, y0 = int(max(0, cx - rw)), int(max(0, cy - rh))
            x1, y1 = int(min(out.shape[1], cx + rw)), int(min(out.shape[0], cy + rh))
            if x1 - x0 < 3 or y1 - y0 < 3:
                continue
            if any(p <= cx <= r and q <= cy <= s for p, q, r, s in keep.get(name, [])):
                continue
            pixelate(out, x0, y0, x1, y1)
            cv2.rectangle(prev, (x0, y0), (x1, y1), (0, 0, 255), 2)
        for x0, y0, x1, y1 in manual.get(name, []):
            pixelate(out, x0, y0, x1, y1)
            cv2.rectangle(prev, (x0, y0), (x1, y1), (255, 0, 255), 2)
        # cv2.imwrite writes no metadata: EXIF and GPS are gone.
        cv2.imwrite(os.path.join(a.out, name), out, [cv2.IMWRITE_JPEG_QUALITY, 85])
        cv2.imwrite(os.path.join(prev_dir, name), prev)
        print(f'{name}: {out.shape[1]}x{out.shape[0]}, {len(boxes)} detections')
    print(f'Now LOOK at every preview in {prev_dir} before committing.')


if __name__ == '__main__':
    sys.exit(main())
