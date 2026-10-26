/* תחילת סשן: מסנכרן את הריפו ומדווח ל-Claude מה המצב, כדי שאף אחד לא יעבוד על עותק ישן.
   רץ אוטומטית בכל פתיחת סשן של Claude Code (מוגדר ב-.claude/settings.json), והפלט נכנס להקשר של Claude.
   לא נכשל אף פעם: כל תקלה נכתבת כשורה בדוח, והסשן ממשיך. */
const {execFileSync}=require('child_process');
const fs=require('fs'),path=require('path');

const root=process.env.CLAUDE_PROJECT_DIR||process.cwd();
const run=(cmd,args,timeout=20000)=>execFileSync(cmd,args,{cwd:root,encoding:'utf8',timeout,stdio:['ignore','pipe','pipe']}).trimEnd();
const git=(...a)=>{try{return run('git',a)}catch(e){return null}};
const count=range=>+(git('rev-list','--count',range)||0);
const info=[],todo=[];

// 1. מה יש ב-GitHub
const online=git('fetch','origin','--prune','--quiet')!==null;
if(!online)todo.push('אין חיבור ל-GitHub, אז לא בדקתי אם יש עדכונים. לא מתחילים עבודה לפני שמוודאים שהעותק מעודכן (git pull).');

// 2. מה נכנס ל-main מאז הסשן הקודם במחשב הזה
const main=git('rev-parse','origin/main');
const seenFile=path.resolve(root,git('rev-parse','--git-path','fun-house-last-seen')||'.git/fun-house-last-seen');
let seen=null;try{seen=fs.readFileSync(seenFile,'utf8').trim()}catch(e){}
if(main&&seen!==main){
  const known=seen&&git('merge-base','--is-ancestor',seen,main)!==null;
  // first-parent: כל PR שמוזג מופיע כשורה אחת, עם הסיכום שנכתב במיזוג
  const log=git('log','--first-parent','--format=  - %an: %s (%ar)','-n',known?'15':'5',known?seen+'..'+main:main);
  if(log)info.push((known?'נכנס ל-main מאז הסשן הקודם במחשב הזה:':'השינויים האחרונים ב-main:')+'\n'+log);
  try{fs.writeFileSync(seenFile,main)}catch(e){}
}

// 3. איפה אנחנו עומדים
const branch=git('rev-parse','--abbrev-ref','HEAD');
const dirty=(git('status','--porcelain')||'').split('\n').filter(Boolean).length;
if(branch==='main'||branch==='master'){
  const ahead=count('origin/main..HEAD'),behind=count('HEAD..origin/main');
  if(ahead)todo.push('יש '+ahead+' שמירות (commits) על main שלא עלו ל-GitHub. אסור לעבוד על main: שאל את המשתמש, ואז העבר אותן לענף חדש.');
  else if(dirty)todo.push('יש '+dirty+' קבצים עם שינויים שלא נשמרו, ישירות על main. לפני כל עבודה: git switch -c feature/<תיאור-קצר> (השינויים עוברים איתך לענף). main לא עודכן כדי לא לגעת בהם.');
  else if(behind){
    if(git('pull','--ff-only','--quiet')!==null)info.push('main עודכן אוטומטית: נמשכו '+behind+' שינויים חדשים.');
    else todo.push('main מאחור ב-'+behind+' שינויים והעדכון האוטומטי נכשל. הרץ git pull והסבר למשתמש מה קרה.');
  }else if(online)info.push('main מעודכן.');
  info.push('אתה על main. כל שינוי מתחיל בענף חדש: git switch -c feature/<תיאור-קצר>.');
}else if(branch){
  info.push('הענף הנוכחי: '+branch+(dirty?', עם '+dirty+' קבצים שלא נשמרו':''));
  const track=git('for-each-ref','--format=%(upstream:track)','refs/heads/'+branch)||'';
  if(track.includes('gone'))todo.push('הענף '+branch+' כבר מוזג או נמחק ב-GitHub. אם אין בו שינויים שלא נשמרו, חזור ל-main (git switch main && git pull) והתחל ענף חדש.');
  const behind=count('HEAD..origin/main');
  if(behind&&!dirty){
    if(git('merge','--no-edit','--quiet','origin/main')!==null)info.push('הענף עודכן אוטומטית עם '+behind+' שינויים חדשים מ-main.');
    else{
      const conflict=git('rev-parse','-q','--verify','MERGE_HEAD')!==null;git('merge','--abort');
      todo.push('הענף מאחורי main ב-'+behind+' שינויים, והעדכון האוטומטי '+(conflict?'נתקל בהתנגשות':'נכשל')+'. הרץ git merge origin/main, הסבר למשתמש מה קרה, ואם יש התנגשות פתור אותה כך ששני השינויים נשמרים.');
    }
  }else if(behind)todo.push('הענף מאחורי main ב-'+behind+' שינויים. אחרי שהשינויים הנוכחיים נשמרים (commit), הרץ git merge origin/main.');
  const unpushed=git('rev-parse','--abbrev-ref','@{u}')?count('@{u}..HEAD'):0;
  if(unpushed)info.push('יש '+unpushed+' שמירות שעוד לא עלו ל-GitHub.');
}

// 4. בקשות מיזוג פתוחות, ומה מותקן במחשב
let gh=false;
try{run('gh',['--version'],10000);gh=true}catch(e){}
if(gh){
  try{
    const prs=run('gh',['pr','list','--state','open','--json','number,title,author','--jq','.[]|"  - #\\(.number) \\(.title) (\\(.author.login))"'],15000);
    info.push(prs?'בקשות מיזוג (PR) פתוחות:\n'+prs:'אין בקשות מיזוג (PR) פתוחות.');
  }catch(e){info.push('לא הצלחתי לקרוא את בקשות המיזוג מ-GitHub. אם gh לא מחובר, gh auth login מתקן את זה. בינתיים פותחים PR מהקישור ש-git push מדפיס.')}
}else info.push('gh לא מותקן. אפשר לעבוד בלעדיו: את בקשת המיזוג (PR) פותחים מהקישור ש-git push מדפיס.');
let pw=false;try{require.resolve('playwright',{paths:[root]});pw=true}catch(e){}
if(!pw)info.push('הבדיקה האוטומטית לא מותקנת במחשב הזה (npm run setup, כ-150MB). היא רצה ממילא ב-GitHub על כל PR.');

console.log(['## מצב הריפו (בדיקה אוטומטית בתחילת הסשן)',
  ...(todo.length?['**לטיפול לפני כל עבודה:**',...todo.map(s=>'- '+s)]:[]),
  ...info.map(s=>'- '+s),
  '',
  'Claude: לפני כל דבר אחר, ספר למשתמש בשתיים-שלוש שורות פשוטות מה המצב ומה השתנה. אם יש סעיף "לטיפול", טפל בו קודם, ושאל את המשתמש לפני כל פעולה שמשנה משהו.'
].join('\n'));
