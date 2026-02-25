import axios from "axios";
import { API_URL, unwrap } from "./base";
import { TokenUtils } from "../src/utils/tokenUtils";

/**
 * Okestra API calls use a plain axios instance (no interceptor) so that
 * backend failures never trigger the global token-refresh → logout flow.
 * The OkestraPanel has its own 3-tier fallback (backend → direct LLM → local heuristics).
 */
const okestraFetch = () => {
  const token = TokenUtils.getAccessToken();
  return axios.create({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });
};

export const GetAIInsights = async (contentType: 'topic' | 'nook', contentId: string) => {
  const res = await okestraFetch().get(`${API_URL}/okestra/insights/${contentType}/${contentId}`);
  return unwrap(res);
};

export const GenerateAIInsights = async (contentType: 'topic' | 'nook', contentId: string) => {
  const res = await okestraFetch().post(`${API_URL}/okestra/insights/${contentType}/${contentId}/generate`);
  return unwrap(res);
};
