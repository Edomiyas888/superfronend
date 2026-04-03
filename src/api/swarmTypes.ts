export type SwarmEnvelope = {
  command: string;
  params?: Record<string, unknown>;
};

export type SwarmResponse<T = unknown> = {
  code?: number;
  data?: T;
  msg?: string;
};
