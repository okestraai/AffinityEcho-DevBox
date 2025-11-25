// src/api/authApis.ts
import axios from "axios";
import axiosInstance from "../src/Helper/AxiosInterceptor";

const API_URL = import.meta.env.VITE_API_URL;

// Public endpoints (no auth needed)
export const registerUser = async (payload: {
  email: string;
  password: string;
  username: string;
}) => {
  const res = await axios.post(`${API_URL}/auth/signup`, payload);
  return res.data;
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  const res = await axios.post(`${API_URL}/auth/login`, payload);
  return res.data;
};

export const SocialMediaLogin = async (provider: "google" | "facebook") => {
  const res = await axios.get(`${API_URL}/auth/login/${provider}`);
  return res.data;
};

export const ResetPassword = async (
  email: string,
  password: string,
  otp: string
) => {
  const res = await axios.post(`${API_URL}/auth/reset-password`, {
    email,
    password,
    otp,
  });
  return res.data;
};
export const ForgotPassword = async (email: string) => {
  const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  return res.data;
};

export const ResendOTP = async (email: string) => {
  const res = await axios.post(`${API_URL}/auth/otp/resend`, { email });
  return res.data;
};

export const VerifyOTP = async (email: string, token: string) => {
  const res = await axios.post(`${API_URL}/auth/otp/verify`, { email, token });
  return res.data;
};

// Authenticated endpoints (use interceptor)
const getAuthInstance = () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  return axiosInstance(accessToken, refreshToken);
};

export const GetCurrentUser = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/auth/me`);
  return res.data; // returns full user object
};

export const RefreshToken = async (refreshToken: string) => {
  const res = await axios.post(`${API_URL}/auth/refresh-token`, {
    refreshToken,
  });
  return res.data.data.access_token; // adjust based on actual response
};

export const LogoutUser = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/auth/logout`);
  return res.data;
};

export const UpdateOnboardingProfile = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(`${API_URL}/auth/profile`, payload);
  return res.data;
};

export const CreateOnboardingProfile = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/auth/onboarding/complete`,
    payload
  );
  return res.data;
};

export const ChangePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/auth/change-password`, payload);
  return res.data;
};

