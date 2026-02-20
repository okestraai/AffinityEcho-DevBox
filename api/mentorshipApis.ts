// api/mentorshipApis.ts
import { getAuthInstance, API_URL, unwrap } from "./base";

export interface MentorProfilePayload {
  isWillingToMentor: boolean;
  mentorBio: string;
  expertise: string[];
  industries: string[];
  availability: string;
  mentoringStyle: string;
  languages: string[];
  careerLevel: string;
  location: string;
  affinityTags: string[];
  jobTitle: string;
  company: string;
  yearsExperience: number;
  bio: string;
}

export interface MenteeProfilePayload {
  topic: string;
  goals: string;
  availability: string;
  communicationMethod: string;
  urgency: "low" | "medium" | "high";
  jobTitle: string;
  company: string;
  yearsExperience: number;
  location: string;
  careerLevel: string;
  bio: string;
  menteeBio?: string;
  mentoredStyle?: string;
  menteeIndustries?: string[];
  menteeLanguages?: string[];
  interests?: string[];
  affinityTags?: string;
}

export interface DirectMentorshipRequestPayload {
  targetUserId: string;
  requestType: "mentor_request" | "mentee_request";
  message: string;
}

export interface ProfileRequirementResponse {
  hasProfile: boolean;
  profileType: "mentor" | "mentee" | null;
  missingFields: string[];
  canCreateRequest: boolean;
}

export interface ProfileExistsResponse {
  hasProfile: boolean;
  hasMentorProfile: boolean;
  hasMenteeProfile: boolean;
  isActiveMentor: boolean;
  isActiveMentee: boolean;
  profileId: string;
  profileType?: string;
  mentoringAs?: "mentor" | "mentee" | "both";
}

export interface MatchScoreRange {
  label: string;
  min: number;
  max: number;
}

export interface FilterOptions {
  careerLevels: string[];
  expertiseAreas: string[];
  industries: string[];
  affinityTags: string[];
  availabilityOptions: string[];
  communicationMethods: string[];
  languages: string[];
  matchScoreRanges: MatchScoreRange[];
}

export interface MentorProfileResponse {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  jobTitle: string;
  company: string;
  company_encrypted?: string;
  careerLevel: string;
  career_level_encrypted?: string;
  location?: string;
  expertise: string[];
  industries: string[];
  mentoringAs?: "mentor" | "mentee" | "both";
  availability: string;
  responseTime?: string;
  matchScore?: number;
  isAvailable: boolean;
  totalMentees?: number;
  yearsExperience?: number;
  affinityTags: string[];
  affinity_tags_encrypted?: string;
  mentorshipStyle?: string;
  languages?: string[];
}

export interface GetMentorsAndMenteesResponse {
  success: boolean;
  data: {
    profiles: MentorProfileResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DirectMentorshipRequest {
  id: string;
  requester_id: string;
  target_user_id: string;
  request_type: "mentor_request" | "mentee_request";
  message: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  requester?: {
    id: string;
    username: string;
    email: string;
    avatar: string;
    job_title: string;
    company_encrypted: string;
    location: string;
    years_experience: number;
    mentor_bio?: string;
    mentor_expertise?: string[];
    mentor_industries?: string[];
  };
  target_user?: {
    id: string;
    username: string;
    email: string;
    avatar: string;
    job_title: string;
    company_encrypted: string;
    location: string;
    years_experience: number;
    mentor_bio?: string;
    mentor_expertise?: string[];
    mentor_industries?: string[];
  };
}

// Create mentor profile
export const CreateMentorProfile = async (payload: MentorProfilePayload) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/mentorship-profiles/mentor/setup`,
    payload
  );
  return unwrap(res);
};

// Get my mentor profile
export const GetMyMentorProfile = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/mentorship-profiles/me`);
  return unwrap(res);
};



// Update my mentor profile
export const UpdateMyMentorProfile = async (payload: MentorProfilePayload) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(`${API_URL}/mentorship-profiles/mentor/update`, payload);
  return unwrap(res);
};

