import { supabase } from './supabase';

const userProfiles = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'TechSeeker_Sarah',
    avatar: '🚀',
    bio: 'Full-stack developer with 5+ years of experience. Passionate about React, Node.js, and cloud technologies. Looking to join a FAANG company.',
    company: 'StartupXYZ',
    job_title: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    years_experience: 5,
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
    linkedin_url: 'https://linkedin.com/in/techseeker'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    username: 'Microsoft_Insider_Alex',
    avatar: '💼',
    bio: 'Senior Product Manager at Microsoft. Happy to help qualified candidates navigate the interview process.',
    company: 'Microsoft',
    job_title: 'Senior Product Manager',
    location: 'Seattle, WA',
    years_experience: 8,
    skills: ['Product Management', 'Strategy', 'Agile', 'User Research'],
    linkedin_url: 'https://linkedin.com/in/msinsider'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    username: 'DataScience_Maya',
    avatar: '📊',
    bio: 'PhD in Statistics, 3 years industry experience in ML/AI. Specialized in NLP and computer vision.',
    company: 'Research Labs Inc',
    job_title: 'Data Scientist',
    location: 'Boston, MA',
    years_experience: 3,
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'NLP', 'Statistics'],
    linkedin_url: 'https://linkedin.com/in/datamaya'
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    username: 'Goldman_VP_Marcus',
    avatar: '💰',
    bio: 'VP at Goldman Sachs with 10+ years in finance and tech. Can provide insights into both finance and engineering roles.',
    company: 'Goldman Sachs',
    job_title: 'Vice President',
    location: 'New York, NY',
    years_experience: 10,
    skills: ['Finance', 'Trading Systems', 'Risk Management', 'Java', 'Python'],
    linkedin_url: 'https://linkedin.com/in/goldmanvp'
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    username: 'UXDesigner_Emma',
    avatar: '🎨',
    bio: 'Senior UX Designer passionate about creating intuitive user experiences. 6 years experience in consumer products.',
    company: 'Airbnb',
    job_title: 'Senior UX Designer',
    location: 'San Francisco, CA',
    years_experience: 6,
    skills: ['UX Design', 'Figma', 'User Research', 'Prototyping', 'Design Systems'],
    linkedin_url: 'https://linkedin.com/in/uxemma'
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    username: 'Google_SWE_Kevin',
    avatar: '🔥',
    bio: 'L5 Software Engineer at Google. Working on distributed systems. Can refer for SWE roles.',
    company: 'Google',
    job_title: 'Senior Software Engineer (L5)',
    location: 'Mountain View, CA',
    years_experience: 7,
    skills: ['C++', 'Distributed Systems', 'System Design', 'Go', 'Kubernetes'],
    linkedin_url: 'https://linkedin.com/in/googleswe'
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    username: 'Meta_Recruiter_Lisa',
    avatar: '🎯',
    bio: 'Technical Recruiter at Meta. Sharing insights about the hiring process and what we look for.',
    company: 'Meta',
    job_title: 'Technical Recruiter',
    location: 'Menlo Park, CA',
    years_experience: 5,
    skills: ['Recruiting', 'Talent Acquisition', 'Interview Process', 'Networking'],
    linkedin_url: 'https://linkedin.com/in/metarecruiter'
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    username: 'DevOps_Chris',
    avatar: '⚙️',
    bio: 'DevOps Engineer looking to transition into SRE role at a major tech company.',
    company: 'CloudTech Solutions',
    job_title: 'DevOps Engineer',
    location: 'Austin, TX',
    years_experience: 4,
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Monitoring'],
    linkedin_url: 'https://linkedin.com/in/devopschris'
  },
  {
    id: '00000000-0000-0000-0000-000000000009',
    username: 'Amazon_PM_Rachel',
    avatar: '📦',
    bio: 'Senior PM at Amazon. Worked on several consumer-facing products. Can help with PM interview prep.',
    company: 'Amazon',
    job_title: 'Senior Product Manager',
    location: 'Seattle, WA',
    years_experience: 6,
    skills: ['Product Management', 'Data Analysis', 'A/B Testing', 'Customer Insights'],
    linkedin_url: 'https://linkedin.com/in/amazonpm'
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    username: 'Startup_Founder_Jay',
    avatar: '🌟',
    bio: 'Previously at Stripe. Now building my own startup. Looking to connect with potential co-founders and early engineers.',
    company: 'Jay\'s Startup',
    job_title: 'Founder & CEO',
    location: 'San Francisco, CA',
    years_experience: 9,
    skills: ['Entrepreneurship', 'Full-Stack', 'Leadership', 'Fundraising'],
    linkedin_url: 'https://linkedin.com/in/startupjay'
  }
];

