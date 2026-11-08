import { AbstractActivity } from '@/managers/activity';
import cookie from '@/managers/cookie';

export default class CookieActivity extends AbstractActivity {
  public ms = 30000;
  public instant = true;

  public run() {
    cookie.save();
  }
}