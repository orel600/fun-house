/* אייקונים אחידים מ-game-icons.net (CC BY 3.0, הקרדיטים: docs/credits.md ובהגדרות). הקונספט: docs/concept-icons.md (ניר אישר, 7.11.2026)
   צללית אחת בצבע, במסגרת קבועה לכל הקשר. סקיל בצבע סוג הנזק שלו, צומת בעץ בצבע הענף.
   ניר רוצה לנסות ולהחליט: בהגדרות "אייקוני סקילים: חדש / קלאסי", נשמר ב-SAVE.icons.sk. קלאסי = מה שהיה לפני (ציורים ואימוג'י).
   אייקון חדש לסקיל: שורה ב-GICO.sk (או tree), ואז node tools/gicons.js <תיקיית הריפו של game-icons> מעדכן את js/gicons-data.js ואת docs/credits.md.
   בזירה (של אוראל) רק כפתורי הסקילים, לפי אותה הגדרה (skillsHud ב-skills.js). */
const GICO={
  // הגדלים: אותו סולם בשני הסגנונות (style.css, --ic-s/m/l). קטן: בתוך טקסט ושורות. בינוני: משבצות וכרטיסים. גדול: בתוך כפתור סקיל
  size:{s:20,m:28,l:40},
  frame:'#C9A23E',                 // טבעת הזהב סביב סקיל
  // סקיל -> אייקון (תיקיית היוצר/שם). צבע: סוג הנזק של הסקיל
  sk:{quake:'lorc/earth-crack',splash:'lorc/big-wave',frost:'lorc/snowflake-2',flame:'sbed/fire',zap:'lorc/lightning-arc',
    charge:'lorc/sprint',whirl:'lorc/whirlwind',shield:'lorc/ice-shield',volley:'lorc/arrow-cluster',trap:'lorc/wolf-trap',
    vines:'lorc/vine-whip',spirit:'lorc/ghost',storm:'lorc/lightning-storm',meteor:'lorc/meteor-impact',petrify:'delapouite/stone-bust',
    chain:'lorc/lightning-branches',vortex:'lorc/vortex',bastion:'lorc/stone-tower',dawnblade:'delapouite/sword-brandish',
    starfall:'delapouite/falling-star',emberstorm:'lorc/burning-meteor',comet:'lorc/comet-spark',lance:'lorc/ice-spear',bloom:'lorc/lotus-flower'},
  // סטטים, ענפים וצמתים בעץ (stats.js). צבע: הענף (--br), ומחוץ לענף זהב
  tree:{str:'delapouite/biceps',vit:'delapouite/heart-beats',agi:'delapouite/running-shoe',haste:'lorc/sands-of-time',def:'lorc/checked-shield',luck:'lorc/clover',
    war:'lorc/crossed-swords',hunt:'lorc/high-shot',mage:'lorc/wizard-staff',
    w1:'lorc/rock',wRoot:'delapouite/tree-roots',wCounter:'lorc/return-arrow',w3:'lorc/broadsword',wBlood:'lorc/bleeding-wound',wQuake:'lorc/earth-spit',
    w5:'lorc/checked-shield',wMountain:'lorc/mountains',wBerserk:'delapouite/enrage',
    h1:'skoll/bullseye',hMomentum:'lorc/run',hFirst:'delapouite/podium-winner',h3:'delapouite/running-shoe',hMark:'skoll/bullseye',hHop:'delapouite/jump-across',
    h5:'lorc/high-shot',hSniper:'lorc/spyglass',hWind:'lorc/wind-slap',
    m1:'delapouite/sparkles',mRotate:'lorc/rainbow-star',mFocus:'lorc/magnifying-glass',m3:'delapouite/healing',mSpread:'lorc/star-swirl',
    mCircle:'lorc/magic-portal',m5:'delapouite/star-formation',mStorm:'lorc/lightning-storm',mGlass:'lorc/crystal-growth'},
  // הנשק ביד (כפתור ההחלפה, combat.js). צבע: סוג הנזק. חלק מ"אייקוני סקילים"
  wpn:{sword:'lorc/broadsword',axe:'lorc/battle-axe',hammer:'delapouite/warhammer',bow:'lorc/high-shot',staff:'lorc/wizard-staff',wand:'lorc/fairy-wand',
    gun:'lorc/high-shot'},
  // סרגל התפריט והקיצורים בצד (לפי ה-id של הכפתור, או data-tab בקיצור). צבע: זהב, במסגרת עץ. "אייקוני תפריט" בהגדרות
  nav:{gearBtn:'delapouite/backpack',qBtn:'lorc/scroll-unfurled',bookBtn:'lorc/open-book',wMapBtn:'lorc/treasure-map',mbTab:'lorc/crossed-swords',setBtn:'lorc/cog'},
  // משחקי השאול (moba-icons.js): הסקילים של הערכות, הערכות עצמן (k_), והריפוי והלחשים (sp_, moba-spells.js). צבע: --dt של הכפתור. חלק מ"אייקוני סקילים"
  mb:{anvil:'lorc/anvil-impact',taunt:'lorc/shouting',wall:'delapouite/brick-wall',
    cleave:'lorc/wave-strike',spin:'lorc/sword-spin',rage:'delapouite/enrage',
    pierce:'lorc/arrow-dunk',net:'lorc/fishing-net',rain:'lorc/arrow-flights',
    wave:'lorc/wave-crest',bubble:'lorc/bubbles',blizzard:'lorc/frozen-orb',
    k_tank:'lorc/hammer-drop',k_warrior:'lorc/crossed-swords',k_hunter:'lorc/high-shot',k_mage:'lorc/wizard-staff',
    sp_heal:'sbed/health-increase',sp_dash:'lorc/sprint',sp_haste:'lorc/wingfoot',sp_barrier:'lorc/shield-reflect',sp_reveal:'delapouite/eye-target',sp_exhaust:'sbed/weight-crush',sp_cleanse:'delapouite/holy-water'},
  // הכפתורים הגדולים בזירה: אולטימייט "פרץ הפנס" (ult.js), ברק אלוהי (divine.js) והכישוף (spell.js). הסקיל החתימה (sigskill.js) לוקח מ-sk
  ult:{ult:'lorc/lantern-flame',divine:'lorc/thunder-struck'},
  spell:{dash:'lorc/wingfoot',heal:'sbed/health-increase',smite:'lorc/lightning-helix'},
  // ממשק: תג "נעול עד רמה" (moba-icons.js). תמיד, גם בקלאסי
  ui:{lock:'lorc/padlock'},
};

