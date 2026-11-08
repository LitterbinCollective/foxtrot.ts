import { join } from 'path';
import ActivityManager from '@/managers/activity';

export default new ActivityManager(join(__dirname, 'activities'));