// Get mentor profile by user ID
export const GetMentorProfileByUserId = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/mentorship/profile/${userId}`);
  return unwrap(res);
};

// Check user profile requirement
export const CheckUserProfileRequirement =
  async (): Promise<ProfileRequirementResponse> => {
    const authFetch = getAuthInstance();
    const res = await authFetch.get(
      `${API_URL}/mentorship-profiles/check-requirement`
    );
    return unwrap(res);
  };

// Check if user has a mentorship profile
export const CheckUserProfileExist = async (): Promise<{
  data: ProfileExistsResponse;
}> => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/mentorship-profiles/check-exists`);
  return unwrap(res);
};


// Create mentee profile
export const CreateMenteeProfile = async (payload: MenteeProfilePayload) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/mentorship-profiles/mentee/setup`,
    payload
  );
  return unwrap(res);
};

export const GetMyMenteeProfile = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/mentorship-profiles/me`);
  return unwrap(res);
};

// Update mentee profile
export const UpdateMyMenteeProfile = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(
    `${API_URL}/mentorship-profiles/mentee/update`,
    payload
  );
  return unwrap(res);
};

// Send direct mentorship request
export const CreateDirectMentorShipRequest = async (
  payload: DirectMentorshipRequestPayload
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/mentorship/requests/direct`,
    payload
  );
  return unwrap(res);
};

// Get all mentorship requests
export const GetAllMentorshipRequests = async (
  status: string,
  type: string
) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  queryParams.append("status", status);
  queryParams.append("type", type);

  const queryString = queryParams.toString();
  const res = await authFetch.get(
    `${API_URL}/mentorship/requests${queryString ? `?${queryString}` : ""}`
  );
  return unwrap(res);
};

// Get received mentorship requests
export const GetReceivedDirectMentorshipRequests = async (status: string) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  queryParams.append("status", status);

  const queryString = queryParams.toString();
  const res = await authFetch.get(
    `${API_URL}/mentorship/requests/direct/received${
      queryString ? `?${queryString}` : ""
    }`
  );
  return unwrap(res);
};

// Get sent mentorship requests
export const GetSentDirectMentorshipRequests = async (status: string) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  queryParams.append("status", status);

  const queryString = queryParams.toString();
  const res = await authFetch.get(
    `${API_URL}/mentorship/requests/direct/sent${
      queryString ? `?${queryString}` : ""
    }`
  );
  return unwrap(res);
};

// Get mentorship request by ID
export const GetMentorshipRequestById = async (requestId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/mentorship/requests/${requestId}`
  );
  return unwrap(res);
};
export const CheckMentorshipRequestHasBeenSent = async (
  targetUserId: string,
  requestType: string
) => {
  const queryParams = new URLSearchParams();
  queryParams.append("requestType", requestType);

  const queryString = queryParams.toString();
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/mentorship/requests/direct/check/${targetUserId}${
      queryString ? `?${queryString}` : ""
    }`
  );
  return unwrap(res);
};
export const GetMentorshipMetric = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/mentorship/requests/direct/metrics`
  );
  return unwrap(res);
};

// Update mentorship request
export const UpdateMentorshipDirectRequestToRead = async (type: string) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  queryParams.append("type", type);

  const queryString = queryParams.toString();
  const res = await authFetch.post(
    `${API_URL}/mentorship/requests/direct/read-all${
      queryString ? `?${queryString}` : ""
    }`
  );
  return unwrap(res);
};
export const UpdateMentorshipRequestById = async (
  requestId: string,
  payload: any
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(
    `${API_URL}/mentorship/requests/${requestId}`,
    payload
  );
  return unwrap(res);
};

