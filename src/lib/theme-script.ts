import { THEMES } from "./themes";

// Runs in <head> before first paint, and again whenever settings change.
// Applies the theme (a fixed one, or the reader's day/night pair following sunrise and sunset for their
// city or the device setting), the browser's address-bar colour, reading view, Arabic script, text sizes and translation toggles.
export const CITIES: Record<string, { label: string; lat: number; lon: number }> = {
  dhaka: { label: "ঢাকা", lat: 23.81, lon: 90.41 },
  chattogram: { label: "চট্টগ্রাম", lat: 22.36, lon: 91.78 },
  sylhet: { label: "সিলেট", lat: 24.89, lon: 91.87 },
  rajshahi: { label: "রাজশাহী", lat: 24.37, lon: 88.6 },
  khulna: { label: "খুলনা", lat: 22.82, lon: 89.55 },
  kolkata: { label: "কলকাতা", lat: 22.57, lon: 88.36 },
  london: { label: "লন্ডন", lat: 51.51, lon: -0.13 },
  newyork: { label: "নিউ ইয়র্ক", lat: 40.71, lon: -74.01 },
};

const TZ_CITY: Record<string, string> = {
  "Asia/Dhaka": "dhaka",
  "Asia/Kolkata": "kolkata",
  "Asia/Calcutta": "kolkata",
  "Europe/London": "london",
  "America/New_York": "newyork",
};

const GROUNDS = Object.fromEntries(THEMES.map((t) => [t.id, t.ground]));
const DAY = THEMES.filter((t) => t.kind === "day").map((t) => t.id);
const NIGHT = THEMES.filter((t) => t.kind === "night").map((t) => t.id);

export const THEME_SCRIPT = `(function(){
var C=${JSON.stringify(CITIES)},T=${JSON.stringify(TZ_CITY)},G=${JSON.stringify(GROUNDS)},DAY=${JSON.stringify(DAY)},NIGHT=${JSON.stringify(NIGHT)};
function isDay(lat,lon){var r=Math.PI/180,n=new Date(),y=n.getUTCFullYear(),d=Math.floor((Date.UTC(y,n.getUTCMonth(),n.getUTCDate())-Date.UTC(y,0,0))/864e5),g=2*Math.PI/365*(d-1),
eq=229.18*(7.5e-5+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g)),
de=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+9.07e-4*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g),
c=Math.cos(90.833*r)/(Math.cos(lat*r)*Math.cos(de))-Math.tan(lat*r)*Math.tan(de);
if(c>1)return false;if(c<-1)return true;var h=Math.acos(c)/r,
m=function(v){return((v%1440)+1440)%1440},rise=m(720-4*(lon+h)-eq),set=m(720-4*(lon-h)-eq),now=n.getUTCHours()*60+n.getUTCMinutes();
return rise<set?(now>=rise&&now<set):(now>=rise||now<set);}
window.__qsApply=function(){var s={};try{s=JSON.parse(localStorage.getItem('qs-settings')||'{}')||{}}catch(e){}
var el=document.documentElement,t=s.theme||'auto',id,
d=DAY.indexOf(s.day)>-1?s.day:'light',n=NIGHT.indexOf(s.night)>-1?s.night:'dark';
if(t==='auto'){var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){}
var c=C[s.city]||C[T[tz]]||C.dhaka;id=isDay(c.lat,c.lon)?d:n;}
else if(t==='system'){id=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?n:d}
else{id=G[t]?t:'light'}
el.setAttribute('data-theme',id);
var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++){m[i].setAttribute('content',G[id]);m[i].removeAttribute('media')}
el.setAttribute('data-view',s.view==='word'?'word':'ayah');el.toggleAttribute('data-hide-tr',s.translit===false);el.setAttribute('data-script',s.script==='simple'?'simple':'uthmani');el.style.setProperty('--ar-scale',String(s.arScale||1));el.style.setProperty('--tr-scale',String(s.trScale||1));
el.toggleAttribute('data-hide-en',s.showEn===false);el.toggleAttribute('data-hide-bn',s.showBn===false);el.setAttribute('data-bn-ed',String(s.bnEd||0));el.setAttribute('data-en-ed',String(s.enEd||0));};
window.__qsApply();
if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){window.__qsApply()});
document.addEventListener('DOMContentLoaded',function(){window.__qsApply()});})();`;

export const cityForTimezone = () => {
  try {
    return TZ_CITY[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? "dhaka";
  } catch {
    return "dhaka";
  }
};
