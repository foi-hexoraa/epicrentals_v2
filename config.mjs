export const DEFAULT_SETTINGS={
 holidays:{years:{'2026':['01-01','01-15','01-16','01-17','01-26','02-01','03-19','03-21','03-31','04-03','04-14','05-01','05-28','06-26','08-15','08-26','09-04','09-14','10-02','10-19','10-20','11-08','12-25'].map(d=>({date:'2026-'+d,name:'Public holiday'}))}},
 pricing:{weekday:400,weekly:2700,premium:[0,700,1300,1800,2200,2700],controller:[0,300,500,600,650,650,650,700],soundbar:[0,300,500,600,650,650,650,700],controllerAfter7:100,soundbarAfter7:100,delivery:150,deliveryKm:10,returnCutoffMinutes:600},
 images:{hero:'/assets/ps5-v2.webp',ps5:'/assets/ps5-v2.webp',controller:'/assets/controller-v2.webp',soundbar:'/assets/soundbar-v2.webp',vr:'/assets/vr-v2.webp',events:'/assets/events.webp'},
 promotions:{layout:'wide',offers:[{enabled:true,image:'/assets/gta-offer.webp',link:'https://wa.me/919444659236?text=Hi%20Epic%20Rentals!%20Please%20share%20the%20GTA%20VI%20early-bird%20offer%20details.',expires:'2026-10-31T18:29:59Z',title:'GTA VI early-bird offer',note:'Enquire by 31 October 2026. Game access subject to release and availability.'},{enabled:false,image:'/assets/gta-offer.webp',link:'https://wa.me/919444659236',expires:null,title:'Epic Rentals promotion',note:''}]}
};
export function validateHolidays(value){
 if(!value||!value.years||typeof value.years!=='object'||Array.isArray(value.years)||Object.keys(value.years).length>101)return false;
 return Object.entries(value.years).every(([year,dates])=>/^20\d{2}$|^2100$/.test(year)&&Array.isArray(dates)&&dates.length<=366&&new Set(dates.map(d=>d?.date)).size===dates.length&&dates.every(d=>d&&typeof d.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&d.date.startsWith(year+'-')&&Number.isFinite(Date.parse(d.date+'T00:00:00Z'))&&new Date(d.date+'T00:00:00Z').toISOString().slice(0,10)===d.date&&typeof d.name==='string'&&d.name.trim().length>0&&d.name.length<=100));
}
export function validatePricing(p){
 const valid=n=>Number.isInteger(n)&&n>=0&&n<=100000;
 if(!p||!['weekday','weekly','controllerAfter7','soundbarAfter7','delivery','deliveryKm','returnCutoffMinutes'].every(k=>valid(p[k]))||p.weekday<1||p.weekly<1||p.deliveryKm<1||p.deliveryKm>100||p.returnCutoffMinutes>1439)return false;
 if(!['premium','controller','soundbar'].every(k=>Array.isArray(p[k])&&p[k].length===(k==='premium'?6:8)&&p[k][0]===0&&p[k].every(valid)&&p[k].slice(1).every(n=>n>0)))return false;
 return true;
}
