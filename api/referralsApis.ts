import axiosInstance from "../src/Helper/AxiosInterceptor";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthInstance = () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  return axiosInstance(accessToken, refreshToken);
};

export const fetchReferrals = async (
  filters: {
    type?: "request" | "offer" | "all";
    status?: "open" | "closed" | "all";
    scope?: "global" | "closed" | "all";
    search?: string;
    sortBy?: "recent" | "popular" | "relevant";
    offset?: number;
    limit?: number;
  } = {}
) => {
  const authFetch = getAuthInstance();
  // Build query string from filters
  const queryParams = new URLSearchParams();
  if (filters.type) queryParams.append("type", filters.type);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.scope) queryParams.append("scope", filters.scope);
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);

  const offset = filters.offset || 0;
  const limit = filters.limit || 20;
  queryParams.append("offset", offset.toString());
  queryParams.append("limit", limit.toString());

  const queryString = queryParams.toString();
  const url = `${API_URL}/referrals${queryString ? `?${queryString}` : ""}`;

  const res = await authFetch.get(url);

  return res.data;
};
// this is the response structured

//   "success": true,
//   "data": [
//     {
//       "id": "uuid-string",
//       "userId": "uuid-string",
//       "type": "request",
//       "title": "Looking for Software Engineer referral at Google",
//       "company": "Google",
//       "jobTitle": "Senior Software Engineer",
//       "jobLink": "https://careers.google.com/jobs/123",
//       "description": "Experienced full-stack developer...",
//       "scope": "global",
//       "status": "open",
//       "availableSlots": null,
//       "totalSlots": null,
//       "tags": [
//         "software-engineering",
//         "react"
//       ],
//       "requiredSkills": [
//         "JavaScript",
//         "React"
//       ],
//       "preferredExperience": "5+ years",
//       "viewsCount": 45,
//       "likesCount": 12,
//       "commentsCount": 8,
//       "bookmarksCount": 6,
//       "connectionRequestsCount": 3,
//       "createdAt": "2024-01-01T00:00:00Z",
//       "updatedAt": "2024-01-01T00:00:00Z",
//       "lastActivityAt": "2024-01-01T12:00:00Z",
//       "expiresAt": null,
//       "author": {
//         "id": "uuid-string",
//         "username": "TechSeeker2024",
//         "avatar": "🚀",
//         "jobTitle": "Software Engineer",
//         "company": "Tech Corp",
//         "bio": "Passionate developer...",
//         "skills": [
//           "React",
//           "Node.js"
//         ],
//         "yearsExperience": 5
//       },
//       "isLiked": false,
//       "isBookmarked": false
//     }
//   ],
//   "pagination": {
//     "total": 150,
//     "limit": 50,
//     "offset": 0,
//     "hasMore": true
//   }
// }

export const CreateReferrals = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/referrals`, payload);
  return res.data;
};
// this is the payload structured
// {
//   "type": "request",
//   "title": "Looking for Software Engineer referral at Google",
//   "company": "Google",
//   "jobTitle": "Senior Software Engineer",
//   "jobLink": "https://careers.google.com/jobs/123",
//   "description": "Experienced full-stack developer...",
//   "scope": "global",
//   "availableSlots": 3,
//   "totalSlots": 5,
//   "tags": [
//     "software-engineering",
//     "react"
//   ],
//   "requiredSkills": [
//     "JavaScript",
//     "React",
//     "Node.js"
//   ],
//   "preferredExperience": "5+ years experience",
//   "affinityGroups": [
//     "group1",
//     "group2"
//   ]
// }

export const SearchReferrals = async (
  q: string,
  filters: {
    type?: "request" | "offer" | "all";
    companies?: string;
    tags?: string;
    skills?: string;
  } = {}
) => {
  const authFetch = getAuthInstance();
  // Build query string from filters
  const queryParams = new URLSearchParams();
  if (filters.type) queryParams.append("type", filters.type);
  if (filters.companies) queryParams.append("companies", filters.companies);
  if (filters.tags) queryParams.append("tags", filters.tags);
  if (filters.skills) queryParams.append("skills", filters.skills);
  const queryString = queryParams.toString();
  const url = `${API_URL}/referrals/search${encodeURIComponent(q)}${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await authFetch.get(url);

  return res.data;
};
// this is the res strusture
// {
//   "success": true,
//   "data": [
//     {
//       "id": "uuid-string",
//       "type": "request",
//       "title": "Looking for Software Engineer referral",
//       "company": "Google",
//       "jobTitle": "Senior Software Engineer",
//       "description": "Experienced developer...",
//       "scope": "global",
//       "status": "open",
//       "tags": [
//         "software-engineering",
//         "react"
//       ],
//       "viewsCount": 45,
//       "likesCount": 12,
//       "author": {
//         "id": "uuid-string",
//         "username": "TechSeeker2024",
//         "avatar": "🚀"
//       },
//       "isLiked": false,
//       "isBookmarked": false
//     }
//   ],
//   "total": 15
// }

