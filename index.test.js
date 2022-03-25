const {get_content} = require('./file_handler');
const process = require('process');
const cp = require('child_process');
const path = require('path');

// test('throws invalid number', async () => {
//   await expect(wait('foo')).rejects.toThrow('milliseconds not a number');
// });

test('read file content as string', async () => {
    const filepath = './README.md'
    let contents = await get_content(filepath)
    expect(typeof contents === 'string').toBeTruthy();
});

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
    process.env['INPUT_FILE_TYPES'] = 'md';
    process.env['INPUT_EXCLUDE_PATH'] = 'node_modules';
    process.env['INPUT_OUTPUT_FILE'] = 'result_file';
    const ip = path.join(__dirname, 'index.js');
    const result = cp.execSync(`node ${ip}`, {env: process.env}).toString();
    console.log(result);
})
