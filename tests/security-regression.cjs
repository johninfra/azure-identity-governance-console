#!/usr/bin/env node
// Static regression checks; these are not a substitute for runtime security testing.
const fs=require('node:fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
const gov=fs.readFileSync('governance-intelligence.js','utf8');
const live=fs.readFileSync('live-entra.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const config=JSON.parse(fs.readFileSync('staticwebapp.config.json','utf8'));
assert.match(app,/\$\{esc\(r\.title\)\}/);
assert.match(app,/\$\{esc\(r\.entity\)\} · \$\{esc\(r\.detail\)\}/);
assert.match(app,/const safeType=\[/);
assert.doesNotMatch(gov,/localStorage\.setItem\(SNAPSHOT_KEY/);
assert.doesNotMatch(gov,/localStorage\.getItem\(SNAPSHOT_KEY/);
assert.deepEqual(config.routes[0].allowedRoles,['authenticated']); // Preserve the existing hosting gate; validate SWA session separately.
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
assert.match(app,/data-security-action="decide"/);
assert.match(app,/data-security-status="\$\{parts\[1\]\}"|data-security-status="Approved"/);
assert.doesNotMatch(app,/on(?:click|change|submit|input)=/);
assert.doesNotMatch(gov,/on(?:click|change|submit|input)=/);
assert.match(app,/data-security-action/);
assert.match(app,/const allowed = new Set/);
assert.doesNotMatch(config.globalHeaders['Content-Security-Policy-Report-Only'],/script-src[^;]*'unsafe-inline'/);
assert.equal(config.responseOverrides['403'].statusCode,403);
// Release invariants: live API requests use the audited gateway.
assert.equal((live.match(/fetch\s*\(/g)||[]).length,1);
assert.doesNotMatch(live,/XMLHttpRequest|sendBeacon\s*\(/);
assert.match(live,/redirect: "error"/);
assert.equal(config.routes.some(r => r.route === '/*' && r.allowedRoles.includes('governance_reader')),false);
console.log('Static security checks passed; hosted login and delegated live authorization require runtime validation.');
