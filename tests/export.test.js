import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMeasurementsCsv } from '../src/services/export/csvFormatter.js';

test('buildMeasurementsCsv: formats headers, rows, and escapes commas/quotes', () => {
  const sample = [
    {
      id: 'meas-1',
      roomName: 'Lab "A", Floor 2',
      createdAt: '2026-11-27T10:00:00.000Z',
      overallRT60: 0.58,
      edt: 0.52,
      t20: 0.19,
      t30: 0.29,
      rSquared: 0.985,
      snrDb: 40.2,
      bassRatio: 1.15,
      trebleRatio: 0.88,
      clarity: { c50: 3.2, c80: 4.8, d50: 68.5, sti: 0.78, stiRating: 'Excellent' },
      location: { venueName: 'Academic Block, Wing B' },
      surfaceMaterials: ['Carpet', 'Glass'],
    },
  ];

  const csv = buildMeasurementsCsv(sample);
  const lines = csv.split('\n');
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^ID,Room Name,Venue,/);
  assert.match(lines[1], /"Lab ""A"", Floor 2"/);
  assert.match(lines[1], /"Academic Block, Wing B"/);
  assert.match(lines[1], /0\.58/);
  assert.match(lines[1], /Excellent/);
});

test('buildMeasurementsCsv: throws when measurements list is empty', () => {
  assert.throws(() => buildMeasurementsCsv([]), /No measurements/i);
});
