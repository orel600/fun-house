/* מספר הגרסה בפינת מסך הפתיחה: v0.3.18.57 = ראשי.שלב.עדכון.בנייה (ניר, 30.10.2026). ההסבר המלא ב-roadmap.md, "גרסאות".
   ראשי ושלב נקבעים ביד כאן. עדכון ובנייה מחושבים לבד מההיסטוריה של main בזמן הפרסום (.github/workflows/deploy.yml).
   כשנגמר שלב: מעלים את STAGE, ו-STAGE_FROM = מספר השינויים ב-main באותו רגע (git rev-list --count origin/main). */
const MAJOR=0, STAGE=3, STAGE_FROM=39;
const VERSION=MAJOR+'.'+STAGE+'.dev';
