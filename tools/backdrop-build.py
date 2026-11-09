#!/usr/bin/env python3
"""בונה את js/backdrop-data.js מ-art/backdrop/*.webp (ARI, 9.11.2026): BACKDROP = {שם: data URL}.
למה לא טוענים את הקובץ ישירות: מ-file:// טקסטורת WebGL מתמונה בקובץ נכשלת ב-SecurityError (נבדק), ו-data URL לא. כמו js/sounds-data.js ו-js/gicons-data.js.
שימוש: python tools/backdrop-build.py   (אחרי שמחליפים תמונה ב-art/backdrop)"""
import base64, glob, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = []
for f in sorted(glob.glob(os.path.join(root, 'art', 'backdrop', 'arena-backdrop-sky-*.webp'))):
    n = os.path.basename(f)[len('arena-backdrop-sky-'):-5]
    rows.append("  %s:'data:image/webp;base64,%s'" % (n, base64.b64encode(open(f, 'rb').read()).decode()))
out = os.path.join(root, 'js', 'backdrop-data.js')
open(out, 'w', encoding='utf-8', newline='\n').write(
    '/* נוצר אוטומטית ע"י tools/backdrop-build.py מ-art/backdrop/*.webp. לא עורכים ביד. השמיים של הזירה (BACKDROP[שם], data URL) */\nconst BACKDROP={\n' + ',\n'.join(rows) + '\n};\n')
print(len(rows), 'backdrops ->', out, os.path.getsize(out) // 1024, 'KB')
