export interface GAMetrics {
  sessions: number;
  activeUsers: number;
  newUsers: number;
  eventCount: number;
  conversions: number;
}

export interface PageData {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  activeUsers: number;
  avgSessionDuration: number;
}

export interface SCOverview {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface QueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface TimeSeriesPoint {
  date: string;
  sessions: number;
  activeUsers: number;
}

export interface GA4PropertySummary {
  property: string;       // "properties/12345"
  displayName: string;
}

export interface GA4AccountSummary {
  account: string;
  displayName: string;
  propertySummaries: GA4PropertySummary[];
}

export interface SCSite {
  siteUrl: string;
  permissionLevel: string;
}

export type DatePreset = '7' | '28' | '90';
