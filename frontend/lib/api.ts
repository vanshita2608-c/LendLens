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

// 4. Credit Intelligence
export async function getCreditModelMetrics() {
  return fetchApi<any>('/api/credit/model-metrics');
}

export async function predictCreditRisk(payload: {
  monthly_income: number;
  credit_score: number;
  debt_to_income_ratio: number;
  requested_amount: number;
  requested_tenure_months: number;
  customer_segment: string;
  acquisition_channel: string;
}) {
  return fetchApi<any>('/api/credit/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 5. Strategy Lab & Scenarios
export async function simulateScenario(payload: any) {
  return fetchApi<any>('/api/scenarios/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getScenarios(scenario_type?: string) {
  const q = scenario_type ? `?scenario_type=${scenario_type}` : '';
  return fetchApi<any[]>(`/api/scenarios${q}`);
}

export async function getScenario(scenarioId: number) {
  return fetchApi<any>(`/api/scenarios/${scenarioId}`);
}

export async function createScenario(payload: {
  scenario_name: string;
  description?: string;
  scenario_type: string;
  assumptions: any;
}) {
  return fetchApi<any>('/api/scenarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateScenario(scenarioId: number, payload: {
  scenario_name?: string;
  description?: string;
  assumptions?: any;
}) {
  return fetchApi<any>(`/api/scenarios/${scenarioId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteScenario(scenarioId: number) {
  return fetchApi<any>(`/api/scenarios/${scenarioId}`, {
    method: 'DELETE',
  });
}

export async function compareScenarios(scenarioIds: number[]) {
  return fetchApi<any>('/api/scenarios/compare', {
    method: 'POST',
    body: JSON.stringify({ scenario_ids: scenarioIds }),
  });
}