// Respond to mentorship request
export const RespondToDirectMentorshipRequest = async (
  requestId: string,
  data: any
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/mentorship/requests/direct/${requestId}/respond`,
    data
  );
  return unwrap(res);
};

export const DeleteDirectMentorshipRequest = async (requestId: string) => {
  try {
    const authFetch = getAuthInstance();
    const res = await authFetch.delete(
      `/mentorship/requests/direct/${requestId}`
    );
    return unwrap(res);
  } catch (error) {
    console.error("Error deleting direct request:", error);
    throw error;
  }
};

// Get mentors and mentees with filters
export const GetMentorsAndMentees = async (
  filters: {
    viewMode?: "mentors" | "mentees" | "all";
    search?: string;
    careerLevel?: string[];
    expertise?: string[];
    industries?: string[];
    affinityTags?: string[];
    availability?: string | string[];
    location?: string;
    minMatchScore?: number;
    maxMatchScore?: number;
    sortBy?: "match_score" | "recent" | "experience" | "availability";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
  } = {}
): Promise<GetMentorsAndMenteesResponse> => {
  const authFetch = getAuthInstance();

  // Build query string from filters
  const queryParams = new URLSearchParams();

  // Add all filter parameters
  if (filters.viewMode) queryParams.append("viewMode", filters.viewMode);
  if (filters.search) queryParams.append("search", filters.search);

  // Array parameters (can have multiple values)
  if (filters.careerLevel && Array.isArray(filters.careerLevel)) {
    filters.careerLevel.forEach((level) => {
      queryParams.append("careerLevel", level);
    });
  }

  if (filters.expertise && Array.isArray(filters.expertise)) {
    filters.expertise.forEach((exp) => {
      queryParams.append("expertise", exp);
    });
  }

  if (filters.industries && Array.isArray(filters.industries)) {
    filters.industries.forEach((ind) => {
      queryParams.append("industries", ind);
    });
  }

  if (filters.affinityTags && Array.isArray(filters.affinityTags)) {
    filters.affinityTags.forEach((tag) => {
      queryParams.append("affinityTags", tag);
    });
  }

  if (filters.availability) {
    if (Array.isArray(filters.availability)) {
      filters.availability.forEach((a) => queryParams.append("availability", a));
    } else {
      queryParams.append("availability", filters.availability);
    }
  }
  if (filters.location) queryParams.append("location", filters.location);
  if (filters.minMatchScore !== undefined) queryParams.append("minMatchScore", String(filters.minMatchScore));
  if (filters.maxMatchScore !== undefined) queryParams.append("maxMatchScore", String(filters.maxMatchScore));
  if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
  if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder);

  // Page and limit with defaults
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());

  const queryString = queryParams.toString();
  const url = `${API_URL}/mentorship/discover${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await authFetch.get(url);
  return unwrap(res);
};

// Get AI suggestions for mentors/mentees
export const GetMentorsAndMenteesBySuggestionAI = async (
  filters: {
    type?: "mentors" | "mentees";
    limit?: number;
  } = {}
) => {
  const authFetch = getAuthInstance();

  const queryParams = new URLSearchParams();
  if (filters.type) queryParams.append("type", filters.type);
  const limit = filters.limit || 8;
  queryParams.append("limit", limit.toString());

  const queryString = queryParams.toString();
  const url = `${API_URL}/mentorship/discover/suggestions${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await authFetch.get(url);
  return unwrap(res);
};

// Get filter options
export const GetFilterOptions = async (): Promise<{ data: FilterOptions }> => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/mentorship/discover/filters/options`
  );
  return unwrap(res);
};

// Follow user
export const FollowUser = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/mentorship/follow/${userId}`);
  return unwrap(res);
};

// Unfollow user
export const UnfollowUser = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/mentorship/follow/${userId}`);
  return unwrap(res);
};

// Get follow status
export const GetFollowStatus = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/mentorship/follow/${userId}/status`
  );
  return unwrap(res);
};

// Get followers list
export const GetFollowers = async (params: { page?: number; limit?: number } = {}) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));
  const qs = queryParams.toString();
  const res = await authFetch.get(`${API_URL}/mentorship/follow/followers${qs ? `?${qs}` : ""}`);
  return unwrap(res);
};

// Get following list
export const GetFollowing = async (params: { type?: string; page?: number; limit?: number } = {}) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append("type", params.type);
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));
  const qs = queryParams.toString();
  const res = await authFetch.get(`${API_URL}/mentorship/follow/following${qs ? `?${qs}` : ""}`);
  return unwrap(res);
};



export const GetMyMentors = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/mentorship/requests/my-mentors`);
  return unwrap(res);
};

export const GetMyMentees = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/mentorship/requests/my-mentees`);
  return unwrap(res);
};


export const GeAllRequests = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/mentorship/requests/direct/all`);
  return unwrap(res);
};
