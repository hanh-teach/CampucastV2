import { SessionSnapshot } from './SessionTypes';

export class SessionSerializer {
  static serialize(snapshot: SessionSnapshot): string {
    return JSON.stringify(snapshot);
  }

  static deserialize(data: string): SessionSnapshot {
    return JSON.parse(data);
  }
}
