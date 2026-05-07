// src/test/mentorshipApis.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../api/base', () => ({
  API_URL: 'http://test-api',
  getAuthInstance: () => ({
    post: mockPost,
    get: mockGet,
    put: mockPut,
    delete: mockDelete,
  }),
  unwrap: (res: { data: any }) => res.data?.data ?? res.data,
}));

import {
  CreateMentorProfile,
  GetMyMentorProfile,
  UpdateMyMentorProfile,
  GetMentorProfileByUserId,
  CheckUserProfileRequirement,
  CheckUserProfileExist,
  CreateMenteeProfile,
  GetMyMenteeProfile,
  UpdateMyMenteeProfile,
  CreateDirectMentorShipRequest,
  GetAllMentorshipRequests,
  GetReceivedDirectMentorshipRequests,
  GetSentDirectMentorshipRequests,
  GetMentorshipRequestById,
  CheckMentorshipRequestHasBeenSent,
  GetMentorshipMetric,
  UpdateMentorshipDirectRequestToRead,
  UpdateMentorshipRequestById,
  RespondToDirectMentorshipRequest,
  DeleteDirectMentorshipRequest,
  GetMentorsAndMentees,
  GetMentorsAndMenteesBySuggestionAI,
  GetFilterOptions,
  FollowUser,
  UnfollowUser,
  GetFollowStatus,
  GetFollowers,
  GetFollowing,
  GetMyMentors,
  GetMyMentees,
  GeAllRequests,
} from '../../api/mentorshipApis';

