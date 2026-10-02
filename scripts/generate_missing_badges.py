import math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

os.makedirs('public/badges', exist_ok=True)

def draw_star(draw, center, size, fill, outline=None):
    cx, cy = center
    points = []
    for i in range(10):
        r = size if i % 2 == 0 else size / 2.2
        angle = i * (math.pi / 5) - math.pi / 2
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(points, fill=fill, outline=outline)

def draw_laurel_wreath(draw, center, radius, color):
    cx, cy = center
    for side in [-1, 1]:
        for i in range(8):
            angle = (math.pi / 2) + side * (0.3 + i * 0.16)
            lx = cx + radius * math.cos(angle)
            ly = cy + radius * math.sin(angle)
            # Leaf ellipse
            leaf_w, leaf_h = 14, 7
            leaf_ang = angle + (0.4 if side == 1 else -0.4)
            # Draw leaf
            draw.ellipse([lx - 7, ly - 4, lx + 7, ly + 4], fill=color)

def draw_barbell(draw, center, length=140, color=(240, 210, 100, 255)):
    cx, cy = center
    # Bar
    draw.rectangle([cx - length//2, cy - 4, cx + length//2, cy + 4], fill=(210, 210, 210, 255), outline=(50, 50, 50, 255))
    # Outer Plates
    for sign in [-1, 1]:
        px = cx + sign * (length//2 - 10)
        draw.rounded_rectangle([px - 6, cy - 35, px + 6, cy + 35], radius=3, fill=color, outline=(40, 30, 10, 255), width=2)
        px2 = cx + sign * (length//2 - 24)
        draw.rounded_rectangle([px2 - 6, cy - 28, px2 + 6, cy + 28], radius=3, fill=(180, 150, 50, 255), outline=(40, 30, 10, 255), width=2)
        px3 = cx + sign * (length//2 - 36)
        draw.rounded_rectangle([px3 - 5, cy - 20, px3 + 5, cy + 20], radius=2, fill=(140, 110, 30, 255), outline=(40, 30, 10, 255), width=1)

def create_circular_badge(filename, primary_color, secondary_color, accent_color, emblem_fn, title_text, sub_text, inner_pattern='rays'):
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size // 2
    
    R = 230
    
    # Outer Glow
    for r, a in [(R + 10, 25), (R + 6, 50), (R + 2, 90)]:
        draw.ellipse([center - r, center - r, center + r, center + r], fill=(*accent_color[:3], a))
    
    # Base dark bevel
    draw.ellipse([center - R, center - R, center + R, center + R], fill=(25, 22, 20, 255))
    
    # Metallic Gold / Platinum Rim Gradient
    for i in range(24):
        rad = R - i
        t = i / 24.0
        col = tuple(int(primary_color[c] * (1-t) + secondary_color[c] * t) for c in range(3)) + (255,)
        draw.ellipse([center - rad, center - rad, center + rad, center + rad], outline=col, width=2)
        
    # Rivet details around the rim
    num_rivets = 18
    for k in range(num_rivets):
        angle = k * (2 * math.pi / num_rivets)
        rx = center + int((R - 12) * math.cos(angle))
        ry = center + int((R - 12) * math.sin(angle))
        draw.ellipse([rx - 4, ry - 4, rx + 4, ry + 4], fill=(245, 225, 145, 255), outline=(40, 35, 20, 255))
        draw.ellipse([rx - 2, ry - 2, rx + 1, ry + 1], fill=(255, 255, 230, 255))
        
    # Inner Rim Ring
    R_inner = R - 24
    draw.ellipse([center - R_inner, center - R_inner, center + R_inner, center + R_inner], fill=(12, 16, 22, 255), outline=(212, 175, 55, 255), width=3)
    
    # Inner background texture
    inner_mask = Image.new('L', (size, size), 0)
    inner_draw = ImageDraw.Draw(inner_mask)
    inner_draw.ellipse([center - (R_inner - 2), center - (R_inner - 2), center + (R_inner - 2), center + (R_inner - 2)], fill=255)
    
    bg_layer = Image.new('RGBA', (size, size), (0,0,0,0))
    bg_draw = ImageDraw.Draw(bg_layer)
    
    if inner_pattern == 'rays':
        num_rays = 36
        for r_idx in range(num_rays):
            a1 = r_idx * (2 * math.pi / num_rays)
            a2 = (r_idx + 0.5) * (2 * math.pi / num_rays)
            p1 = (center, center)
            p2 = (center + int(300 * math.cos(a1)), center + int(300 * math.sin(a1)))
            p3 = (center + int(300 * math.cos(a2)), center + int(300 * math.sin(a2)))
            bg_draw.polygon([p1, p2, p3], fill=(*accent_color[:3], 40 if r_idx % 2 == 0 else 12))
    elif inner_pattern == 'grid':
        for gx in range(center - R_inner, center + R_inner, 16):
            bg_draw.line([(gx, center - R_inner), (gx, center + R_inner)], fill=(*accent_color[:3], 35), width=1)
        for gy in range(center - R_inner, center + R_inner, 16):
            bg_draw.line([(center - R_inner, gy), (center + R_inner, gy)], fill=(*accent_color[:3], 35), width=1)
    elif inner_pattern == 'stars':
        np.random.seed(42)
        for _ in range(70):
            sx = np.random.randint(center - R_inner + 15, center + R_inner - 15)
            sy = np.random.randint(center - R_inner + 15, center + R_inner - 15)
            s_rad = np.random.randint(1, 3)
            bg_draw.ellipse([sx - s_rad, sy - s_rad, sx + s_rad, sy + s_rad], fill=(255, 255, 255, np.random.randint(90, 240)))

    # Central Core Radial Glow
    for g_rad, g_alpha in [(140, 20), (110, 45), (80, 75), (50, 110), (25, 170)]:
        bg_draw.ellipse([center - g_rad, center - g_rad, center + g_rad, center + g_rad], fill=(*accent_color[:3], g_alpha))

    img.paste(bg_layer, (0, 0), inner_mask)
    
    # Custom 3D Emblem Layer
    emblem_layer = Image.new('RGBA', (size, size), (0,0,0,0))
    emblem_fn(ImageDraw.Draw(emblem_layer), center, size)
    img.alpha_composite(emblem_layer)
    
    # Upper Ribbon / Text Banner
    ribbon_y = center - 134
    ribbon_w = 175
    ribbon_h = 34
    draw.rounded_rectangle([center - ribbon_w, ribbon_y, center + ribbon_w, ribbon_y + ribbon_h], radius=8, fill=(18, 22, 30, 245), outline=(212, 175, 55, 255), width=2)
    draw.line([(center - ribbon_w + 5, ribbon_y + 2), (center + ribbon_w - 5, ribbon_y + 2)], fill=(255, 240, 170, 220), width=1)
    
    try:
        font_upper = ImageFont.truetype('arialbd.ttf', 16)
    except:
        font_upper = ImageFont.load_default()
    
    bbox = draw.textbbox((0,0), title_text, font=font_upper)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((center - tw // 2, ribbon_y + (ribbon_h - th) // 2 - 2), title_text, fill=(255, 225, 130, 255), font=font_upper)
    
    # Lower Ribbon / Subtitle
    sub_y = center + 120
    sub_w = 165
    sub_h = 30
    draw.rounded_rectangle([center - sub_w, sub_y, center + sub_w, sub_y + sub_h], radius=6, fill=(14, 18, 26, 245), outline=(185, 155, 50, 230), width=2)
    try:
        font_sub = ImageFont.truetype('arialbd.ttf', 13)
    except:
        font_sub = ImageFont.load_default()
    s_bbox = draw.textbbox((0,0), sub_text, font=font_sub)
    stw = s_bbox[2] - s_bbox[0]
    sth = s_bbox[3] - s_bbox[1]
    draw.text((center - stw // 2, sub_y + (sub_h - sth) // 2 - 2), sub_text, fill=(210, 230, 255, 255), font=font_sub)

    # Specular reflections
    highlight_layer = Image.new('RGBA', (size, size), (0,0,0,0))
    h_draw = ImageDraw.Draw(highlight_layer)
    h_draw.arc([center - R + 2, center - R + 2, center + R - 2, center + R - 2], start=200, end=320, fill=(255, 255, 255, 190), width=4)
    h_draw.arc([center - R_inner + 1, center - R_inner + 1, center + R_inner - 1, center + R_inner - 1], start=210, end=310, fill=(255, 255, 220, 130), width=2)
    img.alpha_composite(highlight_layer)
    
    out_path = os.path.join('public/badges', filename)
    img.save(out_path, 'PNG', optimize=True)
    print(f'Successfully created {filename}')

# -------------------------------------------------------------
# EMBLEM DEFINITIONS FOR THE 10 BADGES
# -------------------------------------------------------------

# 1. Maratona Mensal (badge_maratona_mensal.png)
def emblem_maratona(draw, cx, size):
    cy = cx - 5
    # Running Wings (Hermes speed)
    wing_color = (255, 215, 0, 255)
    for side in [-1, 1]:
        for w in range(4):
            pts = [
                (cx + side * (10 + w*10), cy - 20 - w*6),
                (cx + side * (55 + w*16), cy - 50 - w*10),
                (cx + side * (35 + w*12), cy - 10 - w*4),
            ]
            draw.polygon(pts, fill=wing_color, outline=(20, 20, 20, 255))
    
    # Winged Sneaker Base
    draw.rounded_rectangle([cx - 55, cy - 10, cx + 55, cy + 25], radius=12, fill=(20, 180, 255, 255), outline=(255, 230, 120, 255), width=3)
    # Sole
    draw.rounded_rectangle([cx - 60, cy + 18, cx + 60, cy + 32], radius=6, fill=(240, 240, 240, 255), outline=(50, 50, 50, 255), width=2)
    # Laces
    for lx in range(-35, 36, 16):
        draw.line([(cx + lx, cy - 5), (cx + lx + 8, cy + 10)], fill=(255, 255, 255, 255), width=3)
    # Cyan Pulse / Speed lines
    draw.arc([cx - 80, cy - 40, cx + 80, cy + 60], start=30, end=150, fill=(0, 230, 255, 220), width=3)
    draw_star(draw, (cx, cy - 35), 14, (255, 255, 100, 255))

# 2. Jornada 365 (badge_jornada_365.png)
def emblem_jornada_365(draw, cx, size):
    cy = cx - 5
    # Celestial Sun Clock / Dial
    draw.ellipse([cx - 65, cy - 65, cx + 65, cy + 65], fill=(30, 15, 45, 255), outline=(255, 215, 0, 255), width=3)
    # 12 Sun Rays / Roman markers
    for i in range(12):
        ang = i * (math.pi / 6)
        x1 = cx + int(50 * math.cos(ang))
        y1 = cy + int(50 * math.sin(ang))
        x2 = cx + int(62 * math.cos(ang))
        y2 = cy + int(62 * math.sin(ang))
        draw.line([(x1, y1), (x2, y2)], fill=(255, 220, 100, 255), width=2)
    
    # Golden Phoenix Wings
    for side in [-1, 1]:
        for f in range(5):
            pts = [
                (cx + side * 5, cy + 15),
                (cx + side * (35 + f*14), cy - 45 - f*8),
                (cx + side * (25 + f*10), cy - 10 - f*4),
            ]
            draw.polygon(pts, fill=(255, 180 + f*12, 40, 255), outline=(50, 20, 0, 255))
            
    # Diamond 365 Crown / Core
    draw.polygon([(cx, cy - 40), (cx + 25, cy - 15), (cx, cy + 10), (cx - 25, cy - 15)], fill=(255, 240, 150, 255), outline=(180, 120, 20, 255), width=2)
    draw_star(draw, (cx, cy - 15), 10, (255, 255, 255, 255))
    draw_laurel_wreath(draw, (cx, cy + 15), 55, (255, 215, 0, 255))

# 3. Megatonelada Anual (badge_megatonelada_anual.png)
def emblem_megatonelada(draw, cx, size):
    cy = cx - 5
    # Heavy Anvil
    anvil_pts = [
        (cx - 50, cy + 5), (cx + 50, cy + 5),
        (cx + 40, cy + 30), (cx + 55, cy + 45), (cx - 55, cy + 45), (cx - 40, cy + 30)
    ]
    draw.polygon(anvil_pts, fill=(50, 55, 65, 255), outline=(212, 175, 55, 255), width=2)
    # Molten Earth Planet Core
    draw.ellipse([cx - 42, cy - 55, cx + 42, cy + 25], fill=(30, 80, 180, 255), outline=(255, 165, 0, 255), width=3)
    # Continents / Golden landmasses
    draw.ellipse([cx - 25, cy - 40, cx + 15, cy - 5], fill=(220, 180, 60, 255))
    draw.ellipse([cx - 10, cy - 15, cx + 30, cy + 15], fill=(220, 180, 60, 255))
    # Orbital Barbell Rings
    draw.arc([cx - 75, cy - 35, cx + 75, cy + 5], start=0, end=360, fill=(255, 215, 0, 255), width=3)
    draw_barbell(draw, (cx, cy - 15), length=130, color=(255, 200, 50, 255))

# 4. Ultra-Resistência Anual (badge_ultra_resistencia.png)
def emblem_ultra_resistencia(draw, cx, size):
    cy = cx - 5
    # Glowing Reactor Core
    draw.ellipse([cx - 55, cy - 55, cx + 55, cy + 55], fill=(20, 10, 30, 255), outline=(255, 60, 90, 255), width=3)
    # Heart Silhouette Geometry
    h_pts = [
        (cx, cy + 38), (cx - 38, cy - 5), (cx - 38, cy - 32), (cx - 18, cy - 42),
        (cx, cy - 25), (cx + 18, cy - 42), (cx + 38, cy - 32), (cx + 38, cy - 5)
    ]
    draw.polygon(h_pts, fill=(240, 30, 70, 255), outline=(255, 220, 150, 255), width=2)
    # Cybernetic Vascular Conduits (Neon Cyan lines)
    draw.line([(cx - 45, cy), (cx - 20, cy), (cx - 10, cy - 20), (cx, cy + 15), (cx + 12, cy - 25), (cx + 22, cy), (cx + 45, cy)], fill=(0, 240, 255, 255), width=3)
    # Energy Sparks
    draw_star(draw, (cx, cy - 5), 8, (255, 255, 255, 255))
    for ang in [0, math.pi/2, math.pi, 3*math.pi/2]:
        sx = cx + int(65 * math.cos(ang))
        sy = cy + int(65 * math.sin(ang))
        draw_star(draw, (sx, sy), 6, (255, 100, 120, 255))

# 5. Espírito Indomável (badge_espirito_indomavel.png)
def emblem_espirito_indomavel(draw, cx, size):
    cy = cx - 5
    # Diamond Shield Base
    shield_pts = [
        (cx - 50, cy - 55), (cx + 50, cy - 55),
        (cx + 48, cy + 5), (cx, cy + 55), (cx - 48, cy + 5)
    ]
    draw.polygon(shield_pts, fill=(15, 35, 40, 255), outline=(255, 215, 0, 255), width=3)
    # Emerald Inner Core
    inner_shield = [
        (cx - 38, cy - 43), (cx + 38, cy - 43),
        (cx + 36, cy + 3), (cx, cy + 42), (cx - 36, cy + 3)
    ]
    draw.polygon(inner_shield, fill=(10, 120, 90, 255), outline=(150, 255, 200, 255), width=2)
    # Lion Head / Spartan Crest
    draw.polygon([(cx, cy - 35), (cx + 25, cy - 10), (cx + 15, cy + 15), (cx, cy + 25), (cx - 15, cy + 15), (cx - 25, cy - 10)], fill=(245, 200, 60, 255), outline=(50, 30, 5, 255), width=2)
    # Eyes & details
    draw.ellipse([cx - 10, cy - 8, cx - 4, cy - 2], fill=(10, 10, 10, 255))
    draw.ellipse([cx + 4, cy - 8, cx + 10, cy - 2], fill=(10, 10, 10, 255))
    # 12 Stars around for 12 months
    for i in range(12):
        ang = i * (2 * math.pi / 12)
        sx = cx + int(68 * math.cos(ang))
        sy = cy + int(68 * math.sin(ang))
        draw_star(draw, (sx, sy), 5, (255, 220, 100, 255))

# 6. Coach Welcome (badge_coach_welcome.png)
def emblem_coach_welcome(draw, cx, size):
    cy = cx - 5
    # Tactical Clipboard
    draw.rounded_rectangle([cx - 45, cy - 45, cx + 45, cy + 45], radius=8, fill=(28, 36, 48, 255), outline=(212, 175, 55, 255), width=3)
    # Clipboard clip
    draw.rounded_rectangle([cx - 20, cy - 54, cx + 20, cy - 42], radius=4, fill=(220, 220, 220, 255), outline=(50, 50, 50, 255), width=2)
    # Green checkmarks / lines
    for ly in [-22, -4, 14]:
        draw.line([(cx - 28, cy + ly), (cx + 28, cy + ly)], fill=(80, 120, 160, 255), width=2)
    # Large Emerald Check
    draw.line([(cx - 15, cy + 5), (cx - 4, cy + 20), (cx + 20, cy - 12)], fill=(34, 197, 94, 255), width=5)
    # Golden Coach Whistle
    whistle_pts = [(cx + 25, cy + 20), (cx + 55, cy + 20), (cx + 55, cy + 38), (cx + 38, cy + 38), (cx + 25, cy + 30)]
    draw.polygon(whistle_pts, fill=(255, 215, 0, 255), outline=(40, 30, 10, 255), width=2)

# 7. Coach Primeiro Pupilo (badge_coach_primeiro_pupilo.png)
def emblem_primeiro_pupilo(draw, cx, size):
    cy = cx - 5
    # Tiered Podium
    draw.rectangle([cx - 55, cy + 18, cx - 18, cy + 45], fill=(160, 160, 170, 255), outline=(40, 40, 40, 255), width=2)
    draw.rectangle([cx - 18, cy + 5, cx + 18, cy + 45], fill=(255, 215, 0, 255), outline=(50, 40, 10, 255), width=2)
    draw.rectangle([cx + 18, cy + 25, cx + 55, cy + 45], fill=(205, 127, 50, 255), outline=(40, 40, 40, 255), width=2)
    
    # Golden Handshake of Mentorship
    # Left Hand (Coach)
    draw.rounded_rectangle([cx - 45, cy - 25, cx - 5, cy - 5], radius=6, fill=(235, 195, 75, 255), outline=(40, 30, 10, 255), width=2)
    # Right Hand (Student)
    draw.rounded_rectangle([cx + 5, cy - 25, cx + 45, cy - 5], radius=6, fill=(255, 220, 120, 255), outline=(40, 30, 10, 255), width=2)
    # Grip center
    draw.ellipse([cx - 10, cy - 28, cx + 10, cy - 2], fill=(210, 165, 45, 255), outline=(50, 35, 10, 255), width=2)
    # Laurel & Star
    draw_laurel_wreath(draw, (cx, cy - 5), 60, (255, 215, 0, 255))
    draw_star(draw, (cx, cy - 42), 12, (255, 255, 255, 255))

# 8. Coach Agenda Semanal (badge_coach_agenda_semanal.png)
def emblem_agenda_semanal(draw, cx, size):
    cy = cx - 5
    # Smart Tablet HUD
    draw.rounded_rectangle([cx - 52, cy - 48, cx + 52, cy + 48], radius=10, fill=(15, 25, 35, 255), outline=(34, 197, 94, 255), width=3)
    # Calendar Grid 7 columns
    for col in range(5):
        gx = cx - 40 + col * 20
        for row in range(3):
            gy = cy - 28 + row * 22
            # Booked green slots vs available
            slot_fill = (34, 197, 94, 255) if (col + row) % 2 == 0 else (30, 50, 65, 255)
            draw.rounded_rectangle([gx, gy, gx + 16, gy + 16], radius=3, fill=slot_fill, outline=(20, 30, 40, 255))
    # Golden Chronometer / Stopwatch in corner
    draw.ellipse([cx + 25, cy + 18, cx + 55, cy + 48], fill=(255, 215, 0, 255), outline=(40, 30, 10, 255), width=2)
    draw.line([(cx + 40, cy + 33), (cx + 48, cy + 25)], fill=(20, 20, 20, 255), width=2)

# 9. Coach Fichas do Mês (badge_coach_fichas_mes.png)
def emblem_fichas_mes(draw, cx, size):
    cy = cx - 5
    # Architectural Blueprint Scroll
    draw.rounded_rectangle([cx - 48, cy - 48, cx + 48, cy + 48], radius=6, fill=(20, 45, 90, 255), outline=(212, 175, 55, 255), width=3)
    # Blueprint Grid lines
    for bx in range(cx - 40, cx + 45, 12):
        draw.line([(bx, cy - 42), (bx, cy + 42)], fill=(40, 80, 140, 255), width=1)
    for by in range(cy - 40, cy + 45, 12):
        draw.line([(cx - 42, by), (cx + 42, by)], fill=(40, 80, 140, 255), width=1)
    # Anatomical Muscular Silhouette in Center
    draw.ellipse([cx - 10, cy - 35, cx + 10, cy - 15], fill=(255, 220, 100, 255)) # Head
    draw.polygon([(cx - 22, cy - 15), (cx + 22, cy - 15), (cx + 12, cy + 15), (cx - 12, cy + 15)], fill=(255, 200, 60, 255)) # Torso
    # Golden Drafting Compass
    draw.line([(cx - 35, cy + 40), (cx, cy - 5)], fill=(255, 235, 150, 255), width=3)
    draw.line([(cx + 35, cy + 40), (cx, cy - 5)], fill=(255, 235, 150, 255), width=3)
    draw_star(draw, (cx, cy - 5), 8, (255, 255, 255, 255))

# 10. Coach Treinador do Ano (badge_coach_treinador_ano.png)
def emblem_treinador_ano(draw, cx, size):
    cy = cx - 5
    # Grand Trophy Cup
    draw.polygon([(cx - 45, cy - 40), (cx + 45, cy - 40), (cx + 30, cy + 10), (cx - 30, cy + 10)], fill=(255, 215, 0, 255), outline=(50, 40, 10, 255), width=2)
    # Trophy Handles
    draw.arc([cx - 65, cy - 38, cx - 25, cy + 5], start=90, end=270, fill=(255, 200, 40, 255), width=4)
    draw.arc([cx + 25, cy - 38, cx + 65, cy + 5], start=270, end=90, fill=(255, 200, 40, 255), width=4)
    # Trophy Stem & Base
    draw.rectangle([cx - 12, cy + 10, cx + 12, cy + 28], fill=(220, 180, 20, 255), outline=(40, 30, 5, 255))
    draw.rectangle([cx - 35, cy + 28, cx + 35, cy + 44], fill=(30, 30, 35, 255), outline=(255, 215, 0, 255), width=2)
    # Barbell in Trophy Cup
    draw_barbell(draw, (cx, cy - 40), length=110, color=(255, 240, 120, 255))
    # 365 Star Crown
    draw_laurel_wreath(draw, (cx, cy - 10), 58, (255, 215, 0, 255))
    draw_star(draw, (cx, cy - 15), 12, (255, 255, 255, 255))


# -------------------------------------------------------------
# BATCH GENERATION EXECUTION
# -------------------------------------------------------------

gold_primary = (255, 215, 0)
gold_secondary = (180, 140, 30)
cyan_accent = (0, 210, 255)
emerald_accent = (34, 197, 94)
purple_accent = (168, 85, 247)
crimson_accent = (239, 68, 68)
amber_accent = (245, 158, 11)

configs = [
    # 1. Maratona Mensal
    ('badge_maratona_mensal.png', gold_primary, gold_secondary, cyan_accent, emblem_maratona, 'MARATONA MENSAL', 'REI DA DISTANCIA', 'rays'),
    # 2. Jornada 365
    ('badge_jornada_365.png', gold_primary, gold_secondary, purple_accent, emblem_jornada_365, 'JORNADA 365', 'LENDA DO ANO', 'stars'),
    # 3. Megatonelada Anual
    ('badge_megatonelada_anual.png', (210, 215, 225), (120, 130, 145), amber_accent, emblem_megatonelada, 'MEGATONELADA', 'TITA COSMICO', 'rays'),
    # 4. Ultra-Resistência Anual
    ('badge_ultra_resistencia.png', gold_primary, (180, 40, 40), crimson_accent, emblem_ultra_resistencia, 'ULTRA-RESISTENCIA', 'CORACAO BIONICO', 'grid'),
    # 5. Espírito Indomável
    ('badge_espirito_indomavel.png', gold_primary, (30, 120, 80), emerald_accent, emblem_espirito_indomavel, 'ESPIRITO INDOMAVEL', '12 MESES DE FERRO', 'stars'),
    # 6. Coach Welcome
    ('badge_coach_welcome.png', gold_primary, gold_secondary, emerald_accent, emblem_coach_welcome, 'BEM-VINDO COACH', 'TREINADOR OFICIAL', 'rays'),
    # 7. Coach Primeiro Pupilo
    ('badge_coach_primeiro_pupilo.png', gold_primary, gold_secondary, amber_accent, emblem_primeiro_pupilo, 'PRIMEIRO PUPILO', 'ESTREIA NA CONSULTORIA', 'rays'),
    # 8. Coach Agenda Semanal
    ('badge_coach_agenda_semanal.png', gold_primary, (40, 140, 80), emerald_accent, emblem_agenda_semanal, 'AGENDA DE ELITE', 'GRADE SEMANAL', 'grid'),
    # 9. Coach Fichas do Mês
    ('badge_coach_fichas_mes.png', gold_primary, (30, 70, 140), cyan_accent, emblem_fichas_mes, 'MESTRE DAS FICHAS', 'PERIODIZACAO MENSAL', 'grid'),
    # 10. Coach Treinador do Ano
    ('badge_coach_treinador_ano.png', gold_primary, gold_secondary, amber_accent, emblem_treinador_ano, 'TREINADOR DO ANO', 'AUTORIDADE MAXIMA', 'stars'),
]

for filename, pri, sec, acc, emb_fn, title, sub, pat in configs:
    create_circular_badge(filename, pri, sec, acc, emb_fn, title, sub, inner_pattern=pat)

print('ALL 10 REMAINING BADGES GENERATED WITH 100% UNIQUE ARTWORK!')