export const CheckOnboardingStatus = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/auth/onboarding/status`);
  return res.data;
};

// import axiosInstance from "../src/Helper/AxiosInterceptor";
// import axios from "axios";
// import {
//   ChangePasswordData,
//   CreateOnboardingData,
//   LoginFormData,
//   ResetPasswordData,
//   SignUpFormData,
//   UpdateOnboardingData,
// } from "../src/types/auth";

// const API_URL = `${import.meta.env.VITE_API_URL}`;

// console.log(API_URL)

// export const registerUser = async (payload: SignUpFormData) => {
//   const response = await axios.post(`${API_URL}/auth/signup`, payload);

//   return response.data;
// };

// // this is this endpoint Response
// // {
// //   "success": true,
// //   "data": {
// //     "message": "Registration successful! Please check your email for the verification code.",
// //     "userId": "1bd708fb-b5be-4188-8bcb-6cc407289f4e",
// //     "email": "adminokestra01@yopmail.com",
// //     "requiresOtpVerification": true,
// //     "profileCreated": true
// //   },
// //   "timestamp": "2025-11-19T10:45:13.800Z"
// // }

// export const loginUser = async (payload: LoginFormData) => {
//   const response = await axios.post(`${API_URL}/auth/login`, payload);

//   return response.data;
// };

// // this is the response
// // {
// //   "success": true,
// //   "data": {
// //     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxYmQ3MDhmYi1iNWJlLTQxODgtOGJjYi02Y2M0MDcyODlmNGUiLCJlbWFpbCI6ImFkbWlub2tlc3RyYTAxQHlvcG1haWwuY29tIiwiaWF0IjoxNzYzNTQ5MjIyLCJleHAiOjE3NjM1NTAxMjJ9.RVK4f_TZkJUouRnJ2Vge1avJ3-mRLrwiSDAyybMtJN8",
// //     "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxYmQ3MDhmYi1iNWJlLTQxODgtOGJjYi02Y2M0MDcyODlmNGUiLCJlbWFpbCI6ImFkbWlub2tlc3RyYTAxQHlvcG1haWwuY29tIiwiaWF0IjoxNzYzNTQ5MjIyLCJleHAiOjE3NjQxNTQwMjJ9.AmCn1YnTONlhZZ-tj08sI657NPmUqlSGbDHj5BKu6Sg",
// //     "token_type": "Bearer",
// //     "expires_in": 900,
// //     "user": {
// //       "id": "1bd708fb-b5be-4188-8bcb-6cc407289f4e",
// //       "email": "adminokestra01@yopmail.com"
// //     },
// //     "has_completed_onboarding": false
// // "requiresOtpVerification": true,

// //   },
// //  "timestamp": "2025-11-19T10:47:02.543Z"
// // }

// export const SocialMediaLogin = async (provider: string) => {
//   const response = await axios.get(`${API_URL}/auth/login/${provider}`);

//   return response.data;
// };

// // this is the Response
// // {
// //   "success": true,
// //   "data": {
// //     "url": "https://glzwcbnlzsoljnzdsxgz.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A5174%2Fauth%2Fcallback",
// //     "provider": "google"
// //   },
// //   "timestamp": "2025-11-19T10:48:48.498Z"
// // }

// export const ForgotPassword = async (email: string) => {
//   const response = await axios.post(`${API_URL}/auth/forgot-password`, email);

//   return response.data;
// };

// // this is the Response
// // {
// //   "success": true,
// //   "data": {
// //     "message": "If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder."
// //   },
// //   "timestamp": "2025-11-19T10:49:39.887Z"
// // }

// export const ResetPassword = async (payload: ResetPasswordData) => {
//   const response = await axios.post(`${API_URL}/auth/reset-password`, payload);

//   return response.data;
// };

// // this is the Response
// // {
// //   "success": true,
// //   "data": {
// //     "message": "Password has been reset successfully. You can now log in with your new password."
// //   },
// //   "timestamp": "2025-11-19T10:52:12.634Z"
// // }

// export const RefreshToken = async (refreshToken: string) => {
//   const response = await axios.post(
//     `${API_URL}/auth/forgot-password`,
//     refreshToken
//   );

//   return response.data;
// };

// // this is the Response
// // {
// //   "success": true,
// //   "data": {
// //     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxYmQ3MDhmYi1iNWJlLTQxODgtOGJjYi02Y2M0MDcyODlmNGUiLCJlbWFpbCI6ImFkbWlub2tlc3RyYTAxQHlvcG1haWwuY29tIiwiaWF0IjoxNzYzNTQ5NjQyLCJleHAiOjE3NjM1NTA1NDJ9.YQYa__YhlKYLovnpKj6Y_eDs00ivMfzRV4V7Eay6vUU",
// //     "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxYmQ3MDhmYi1iNWJlLTQxODgtOGJjYi02Y2M0MDcyODlmNGUiLCJlbWFpbCI6ImFkbWlub2tlc3RyYTAxQHlvcG1haWwuY29tIiwiaWF0IjoxNzYzNTQ5NjQyLCJleHAiOjE3NjQxNTQ0NDJ9.K7U7vusKtEiLaGMFBLMwRzErg0GK55tO4krsmvStKpE",
// //     "token_type": "Bearer",
// //     "expires_in": 900,
// //     "user": {
// //       "id": "1bd708fb-b5be-4188-8bcb-6cc407289f4e",
// //       "email": "adminokestra01@yopmail.com"
// //     }
// //   },
// //   "timestamp": "2025-11-19T10:54:02.652Z"
// // }

// export const LogoutUser = async (accessToken: string, refreshToken: string) => {
//   const authFetch = axiosInstance(accessToken, refreshToken);
//   const response = await authFetch.post(`${API_URL}/auth/forgot-password`);

//   return response.data;
// };

// // this is the Response
// // {
// //   "success": true,
// //   "data": {
// //     "message": "Logged out successfully",
// //     "timestamp": "2025-11-19T10:55:04.093Z"
// //   },
// //   "timestamp": "2025-11-19T10:55:04.093Z"
// // }

// export const GetCurrentUser = async (
//   accessToken: string,
//   refreshToken: string
// ) => {
//   const authFetch = axiosInstance(accessToken, refreshToken);
//   const response = await authFetch.get(`${API_URL}/auth/me`);

//   return response.data;
// };

// // this is the Response

// // {
// //   "success": true,
// //   "data": {
// //     "id": "1bd708fb-b5be-4188-8bcb-6cc407289f4e",
// //     "username": "BraveLeader42",
// //     "email": "adminokestra01@yopmail.com",
// //     "avatar": "User",
// //     "bio": null,
// //     "job_title": null,
// //     "location": null,
// //     "years_experience": null,
// //     "skills": [],
// //     "linkedin_url": null,
// //     "has_completed_onboarding": false,
// //     "is_willing_to_mentor": false,
// //     "badges": [],
// //     "race_encrypted": null,
// //     "gender_encrypted": null,
// //     "privacy_level": "anonymous",
// //     "reputation_score": 0,
// //     "total_posts": 0,
// //     "total_comments": 0,
// //     "helpful_votes_received": 0,
// //     "mentorship_sessions_completed": 0,
// //     "successful_referrals": 0,
// //     "created_at": "2025-11-19T10:45:10.558+00:00",
// //     "updated_at": "2025-11-19T10:45:10.558+00:00",
// //     "last_active_at": "2025-11-19T10:45:10.558+00:00",
// //     "affinity_tags_encrypted": null,
// //     "career_level_encrypted": null,
// //     "company_encrypted": null
// //   },
// //   "timestamp": "2025-11-19T10:55:37.422Z"
// // }

// export const ResendOTP = async (email: string) => {
//   const response = await axios.post(`${API_URL}/auth/otp/resend`, email);

//   return response.data;
// };

// // this is error Response
// // {
// //   "statusCode": 400,
// //   "timestamp": "2025-11-19T10:56:55.151Z",
// //   "path": "/auth/otp/resend",
// //   "method": "POST",
// //   "message": "Email is already verified. Please log in instead."
// // }
// // this is a same of the true
// // {
// //   "message": "A new verification code has been sent to user@example.com.",
// //   "attemptsRemaining": 2
// // }

// export const VerifyOTP = async (email: string, token: string) => {
//   const response = await axios.post(`${API_URL}/auth/otp/verify`, {
//     email,
//     token,
//   });

//   return response.data;
// // };

// this is the Response{
//   "success": true,
//   "data": {
//     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MzRhNWZmOS02ZTVhLTQ0OGMtOGE0Ni0yNGFjYjIwM2JjY2UiLCJlbWFpbCI6ImFkbWlub2tlc3RyYTAyQHlvcG1haWwuY29tIiwiaWF0IjoxNzYzNTYwNjEwLCJleHAiOjE3NjM1NjE1MTB9.8YOk9uZPjO8omGcxvaVNX7LStl7u54oSCs-JGSovXOk",
//     "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MzRhNWZmOS02ZTVhLTQ0OGMtOGE0Ni0yNGFjYjIwM2JjY2UiLCJlbWFpbCI6ImFkbWlub2tlc3RyYTAyQHlvcG1haWwuY29tIiwiaWF0IjoxNzYzNTYwNjEwLCJleHAiOjE3NjQxNjU0MTB9.9NNVEBsJdQNqUw8MkaQnfEvcLh9ZYizYr4ofMhWMtCI",
//     "token_type": "Bearer",
//     "expires_in": 900,
//     "user": {
//       "id": "934a5ff9-6e5a-448c-8a46-24acb203bcce",
//       "email": "adminokestra02@yopmail.com"
//     }
//   },
//   "timestamp": "2025-11-19T13:56:50.817Z"
// }
// export const UpdateOnboardingProfile = async (
//   payload: UpdateOnboardingData,
//   accessToken: string,
//   refreshToken: string
// ) => {
//   const authFetch = axiosInstance(accessToken, refreshToken);
//   const response = await authFetch.put(`${API_URL}/auth/profile`, payload);

//   return response.data;
// };
// export const CreateOnboardingProfile = async (
//   payload: CreateOnboardingData,
//   accessToken: string,
//   refreshToken: string
// ) => {
//   const authFetch = axiosInstance(accessToken, refreshToken);
//   const response = await authFetch.post(
//     `${API_URL}/auth/onboarding/complete`,
//     payload
//   );

//   return response.data;
// };

// // this is the Response

// //   "success": true,
// //   "data": {
// //     "message": "Onboarding completed successfully",
// //     "has_completed_onboarding": true
// //   },
// //   "timestamp": "2025-11-19T11:01:52.676Z"
// // }
// export const ChangePassword = async (
//   payload: ChangePasswordData,
//   accessToken: string,
//   refreshToken: string
// ) => {
//   const authFetch = axiosInstance(accessToken, refreshToken);
//   const response = await authFetch.patch(
//     `${API_URL}/auth/change-password`,
//     payload
//   );

//   return response.data;
// };

// export const CheckOnboardingStatus = async (
//   accessToken: string,
//   refreshToken: string
// ) => {
//   const authFetch = axiosInstance(accessToken, refreshToken);
//   const response = await authFetch.get(`${API_URL}/auth/onboarding/status`);

//   return response.data;
// };
// // this is the Response
// // {
// //   "success": true,
// //   "data": {
// //     "hasCompletedOnboarding": true,
// //     "isWillingToMentor": true,
// //     "encryptedData": {
// //       "race": "dVdD3h+rpAFnlU/yPCNZa9FRQy3ybL0EPaI44krw6DkIrx5oMl8IzSEOkSTm4frDeUM=",
// //       "gender": "h0FInDGQAmKbz3YdhQsH0H/+d5D38FWemUJ/gezXmN/h",
// //       "careerLevel": "zIIbKZhRxGXAh/3SVmVo4jgR9c2r0Ioezn43R134iBZH03sr3MuTx3ytmzBMs5DpNQ==",
// //       "company": "cMdmpytcIlTJlLejHcT/6lDojZn0hO+cddGcDc9eDekpxg==",
// //       "affinityTags": "Ert46ao6uMkc2onG3My8lp7Fv3G3o46TiAy8qtYePtaUFFNvZNblKUglHeZnqKW3lCV7LRp+Pq1gAD1l5MG/p87N/g=="
// //     }
// //   },
// //   "timestamp": "2025-11-19T11:37:56.157Z"
// // }
