export interface AppDTO {
  id: string;
  name: string;
  sdkKey: string;
  environment: string;
  slowQueryThresholdMs: number;
  active: boolean;
  createdAt: string;
}

export interface QueryLogDTO {
  id: string;
  sqlText: string;
  sqlHash: string;
  durationMs: number;
  queryType: string;
  tableName: string;
  status: string;
  issueCount: number;
  capturedAt: string;
}

export interface QueryIssueDTO {
  id: string;
  issueType: string;
  severity: string;
  ruleSuggestion: string;
  aiSuggestion?: string;
  aiEnhanced: boolean;
  resolved: boolean;
  createdAt: string;
}

export interface ExecutionPlanDTO {
  id: string;
  planJson: string;
  scanType: string;
  rowsScanned: number;
  startupCost: number;
  totalCost: number;
  analyzedAt: string;
}

export interface QueryDetailDTO extends QueryLogDTO {
  executionPlan?: ExecutionPlanDTO;
  issues: QueryIssueDTO[];
}

export interface AnalyticsDTO {
  summary: {
    totalQueries: number;
    slowQueries: number;
    n1Detections: number;
    avgDurationMs: number;
    p95DurationMs: number;
  };
  dailyStats: {
    date: string;
    total: number;
    slow: number;
    avgMs: number;
  }[];
  topSlowQueries: QueryLogDTO[];
}

export interface N1PatternDTO {
  sqlHash: string;
  pattern: string;
  tableName?: string;
  occurrences: number;
}
