import { AbstractActivity } from '@/managers/activity';
import special from '@cluster/managers/special';

export default class SpecialActivity extends AbstractActivity {
  public ms = 60000;
  public instant = true;

  public run() {
    special.checkDate();
  }
}