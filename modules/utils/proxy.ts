import axios from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';

import config from '@/configs/app.json';

let httpsAgent: HttpsProxyAgent.HttpsProxyAgent | undefined;

if (config.proxy.length !== 0)
  httpsAgent = HttpsProxyAgent(config.proxy);

export default axios.create({
  httpsAgent
});