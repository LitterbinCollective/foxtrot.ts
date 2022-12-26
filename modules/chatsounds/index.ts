import Sh, { defaultModifiers } from 'sh';

import shConfig from '@/configs/shat.json';

const sh = new Sh();
sh.useModifiers(defaultModifiers);

export async function getRepositories() {
  let merge = false;

  for (const configKey in shConfig) {
    const config = shConfig[configKey as keyof typeof shConfig];
    const [ repository, branch ] = configKey.split('#');
    for (const base of config.bases)
      if (config.useMsgPack)
        merge = await sh.useSourcesFromGitHubMsgPack(repository, branch, base) || merge
      else
        merge = await sh.useSourcesFromGitHub(repository, branch, base) || merge;
  }

  if (merge)
    sh.mergeSources();
}

getRepositories();

export const interval = setInterval(getRepositories, 60 * 60 * 1000);
export default sh;