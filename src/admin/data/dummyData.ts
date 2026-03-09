// src/admin/data/dummyData.ts

export const DUMMY_DASHBOARD = {
  users: { total: 4820, active_today: 312, new_this_week: 87, suspended: 14, deactivated: 38, deleted: 22 },
  reports: { total: 143, pending: 12, under_review: 8, resolved_this_week: 31, high_priority: 3 },
  content: { feed_posts_today: 204, forum_topics_today: 45, nook_messages_today: 1893, hidden_content_total: 17 },
  forums: { total: 22, global: 14, company_based: 8 },
  mentorship: { active_sessions: 67, pending_requests: 89, completed_this_month: 142 },
  chart: {
    user_signups_7d: [12, 8, 15, 22, 19, 7, 4],
    reports_7d: [3, 1, 5, 2, 0, 4, 2],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
};

export const DUMMY_LOGS = [
  { id: 'l1', admin: 'admin_priya', action: 'suspend_user', target_type: 'user', target_id: 'u8', reason: 'Repeated harassment violations — 4 confirmed reports', created_at: '2024-03-10T08:00:00Z' },
  { id: 'l2', admin: 'admin_priya', action: 'resolve_report', target_type: 'report', target_id: 'HR-2024-003', reason: 'User warned. Evidence confirmed.', created_at: '2024-03-10T09:30:00Z' },
  { id: 'l3', admin: 'admin_david', action: 'hide_content', target_type: 'comment', target_id: 'c3', reason: 'Violates community guidelines — targeted harassment', created_at: '2024-03-09T14:00:00Z' },
  { id: 'l4', admin: 'admin_priya', action: 'create_forum', target_type: 'forum', target_id: 'f4', reason: 'New design community forum', created_at: '2024-03-08T10:00:00Z' },
  { id: 'l5', admin: 'admin_david', action: 'delete_content', target_type: 'post', target_id: 'c4', reason: 'Spam — promotional content violating guidelines', created_at: '2024-03-07T15:30:00Z' },
  { id: 'l6', admin: 'super_admin', action: 'change_role', target_type: 'user', target_id: 'u2', reason: 'Trusted community member, promoted to moderator', created_at: '2024-03-06T12:00:00Z' },
  { id: 'l7', admin: 'admin_priya', action: 'broadcast_notification', target_type: 'notification', target_id: 'all', reason: 'Community guidelines update announcement', created_at: '2024-03-05T09:00:00Z' },
  { id: 'l8', admin: 'admin_david', action: 'decline_report', target_type: 'report', target_id: 'HR-2024-005', reason: 'Content within community guidelines', created_at: '2024-03-04T16:00:00Z' },
  { id: 'l9', admin: 'admin_priya', action: 'unsuspend_user', target_type: 'user', target_id: 'u3', reason: 'Suspension period completed, user appeal approved', created_at: '2024-03-03T08:00:00Z' },
  { id: 'l10', admin: 'super_admin', action: 'delete_nook', target_type: 'nook', target_id: 'n_old', reason: 'Expired nook with inappropriate content', created_at: '2024-03-02T14:00:00Z' },
];

export const DUMMY_USERS = [
  { id: '1', username: 'sarah_johnson', email: 'sarah@example.com', role: 'user', job_title: 'Product Manager', is_suspended: false, is_deactivated: false, is_deleted: false, created_at: '2024-01-15', last_active_at: '2024-03-10', total_posts: 24, total_comments: 87, reports_against: 0 },
  { id: '2', username: 'mike_chen', email: 'mike@acme.com', role: 'moderator', job_title: 'Software Engineer', is_suspended: false, is_deactivated: false, is_deleted: false, created_at: '2024-01-20', last_active_at: '2024-03-11', total_posts: 45, total_comments: 123, reports_against: 1 },
  { id: '3', username: 'alex_torres', email: 'alex@example.com', role: 'user', job_title: 'Designer', is_suspended: true, is_deactivated: false, is_deleted: false, created_at: '2024-02-01', last_active_at: '2024-03-05', total_posts: 8, total_comments: 31, reports_against: 3 },
  { id: '4', username: 'priya_patel', email: 'priya@corp.com', role: 'admin', job_title: 'HR Director', is_suspended: false, is_deactivated: false, is_deleted: false, created_at: '2023-12-10', last_active_at: '2024-03-11', total_posts: 67, total_comments: 210, reports_against: 0 },
  { id: '5', username: 'james_wilson', email: 'james@example.com', role: 'user', job_title: 'Marketing Lead', is_suspended: false, is_deactivated: true, is_deleted: false, created_at: '2024-01-08', last_active_at: '2024-02-20', total_posts: 12, total_comments: 44, reports_against: 0 },
  { id: '6', username: 'lisa_moore', email: 'lisa@example.com', role: 'user', job_title: 'Data Analyst', is_suspended: false, is_deactivated: false, is_deleted: false, created_at: '2024-02-14', last_active_at: '2024-03-09', total_posts: 19, total_comments: 76, reports_against: 2 },
  { id: '7', username: 'david_kim', email: 'david@startup.com', role: 'moderator', job_title: 'Community Manager', is_suspended: false, is_deactivated: false, is_deleted: false, created_at: '2024-01-25', last_active_at: '2024-03-11', total_posts: 89, total_comments: 345, reports_against: 0 },
  { id: '8', username: 'emma_wright', email: 'emma@example.com', role: 'user', job_title: 'UX Researcher', is_suspended: true, is_deactivated: false, is_deleted: false, created_at: '2024-02-05', last_active_at: '2024-03-01', total_posts: 5, total_comments: 18, reports_against: 4 },
  { id: '9', username: 'carlos_ruiz', email: 'carlos@corp.com', role: 'user', job_title: 'Operations Manager', is_suspended: false, is_deactivated: false, is_deleted: false, created_at: '2024-02-20', last_active_at: '2024-03-10', total_posts: 31, total_comments: 95, reports_against: 1 },
  { id: '10', username: 'nina_foster', email: 'nina@example.com', role: 'user', job_title: 'Content Strategist', is_suspended: false, is_deactivated: false, is_deleted: true, created_at: '2024-01-30', last_active_at: '2024-02-28', total_posts: 0, total_comments: 0, reports_against: 5 },
];

export const DUMMY_REPORTS = [
  {
    id: '1', reference_number: 'HR-2024-001', incident_type: 'harassment', status: 'submitted',
    immediate_risk: true, reporter: { id: 'u1', username: 'sarah_johnson' },
    assigned_to: null,
    description_preview: 'I was repeatedly messaged with threatening content after I declined a mentorship request...',
    description: 'Over the past two weeks, I have been receiving threatening direct messages from another user after I declined their mentorship request. The messages escalate in intensity and contain explicit threats. I have screenshots of all communications.',
    created_at: '2024-03-10T08:00:00Z', admin_notes: '', resolution_action: null,
    timeline: [{ event: 'submitted', at: '2024-03-10T08:00:00Z' }],
  },
  {
    id: '2', reference_number: 'HR-2024-002', incident_type: 'discrimination', status: 'under_review',
    immediate_risk: false, reporter: { id: 'u2', username: 'mike_chen' },
    assigned_to: { id: 'a1', username: 'admin_priya' },
    description_preview: 'Discriminatory comments were made in the Design forum targeting members of my background...',
    description: 'A user posted a series of comments in the Design Thinking forum that contained discriminatory language targeting people from my cultural background. Other community members witnessed this.',
    created_at: '2024-03-09T14:30:00Z', admin_notes: 'Reviewed the forum thread. Pattern of behavior confirmed across 3 posts.', resolution_action: null,
    timeline: [
      { event: 'submitted', at: '2024-03-09T14:30:00Z' },
      { event: 'under_review', at: '2024-03-09T16:00:00Z', by: 'admin_priya' },
    ],
  },
  {
    id: '3', reference_number: 'HR-2024-003', incident_type: 'abuse', status: 'resolved',
    immediate_risk: false, reporter: { id: 'u3', username: 'alex_torres' },
    assigned_to: { id: 'a1', username: 'admin_priya' },
    description_preview: 'User consistently undermined my contributions in the Tech nook with belittling comments...',
    description: 'A specific user has been persistently making condescending and belittling remarks about my contributions in the Tech Professionals nook. This has happened at least 8 times over the past month.',
    created_at: '2024-03-05T10:00:00Z', admin_notes: 'Reviewed message history. User has been warned. Behavior pattern confirmed.', resolution_action: 'warned',
    timeline: [
      { event: 'submitted', at: '2024-03-05T10:00:00Z' },
      { event: 'under_review', at: '2024-03-05T12:00:00Z', by: 'admin_priya' },
      { event: 'resolved', at: '2024-03-06T09:00:00Z', by: 'admin_priya' },
    ],
  },
  {
    id: '4', reference_number: 'HR-2024-004', incident_type: 'harassment', status: 'submitted',
    immediate_risk: true, reporter: { id: 'u4', username: 'nina_foster' },
    assigned_to: null,
    description_preview: 'Stalking behavior — same user is following me across multiple nooks and forums...',
    description: 'A user seems to be deliberately following me into every space I participate in and making targeted hostile comments. This feels like coordinated harassment.',
    created_at: '2024-03-11T07:00:00Z', admin_notes: '', resolution_action: null,
    timeline: [{ event: 'submitted', at: '2024-03-11T07:00:00Z' }],
  },
  {
    id: '5', reference_number: 'HR-2024-005', incident_type: 'bullying', status: 'declined',
    immediate_risk: false, reporter: { id: 'u5', username: 'james_wilson' },
    assigned_to: { id: 'a2', username: 'admin_david' },
    description_preview: 'Another user criticized my forum post in what I consider to be bullying behavior...',
    description: 'User left a critical comment on my forum topic. I found the tone harsh and unwelcoming.',
    created_at: '2024-03-08T11:00:00Z', admin_notes: 'Reviewed the comment. Content is within community guidelines — critical but not harassment.', resolution_action: 'dismissed',
    timeline: [
      { event: 'submitted', at: '2024-03-08T11:00:00Z' },
      { event: 'declined', at: '2024-03-08T15:00:00Z', by: 'admin_david' },
    ],
  },
];

export const DUMMY_CONTENT = [
  { id: 'c1', type: 'post', author: 'alex_torres', preview: 'I cannot believe how toxic some people in this industry are. The gatekeeping is absolutely ridiculous and frankly discriminatory toward people from non-traditional backgrounds.', status: 'visible', reports: 3, created_at: '2024-03-10T09:00:00Z' },
  { id: 'c2', type: 'post', author: 'priya_patel', preview: 'Why Black professionals are systematically excluded from leadership pipelines — a data-driven analysis of hiring practices at Fortune 500 companies.', status: 'visible', reports: 1, created_at: '2024-03-09T14:00:00Z' },
  { id: 'c3', type: 'comment', author: 'unknown_user', preview: 'Stop whining. If you cannot handle criticism, maybe this industry is not for you. People like you are why standards are dropping.', status: 'hidden', reports: 7, created_at: '2024-03-08T16:30:00Z', reason: 'Violates community guidelines — targeted harassment' },
  { id: 'c4', type: 'nook_message', author: 'promo_user123', preview: 'Hey everyone — I just joined this investment program and made $5000 in 2 weeks! DM me for details, I can add you to the group.', status: 'removed', reports: 5, created_at: '2024-03-07T11:00:00Z', reason: 'Spam — promotional content violating guidelines' },
  { id: 'c5', type: 'post', author: 'sarah_johnson', preview: 'Looking for recommendations for career coaches who specialize in helping underrepresented professionals break into senior leadership. DMs open!', status: 'visible', reports: 0, created_at: '2024-03-11T08:00:00Z' },
  { id: 'c6', type: 'comment', author: 'james_wilson', preview: 'The pay gap between genders in tech is not as bad as people claim — here is the actual data showing compensation differences.', status: 'visible', reports: 12, created_at: '2024-03-06T10:00:00Z' },
  { id: 'c7', type: 'comment', author: 'lisa_moore', preview: 'This is exactly the kind of post that makes this community great. Well-researched, respectful, and genuinely helpful. Thank you for sharing your experience.', status: 'visible', reports: 0, created_at: '2024-03-10T15:00:00Z' },
  { id: 'c8', type: 'nook_message', author: 'david_kim', preview: 'I have been in this industry for 15 years and I want to be clear: what you experienced was wrong and you absolutely should report it.', status: 'visible', reports: 0, created_at: '2024-03-11T07:30:00Z' },
];

export const DUMMY_FORUMS = [
  { id: 'f1', name: 'Black Professionals Network', category: 'Networking', is_locked: false, is_hidden: false, member_count: 1203, topic_count: 89, posts_this_week: 34, created_at: '2024-01-10', description: 'A space for Black professionals to connect, share experiences and support each other.' },
  { id: 'f2', name: 'Women in Tech', category: 'Technology', is_locked: false, is_hidden: false, member_count: 2341, topic_count: 167, posts_this_week: 78, created_at: '2024-01-12', description: 'Connecting women in technology across all levels and disciplines.' },
  { id: 'f3', name: 'Acme Corp Internal', category: 'Internal', is_locked: false, is_hidden: false, member_count: 312, topic_count: 45, posts_this_week: 12, created_at: '2024-01-20', description: 'Internal forum for Acme Corporation employees.' },
  { id: 'f4', name: 'Design Thinking Hub', category: 'Design', is_locked: false, is_hidden: false, member_count: 876, topic_count: 112, posts_this_week: 45, created_at: '2024-02-01', description: 'For designers, design-adjacent professionals, and design enthusiasts.' },
  { id: 'f5', name: 'StartUp Nation', category: 'Entrepreneurship', is_locked: true, is_hidden: false, member_count: 654, topic_count: 78, posts_this_week: 21, created_at: '2024-02-10', description: 'Founders, co-founders, and startup employees sharing experiences.' },
];

export const DUMMY_NOOKS = [
  { id: 'n1', name: 'Black Tech Professionals', description: 'A space for Black professionals in technology to connect and support each other.', scope: 'public', is_locked: false, is_hidden: false, member_count: 234, message_count: 1893, messages_this_week: 87, created_at: '2024-01-15' },
  { id: 'n2', name: 'Women in Leadership Lounge', description: 'Private community for women in leadership positions.', scope: 'private', is_locked: false, is_hidden: false, member_count: 156, message_count: 892, messages_this_week: 43, created_at: '2024-01-20' },
  { id: 'n3', name: 'Startup Founders Circle', description: 'Founders sharing their journey, wins, and lessons learned.', scope: 'private', is_locked: true, is_hidden: false, member_count: 89, message_count: 445, messages_this_week: 0, created_at: '2024-02-01' },
  { id: 'n4', name: 'Design & Dev Crossover', description: 'Where designers and developers collaborate and bridge the gap.', scope: 'public', is_locked: false, is_hidden: false, member_count: 312, message_count: 2103, messages_this_week: 112, created_at: '2024-02-10' },
  { id: 'n5', name: 'Mid-Career Transitions', description: 'Support for professionals navigating career pivots and transitions.', scope: 'company', is_locked: false, is_hidden: false, member_count: 67, message_count: 234, messages_this_week: 15, created_at: '2024-02-20' },
  { id: 'n6', name: 'LGBTQ+ Professional Space', description: 'Safe, affirming community for LGBTQ+ professionals.', scope: 'public', is_locked: false, is_hidden: false, member_count: 178, message_count: 1240, messages_this_week: 56, created_at: '2024-01-28' },
  { id: 'n7', name: 'Latinx in Finance', description: 'Latinx professionals in finance, banking, and investment.', scope: 'public', is_locked: false, is_hidden: true, member_count: 93, message_count: 567, messages_this_week: 22, created_at: '2024-02-15' },
];
