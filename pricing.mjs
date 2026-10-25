// Rental length stays in 24-hour days. Premium dates through the return cutoff determine the rate split.
import {DEFAULT_SETTINGS} from './config.mjs';
export const PRICING_CONFIG=structuredClone(DEFAULT_SETTINGS.pricing);
export function setPricingConfig(p){Object.assign(PRICING_CONFIG,p)}
export function accessoryRate(days,item='controller'){return days<=7?PRICING_CONFIG[item][days]:PRICING_CONFIG[item][7]+(days-7)*PRICING_CONFIG[item+'After7']}
export const HOLIDAYS_2026=new Set(['01-01','01-15','01-16','01-17','01-26','02-01','03-19','03-21','03-31','04-03','04-14','05-01','05-28','06-26','08-15','08-26','09-04','09-14','10-02','10-19','10-20','11-08','12-25'].map(d=>'2026-'+d));
let holidayYears=new Set(['2026']),holidayDates=HOLIDAYS_2026;
export function setHolidayCalendar(calendar){holidayYears=new Set(Object.keys(calendar.years));holidayDates=new Set(Object.values(calendar.years).flat().map(d=>d.date))}
const DAY=86400000;
export function estimateRental(start,days,controllers,startTime='10:00'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(days)||days<1||days>90||![1,2,3,4].includes(Number(controllers)))return {custom:true,reason:'Contact us for a custom quote.'};
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))return {custom:true,reason:'Choose a start time to see your estimate.'};
 const minutes=Number(startTime.slice(0,2))*60+Number(startTime.slice(3));
 const base=Date.parse(start+'T00:00:00Z');if(!Number.isFinite(base))return {custom:true,reason:'Choose valid rental dates.'};
 const dates=Array.from({length:days},(_,i)=>new Date(base+i*DAY).toISOString().slice(0,10));
 if(dates.some(d=>!holidayYears.has(d.slice(0,4))))return {custom:true,reason:'Holiday pricing for this year is awaiting confirmation. Please request a quote.'};
 const isPremium=d=>{const weekday=new Date(d+'T00:00:00Z').getUTCDay();return weekday===0||weekday>=5||holidayDates.has(d)};
 const weeks=Math.floor(days/7),remainder=days%7,lines=[];let consoleTotal=weeks*PRICING_CONFIG.weekly;
 if(weeks)lines.push({label:weeks+' × weekly pack',amount:weeks*PRICING_CONFIG.weekly});
 // Include the return date only after the cutoff. Premium dates replace weekday allocations;
 // they never increase the number of charged rental days.
 const candidates=Array.from({length:remainder+(remainder&&minutes>PRICING_CONFIG.returnCutoffMinutes?1:0)},(_,i)=>new Date(base+(weeks*7+i)*DAY).toISOString().slice(0,10));
 if(candidates.some(d=>!holidayYears.has(d.slice(0,4))))return {custom:true,reason:'Holiday pricing for this year is awaiting confirmation. Please request a quote.'};
 const premiumDates=candidates.filter(isPremium).slice(0,remainder);
 const weekdayCount=remainder-premiumDates.length;
 if(weekdayCount){consoleTotal+=weekdayCount*PRICING_CONFIG.weekday;lines.push({label:weekdayCount+' weekday'+(weekdayCount>1?'s':'')+' × ₹'+PRICING_CONFIG.weekday,amount:weekdayCount*PRICING_CONFIG.weekday})}
 for(let i=0;i<premiumDates.length;){let n=1;while(i+n<premiumDates.length&&Date.parse(premiumDates[i+n])-Date.parse(premiumDates[i+n-1])===DAY)n++;i+=n;if(n>5)return {custom:true,reason:'Please contact us for a quote for this holiday stretch.'};const amount=PRICING_CONFIG.premium[n];consoleTotal+=amount;lines.push({label:n+'-day weekend / holiday pack',amount})}
 const included=weeks>0||premiumDates.length>0||days>=3?2:1;
 const extraCount=Math.max(0,Number(controllers)-included),rate=accessoryRate(days);
 const extraTotal=extraCount*rate;
 return {custom:false,days,consoleTotal,included,extraCount,extraRate:rate,extraTotal,total:consoleTotal+extraTotal,lines,returnDate:new Date(base+days*DAY).toISOString().slice(0,10)};
}