describe('Mentorship API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------- Mentor Profile ----------
  describe('CreateMentorProfile', () => {
    it('creates a mentor profile', async () => {
      const payload = {
        isWillingToMentor: true,
        mentorBio: 'Experienced dev',
        expertise: ['React'],
        industries: ['Tech'],
        availability: 'weekly',
        mentoringStyle: 'hands-on',
        languages: ['English'],
        location: 'NYC',
        jobTitle: 'Senior Dev',
        yearsExperience: 10,
        bio: 'Full bio here',
      };
      mockPost.mockResolvedValue({ data: { data: { id: 'profile-1' } } });
      const result = await CreateMentorProfile(payload);
      expect(mockPost).toHaveBeenCalledWith(
        'http://test-api/mentorship-profiles/mentor/setup',
        payload,
      );
      expect(result).toEqual({ id: 'profile-1' });
    });

    it('throws on error', async () => {
      mockPost.mockRejectedValue(new Error('Validation error'));
      await expect(
        CreateMentorProfile({
          isWillingToMentor: true,
          mentorBio: '',
          expertise: [],
          industries: [],
          availability: '',
          mentoringStyle: '',
          languages: [],
          location: '',
          jobTitle: '',
          yearsExperience: 0,
          bio: '',
        }),
      ).rejects.toThrow('Validation error');
    });
  });

  describe('GetMyMentorProfile', () => {
    it('fetches my mentor profile', async () => {
      mockGet.mockResolvedValue({ data: { data: { id: 'me', bio: 'My bio' } } });
      const result = await GetMyMentorProfile();
      expect(mockGet).toHaveBeenCalledWith('http://test-api/mentorship-profiles/me');
      expect(result).toEqual({ id: 'me', bio: 'My bio' });
    });
  });

  describe('UpdateMyMentorProfile', () => {
    it('updates mentor profile', async () => {
      const payload = {
        isWillingToMentor: true,
        mentorBio: 'Updated',
        expertise: ['Node'],
        industries: ['Finance'],
        availability: 'daily',
        mentoringStyle: 'coaching',
        languages: ['English'],
        location: 'LA',
        jobTitle: 'Lead',
        yearsExperience: 12,
        bio: 'Updated bio',
      };
      mockPut.mockResolvedValue({ data: { data: { success: true } } });
      const result = await UpdateMyMentorProfile(payload);
      expect(mockPut).toHaveBeenCalledWith(
        'http://test-api/mentorship-profiles/mentor/update',
        payload,
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('GetMentorProfileByUserId', () => {
    it('fetches mentor profile by user id', async () => {
      mockGet.mockResolvedValue({ data: { data: { id: 'u1', bio: 'Bio' } } });
      const result = await GetMentorProfileByUserId('u1');
      expect(mockGet).toHaveBeenCalledWith('http://test-api/mentorship/profile/u1');
      expect(result).toEqual({ id: 'u1', bio: 'Bio' });
    });
  });

  // ---------- Profile checks ----------
  describe('CheckUserProfileRequirement', () => {
    it('checks profile requirement', async () => {
      mockGet.mockResolvedValue({
        data: {
          data: {
            hasProfile: true,
            profileType: 'mentor',
            missingFields: [],
            canCreateRequest: true,
          },
        },
      });
      const result = await CheckUserProfileRequirement();
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/mentorship-profiles/check-requirement',
      );
      expect(result.canCreateRequest).toBe(true);
    });
  });

  describe('CheckUserProfileExist', () => {
    it('checks if user has mentorship profile', async () => {
      mockGet.mockResolvedValue({
        data: {
          data: {
            hasProfile: true,
            hasMentorProfile: true,
            hasMenteeProfile: false,
            isActiveMentor: true,
            isActiveMentee: false,
            profileId: 'p-1',
          },
        },
      });
      const result = await CheckUserProfileExist();
      expect(result.hasMentorProfile).toBe(true);
      expect(result.hasMenteeProfile).toBe(false);
    });
  });

  // ---------- Mentee Profile ----------
  describe('CreateMenteeProfile', () => {
    it('creates a mentee profile', async () => {
      const payload = {
        topic: 'Career growth',
        goals: 'Become senior',
        availability: 'weekly',
        communicationMethod: 'chat',
        urgency: 'medium' as const,
        jobTitle: 'Junior Dev',
        yearsExperience: 2,
        location: 'Remote',
        bio: 'Learning',
      };
      mockPost.mockResolvedValue({ data: { data: { id: 'mentee-1' } } });
      const result = await CreateMenteeProfile(payload);
      expect(mockPost).toHaveBeenCalledWith(
        'http://test-api/mentorship-profiles/mentee/setup',
        payload,
      );
      expect(result).toEqual({ id: 'mentee-1' });
    });
  });

  describe('GetMyMenteeProfile', () => {
    it('fetches my mentee profile', async () => {
      mockGet.mockResolvedValue({ data: { data: { id: 'me-mentee' } } });
      const result = await GetMyMenteeProfile();
      expect(mockGet).toHaveBeenCalledWith('http://test-api/mentorship-profiles/me');
      expect(result).toEqual({ id: 'me-mentee' });
    });
  });

  describe('UpdateMyMenteeProfile', () => {
    it('updates mentee profile', async () => {
      const payload = { topic: 'Updated topic', goals: 'New goals' };
      mockPut.mockResolvedValue({ data: { data: { success: true } } });
      const result = await UpdateMyMenteeProfile(payload);
      expect(mockPut).toHaveBeenCalledWith(
        'http://test-api/mentorship-profiles/mentee/update',
        payload,
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ---------- Direct Mentorship Requests ----------
  describe('CreateDirectMentorShipRequest', () => {
    it('sends a direct mentorship request', async () => {
      const payload = {
        targetUserId: 'user-2',
        requestType: 'mentor_request' as const,
        message: 'Would love to learn from you',
      };
      mockPost.mockResolvedValue({ data: { data: { id: 'req-1' } } });
      const result = await CreateDirectMentorShipRequest(payload);
      expect(mockPost).toHaveBeenCalledWith(
        'http://test-api/mentorship/requests/direct',
        payload,
      );
      expect(result).toEqual({ id: 'req-1' });
    });
  });

  describe('GetAllMentorshipRequests', () => {
    it('fetches all requests with status and type', async () => {
      mockGet.mockResolvedValue({ data: { data: { requests: [] } } });
      const result = await GetAllMentorshipRequests('pending', 'all');
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('status=pending');
      expect(url).toContain('type=all');
      expect(result).toEqual({ requests: [] });
    });
  });

  describe('GetReceivedDirectMentorshipRequests', () => {
    it('fetches received requests', async () => {
      mockGet.mockResolvedValue({ data: { data: { requests: [{ id: 'r-1' }] } } });
      const result = await GetReceivedDirectMentorshipRequests('pending');
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('status=pending');
      expect(url).toContain('/direct/received');
      expect(result).toEqual({ requests: [{ id: 'r-1' }] });
    });
  });

  describe('GetSentDirectMentorshipRequests', () => {
    it('fetches sent requests', async () => {
      mockGet.mockResolvedValue({ data: { data: { requests: [] } } });
      const result = await GetSentDirectMentorshipRequests('pending');
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('/direct/sent');
      expect(result).toEqual({ requests: [] });
    });
  });

  describe('GetMentorshipRequestById', () => {
    it('fetches a specific request', async () => {
      mockGet.mockResolvedValue({ data: { data: { id: 'req-1', status: 'pending' } } });
      const result = await GetMentorshipRequestById('req-1');
      expect(mockGet).toHaveBeenCalledWith('http://test-api/mentorship/requests/req-1');
      expect(result).toEqual({ id: 'req-1', status: 'pending' });
    });
  });

  describe('CheckMentorshipRequestHasBeenSent', () => {
    it('checks if request has been sent', async () => {
      mockGet.mockResolvedValue({ data: { data: { hasSent: true } } });
      const result = await CheckMentorshipRequestHasBeenSent('user-2', 'mentor_request');
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('/direct/check/user-2');
      expect(url).toContain('requestType=mentor_request');
      expect(result).toEqual({ hasSent: true });
    });
  });

  describe('GetMentorshipMetric', () => {
    it('fetches mentorship metrics', async () => {
      mockGet.mockResolvedValue({
        data: { data: { total: 10, totalUnread: 3 } },
      });
      const result = await GetMentorshipMetric();
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/mentorship/requests/direct/metrics',
      );
      expect(result).toEqual({ total: 10, totalUnread: 3 });
    });
  });

  describe('UpdateMentorshipDirectRequestToRead', () => {
    it('marks requests as read', async () => {
      mockPost.mockResolvedValue({ data: { data: { count: 3 } } });
      const result = await UpdateMentorshipDirectRequestToRead('received');
      const url = mockPost.mock.calls[0][0] as string;
      expect(url).toContain('/direct/read-all');
      expect(url).toContain('type=received');
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('UpdateMentorshipRequestById', () => {
    it('updates a request by ID', async () => {
      mockPut.mockResolvedValue({ data: { data: { success: true } } });
      const result = await UpdateMentorshipRequestById('req-1', { status: 'accepted' });
      expect(mockPut).toHaveBeenCalledWith('http://test-api/mentorship/requests/req-1', {
        status: 'accepted',
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('RespondToDirectMentorshipRequest', () => {
    it('accepts a request', async () => {
      mockPost.mockResolvedValue({ data: { data: { success: true } } });
      const result = await RespondToDirectMentorshipRequest('req-1', {
        action: 'accept',
      });
      expect(mockPost).toHaveBeenCalledWith(
        'http://test-api/mentorship/requests/direct/req-1/respond',
        { action: 'accept' },
      );
      expect(result).toEqual({ success: true });
    });

    it('declines a request', async () => {
      mockPost.mockResolvedValue({ data: { data: { success: true } } });
      await RespondToDirectMentorshipRequest('req-1', {
        action: 'decline',
        reason: 'Too busy',
      });
      expect(mockPost).toHaveBeenCalledWith(
        'http://test-api/mentorship/requests/direct/req-1/respond',
        { action: 'decline', reason: 'Too busy' },
      );
    });
  });

  describe('DeleteDirectMentorshipRequest', () => {
    it('deletes a direct request', async () => {
      mockDelete.mockResolvedValue({ data: { data: { success: true } } });
      const result = await DeleteDirectMentorshipRequest('req-1');
      expect(mockDelete).toHaveBeenCalledWith('/mentorship/requests/direct/req-1');
      expect(result).toEqual({ success: true });
    });

    it('throws and logs on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDelete.mockRejectedValue(new Error('Delete failed'));
      await expect(DeleteDirectMentorshipRequest('req-1')).rejects.toThrow('Delete failed');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ---------- Discover ----------
  describe('GetMentorsAndMentees', () => {
    it('fetches with default params', async () => {
      mockGet.mockResolvedValue({
        data: {
          data: {
            profiles: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
          },
        },
      });
      const result = await GetMentorsAndMentees();
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('/mentorship/discover');
      expect(url).toContain('page=1');
      expect(url).toContain('limit=20');
      expect(result.profiles).toEqual([]);
    });

    it('passes all filter parameters', async () => {
      mockGet.mockResolvedValue({
        data: {
          data: {
            profiles: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        },
      });
      await GetMentorsAndMentees({
        viewMode: 'mentors',
        search: 'react',
        careerLevel: ['senior'],
        expertise: ['react', 'node'],
        industries: ['tech'],
        affinityTags: ['women-in-tech'],
        availability: 'weekly',
        location: 'NYC',
        languages: ['English'],
        minMatchScore: 50,
        maxMatchScore: 100,
        sortBy: 'match_score',
        sortOrder: 'desc',
        page: 2,
        limit: 10,
      });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('viewMode=mentors');
      expect(url).toContain('search=react');
      expect(url).toContain('careerLevel=senior');
      expect(url).toContain('location=NYC');
      expect(url).toContain('page=2');
      expect(url).toContain('sortBy=match_score');
    });

    it('handles array availability', async () => {
      mockGet.mockResolvedValue({
        data: { data: { profiles: [], total: 0, page: 1, limit: 20, totalPages: 0 } },
      });
      await GetMentorsAndMentees({ availability: ['weekly', 'biweekly'] });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('availability=weekly');
      expect(url).toContain('availability=biweekly');
    });
  });

  describe('GetMentorsAndMenteesBySuggestionAI', () => {
    it('fetches AI suggestions', async () => {
      mockGet.mockResolvedValue({ data: { data: { profiles: [] } } });
      const result = await GetMentorsAndMenteesBySuggestionAI({ type: 'mentors', limit: 5 });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('/discover/suggestions');
      expect(url).toContain('type=mentors');
      expect(url).toContain('limit=5');
      expect(result).toEqual({ profiles: [] });
    });

    it('uses default limit of 8', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetMentorsAndMenteesBySuggestionAI({});
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('limit=8');
    });
  });

  describe('GetFilterOptions', () => {
    it('fetches filter options', async () => {
      const options = {
        careerLevels: ['Junior', 'Senior'],
        expertiseAreas: ['React'],
        industries: ['Tech'],
        affinityTags: [],
        availabilityOptions: ['weekly'],
        communicationMethods: ['chat'],
        languages: ['English'],
        matchScoreRanges: [],
      };
      mockGet.mockResolvedValue({ data: { data: options } });
      const result = await GetFilterOptions();
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/mentorship/discover/filters/options',
      );
      expect(result).toEqual(options);
    });
  });

  // ---------- Follow ----------
  describe('FollowUser', () => {
    it('follows a user', async () => {
      mockPost.mockResolvedValue({ data: { data: { success: true } } });
      const result = await FollowUser('user-2');
      expect(mockPost).toHaveBeenCalledWith('http://test-api/mentorship/follow/user-2');
      expect(result).toEqual({ success: true });
    });
  });

  describe('UnfollowUser', () => {
    it('unfollows a user', async () => {
      mockDelete.mockResolvedValue({ data: { data: { success: true } } });
      const result = await UnfollowUser('user-2');
      expect(mockDelete).toHaveBeenCalledWith('http://test-api/mentorship/follow/user-2');
      expect(result).toEqual({ success: true });
    });
  });

  describe('GetFollowStatus', () => {
    it('gets follow status', async () => {
      mockGet.mockResolvedValue({ data: { data: { isFollowing: true } } });
      const result = await GetFollowStatus('user-2');
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/mentorship/follow/user-2/status',
      );
      expect(result).toEqual({ isFollowing: true });
    });
  });

  describe('GetFollowers', () => {
    it('fetches followers with pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: { followers: [], total: 0 } } });
      const result = await GetFollowers({ page: 1, limit: 10 });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('/followers');
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
      expect(result).toEqual({ followers: [], total: 0 });
    });

    it('fetches followers without params', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetFollowers();
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/mentorship/follow/followers',
      );
    });
  });

  describe('GetFollowing', () => {
    it('fetches following list with type', async () => {
      mockGet.mockResolvedValue({ data: { data: { following: [] } } });
      const result = await GetFollowing({ type: 'mentors', page: 1, limit: 10 });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('/following');
      expect(url).toContain('type=mentors');
      expect(result).toEqual({ following: [] });
    });
  });

  // ---------- My Mentors/Mentees ----------
  describe('GetMyMentors', () => {
    it('fetches my mentors', async () => {
      mockGet.mockResolvedValue({ data: { data: { mentors: [{ id: 'm1' }] } } });
      const result = await GetMyMentors();
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/mentorship/requests/my-mentors',
      );
      expect(result).toEqual({ mentors: [{ id: 'm1' }] });
    });
  });

  describe('GetMyMentees', () => {
    it('fetches my mentees', async () => {
      mockGet.mockResolvedValue({ data: { data: { mentees: [] } } });
      const result = await GetMyMentees();
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/mentorship/requests/my-mentees',
      );
      expect(result).toEqual({ mentees: [] });
    });
  });

  describe('GeAllRequests', () => {
    it('fetches all direct requests', async () => {
      mockGet.mockResolvedValue({ data: { data: { requests: [] } } });
      const result = await GeAllRequests();
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/mentorship/requests/direct/all',
      );
      expect(result).toEqual({ requests: [] });
    });
  });
});
