import assert from 'node:assert';
import fs from 'node:fs';
import { parseLogs } from '../src/parser.js';

console.log('Testing parseLogs()...');

// 1. Legacy format test
const legacyLog = `2026/01/13 12:15:30 Endpoint: getUpdates, response: {"ok":true,"result":[{"update_id":100,"message":{"message_id":1,"from":{"id":121,"first_name":"John","username":"johndoe"},"chat":{"id":121,"first_name":"John","username":"johndoe"},"date":1736748930,"text":"/start"}}]}
2026/01/13 12:15:31 Endpoint: sendMessage, response: {"ok":true,"result":{"message_id":2,"from":{"id":999,"is_bot":true},"chat":{"id":121,"first_name":"John","username":"johndoe"},"date":1736748931,"text":"Welcome!"}}
2026/01/13 12:16:02 Endpoint: getUpdates, response: {"ok":true,"result":[{"update_id":101,"callback_query":{"id":"cb1","from":{"id":121,"first_name":"John"},"message":{"message_id":2,"chat":{"id":121},"date":1736748931,"text":"Choose"},"data":"opt_1"}}]}
2026/01/13 12:16:03 Endpoint: editMessageText, response: {"ok":true,"result":{"message_id":2,"chat":{"id":121},"date":1736748931,"edit_date":1736748963,"text":"Selected 1"}}`;

const legacyResult = parseLogs(legacyLog);
assert.strictEqual(legacyResult.length, 4, 'Should parse 4 legacy messages');
assert.strictEqual(legacyResult[0].direction, 'in');
assert.strictEqual(legacyResult[0].text, '/start');
assert.strictEqual(legacyResult[0].userId, 121);
assert.strictEqual(legacyResult[1].direction, 'out');
assert.strictEqual(legacyResult[1].text, 'Welcome!');
assert.strictEqual(legacyResult[2].kind, 'callback_query');
assert.strictEqual(legacyResult[2].text, 'opt_1');
assert.strictEqual(legacyResult[3].direction, 'out');
assert.strictEqual(legacyResult[3].kind, 'edit');
assert.strictEqual(legacyResult[3].text, 'Selected 1');

console.log('? Legacy format parsed successfully');

// 2. New go-telegram/bot format test
const newLog = `2026/09/03 22:30:00 [TGBOT] [DEBUG] response from 'https://api.telegram.org/bot***/getUpdates' with payload '{"ok":true,"result":[{"update_id":200,"message":{"message_id":10,"from":{"id":222,"first_name":"Alice","username":"alice"},"chat":{"id":222,"first_name":"Alice","username":"alice"},"date":1788445800,"text":"/build_4"}}]}'
2026/09/03 22:30:01 [TGBOT] [DEBUG] request url: https://api.telegram.org/bot***/sendMessage, payload: {"chat_id":222,"text":"Builders Guild construction started!","parse_mode":"HTML"}
2026/09/03 22:30:01 [TGBOT] [DEBUG] response from 'https://api.telegram.org/bot***/sendMessage' with payload '{"ok":true,"result":{"message_id":12,"from":{"id":999,"is_bot":true},"chat":{"id":222,"first_name":"Alice","username":"alice"},"date":1788445801,"text":"Builders Guild construction started!"}}'
2026/09/03 22:30:15 [TGBOT] [DEBUG] response from 'https://api.telegram.org/bot***/getUpdates' with payload '{"ok":true,"result":[{"update_id":201,"callback_query":{"id":"cb2","from":{"id":222,"first_name":"Alice"},"message":{"message_id":12,"chat":{"id":222},"date":1788445801,"text":"Menu"},"data":"confirm_upgrade"}}]}'
2026/09/03 22:30:16 [TGBOT] [DEBUG] response from 'https://api.telegram.org/bot***/editMessageText' with payload '{"ok":true,"result":{"message_id":12,"chat":{"id":222},"date":1788445801,"edit_date":1788445816,"text":"? Upgrade queued!"}}'`;

const newResult = parseLogs(newLog);
assert.strictEqual(newResult.length, 4, 'Should parse 4 new format messages (ignoring request payload)');
assert.strictEqual(newResult[0].direction, 'in');
assert.strictEqual(newResult[0].text, '/build_4');
assert.strictEqual(newResult[0].userId, 222);
assert.strictEqual(newResult[1].direction, 'out');
assert.strictEqual(newResult[1].text, 'Builders Guild construction started!');
assert.strictEqual(newResult[2].kind, 'callback_query');
assert.strictEqual(newResult[2].text, 'confirm_upgrade');
assert.strictEqual(newResult[3].direction, 'out');
assert.strictEqual(newResult[3].kind, 'edit');
assert.strictEqual(newResult[3].text, '? Upgrade queued!');

console.log('? New go-telegram/bot format parsed successfully');

// 3. Single quotes inside message text test
const singleQuotesLog = `2026/09/03 22:35:00 [TGBOT] [DEBUG] response from 'https://api.telegram.org/bot***/sendMessage' with payload '{"ok":true,"result":{"message_id":50,"chat":{"id":333},"date":1788446100,"text":"It's a knight's duty to protect the realm!"}}'`;
const quotesResult = parseLogs(singleQuotesLog);
assert.strictEqual(quotesResult.length, 1);
assert.strictEqual(quotesResult[0].text, "It's a knight's duty to protect the realm!");

console.log('? Single quotes in payload handled successfully');

// 4. Mixed format test
const mixedLog = `${legacyLog}\n${newLog}`;
const mixedResult = parseLogs(mixedLog);
assert.strictEqual(mixedResult.length, 8, 'Should parse all 8 messages from mixed log');

console.log('? Mixed log parsed successfully');

// 5. Test test_sample.log file directly
const sampleContent = fs.readFileSync('test_sample.log', 'utf-8');
const sampleResult = parseLogs(sampleContent);
assert.strictEqual(sampleResult.length, 12, 'Should parse all 12 valid messages in test_sample.log');

console.log('? test_sample.log parsed successfully');

console.log('All tests passed! ??');
