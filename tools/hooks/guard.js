/* שומר: רץ לפני כל פקודת טרמינל של Claude (Bash או PowerShell) ועוצר טעויות שקשה לתקן.
   חסום לגמרי: commit או push ישירות ל-main, ו-push בכוח.
   עוצר לאישור של המשתמש: מחיקות, פקודות git שמוחקות עבודה, ומיזוג ל-main.
   מוגדר ב-.claude/settings.json. תקלה בסקריפט עצמו לא חוסמת כלום. */
const {execFileSync}=require('child_process');

// כל השאר: [ביטוי, למה עוצרים לאישור]
const ASK=[
  [/\bgh\s+pr\s+merge\b/,'מיזוג ל-main. ודא שהבדיקה ב-GitHub ירוקה, ושהמשתמש שיחק בגרסה ואמר במפורש למזג'],
  [/\bgit\s+reset\s+--hard\b/,'git reset --hard מוחק שינויים שלא נשמרו'],
  [/\bgit\s+clean\b[^;&|]*\s-[a-zA-Z]*f/,'git clean מוחק קבצים שלא נשמרו ב-git'],
  [/\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/,'זה מבטל את כל השינויים שלא נשמרו'],
  [/\bgit\s+branch\s+-D\b|\bgit\s+push\b[^;&|]*\s--delete\b/,'מחיקת ענף'],
  [/(^|[\s;&|(])(rm|del|rd|rmdir|Remove-Item)\s/i,'מחיקת קבצים']
];

let raw='';
process.stdin.on('data',d=>raw+=d).on('end',()=>{
  let inp;try{inp=JSON.parse(raw)}catch(e){process.exit(0)}
  const cmd=String(inp.tool_input&&inp.tool_input.command||'');
  if(!cmd)process.exit(0);
  const cwd=inp.cwd||process.env.CLAUDE_PROJECT_DIR||process.cwd();
  let branch=null;
  try{branch=execFileSync('git',['rev-parse','--abbrev-ref','HEAD'],{cwd,encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore']}).trim()}catch(e){}
  // פקודה שיוצרת ענף לפני ה-commit לא עובדת על main
  const onMain=(branch==='main'||branch==='master')&&!/\b(switch\s+(-c|--create)|checkout\s+-b)\b/.test(cmd);

  if(/\bgit\s+push\b/.test(cmd)){
    if(/\bgit\s+push\b[^;&|]*(\s(-f|--force)(\s|$)|--force-with-lease|\s\+\S)/.test(cmd))
      deny('חסום: push בכוח מוחק היסטוריה ב-GitHub. במקום זה מזגו את main לתוך הענף (git merge origin/main) ודחפו רגיל.');
    if(onMain||/\bgit\s+push\b[^;&|]*[\s:](main|master)(\s|$)/.test(cmd))
      deny('חסום: אסור push ל-main. דוחפים ענף ופותחים בקשת מיזוג (PR), כמו ב-/finish.');
  }
  if(/\bgh\s+pr\s+merge\b/.test(cmd)&&!/\s(--body|-b)[\s=]/.test(cmd))
    deny('חסום: כל מיזוג נכנס להיסטוריה עם סיכום קצר. הוסף --subject "<כותרת בעברית> (#<n>)" --body "מה נעשה: ... | למה: ... | אישר: <מי>".');
  if(onMain&&/\bgit\s+commit\b/.test(cmd))
    deny('חסום: אסור commit ישירות על main. קודם ענף: git switch -c feature/<תיאור-קצר> (השינויים שלא נשמרו עוברים איתך), ואז commit.');
  for(const [re,why] of ASK)if(re.test(cmd))ask(why+'. ודא שהמשתמש ביקש בדיוק את זה, ושאמרת לו בשם מה יימחק או ישתנה.');
  process.exit(0);
});

function deny(msg){process.stderr.write(msg+'\n');process.exit(2)}
function ask(msg){process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'ask',permissionDecisionReason:msg}}));process.exit(0)}
