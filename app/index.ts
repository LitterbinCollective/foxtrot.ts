import { Application } from './app';
import config from '@/configs/app.json';

export default new Application(config.token, config.prefix);
