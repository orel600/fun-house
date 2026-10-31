/* סטים של ציוד (roadmap.md, "Claude מוביל"): כמה פריטים מאותו סט שלבושים יחד נותנים בונוס.
   פריט בסט: set:'<id>' בשורה שלו ב-GEAR.items (gear.js). bonus: כמה חלקים לבושים → מה מקבלים.
   הבונוס נכנס ל-gearStats (gear.js), ולכן חל על השחקן בדיוק כמו סטט של ציוד, גם כשמחליפים באמצע ריצה.
   מפתחות שאפשר לתת: כל מה ש-gApply מכיר (sdmg, gdmg, hp, speed, magnet, regen, def, crit, loot, hpPct, multi, pierce, aspd).
   השמות ב-lang.js: 'set.<id>' לסט, ו-'set.<id>.<n>' למה שהמדרגה נותנת. col: הצבע של הסט בחלון הציוד */
const SETS={
  warden:{col:'#C9A26B',bonus:{2:{hp:30,def:5},4:{def:8,hpPct:15,sdmg:20}}},     // השומר האבן: מקרוב ועמיד (פרק 1 בעלילה)
  storm: {col:'#C7A6FF',bonus:{2:{gdmg:15,crit:4},4:{speed:10,multi:1,gdmg:20}}}  // צייד הסערה: מרחוק ומהיר
};

const setOf=id=>{const it=gItem(id);return it&&it.set||null};
const setItems=s=>Object.keys(GEAR.items).filter(k=>GEAR.items[k].set===s);
function setCounts(ids){const c={};for(const id of ids){const s=setOf(id);if(s)c[s]=(c[s]||0)+1}return c}
// הבונוס של כל המדרגות שהגיעו אליהן, יחד. נקרא מ-gearStats
function setStats(ids){
  const t={},c=setCounts(ids);
  for(const s in c)for(const n in SETS[s].bonus)if(c[s]>=+n){const b=SETS[s].bonus[n];for(const k in b)t[k]=(t[k]||0)+b[k]}
  return t;
}
// המדרגות הפעילות, כמו 'warden2'. כך יודעים מה נפתח עכשיו
const setTiers=ids=>{const c=setCounts(ids),o=[];for(const s in c)for(const n in SETS[s].bonus)if(c[s]>=+n)o.push(s+n);return o};

// בפרטי פריט מסט: שם הסט, כמה חלקים לבושים, וכל מדרגה. מדרגה פעילה מודגשת
function setHtml(id){
  const s=setOf(id);if(!s)return '';
  const c=setCounts(gearWorn())[s]||0;
  return '<div class="gset" style="--set:'+SETS[s].col+'"><b>'+T('set.'+s)+' <bdi>'+c+'/'+setItems(s).length+'</bdi></b>'+
    Object.keys(SETS[s].bonus).map(n=>'<p'+(c>=+n?' class="on"':'')+'>'+T('set.n',n)+' '+T('set.'+s+'.'+n)+'</p>').join('')+'</div>';
}
// אחרי שלבשו פריט: מדרגה חדשה של סט נפתחה? חגיגה והודעה בצבע הסט (כל התקדמות נראית)
function setCheck(beforeIds){
  const a=setTiers(beforeIds),nw=setTiers(gearWorn()).filter(x=>!a.includes(x));
  if(!nw.length)return false;
  const x=nw[nw.length-1],n=x.match(/\d+$/)[0],s=x.slice(0,-n.length);
  celebrate(P.x,P.y-30,'gear','✨');banner(T('set.got',T('set.'+s),n),SETS[s].col);
  return true;
}
