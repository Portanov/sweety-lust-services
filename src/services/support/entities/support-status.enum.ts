export enum SupportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  CLOSED = 'closed',
}

export enum Action {
  UPDATE = 'update',
  CREATE = 'create',
}

export interface SupportFilters {
  search?: string;
  status?: SupportStatus;
}
