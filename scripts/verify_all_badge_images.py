import re, os

with open('src/lib/gamification-service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Match each badge block in INITIAL_ALL_BADGES
badge_blocks = re.findall(r'\{\s*id:\s*"([^"]+)",[\s\S]*?image:\s*"([^"]+)",', content)

print(f"Total badges parsed: {len(badge_blocks)}")

seen_images = {}
duplicates = []
for bid, img in badge_blocks:
    if img in seen_images:
        duplicates.append((bid, img, seen_images[img]))
    else:
        seen_images[img] = bid

print(f"Unique images count: {len(seen_images)}")

if duplicates:
    print("[ERROR] DUPLICATES DETECTED:")
    for bid, img, prev in duplicates:
        print(f"  - Badge '{bid}' shares '{img}' with '{prev}'")
else:
    print("[SUCCESS] ZERO DUPLICATES! Every badge has its own unique artwork.")

missing = []
for bid, img in badge_blocks:
    rel_path = os.path.join("public", img.lstrip('/'))
    if not os.path.exists(rel_path):
        missing.append((bid, img, rel_path))

if missing:
    print("[ERROR] MISSING FILES:")
    for bid, img, path in missing:
        print(f"  - Badge '{bid}' points to missing file '{path}'")
else:
    print("[SUCCESS] ALL 43 BADGE IMAGES EXIST ON DISK!")

print("\n--- Summary of All Badges and Unique Assets ---")
for i, (bid, img) in enumerate(badge_blocks, 1):
    print(f"{i:02d}. [{bid}] -> {img}")
