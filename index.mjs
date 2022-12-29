// From https://thewebdev.info/2022/02/27/how-to-use-__dirname-in-node-js-when-using-es6-modules/
import { dirname } from 'path';
import { chdir } from 'process';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load server
chdir(__dirname);
import server from './lib/server.mjs';
