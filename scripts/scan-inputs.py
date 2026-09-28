import os
import re

unbounded = []
src_dir = r"C:\Users\Cauã Felype\Documents\GymFlow\src"

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(".tsx") or f.endswith(".ts"):
            filepath = os.path.join(root, f)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as fp:
                lines = fp.readlines()
            for i, line in enumerate(lines):
                if "<input" in line or "<textarea" in line:
                    # Search up to 35 lines or until self-closing '/>' or closing '>' outside arrow function
                    tag_lines = []
                    for future_line in lines[i:min(len(lines), i + 35)]:
                        tag_lines.append(future_line)
                        cleaned = re.sub(r'=>', '', future_line)
                        if "/>" in cleaned or (">" in cleaned and not "<input" in future_line and not "<textarea" in future_line):
                            break
                    tag = "".join(tag_lines)

                    if re.search(r'type=["\'](hidden|checkbox|radio|file)["\']', tag):
                        continue

                    is_bounded_by_range = any(t in tag for t in ['type="number"', "type='number'", 'type="date"', "type='date'", 'type="time"', "type='time'", 'type="datetime-local"'])
                    has_max_length = "maxLength" in tag
                    has_min = "min=" in tag or "min={" in tag
                    has_max = "max=" in tag or "max={" in tag

                    rel_path = os.path.relpath(filepath, r"C:\Users\Cauã Felype\Documents\GymFlow")
                    if is_bounded_by_range and (not has_min or not has_max):
                        unbounded.append((rel_path, i + 1, "missing_min_or_max", line.strip()))
                    elif not is_bounded_by_range and not has_max_length:
                        unbounded.append((rel_path, i + 1, "missing_maxLength", line.strip()))

print(f"Total unbounded inputs found: {len(unbounded)}")
for item in unbounded:
    print(f"{item[0]}:{item[1]} [{item[2]}] {item[3][:80]}")
