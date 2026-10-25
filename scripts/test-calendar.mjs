import assert from 'node:assert/strict';import {calculate} from '../worker/calendar-worker.mjs';
const t=s=>Date.parse(s+'+05:30'),from=t('2026-10-23T00:00:00'),to=t('2026-10-28T00:00:00');
const busy=(resource,start,finish)=>({resource,start,finish});
const booked=['PS1','PS2','PS3','PS4'].map(r=>busy(r,'2026-10-24 10:00:00','2026-10-25 10:00:00'));
let windows=calculate(booked,from,to,2);assert.equal(windows[0][1],t('2026-10-24T08:00:00'));assert.equal(windows[1][0],t('2026-10-25T12:00:00'));
assert(windows.some(w=>w[0]<=t('2026-10-23T08:00:00')&&w[1]>=t('2026-10-24T08:00:00')));
assert(!windows.some(w=>w[0]<=t('2026-10-23T10:00:00')&&w[1]>=t('2026-10-25T10:00:00')));
// Controller reservations affect 3/4-controller rentals independently.
const extras=[busy('CON1','2026-10-23 00:00:00','2026-10-27 00:00:00')];assert.equal(calculate(extras,from,to,3)[0][0],from);assert.equal(calculate(extras,from,to,4)[0][0],t('2026-10-27T02:00:00'));
// Overlapping windows across different consoles must not create a false continuous rental.
const fragmented=[busy('PS1','2026-10-25 10:00:00','2026-10-28 00:00:00'),...['PS2','PS3','PS4'].map(r=>busy(r,'2026-10-22 00:00:00','2026-10-24 10:00:00'))];windows=calculate(fragmented,from,to,2);assert(!windows.some(w=>w[0]<=from&&w[1]>=to));
console.log('Passed: both buffer boundaries, exact two-hour gap, shorter rental, extra controllers, continuous-console requirement');
