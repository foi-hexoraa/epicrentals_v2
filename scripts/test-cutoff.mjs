import assert from 'node:assert/strict';import {estimateRental as q,PRICING_CONFIG} from '../pricing.mjs';
assert.equal(q('2026-11-04',3,2,'19:00').total,1700);
assert.equal(q('2026-11-05',2,2,'09:00').total,1100);
assert.equal(q('2026-11-05',2,2,'10:00').total,1100);
assert.equal(q('2026-11-05',2,2,'10:01').total,1300);
assert.equal(q('2026-11-05',2,2,'11:00').total,1300);
assert.equal(q('2026-11-06',3,2,'19:00').total,1800);
assert.equal(q('2026-11-06',7,2,'19:00').total,2700);
assert.equal(q('2026-11-06',14,4,'19:00').total,8200);
assert.equal(q('2026-11-06',1,2,'19:00').total,700); // no double charging Fri/Sat
assert.equal(q('2026-11-08',1,2,'19:00').total,700); // Sunday to Monday
assert.equal(q('2026-11-02',2,1,'19:00').total,800); // weekdays
assert.equal(q('2026-11-05',1,2,'19:00').total,700); // return Friday after cutoff, two included
assert.equal(q('2026-11-05',1,2,'10:00').total,700); // weekday400 + extra300
assert.equal(q('2026-11-05',1,2,'10:00').included,1);
assert.equal(q('2026-11-05',1,2,'10:01').included,2);
assert.equal(q('2026-10-18',1,2,'19:00').total,700); // holiday Monday capped to 1 day
PRICING_CONFIG.returnCutoffMinutes=12*60;
assert.equal(q('2026-11-05',2,2,'11:00').total,1100);
assert.equal(q('2026-11-05',2,2,'12:01').total,1300);
console.log('Passed approved cases, exact cutoff, one minute after, no extra rental days, Monday returns, controllers, weekly packs and configurable cutoff');
