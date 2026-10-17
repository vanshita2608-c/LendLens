/**
 * LendLens Typed Frontend API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch from ${endpoint}:`, error);
    throw error;
  }
}

// 1. Dashboard
export async function getDashboardSummary(params?: {
  channel?: string;
  segment?: string;
  startDate?: string;
  endDate?: string;
}) {
  const q = new URLSearchParams();
  if (params?.channel && params.channel !== 'All') q.set('channel', params.channel);
  if (params?.segment && params.segment !== 'All') q.set('segment', params.segment);
  if (params?.startDate) q.set('start_date', params.startDate);
  if (params?.endDate) q.set('end_date', params.endDate);
  
  return fetchApi<any>(`/api/dashboard/summary?${q.toString()}`);
}

export async function getDashboardTrends() {
  return fetchApi<any[]>('/api/dashboard/trends');
}

// 2. Funnel
export async function getFunnelOverview(params?: {
  channel?: string;
  segment?: string;
}) {
  const q = new URLSearchParams();
  if (params?.channel && params.channel !== 'All') q.set('channel', params.channel);
  if (params?.segment && params.segment !== 'All') q.set('segment', params.segment);
  return fetchApi<any>(`/api/funnel/overview?${q.toString()}`);
}

export async function getFunnelDropoffs(stage?: string) {
  const q = stage ? `?stage=${stage}` : '';
  return fetchApi<any[]>(`/api/funnel/dropoffs${q}`);
}

export async function getStageTiming() {
  return fetchApi<any[]>('/api/funnel/stage-timing');
}

export async function getChannelPerformance() {
  return fetchApi<any[]>('/api/funnel/channels');
}

export async function getSegmentPerformance() {
  return fetchApi<any[]>('/api/funnel/segments');
}

// 3. Portfolio
export async function getPortfolioSummary() {
  return fetchApi<any>('/api/portfolio/summary');
}

export async function getVintageAnalysis() {
  return fetchApi<any[]>('/api/portfolio/vintages');
}

export async function getDelinquencyBuckets() {
  return fetchApi<any>('/api/portfolio/delinquency');
}
