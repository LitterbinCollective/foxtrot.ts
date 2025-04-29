import { readFileSync } from 'fs';
export default JSON.parse(readFileSync('configs/json/knex.json', 'utf-8'));