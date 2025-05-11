import { IntegrityTokenData } from 'bgutils-js';
import { Worker } from 'worker_threads';

import { AbstractActivity } from '@/managers/activity';
import com from '@/com';

export interface WorkerData {
  visitorData: string;
  poToken: string;
  integrityTokenData: IntegrityTokenData;
}

export default class YouTubeActivity extends AbstractActivity {
  public ms = 60000 * 10;
  public instant = true;

  public async run() {
    const worker = new Worker(__filename.replace(/youtube\.js$/, 'ytworker.js'));

    const message = await new Promise<WorkerData>((resolve, reject) => {
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', code => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });

    com.data._youtube = message;
    com.data._youtubeDirty = true;
  }
}