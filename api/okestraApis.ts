import { getAuthInstance, API_URL, unwrap } from "./base";

export const GetAIInsights = async (contentType: 'topic' | 'nook', contentId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/okestra/insights/${contentType}/${contentId}`);
  return unwrap(res);
};

export const GenerateAIInsights = async (contentType: 'topic' | 'nook', contentId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/okestra/insights/${contentType}/${contentId}/generate`);
  return unwrap(res);
};
