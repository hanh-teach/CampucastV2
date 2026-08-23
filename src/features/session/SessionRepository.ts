import { SessionSnapshot } from './SessionTypes';
import { SessionSerializer } from './SessionSerializer';

export class SessionRepository {
  private static STORAGE_KEY = 'commutecast_session_snapshot';

  static save(snapshot: SessionSnapshot): void {
    const data = SessionSerializer.serialize(snapshot);
    localStorage.setItem(this.STORAGE_KEY, data);
  }

  static load(): SessionSnapshot | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? SessionSerializer.deserialize(data) : null;
  }
}
