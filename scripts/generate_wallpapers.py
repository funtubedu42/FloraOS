import os
import math
from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1080
OUT_DIRS = ['public/wallpapers', 'dist/wallpapers']

for d in OUT_DIRS:
    os.makedirs(d, exist_ok=True)

def save_all(im, filename):
    for d in OUT_DIRS:
        path = os.path.join(d, filename)
        im.save(path, quality=95)
    print(f"Saved {filename}")

# 1. emerald_forest.jpg (FloraOS Signature)
def make_emerald():
    im = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        r = int(4 + t * 8)
        g = int(20 + t * 45)
        b = int(18 + t * 35)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    pts1 = [(x, int(H * 0.5 + math.sin(x * 0.003) * 150 + math.cos(x * 0.0018) * 80)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts1, fill=(16, 185, 129, 110))

    pts2 = [(x, int(H * 0.62 + math.sin(x * 0.0025 + 1.2) * 130 + math.cos(x * 0.004) * 60)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts2, fill=(6, 182, 212, 85))

    layer = layer.filter(ImageFilter.GaussianBlur(50))
    final = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    save_all(final, 'emerald_forest.jpg')

# 2. nordic_aurora.jpg
def make_aurora():
    im = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        r = int(5 + t * 6)
        g = int(10 + t * 15)
        b = int(28 + t * 30)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)

    pts = [(x, int(H * 0.42 + math.sin(x * 0.0035) * 180 + math.sin(x * 0.008) * 40)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts, fill=(52, 211, 153, 90))

    pts2 = [(x, int(H * 0.35 + math.sin(x * 0.0028 + 0.8) * 160)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts2, fill=(56, 189, 248, 80))

    pts3 = [(x, int(H * 0.52 + math.cos(x * 0.003) * 120)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts3, fill=(129, 140, 248, 60))

    layer = layer.filter(ImageFilter.GaussianBlur(55))
    final = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    save_all(final, 'nordic_aurora.jpg')

# 3. cyber_dark.jpg
def make_cyber_dark():
    im = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        val = int(8 + t * 14)
        draw.line([(0, y), (W, y)], fill=(val, val + 2, val + 6))

    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    pts = [(x, int(H * 0.7 + math.sin(x * 0.002) * 100)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts, fill=(30, 41, 59, 130))

    pts2 = [(x, int(H * 0.78 + math.cos(x * 0.003) * 80)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts2, fill=(15, 23, 42, 160))

    layer = layer.filter(ImageFilter.GaussianBlur(40))
    final = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    save_all(final, 'cyber_dark.jpg')

# 4. neon_gradient.jpg
def make_neon():
    im = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        r = int(25 + t * 30)
        g = int(12 + t * 15)
        b = int(55 + t * 45)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    pts = [(x, int(H * 0.45 + math.sin(x * 0.003) * 160)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts, fill=(168, 85, 247, 95))

    pts2 = [(x, int(H * 0.58 + math.cos(x * 0.0025) * 140)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts2, fill=(236, 72, 153, 75))

    pts3 = [(x, int(H * 0.68 + math.sin(x * 0.004 + 1) * 110)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts3, fill=(56, 189, 248, 70))

    layer = layer.filter(ImageFilter.GaussianBlur(65))
    final = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    save_all(final, 'neon_gradient.jpg')

# 5. mountain_peak.jpg
def make_mountain():
    im = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        r = int(10 + t * 15)
        g = int(22 + t * 25)
        b = int(45 + t * 50)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    pts = [(x, int(H * 0.5 + math.sin(x * 0.0035) * 120 + math.sin(x * 0.01) * 50)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts, fill=(56, 189, 248, 85))

    pts2 = [(x, int(H * 0.65 + math.cos(x * 0.003) * 100)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts2, fill=(14, 116, 144, 100))

    layer = layer.filter(ImageFilter.GaussianBlur(45))
    final = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    save_all(final, 'mountain_peak.jpg')

# 6. sunset_dunes.jpg
def make_sunset():
    im = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        r = int(45 + t * 55)
        g = int(15 + t * 25)
        b = int(35 + t * 30)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    pts = [(x, int(H * 0.48 + math.sin(x * 0.003) * 140)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts, fill=(244, 63, 94, 90))

    pts2 = [(x, int(H * 0.6 + math.cos(x * 0.0028) * 120)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts2, fill=(245, 158, 11, 75))

    layer = layer.filter(ImageFilter.GaussianBlur(55))
    final = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    save_all(final, 'sunset_dunes.jpg')

# 7. botanical_zen.jpg
def make_botanical():
    im = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        r = int(5 + t * 12)
        g = int(35 + t * 40)
        b = int(25 + t * 30)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    pts = [(x, int(H * 0.52 + math.sin(x * 0.004) * 130)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts, fill=(34, 197, 94, 95))

    pts2 = [(x, int(H * 0.64 + math.cos(x * 0.003) * 110)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts2, fill=(16, 185, 129, 85))

    layer = layer.filter(ImageFilter.GaussianBlur(50))
    final = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    save_all(final, 'botanical_zen.jpg')

# 8. deep_space.jpg
def make_space():
    im = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        val = int(4 + t * 8)
        draw.line([(0, y), (W, y)], fill=(val, val + 2, val + 15))

    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    pts = [(x, int(H * 0.4 + math.sin(x * 0.003) * 160)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts, fill=(99, 102, 241, 80))

    pts2 = [(x, int(H * 0.55 + math.cos(x * 0.0035) * 140)) for x in range(0, W + 40, 20)] + [(W, H), (0, H)]
    ldraw.polygon(pts2, fill=(168, 85, 247, 75))

    layer = layer.filter(ImageFilter.GaussianBlur(60))
    final = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
    save_all(final, 'deep_space.jpg')

if __name__ == '__main__':
    make_emerald()
    make_aurora()
    make_cyber_dark()
    make_neon()
    make_mountain()
    make_sunset()
    make_botanical()
    make_space()
    print("All FloraOS wallpapers generated!")
