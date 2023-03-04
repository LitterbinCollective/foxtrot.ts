import Sh, { defaultModifiers } from 'sh';

import shConfig from '@/configs/shat.json';

const sh = new Sh({
  gitHubToken: shConfig.gitHubToken,
  modifiers: defaultModifiers
});

export async function getRepositories() {
  let merge = false;

  for (const configKey in shConfig.sources) {
    const config = shConfig.sources[configKey as keyof typeof shConfig.sources];
    const [repository, branch] = configKey.split('#');
    for (const base of config.bases)
      if (config.useMsgPack)
        merge =
          (await sh.useSourcesFromGitHubMsgPack(repository, branch, base)) ||
          merge;
      else
        merge =
          (await sh.useSourcesFromGitHub(repository, branch, base)) || merge;
  }

  if (merge) sh.mergeSources();
}

getRepositories();

export const interval = setInterval(getRepositories, 60 * 60 * 1000);
export default sh;
