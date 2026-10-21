#!/usr/bin/env node
// Static regression checks; these are not a substitute for runtime security testing.
const fs=require('node:fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
const gov=fs.readFileSync('governance-intelligence.js','utf8');
const live=fs.readFileSync('live-entra.js','utf8');
const config=JSON.parse(fs.readFileSync('staticwebapp.config.json','utf8'));
assert.match(app,/\$\{esc\(r\.title\)\}/);
assert.match(app,/\$\{esc\(r\.entity\)\} · \$\{esc\(r\.detail\)\}/);
assert.match(app,/const safeType=\[/);
assert.doesNotMatch(gov,/localStorage\.setItem\(SNAPSHOT_KEY/);
assert.doesNotMatch(gov,/localStorage\.getItem\(SNAPSHOT_KEY/);
assert.deepEqual(config.routes[0].allowedRoles,['authenticated']); // Not app-role authorization; remains a blocker.
assert.ok(config.globalHeaders['X-Content-Type-Options']==='nosniff');
assert.ok(config.globalHeaders['X-Frame-Options']==='DENY');
assert.match(live,/cacheLocation: "sessionStorage"/);
assert.match(live,/endpoint\.origin !== new URL\(GRAPH\)\.origin/);
assert.match(app,/\$\{esc\(r\.role\)\}/);
assert.match(app,/\$\{esc\(r\.scope\)\}/);
assert.match(live,/redirect: "error"/);
assert.match(live,/requireTrustedEndpoint\(url\)/);
assert.match(live,/a\.tenantId\?\.toLowerCase\(\) === TENANT_ID\.toLowerCase\(\)/);
assert.match(live,/account\?\.tenantId\?\.toLowerCase\(\) !== TENANT_ID\.toLowerCase\(\)/);
assert.ok(config.globalHeaders['Content-Security-Policy-Report-Only']);
assert.match(app,/function safeActionId\(value\)/);
assert.match(app,/\$\{esc\(r\.entity\)\}<\/td><td>\$\{statusBadge\(r\.status\)\}/);
assert.match(app,/decide\('\$\{safeActionId\(r\.id\)\}'/);
console.log('Static security regression checks passed; authorization remains a deployment blocker.');
