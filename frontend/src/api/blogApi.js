
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASE_URL = `${BACKEND_URL.replace(/\/+$/, '')}/api/v1/blog`;

export const startBlogGeneration = async (topic, audience, style = 'intuitive') => {
  const response = await fetch(`${API_BASE_URL}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, audience, style }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to start blog generation: ${response.statusText}`);
  }
  return response.json();
};

export const resumeBlogWorkflow = async (threadId, action, feedback = '') => {
  const response = await fetch(`${API_BASE_URL}/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      thread_id: threadId,
      action,
      feedback,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to resume workflow: ${response.statusText}`);
  }
  return response.json();
};

export const getBlogState = async (threadId) => {
  const response = await fetch(`${API_BASE_URL}/${threadId}/state`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch state: ${response.statusText}`);
  }
  return response.json();
};
