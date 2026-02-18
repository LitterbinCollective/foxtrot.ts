import { Worker } from 'worker_threads';

import { AbstractActivity } from '@/managers/activity';
import com from '@/com';

export interface WorkerData {
  secret: string;
  obj: { secret: string; version: number; };
  version: number;
  transformedSecret: string;
}

export default class SpotifyActivity extends AbstractActivity {
  public ms = 60000 * 10;
  public instant = true;

  public async run() {
    const worker = new Worker(__filename.replace(/spotify\.js$/, 'spotify_worker.js'));

    const message = await new Promise<WorkerData>((resolve, reject) => {
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', code => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });

    com.data._spotify = message;
    com.data._spotifyDirty = true;
  }
}