// הסגנון: 'new' (ברירת מחדל) או 'classic'. kind: 'sk' (סקילים, ספר, עץ ונשק) או 'nav' (סרגל התפריט)
const gicoOn=kind=>!(typeof SAVE==='object'&&SAVE.icons&&SAVE.icons[kind]==='classic');
// הצללית כ-SVG. name: 'lorc/sprint'. cls: מחלקות נוספות. col: צבע (בלי: currentColor, כלומר לפי ה-CSS)
function gIco(name,cls,col){const k=name&&name.split('/')[1],d=typeof GICON==='object'&&GICON[k];if(!d)return'';
  return '<svg class="gi'+(cls?' '+cls:'')+'" viewBox="0 0 512 512" aria-hidden="true"'+(col?' style="color:'+col+'"':'')+'><path d="'+d+'"/></svg>'}
// סקיל: האייקון בצבע סוג הנזק, או '' כשהסגנון קלאסי או שאין אייקון
const gSk=(id,cls)=>gicoOn('sk')&&GICO.sk[id]&&typeof SKILLS==='object'&&SKILLS.list[id]?gIco(GICO.sk[id],cls,dtCol(SKILLS.list[id].dt)):'';
// צומת או סטט בעץ: '' כשהסגנון קלאסי
const gTree=(k,cls)=>gicoOn('sk')&&GICO.tree[k]?gIco(GICO.tree[k],cls):'';
// כפתור הסקיל בעולם ובכפר. בזירה skillsHud בודק בעצמו (skills.js)
const gSkHere=()=>gicoOn('sk')&&!!(S.wd||document.body.classList.contains('vil'));

// הנשק על כפתור ההחלפה (#ico, combat.js): צללית, או ציור הקו הקלאסי (ICON). w: 'sword'/'gun'/'staff', wt: הנשק המדויק (P.wt)
function gWpn(el,w,wt){const n=gicoOn('sk')&&(GICO.wpn[wt]||GICO.wpn[w]),k=n&&n.split('/')[1],d=k&&typeof GICON==='object'&&GICON[k];
  if(d){el.setAttribute('viewBox','0 0 512 512');el.setAttribute('fill','currentColor');el.setAttribute('stroke','none');el.innerHTML='<path d="'+d+'"/>';return}
  el.setAttribute('viewBox','0 0 24 24');el.setAttribute('fill','none');el.setAttribute('stroke','currentColor');el.innerHTML=ICON[wt]||ICON[w]||''}
// סרגל התפריט: מחליף את האימוג'י או הציור בצללית, ושומר את הישן כדי להחזיר בקלאסי
function gNav(){const on=gicoOn('nav');
  for(const b of document.querySelectorAll('.mtab[id],.qr[data-tab]')){const n=GICO.nav[b.dataset.tab||b.id],ni=b.querySelector('.ni');if(!n||!ni)continue;
    if(ni.dataset.e===undefined)ni.dataset.e=ni.innerHTML;
    const want=on?gIco(n):ni.dataset.e;if(ni.innerHTML!==want)ni.innerHTML=want;b.classList.toggle('gnav',on&&!!want)}}

/* ההגדרות בחלון ההגדרות (data-gico="new|classic", data-gk="sk|nav"). בלי טעינה מחדש: הכפתורים מתחלפים מיד, והחלונות נבנים מחדש בפעם הבאה שנפתחים */
function gicoApply(){
  for(const b of document.querySelectorAll('[data-gico]'))b.setAttribute('aria-pressed',String((b.dataset.gico==='new')===gicoOn(b.dataset.gk||'sk')));
  if(typeof skKey!=='undefined')skKey='';gNav();if(typeof updateSwapBtn==='function'&&typeof P!=='undefined'&&P)updateSwapBtn()}
for(const b of document.querySelectorAll('[data-gico]'))b.onclick=()=>{if(!isObj(SAVE.icons))SAVE.icons={};SAVE.icons[b.dataset.gk||'sk']=b.dataset.gico;saveNow();gicoApply();if(typeof sfx==='function')sfx('ui')};
gNav();   // בטעינה: השמירה כבר נטענה (save.js), והסרגל כבר ב-HTML
