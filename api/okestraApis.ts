import { API_URL, getAuthInstance, unwrap } from "./base";

export const GetAIInsights = async (contentType: 'topic' | 'nook', contentId: string) => {
  const res = await getAuthInstance().get(`${API_URL}/okestra/insights/${contentType}/${contentId}`);
  return unwrap(res);
};

export const GenerateAIInsights = async (contentType: 'topic' | 'nook', contentId: string) => {
  const res = await getAuthInstance().post(`${API_URL}/okestra/insights/${contentType}/${contentId}/generate`);
  return unwrap(res);
};
