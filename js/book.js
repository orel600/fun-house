/* ספר ההרפתקאות: אוסף שמעודד לחקור. שלושה פרקים: יצורים, פריטים ומשאבים.
   מה שעוד לא נמצא מופיע כצללית עם "?". יצור נרשם בהריגה הראשונה (bookKill, מ-kill ב-combat.js), ואחרי BOOK.weakAt הריגות רואים את החולשה שלו.
   פריט ומשאב נרשמים כשהם נכנסים לתרמיל (bookSee, מ-bagAdd ב-save.js).
   כל BOOK.every רשומות חדשות נותנות פרס, ובכל BOOK.rareEvery גם משהו נדיר. נשמר ב-SAVE.book. הטקסט ב-lang.js תחת 'book.' */
const BOOK={
  every:10,            // כל כמה רשומות יש פרס
  coins:50,coinsStep:25,// הפרס: מטבעות, ועוד coinsStep בכל פרס הבא
  rareEvery:30,        // כל כמה רשומות גם משהו נדיר, לפי התור ברשימה
  rare:['gem','ruby','sapphire','bolt','aqua','amber','star'],
  weakAt:10,           // אחרי כמה הריגות רואים את החולשה
  // היצורים: כל סוג אויב ב-ETYPES, ועוד אלה שהם לא סוג משלהם. same: החולשה שלו כמו של סוג אחר. learns: הבוס, שמשתנה לפי איך ששיחקת
  extra:{boss:{learns:1},wanted:{},warden:{same:'golem'}},
  icon:{grunt:'💀',shield:'🛡️',wisp:'👻',golem:'🗿',treant:'🌳',crawler:'🦂',sprite:'🧚',mummy:'🧟',boss:'👹',wanted:'🦹',warden:'🪨'},
  tabs:['f','i','r']   // f: יצורים, i: פריטים, r: משאבים
};
const BKU={tab:'f',sel:null};

// השמירה: נוצרת בפעם הראשונה, ומה שכבר יש בתרמיל, במחסן ובציוד נרשם מיד, כדי ששמירה ישנה לא תתחיל מאפס
function BK(){
  if(SAVE.book)return SAVE.book;
  const b=SAVE.book={f:{},i:{},r:{},paid:0};
  const g=SAVE.gear,all=[...Object.keys(SAVE.bag),...Object.keys(SAVE.stash||{}),g.weapon,...(g.acc||[]),...(g.boots||[]),...(g.orbit||[])];
  for(const k of all)if(k)bookMark(k);
  return b;
}
const bookList=t=>t==='f'?[...Object.keys(ETYPES),...Object.keys(BOOK.extra)]:t==='i'?Object.keys(GEAR.items):Object.keys(RES.list);
const bookHas=(t,k)=>!!BK()[t][k];
const bookCount=t=>bookList(t).filter(k=>bookHas(t,k)).length;
const bookTotal=()=>BOOK.tabs.reduce((n,t)=>n+bookCount(t),0);
const bookMax=()=>BOOK.tabs.reduce((n,t)=>n+bookList(t).length,0);
const bookPending=()=>Math.max(0,Math.floor(bookTotal()/BOOK.every)-BK().paid);
// הפרס מספר n (מ-1): מטבעות, ובכל rareEvery גם אבן נדירה
function bookReward(n){
  const r={coins:BOOK.coins+BOOK.coinsStep*(n-1)},at=n*BOOK.every;
  if(at%BOOK.rareEvery===0)r[BOOK.rare[(at/BOOK.rareEvery-1)%BOOK.rare.length]]=1;
  return r;
}
// מסמן בלי לשמור ובלי לחגוג. מחזיר אם זה חדש
function bookMark(k){
  const b=SAVE.book;if(gItem(k)){const id=gBase(k);if(b.i[id])return false;b.i[id]=1;return true}
  if(resOf(k)&&!b.r[k]){b.r[k]=1;return true}
  return false;
}
function bookNew(){
  const p=bookPending();
  if(typeof P!=='undefined'&&P&&S&&S.mode==='play')floatText(P.x,P.y-40,T('book.new'),C.gold,15);
  if(p&&S&&S.mode==='play')sfx('coin');
  saveNow();bookBadge();
}
// נכנס משהו לתרמיל (bagAdd)
function bookSee(k){BK();if(bookMark(k))bookNew()}
// אויב הובס (kill). ספירת ההריגות נשמרת עם השמירה הבאה, ורק רשומה חדשה שומרת מיד
function bookKill(e){
  if(!e||e.node)return;
  const k=e.isBoss?'boss':e.wanted?'wanted':e.warden?'warden':e.type,b=BK();
  if(!ETYPES[k]&&!BOOK.extra[k])return;
  b.f[k]=(b.f[k]||0)+1;if(b.f[k]===1)bookNew();
}
// החולשה של יצור: סוג נזק, 'learns' לבוס, או null
function bookWeak(k){
  const x=BOOK.extra[k]||{};if(x.learns)return 'learns';
  const t=ETYPES[x.same||k];return t?weakOf(multOf(t.tags)):null;
}
function bookClaim(quiet){   // quiet: בלי חגיגה והודעה (welcome.js)
  const n=bookPending();if(!n)return false;
  const b=BK(),got={};
  for(let i=0;i<n;i++){b.paid++;const r=bookReward(b.paid);for(const k in r)got[k]=(got[k]||0)+r[k]}
  for(const k in got)bagAdd(k,got[k]);
  saveNow();if(quiet){bookBadge();return got}sfx('celebrate');
  if(P)celebrate(P.x,P.y,'quest','📖');
  banner(T('book.got',Object.keys(got).map(k=>resIcon(k)+got[k]).join(' ')),C.gold);
  bookBadge();return got;
}
function bookBadge(){const el=$('bBadge');if(!el)return;const n=bookPending(),t=n?String(n):'';if(el.textContent!==t){el.textContent=t;el.hidden=!n}}

