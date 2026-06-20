export const documentKinds = ['NOTE', 'PDF', 'TICKET', 'CONTRACT', 'TRANSCRIPT'] as const;
export type DocumentKind = (typeof documentKinds)[number];

export const jobTypes = ['SUMMARIZE', 'CLASSIFY', 'EXTRACT'] as const;
export type JobType = (typeof jobTypes)[number];

export const jobStatuses = ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;
export type JobStatus = (typeof jobStatuses)[number];
