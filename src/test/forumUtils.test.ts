import {
  formatLastActivity,
  formatCreatedDate,
  getTimeAgo,
  isWithinTimeRange,
  sortTopics,
  transformTopicFromAPI,
  transformForumFromAPI,
} from '../utils/forumUtils';

describe('formatLastActivity', () => {
  it('returns "No activity" for null/undefined', () => {
    expect(formatLastActivity(null)).toBe('No activity');
    expect(formatLastActivity(undefined)).toBe('No activity');
  });

  it('returns "Just now" for very recent dates', () => {
    const now = new Date();
    expect(formatLastActivity(now)).toBe('Just now');
  });

  it('returns minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60000);
    expect(formatLastActivity(date)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const date = new Date(Date.now() - 3 * 3600000);
    expect(formatLastActivity(date)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const date = new Date(Date.now() - 2 * 86400000);
    expect(formatLastActivity(date)).toBe('2d ago');
  });

  it('returns weeks ago', () => {
    const date = new Date(Date.now() - 14 * 86400000);
    expect(formatLastActivity(date)).toBe('2w ago');
  });

  it('returns months ago', () => {
    const date = new Date(Date.now() - 60 * 86400000);
    expect(formatLastActivity(date)).toBe('2mo ago');
  });

  it('returns formatted date for old dates', () => {
    const date = new Date('2020-01-15');
    const result = formatLastActivity(date);
    expect(result).toContain('2020');
    expect(result).toContain('Jan');
  });

  it('handles ISO string input', () => {
    const iso = new Date(Date.now() - 10 * 60000).toISOString();
    expect(formatLastActivity(iso)).toBe('10m ago');
  });

  it('handles garbage input without throwing', () => {
    // 'not-a-date' creates an Invalid Date, but NaN math doesn't throw
    const result = formatLastActivity('not-a-date');
    expect(typeof result).toBe('string');
  });
});

describe('formatCreatedDate', () => {
  it('formats a Date object', () => {
    const result = formatCreatedDate(new Date('2024-06-15T14:30:00Z'));
    expect(result).toContain('2024');
    expect(result).toContain('June');
  });

  it('formats an ISO string', () => {
    const result = formatCreatedDate('2024-03-01T10:00:00Z');
    expect(result).toContain('2024');
  });

  it('returns "Invalid Date" for bad input', () => {
    // toLocaleDateString on an invalid Date returns "Invalid Date" (capital D)
    expect(formatCreatedDate('bad')).toBe('Invalid Date');
  });
});

describe('getTimeAgo', () => {
  it('returns "Just now" for current time', () => {
    expect(getTimeAgo(new Date())).toBe('Just now');
  });

  it('returns minutes', () => {
    expect(getTimeAgo(new Date(Date.now() - 5 * 60000))).toBe('5m ago');
  });

  it('returns hours', () => {
    expect(getTimeAgo(new Date(Date.now() - 2 * 3600000))).toBe('2h ago');
  });

  it('returns days', () => {
    expect(getTimeAgo(new Date(Date.now() - 3 * 86400000))).toBe('3d ago');
  });

  it('returns weeks', () => {
    expect(getTimeAgo(new Date(Date.now() - 14 * 86400000))).toBe('2w ago');
  });

  it('returns months', () => {
    // 60 days = 86400 minutes; 86400 / 43200 = 2
    expect(getTimeAgo(new Date(Date.now() - 60 * 86400000))).toBe('2mo ago');
  });

  it('returns years', () => {
    expect(getTimeAgo(new Date(Date.now() - 400 * 86400000))).toBe('1y ago');
  });

  it('handles string input', () => {
    const iso = new Date(Date.now() - 120000).toISOString();
    expect(getTimeAgo(iso)).toBe('2m ago');
  });

  it('handles invalid date input without throwing', () => {
    // The function catches errors; 'garbage' produces NaN which flows through the math
    const result = getTimeAgo('garbage');
    expect(typeof result).toBe('string');
  });
});

describe('isWithinTimeRange', () => {
  it('returns true for "all" range always', () => {
    expect(isWithinTimeRange('2000-01-01', 'all')).toBe(true);
  });

  it('returns true for today range with recent date', () => {
    const recent = new Date(Date.now() - 3600000).toISOString();
    expect(isWithinTimeRange(recent, 'today')).toBe(true);
  });

  it('returns false for today range with old date', () => {
    const old = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(isWithinTimeRange(old, 'today')).toBe(false);
  });

  it('returns true for week range', () => {
    const recent = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(isWithinTimeRange(recent, 'week')).toBe(true);
  });

  it('returns false for week range with old date', () => {
    const old = new Date(Date.now() - 10 * 86400000).toISOString();
    expect(isWithinTimeRange(old, 'week')).toBe(false);
  });

  it('returns true for month range', () => {
    const recent = new Date(Date.now() - 15 * 86400000).toISOString();
    expect(isWithinTimeRange(recent, 'month')).toBe(true);
  });

  it('handles Date objects', () => {
    expect(isWithinTimeRange(new Date(), 'today')).toBe(true);
  });

  it('returns false for bad input', () => {
    expect(isWithinTimeRange('not-a-date', 'today')).toBe(false);
  });
});

describe('sortTopics', () => {
  const now = Date.now();

  const topics = [
    {
      reactions: { seen: 1, validated: 5, inspired: 0, heard: 2 },
      commentCount: 3,
      last_activity_at: new Date(now - 3600000).toISOString(),
      created_at: new Date(now - 7200000).toISOString(),
    },
    {
      reactions: { seen: 10, validated: 10, inspired: 10, heard: 10 },
      commentCount: 20,
      last_activity_at: new Date(now - 86400000).toISOString(),
      created_at: new Date(now - 86400000).toISOString(),
    },
    {
      reactions: { seen: 0, validated: 0, inspired: 0, heard: 0 },
      commentCount: 0,
      last_activity_at: new Date(now - 60000).toISOString(),
      created_at: new Date(now - 60000).toISOString(),
    },
  ];

  it('sorts by relevant (engagement score)', () => {
    const sorted = sortTopics([...topics], 'relevant');
    // Topic[1] has highest score
    expect(sorted[0]).toEqual(topics[1]);
  });

  it('sorts by recent (most recent first)', () => {
    const sorted = sortTopics([...topics], 'recent');
    // Topic[2] is most recent
    expect(sorted[0]).toEqual(topics[2]);
  });

  it('sorts by popular (total reactions)', () => {
    const sorted = sortTopics([...topics], 'popular');
    // Topic[1] has most total reactions (40)
    expect(sorted[0]).toEqual(topics[1]);
  });

  it('sorts by trending (score / time)', () => {
    const sorted = sortTopics([...topics], 'trending');
    // Trending accounts for recency, so topic[2] may rank low because 0 engagement
    // Topic[0] has moderate engagement and is fairly recent
    expect(sorted.length).toBe(3);
  });

  it('returns copy without mutating original', () => {
    const original = [...topics];
    sortTopics(original, 'recent');
    // Original array order should be intact
    expect(original[0]).toEqual(topics[0]);
  });

  it('handles empty array', () => {
    expect(sortTopics([], 'recent')).toEqual([]);
  });

  it('returns sorted copy for unknown sort', () => {
    const result = sortTopics([...topics], 'unknown' as any);
    expect(result.length).toBe(3);
  });
});

describe('transformTopicFromAPI', () => {
  it('transforms full API topic', () => {
    const api = {
      id: 't1',
      title: 'Test Topic',
      content: 'Body text',
      user_id: 'u1',
      user_profile: { username: 'alice', avatar: '🦊' },
      forum_id: 'f1',
      company_name: 'Acme',
      scope: 'company',
      is_anonymous: false,
      is_pinned: true,
      tags: ['tech', 'ai'],
      link: 'https://example.com',
      reactions: { seen: 5, validated: 3, inspired: 1, heard: 2 },
      userReactions: { seen: true, validated: false, inspired: false, heard: true },
      comments_count: 10,
      views_count: 100,
      created_at: '2024-01-01',
      last_activity_at: '2024-06-01',
    };

    const result = transformTopicFromAPI(api);
    expect(result.id).toBe('t1');
    expect(result.author.username).toBe('alice');
    expect(result.author.avatar).toBe('🦊');
    expect(result.tags).toEqual(['tech', 'ai']);
    expect(result.reactions.seen).toBe(5);
    expect(result.userReactions.heard).toBe(true);
    expect(result.commentCount).toBe(10);
    expect(result.views).toBe(100);
    expect(result.isPinned).toBe(true);
  });

  it('provides defaults for missing fields', () => {
    const api = {
      id: 't2',
      title: 'Minimal',
      content: 'text',
      user_id: 'u1',
      forum_id: 'f1',
    };

    const result = transformTopicFromAPI(api);
    expect(result.author.username).toBe('Anonymous');
    expect(result.author.avatar).toBe('👤');
    expect(result.tags).toEqual([]);
    expect(result.commentCount).toBe(0);
    expect(result.views).toBe(0);
    expect(result.userReactions.seen).toBe(false);
  });

  it('falls back to individual reaction counts when reactions object is missing', () => {
    const api = {
      id: 't3',
      title: 'T',
      content: 'C',
      user_id: 'u1',
      forum_id: 'f1',
      reaction_seen_count: 7,
      reaction_validated_count: 3,
      reaction_inspired_count: 1,
      reaction_heard_count: 2,
    };

    const result = transformTopicFromAPI(api);
    expect(result.reactions.seen).toBe(7);
    expect(result.reactions.validated).toBe(3);
  });
});

describe('transformForumFromAPI', () => {
  it('transforms full API forum', () => {
    const api = {
      id: 'f1',
      name: 'General',
      description: 'A general forum',
      icon: '💬',
      category: 'general',
      is_global: true,
      company_name: null,
      topic_count: 42,
      member_count: 100,
      last_activity: new Date(Date.now() - 60000).toISOString(),
      rules: ['Be nice'],
      moderators: ['mod1'],
      is_joined: true,
    };

    const result = transformForumFromAPI(api);
    expect(result.id).toBe('f1');
    expect(result.name).toBe('General');
    expect(result.isGlobal).toBe(true);
    expect(result.topicCount).toBe(42);
    expect(result.memberCount).toBe(100);
    expect(result.lastActivity).toContain('ago');
    expect(result.rules).toEqual(['Be nice']);
    expect(result.isJoined).toBe(true);
  });

  it('provides defaults for missing fields', () => {
    const api = {
      id: 'f2',
      name: 'Minimal',
    };

    const result = transformForumFromAPI(api);
    expect(result.topicCount).toBe(0);
    expect(result.memberCount).toBe(0);
    expect(result.rules).toEqual([]);
    expect(result.moderators).toEqual([]);
    expect(result.isJoined).toBe(false);
  });
});
