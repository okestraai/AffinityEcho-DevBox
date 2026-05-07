import { getAuthInstance, API_URL, unwrap } from './base';

/**
 * Flag content for review
 */
export const FlagContent = async (
  type: string,
  id: string,
  reason: string,
  description?: string
) => {
  const authFetch = await getAuthInstance();
  const res = await authFetch.post(`${API_URL}/content/${type}/${id}/flag`, {
    reason,
    ...(description && { description }),
  });
  return unwrap(res);
};

/**
 * Hide content from your view (user-level, not admin)
 */
export const HideContent = async (type: string, id: string) => {
  const authFetch = await getAuthInstance();
  const res = await authFetch.post(`${API_URL}/content/${type}/${id}/hide`);
  return unwrap(res);
};
