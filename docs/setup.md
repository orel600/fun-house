# הגדרות חד-פעמיות: Vercel ו-Google

הועבר מ-CLAUDE.md (1.11.2026). כבר מחובר. קוראים רק כשמשהו מזה נשבר.

## Vercel

**חיבור, פעם אחת, רק בעל הריפו (אוראל) יכול:**
1. נרשמים ל-[vercel.com](https://vercel.com/signup) עם חשבון ה-GitHub (התוכנית החינמית, Hobby).
2. יוצרים טוקן ב-[vercel.com/account/tokens](https://vercel.com/account/tokens): שם `fun-house`, ה-Scope הוא החשבון האישי, תוקף שנה.
3. שומרים אותו בריפו כסוד בשם `VERCEL_TOKEN`: `gh secret set VERCEL_TOKEN -R orel600/fun-house` ומדביקים כשהוא מבקש. או בדפדפן: Settings → Secrets and variables → Actions → New repository secret.
4. מפעילים מחדש את הריצה "פרסום ל-Vercel" ב-PR פתוח כלשהו. אחרי דקה מופיעה תגובה עם קישור.

Claude לא מדפיס את הטוקן, לא כותב אותו בקובץ ולא שומר אותו ביומן. עד שהסוד קיים, הריצה מדלגת בשקט ולא מאדימה PR.

## כניסה עם Google (Supabase)

**כניסה עם Google מוגדרת** (אוראל, 30.10.2026): הלקוח `Fun house` ב-Google Cloud בפרויקט "My First Project", והכתובות שמותר לחזור אליהן הן הקישור הקבוע וקישורי ה-PR (`https://fun-house-*-fun-house2.vercel.app/**`). האפליקציה ב-Google במצב בדיקה, אז רק מי שברשימת Test users (ב-Google Auth Platform ← Audience) יכול להיכנס. מי שצריך גישה: אוראל מוסיף אותו שם. כניסה אנונימית וקישור ידני (Allow anonymous sign-ins, Allow manual linking) דלוקים מ-31.10.2026.
