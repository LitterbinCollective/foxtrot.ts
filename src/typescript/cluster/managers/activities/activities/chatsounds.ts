import { AbstractActivity } from '@/managers/activity';
import { getRepositories } from '@/cluster/chatsounds';

export default class ChatsoundsActivity extends AbstractActivity {
  public ms = 60 * 60 * 1000;
  public instant = true;

  public run() {
    getRepositories();
  }
}