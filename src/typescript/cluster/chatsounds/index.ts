import Sh, { defaultModifiers } from 'sh';

import config from '@/managers/config';

const sh = new Sh({
  gitHubToken: config.shat.gitHubToken,
  modifiers: defaultModifiers,
});

export async function getRepositories() {
  let merge = false;

  for (const configKey in config.shat.sources) {
    const sourceConfig = config.shat.sources[configKey as keyof typeof config.shat.sources];
    const [repository, branch] = configKey.split('#');
    for (const base of sourceConfig.bases) {
      try {
        if (sourceConfig.useMsgPack)
          merge =
            (await sh.useSourcesFromGitHubMsgPack(repository, branch, base)) ||
            merge;
        else
          merge =
            (await sh.useSourcesFromGitHub(repository, branch, base)) || merge;
      } catch (err) {}
    }
  }

  if (merge) sh.mergeSources();
}

getRepositories();

export const interval = setInterval(getRepositories, 60 * 60 * 1000);
export default sh;