/* החלון: הכותרת, שלוש לשוניות, ובשני טורים: הרשת (רק היא גוללת) | הפרטים והפרס */
const bookName=(t,k)=>t==='f'?T('book.f.'+k):t==='i'?gName(k):resName(k);
const bookPic=(t,k)=>t==='f'?BOOK.icon[k]||'❔':t==='i'?gPic(k):resPic(k);
function bookCard(t,k){
  const has=bookHas(t,k),cnt=t==='f'&&has?'<small>'+shortN(BK().f[k])+'</small>':'';
  return '<button class="bkc'+(has?'':' unk')+(BKU.sel===k?' on':'')+'" data-act="sel" data-k="'+k+'"'+(t!=='f'?' style="--rar:'+RES.rarity[Math.min(4,gRar(k))].col+'"':'')+
    ' aria-label="'+(has?bookName(t,k):'?')+'"><span class="bpic">'+bookPic(t,k)+'</span>'+(has?'':'<b>?</b>')+cnt+'</button>';
}
function bookDetail(t,k){
  if(!k)return '<p class="bkhint">'+T('book.pick')+'</p>';
  const has=bookHas(t,k);let h='<div class="bkdet"><span class="bpic big'+(has?'':' unk')+'">'+bookPic(t,k)+'</span><b>'+(has?bookName(t,k):'???')+'</b>';
  if(t==='f'){
    if(!has)h+='<p>'+T('book.notMet')+'</p>';
    else{const n=BK().f[k],w=bookWeak(k);h+='<p>'+T('book.kills',shortN(n))+'</p>';
      h+='<p>'+(n<BOOK.weakAt?T('book.weakIn',n,BOOK.weakAt):w==='learns'?T('book.learns'):w?T('book.weak')+' '+dtSvg(w)+' '+T('dt.'+w):T('book.noWeak'))+'</p>'}
  }else if(t==='i'){const it=gItem(k);h+='<p>'+T('tier')[it.tier]+'</p>';if(!has)h+='<p>'+T('book.hintItem')+'</p>'}
  else{const R=resOf(k),w=resWhere(k);h+='<p>'+T('tier')[R.rar]+'</p>';if(w.src.length)h+='<p>'+T('tip.from',w.src.slice(0,3).join(', '))+'</p>'}
  return h+'</div>';
}
function bookDraw(){
  const t=BKU.tab,tot=bookTotal(),pend=bookPending(),next=BOOK.every-tot%BOOK.every;
  let h=winHead(T('book.title'),tot+'/'+bookMax());
  h+='<div class="ffilter bktabs">'+BOOK.tabs.map(x=>'<button aria-pressed="'+(x===t)+'" data-act="tab" data-tab="'+x+'">'+T('book.tab.'+x)+' <small>'+bookCount(x)+'/'+bookList(x).length+'</small></button>').join('')+'</div>';
  h+='<div class="bkcols"><section class="bkgrid">'+bookList(t).map(k=>bookCard(t,k)).join('')+'</section><section class="bkside">'+bookDetail(t,BKU.sel);
  h+='<div class="bkrew'+(pend?' ready':'')+'">';
  if(pend){const r=bookReward(BK().paid+1);h+='<p>'+T('book.ready')+' '+Object.keys(r).map(x=>resPic(x)+r[x]).join(' ')+'</p><button class="bkclaim" data-act="claim">'+T('book.claim')+(pend>1?' ×'+pend:'')+'</button>'}
  else h+='<p>'+T('book.next',next)+'</p><div class="bkbar"><i style="width:'+((tot%BOOK.every)/BOOK.every*100)+'%"></i></div>';
  h+='</div></section></div>';
  $('bookWin').innerHTML=h;
}
function bookOpen(on){
  const w=$('bookWin');
  if(on){if(!S||S.mode!=='play')return;if(!$('qLog').hidden)questLogOpen(false);npcTalk(null);S.mode='book';joy=null;BKU.sel=null;w.hidden=false;bookDraw()}
  else{w.hidden=true;if(S&&S.mode==='book')S.mode='play'}
}
$('bookBtn').addEventListener('click',()=>bookOpen($('bookWin').hidden));
$('bookWin').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const a=b.dataset.act;
  if(a==='close'){bookOpen(false);return}
  if(a==='tab'){BKU.tab=b.dataset.tab;BKU.sel=null}
  else if(a==='sel')BKU.sel=b.dataset.k;
  else if(a==='claim')bookClaim();
  sfx('ui');bookDraw();
});
bookBadge();
