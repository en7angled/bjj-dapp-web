#!/usr/bin/env node
const https = require('https');
const http = require('http');
const { Address } = require('@emurgo/cardano-serialization-lib-nodejs');

const BASE_URL = process.env.API_URL || 'https://bjjserver-995707778143.europe-west1.run.app';
const AUTH = Buffer.from('cardano:lovelace').toString('base64');

function toHex(addr) {
  if (!addr) return '';
  if (/^[0-9a-fA-F]+$/.test(addr)) return addr;
  try { return Buffer.from(Address.from_bech32(addr).to_bytes()).toString('hex'); } catch { return addr; }
}

function post(path, body) {
  const url = new URL(path, BASE_URL);
  const data = JSON.stringify(body);
  const mod = url.protocol === 'https:' ? https : http;
  return new Promise((resolve) => {
    const req = mod.request(url, { method: 'POST', headers: { 'Authorization': `Basic ${AUTH}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data)}}, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.write(data); req.end();
  });
}

async function run() {
  const usedA = toHex(process.env.USED_A);
  const usedB = toHex(process.env.USED_B || process.env.USED_A); // fallback same as change if not provided
  const change = toHex(process.env.CHANGE || process.env.USED_A);

  const common = {
    profile_data: { name: 'Test', description: 'test', image_uri: 'https://example.com/x' },
    profileType: 'Practitioner',
    creationDate: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    belt: 'White'
  };

  const cases = [
    { label: 'same-used-and-change', used: [usedA], change },
    { label: 'two-used-different-from-change', used: [usedA, usedB], change },
  ];

  for (const c of cases) {
    const body = {
      action: { tag: 'CreateProfileWithRankAction', contents: common },
      userAddresses: { usedAddresses: c.used, changeAddress: c.change }
    };
    const res = await post('/build-tx', body);
    console.log(`\nCASE: ${c.label}`);
    console.log('used hex lengths:', c.used.map(u=>u.length), 'change length:', c.change.length);
    console.log('status:', res.status);
    console.log('body:', res.body.slice(0,200));
  }
}
run();
