import { auth } from '../../app/firebase.js';

async function requestProfilePresets(options = {}) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in again before managing profile presets.');
  const response = await fetch('/api/profile-presets', {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Profile presets could not be loaded.');
  return result;
}

export const listProfilePresets = () => requestProfilePresets();
export const changeProfilePreset = (action, values = {}) => requestProfilePresets({ method: 'POST', body: JSON.stringify({ action, ...values }) });
