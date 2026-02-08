const dns = require('dns');

const hostname = '_mongodb._tcp.attendify2026.87cn4pu.mongodb.net';

console.log(`Attempting to resolve SRV record for: ${hostname}`);

dns.resolveSrv(hostname, (err, addresses) => {
    if (err) {
        console.error('DNS Resolution Error:', err);
        console.log('\n--- DIAGNOSIS ---');
        console.log('Your network DNS cannot resolve the MongoDB Atlas address.');
        console.log('Possible causes:');
        console.log('1. Restricted Firewall (School/College WiFi).');
        console.log('2. ISP blocking MongoDB.');
        console.log('3. DNS Server issues.');
        console.log('\n--- SUGGESTED FIX ---');
        console.log('Try connecting to a MOBILE HOTSPOT and run this again.');
    } else {
        console.log('DNS Resolution Success:', addresses);
        console.log('The SRV record is resolving. The issue might be firewall blocking port 27017.');
    }
});