const referralPosts = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    type: 'request',
    title: 'Seeking Software Engineer Referral at Google',
    company: 'Google',
    job_title: 'Senior Software Engineer',
    job_link: 'https://careers.google.com/jobs/results/123456789',
    description: 'I\'m a senior full-stack developer with 5+ years of experience building scalable web applications. My expertise includes React, Node.js, TypeScript, and AWS. I\'ve led teams of 3-5 engineers and have experience with microservices architecture. I\'m particularly interested in Google\'s work on cloud infrastructure and would love to contribute to projects like GCP or Google Cloud Console. Would really appreciate a referral!',
    scope: 'global',
    status: 'open',
    tags: ['google', 'software-engineer', 'full-stack', 'senior-level', 'cloud'],
    views_count: 156,
    likes_count: 23,
    comments_count: 8,
    bookmarks_count: 15,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    user_id: '00000000-0000-0000-0000-000000000002',
    type: 'offer',
    title: 'Microsoft Referrals - PM & Engineering Roles',
    company: 'Microsoft',
    description: 'Senior PM at Microsoft with 8 years of experience. I can provide referrals for Product Manager and Software Engineer positions across various teams including Azure, Office, and Windows. Please share: 1) Your background and experience, 2) Target role and team, 3) Why Microsoft interests you. I\'ll review and connect with promising candidates. Please note: I can\'t guarantee interviews, but I\'ll do my best to get your resume in front of the right people.',
    scope: 'global',
    status: 'open',
    available_slots: 2,
    total_slots: 5,
    tags: ['microsoft', 'product-manager', 'software-engineer', 'azure', 'referral-offer'],
    views_count: 234,
    likes_count: 45,
    comments_count: 18,
    bookmarks_count: 32,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    user_id: '00000000-0000-0000-0000-000000000003',
    type: 'request',
    title: 'Data Scientist Position at Meta, Google, or Amazon',
    company: 'Meta, Google, Amazon',
    job_title: 'Data Scientist',
    description: 'PhD in Statistics with 3 years industry experience specializing in ML/AI, NLP, and computer vision. Published 5 papers in top-tier conferences (NeurIPS, ICML). Experience with production ML systems, A/B testing, and data-driven decision making. Open to roles at any of the major tech companies. My research focuses on improving recommendation systems and natural language understanding.',
    scope: 'global',
    status: 'open',
    tags: ['data-science', 'machine-learning', 'nlp', 'faang', 'phd', 'research'],
    views_count: 189,
    likes_count: 31,
    comments_count: 12,
    bookmarks_count: 22,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    user_id: '00000000-0000-0000-0000-000000000004',
    type: 'offer',
    title: 'Goldman Sachs - Finance & Technology Referrals',
    company: 'Goldman Sachs',
    description: 'VP at Goldman Sachs with extensive experience in both finance and technology divisions. I can refer candidates for: Trading Systems Engineering, Quantitative Analysis, Risk Management, and Technology roles. Looking for candidates with: Strong analytical skills, Experience with Java/Python/C++, Understanding of financial markets (for front-office roles). Limited slots available - please only reach out if you have relevant experience and genuine interest.',
    scope: 'company',
    status: 'open',
    available_slots: 1,
    total_slots: 3,
    tags: ['goldman-sachs', 'finance', 'trading', 'quantitative', 'fintech'],
    views_count: 145,
    likes_count: 18,
    comments_count: 9,
    bookmarks_count: 14,
    created_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    user_id: '00000000-0000-0000-0000-000000000008',
    type: 'request',
    title: 'Looking for SRE Referral at Netflix or Datadog',
    company: 'Netflix, Datadog',
    job_title: 'Site Reliability Engineer',
    description: '4 years DevOps experience looking to transition into SRE. Strong background in: Kubernetes, Docker, CI/CD pipelines, Infrastructure as Code (Terraform), Monitoring & Observability. I\'ve managed production systems serving 1M+ users. Passionate about building reliable, scalable systems. Netflix and Datadog are my top choices because of their engineering culture and focus on reliability.',
    scope: 'global',
    status: 'open',
    tags: ['sre', 'devops', 'kubernetes', 'netflix', 'datadog', 'infrastructure'],
    views_count: 98,
    likes_count: 14,
    comments_count: 6,
    bookmarks_count: 8,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    user_id: '00000000-0000-0000-0000-000000000006',
    type: 'offer',
    title: 'Google Software Engineering Referrals Available',
    company: 'Google',
    description: 'L5 SWE at Google working on distributed systems. I can provide referrals for SWE positions (L3-L5). What I\'m looking for: Strong fundamentals in algorithms and data structures, Experience with large-scale systems, Good communication skills, Passion for solving complex problems. Please share your background, target level, and what excites you about Google. I typically respond within 48 hours.',
    scope: 'global',
    status: 'open',
    available_slots: 3,
    total_slots: 5,
    tags: ['google', 'software-engineer', 'distributed-systems', 'l3', 'l4', 'l5'],
    views_count: 312,
    likes_count: 67,
    comments_count: 25,
    bookmarks_count: 48,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    user_id: '00000000-0000-0000-0000-000000000009',
    type: 'offer',
    title: 'Amazon PM Referrals + Interview Prep Help',
    company: 'Amazon',
    description: 'Senior PM at Amazon. Not only can I refer you, but I can also help you prepare for the interview process! I\'ve been through multiple Amazon interview loops and know what the bar is. Offering: Referrals for PM roles (L5-L6), Mock interviews focused on leadership principles, Resume review, Tips for writing strong narratives. Ideal for: 3-7 years PM experience, Strong track record of shipped products, Interest in e-commerce or AWS.',
    scope: 'global',
    status: 'open',
    available_slots: 4,
    total_slots: 6,
    tags: ['amazon', 'product-manager', 'interview-prep', 'leadership-principles', 'mentorship'],
    views_count: 267,
    likes_count: 52,
    comments_count: 21,
    bookmarks_count: 39,
    created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 90 * 60 * 1000).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    user_id: '00000000-0000-0000-0000-000000000005',
    type: 'request',
    title: 'Senior Product Designer Role at Stripe',
    company: 'Stripe',
    job_title: 'Senior Product Designer',
    job_link: 'https://stripe.com/jobs/listing/senior-product-designer/4567890',
    description: '6 years of product design experience with focus on fintech and payments. Led design for mobile apps used by 2M+ users. Strong portfolio showcasing end-to-end product design, user research, and design systems work. Stripe\'s mission to increase the GDP of the internet really resonates with me. Would love to contribute to making online payments more accessible.',
    scope: 'global',
    status: 'open',
    tags: ['stripe', 'product-design', 'ux', 'fintech', 'payments', 'senior'],
    views_count: 87,
    likes_count: 11,
    comments_count: 4,
    bookmarks_count: 6,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    user_id: '00000000-0000-0000-0000-000000000007',
    type: 'offer',
    title: 'Meta Hiring Insights & Referrals (IC3-IC5)',
    company: 'Meta',
    description: 'Technical Recruiter at Meta here! While I can\'t make hiring decisions, I can: Provide referrals that get prioritized, Share insights about what we\'re looking for, Give feedback on your resume, Explain our interview process in detail. Currently hiring across: Software Engineering, Data Science, Product Management, Product Design. Pro tip: Make sure your experience matches the job description and highlight impact with metrics!',
    scope: 'global',
    status: 'open',
    available_slots: 8,
    total_slots: 10,
    tags: ['meta', 'facebook', 'referral', 'recruiting', 'hiring', 'all-roles'],
    views_count: 401,
    likes_count: 89,
    comments_count: 34,
    bookmarks_count: 67,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    user_id: '00000000-0000-0000-0000-000000000010',
    type: 'offer',
    title: 'Early Stage Startup - Founding Engineer Roles',
    company: 'TechVenture (Stealth Startup)',
    description: 'Ex-Stripe engineer building a fintech startup. Series A funded ($10M). Looking for founding engineers who want equity and impact. Roles: Full-stack engineers (React/Node/Python), DevOps/Infrastructure, Mobile engineers (React Native). What we offer: 0.5-2% equity, Competitive salary, Work directly with founders, Shape product direction. Only reach out if you\'re genuinely interested in startups!',
    scope: 'global',
    status: 'open',
    available_slots: 3,
    total_slots: 4,
    tags: ['startup', 'founding-engineer', 'equity', 'fintech', 'early-stage'],
    views_count: 178,
    likes_count: 34,
    comments_count: 15,
    bookmarks_count: 28,
    created_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    last_activity_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  }
];