export const GetReferralStats = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/referrals/stats`);
  return res.data;
};

// this is the res structure
// {
//   "success": true,
//   "data": {
//     "global": {
//       "totalPosts": 150,
//       "openRequests": 45,
//       "openOffers": 32,
//       "totalCompanies": 67,
//       "totalViews": 4523,
//       "totalConnections": 89,
//       "acceptedConnections": 45,
//       "successfulReferrals": 23,
//       "interviewsScheduled": 15,
//       "offersReceived": 8,
//       "successRate": "25.8"
//     },
//     "user": {
//       "postsCreated": 5,
//       "openPosts": 3,
//       "connectionsSent": 8,
//       "connectionsReceived": 12,
//       "acceptedConnections": 10,
//       "pendingConnections": 6,
//       "likes": 23,
//       "bookmarks": 15,
//       "comments": 18,
//       "successRate": "50.0",
//       "responseRate": "83.3"
//     },
//     "breakdown": {
//       "connectionsByStatus": {
//         "sent": {
//           "pending": 3,
//           "accepted": 4,
//           "rejected": 1
//         },
//         "received": {
//           "pending": 3,
//           "accepted": 6,
//           "rejected": 3
//         }
//       },
//       "postsByType": {
//         "requests": 3,
//         "offers": 2
//       }
//     }
//   }
// }
export const GetUsersReferralsActivity = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/referrals/my-activity`);
  return res.data;
};

// the structuredClone
// {
//   "success": true,
//   "data": {
//     "posts": [
//       {
//         "id": "uuid-string",
//         "type": "request",
//         "title": "Looking for referral...",
//         "company": "Google",
//         "status": "open",
//         "viewsCount": 45,
//         "likesCount": 12,
//         "commentsCount": 8,
//         "connectionRequestsCount": 5,
//         "createdAt": "2024-01-01T00:00:00Z"
//       }
//     ],
//     "connections": {
//       "sent": [],
//       "received": [],
//       "total": 20,
//       "pending": 6,
//       "accepted": 10
//     },
//     "engagement": {
//       "likes": 23,
//       "bookmarks": 15,
//       "comments": 18,
//       "total": 56
//     },
//     "recentActivity": [
//       {
//         "type": "connection_received",
//         "timestamp": "2024-01-15T10:30:00Z",
//         "data": {
//           "connectionId": "uuid-string",
//           "status": "pending"
//         }
//       }
//     ],
//     "activityStats": {
//       "postsThisMonth": 3,
//       "connectionsThisMonth": 5,
//       "engagementThisMonth": 12
//     },
//     "summary": {
//       "totalPosts": 5,
//       "activePosts": 3,
//       "totalConnections": 20,
//       "totalEngagements": 56,
//       "totalViews": 234,
//       "totalLikesReceived": 67
//     }
//   }
// }

export const GetUsersLikedReferrals = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/referrals/liked`);
  return res.data;
};
// the Response

// {
//   "success": true,
//   "data": [
//     {
//       "referral_post_id": "uuid-string",
//       "created_at": "2024-01-01T00:00:00Z"
//     }
//   ]
// }
export const GetUsersBookmarkedReferrals = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/referrals/bookmarked`);
  return res.data;
};
export const GetSingleReferralDetails = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/referrals/${id}`);
  return res.data;
};
// the structure
// {
//   "success": true,
//   "data": {
//     "id": "uuid-string",
//     "userId": "uuid-string",
//     "type": "offer",
//     "title": "Can refer for Microsoft roles",
//     "company": "Microsoft",
//     "jobTitle": null,
//     "jobLink": null,
//     "description": "Senior PM at Microsoft...",
//     "scope": "global",
//     "status": "open",
//     "availableSlots": 2,
//     "totalSlots": 5,
//     "tags": [
//       "microsoft",
//       "product-manager"
//     ],
//     "requiredSkills": [
//       "Product Management"
//     ],
//     "viewsCount": 89,
//     "likesCount": 24,
//     "commentsCount": 15,
//     "bookmarksCount": 18,
//     "connectionRequestsCount": 8,
//     "createdAt": "2024-01-01T00:00:00Z",
//     "author": {
//       "id": "uuid-string",
//       "username": "MSFTInsider",
//       "avatar": "💼",
//       "jobTitle": "Senior PM",
//       "company": "Microsoft"
//     },
//     "isLiked": false,
//     "isBookmarked": true
//   }
// }
export const UpdateSingleReferralDetails = async (id: string, payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/referrals/${id}`, payload);
  return res.data;
};

