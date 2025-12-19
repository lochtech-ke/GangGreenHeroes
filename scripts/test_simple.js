const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'simple_node_log.txt');

try {
    fs.writeFileSync(LOG_FILE, `Node Test Log - ${new Date().toISOString()}\nHello from test_simple.js\n`);
    console.log('Successfully wrote to log file');
} catch (e) {
    console.error('Failed to write log file', e);
}