export async function seedReferralData() {
  try {
    console.log('Starting to seed referral data...');

    // Insert user profiles
    console.log('Inserting user profiles...');
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .upsert(userProfiles, { onConflict: 'id' });

    if (profilesError) {
      console.error('Error inserting profiles:', profilesError);
      throw profilesError;
    }
    console.log(`✓ Inserted ${userProfiles.length} user profiles`);

    // Insert referral posts
    console.log('Inserting referral posts...');
    const { error: postsError } = await supabase
      .from('referral_posts')
      .upsert(referralPosts, { onConflict: 'id' });

    if (postsError) {
      console.error('Error inserting posts:', postsError);
      throw postsError;
    }
    console.log(`✓ Inserted ${referralPosts.length} referral posts`);

    // Add some sample comments
    const comments = [
      {
        referral_post_id: '10000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000006',
        content: 'Hey! I\'m an L5 at Google. Your background looks solid. What team are you interested in? Cloud is hiring a lot right now.'
      },
      {
        referral_post_id: '10000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000007',
        content: 'Make sure to highlight your system design experience in your resume. That\'s what Google really looks for at senior levels.'
      },
      {
        referral_post_id: '10000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000001',
        content: 'I\'m very interested! I have 5 years of SWE experience and would love to work on Azure. Can I DM you my resume?'
      },
      {
        referral_post_id: '10000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000008',
        content: 'Are you open to referring DevOps engineers as well? I have experience with Azure infrastructure.'
      },
      {
        referral_post_id: '10000000-0000-0000-0000-000000000006',
        user_id: '00000000-0000-0000-0000-000000000003',
        content: 'Would you consider ML/AI engineers? I have a PhD in ML and 3 years industry experience.'
      },
      {
        referral_post_id: '10000000-0000-0000-0000-000000000006',
        user_id: '00000000-0000-0000-0000-000000000001',
        content: 'This is exactly what I\'m looking for! I\'ll connect with you through DM. Thanks for offering!'
      },
      {
        referral_post_id: '10000000-0000-0000-0000-000000000009',
        user_id: '00000000-0000-0000-0000-000000000005',
        content: 'As a recruiter, what do you think is the most common mistake candidates make in their Meta applications?'
      },
      {
        referral_post_id: '10000000-0000-0000-0000-000000000009',
        user_id: '00000000-0000-0000-0000-000000000007',
        content: 'Not quantifying their impact! Always use metrics. "Increased performance" vs "Increased performance by 40%, reducing load time from 5s to 3s"'
      }
    ];

    console.log('Inserting comments...');
    const { error: commentsError } = await supabase
      .from('referral_comments')
      .insert(comments);

    if (commentsError) {
      console.error('Error inserting comments:', commentsError);
      throw commentsError;
    }
    console.log(`✓ Inserted ${comments.length} comments`);

    // Add some likes
    const likes = [
      { referral_post_id: '10000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000002' },
      { referral_post_id: '10000000-0000-0000-0000-000000000001', user_id: '00000000-0000-0000-0000-000000000006' },
      { referral_post_id: '10000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000001' },
      { referral_post_id: '10000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000003' },
      { referral_post_id: '10000000-0000-0000-0000-000000000006', user_id: '00000000-0000-0000-0000-000000000001' },
      { referral_post_id: '10000000-0000-0000-0000-000000000009', user_id: '00000000-0000-0000-0000-000000000005' }
    ];

    console.log('Inserting likes...');
    const { error: likesError } = await supabase
      .from('referral_likes')
      .insert(likes);

    if (likesError) {
      console.error('Error inserting likes:', likesError);
      throw likesError;
    }
    console.log(`✓ Inserted ${likes.length} likes`);

    // Add some bookmarks
    const bookmarks = [
      { referral_post_id: '10000000-0000-0000-0000-000000000002', user_id: '00000000-0000-0000-0000-000000000001' },
      { referral_post_id: '10000000-0000-0000-0000-000000000006', user_id: '00000000-0000-0000-0000-000000000003' },
      { referral_post_id: '10000000-0000-0000-0000-000000000009', user_id: '00000000-0000-0000-0000-000000000001' }
    ];

    console.log('Inserting bookmarks...');
    const { error: bookmarksError } = await supabase
      .from('referral_bookmarks')
      .insert(bookmarks);

    if (bookmarksError) {
      console.error('Error inserting bookmarks:', bookmarksError);
      throw bookmarksError;
    }
    console.log(`✓ Inserted ${bookmarks.length} bookmarks`);

    console.log('✓ Seed data inserted successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, error };
  }
}

export { userProfiles, referralPosts };
