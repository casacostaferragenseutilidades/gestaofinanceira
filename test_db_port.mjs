
import net from 'net';

const host = 'aws-0-us-west-2.pooler.supabase.com';
const port = 6543;

const client = new net.Socket();
client.setTimeout(5000);

console.log(`Checking ${host}:${port}...`);

client.connect(port, host, () => {
    console.log('CONNECTED');
    client.destroy();
});

client.on('error', (err) => {
    console.log('ERROR:', err.message);
});

client.on('timeout', () => {
    console.log('TIMEOUT');
    client.destroy();
});
