import assert from 'node:assert/strict';import {estimateRental as q,HOLIDAYS_2026} from '../pricing.mjs';
assert.equal(q('2026-10-22',2,2).total,1100); // Thu + Fri; two included for entire rental.
assert.equal(q('2026-10-23',1,2).total,700);
assert.equal(q('2026-10-23',2,2).total,1300);
assert.equal(q('2026-10-23',3,2).total,1800);
assert.equal(q('2026-10-26',1,2).total,700); // weekday + extra
assert.equal(q('2026-10-26',2,2).total,1300);
assert.equal(q('2026-10-26',3,2).total,1200);
assert.equal(q('2026-10-26',4,3).total,2250); // 4 weekdays + extra at 650
assert.equal(q('2026-10-23',7,2).total,2700);
assert.equal(q('2026-10-23',8,2).total,3400);
assert.equal(q('2026-10-23',14,4).total,8200); // 5400 + 2 × 1400
for(const days of [4,5,6])assert.equal(q('2026-10-23',days,3).extraRate,650);
assert.equal(q('2026-10-23',7,3).extraRate,700);
assert.equal(q('2026-10-23',8,3).extraRate,800);
assert.equal(q('2026-10-19',1,2).total,700); // public holiday
// Test rare holiday runs without changing the production list.
for(const d of ['2026-10-26','2026-10-27'])HOLIDAYS_2026.add(d);
assert.equal(q('2026-10-23',4,2).total,2200);assert.equal(q('2026-10-23',5,2).total,2700);
HOLIDAYS_2026.add('2026-10-28');assert.equal(q('2026-10-23',6,2).custom,true);
assert.equal(q('2027-01-01',2,2).custom,true);
console.log('Passed: weekdays, weekend/holiday packs, mixed days, weeks, included controllers, all extra-controller tiers and custom quotes');