// the res structure
// {
//   "success": true,
//   "data": {
//     "id": "uuid-string",
//     "updatedAt": "2024-01-02T00:00:00Z"
//   },
//   "message": "Referral updated successfully"
// }
export const DeleteSingleReferralPost = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/referrals/${id}`);
  return res.data;
};
export const IncrementViewCount = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/referrals/${id}/view`);
  return res.data;
};
export const LikeReferral = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/referrals/${id}/like`);
  return res.data;
};
export const UnLikeReferral = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/referrals/${id}/like`);
  return res.data;
};

export const BookmarkReferral = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/referrals/${id}/bookmark`);
  return res.data;
};
export const UnBookmarkReferral = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/referrals/${id}/bookmark`);
  return res.data;
};
export const CreateReferralComment = async (id: string, payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/referrals/${id}/comments`,
    payload
  );
  return res.data;
};
// the payload
// {
//   "content": "This looks like a great opportunity!"
// }
export const GetReferralComments = async (
  id: string,
  filters: {
    offset?: number;
    limit?: number;
  } = {}
) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  const offset = filters.offset || 1;
  const limit = filters.limit || 20;
  queryParams.append("offset", offset.toString());
  queryParams.append("limit", limit.toString());

  const queryString = queryParams.toString();
  const res = await authFetch.get(`${API_URL}/referrals/${id}/comments${
    queryString ? `?${queryString}` : ""
  }`);
  return res.data;
};

// the res structuredClone
// {
//   "success": true,
//   "data": [
//     {
//       "id": "uuid-string",
//       "referral_post_id": "uuid-string",
//       "user_id": "uuid-string",
//       "content": "Great opportunity!",
//       "created_at": "2024-01-01T00:00:00Z",
//       "updated_at": "2024-01-01T00:00:00Z",
//       "author": {
//         "id": "uuid-string",
//         "username": "Commenter123",
//         "avatar": "👤"
//       }
//     }
//   ],
//   "pagination": {
//     "total": 8,
//     "limit": 50,
//     "offset": 0
//   }
// }

export const UpdateReferralComment = async (
  commentId: string,
  payload: any
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(
    `${API_URL}/referrals/comments/${commentId}`,
    payload
  );
  return res.data;
};
// the payload
// {
//   "content": "This looks like a great opportunity!"
// }
export const DeleteReferralComment = async (commentId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(
    `${API_URL}/referrals/comments/${commentId}`
  );
  return res.data;
};

export const GetAllUserConnection = async (
  filters: {
    type?: "sent" | "received" | "all";
    status?: "pending" | "accepted" | "rejected" | "all";
  } = {}
) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();

  if (filters.type) queryParams.append("type", filters.type);
  if (filters.status) queryParams.append("status", filters.status);

  const queryString = queryParams.toString();
  const url = `${API_URL}/referrals/connections${
    queryString ? `?${queryString}` : ""
  }`;
  const res = await authFetch.get(url);
  return res.data;
};
export const GetSingleUserConnection = async (connectionId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/referrals/connections/${connectionId}`
  );
  return res.data;
};

export const SendConnectionRequest = async (
  referralId: string,
  payload: any
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/referrals/${referralId}/connect`,
    payload
  );
  return res.data;
};
// the payload
// {
//   "message": "This looks like a great opportunity!"
// }
export const AcceptConnectionRequest = async (connectionId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/referrals/connections/${connectionId}/accept`
  );
  return res.data;
};

export const RejectConnectionRequest = async (connectionId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/referrals/connections/${connectionId}/reject`
  );
  return res.data;
};

export const GetAllIdentityRevealRequests = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/referrals/identity-reveals`);
  return res.data;
};
export const SendIdentityRevealRequest = async (
  connectionId: string,
  payload: any
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/referrals/connections/${connectionId}/reveal-identity`,
    payload
  );
  return res.data;
};
// the payload
// {
//   "message": "This looks like a great opportunity!"
// }

export const AcceptIdentityRevealRequest = async (revealRequestId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/referrals/identity-reveals/${revealRequestId}/accept`
  );
  return res.data;
};

export const RejectIdentityRevealRequest = async (revealRequestId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/referrals/identity-reveals/${revealRequestId}/reject`
  );
  return res.data;
};
