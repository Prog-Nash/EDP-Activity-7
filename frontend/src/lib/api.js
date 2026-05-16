function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function getApiBaseUrl() {
  const configuredBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (import.meta.env.DEV) {
    return '';
  }

  return 'http://localhost:5000';
}

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${normalizedPath}`;
}

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { error: text } : null;
}

export async function apiFetch(path, options = {}) {
  let response;

  try {
    response = await fetch(buildApiUrl(path), options);
  } catch {
    throw new Error('Unable to reach the backend server. Make sure the backend is running on http://localhost:5000.');
  }

  const data = await readResponseBody(response);

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return data;
}
