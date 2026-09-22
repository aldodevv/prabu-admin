/**
 * Axiom Client Logging Utility for prabu-dashboard
 * Sends structured events & errors directly to Axiom Cloud
 */

export interface AxiomLogEvent {
  _time?: string;
  level?: 'info' | 'warn' | 'error';
  message: string;
  action?: string;
  user_id?: string;
  username?: string;
  role?: string;
  branch_id?: string;
  path?: string;
  error?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

const getAxiomConfig = () => {
  const token = process.env.NEXT_PUBLIC_AXIOM_TOKEN || '';
  const dataset = process.env.NEXT_PUBLIC_AXIOM_DATASET || 'prabu-dashboard';
  const url =
    process.env.NEXT_PUBLIC_AXIOM_URL ||
    `https://api.axiom.co/v1/datasets/${dataset}/ingest`;

  return { token, dataset, url };
};

/**
 * Ingest a structured event to Axiom
 */
export async function logToAxiom(event: AxiomLogEvent): Promise<void> {
  const { token, url } = getAxiomConfig();

  const payload = {
    _time: event._time || new Date().toISOString(),
    service: 'prabu-dashboard',
    level: event.level || 'info',
    ...event,
  };

  // If no token is provided, log cleanly to dev console
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Axiom Dev Fallback]:', payload);
    }
    return;
  }

  try {
    // Fire and forget fetch request
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([payload]),
      keepalive: true,
    });
  } catch (err) {
    // Silently handle network errors to not disrupt UI
    console.warn('Axiom log delivery failed:', err);
  }
}

/**
 * Helper to log exceptions and errors to Axiom
 */
export function logAxiomError(
  error: unknown,
  context?: { action?: string; metadata?: Record<string, unknown> }
): void {
  const errorMessage =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  logToAxiom({
    level: 'error',
    message: errorMessage,
    action: context?.action || 'error_caught',
    error: errorMessage,
    stack: errorStack,
    metadata: context?.metadata,
  });
}
