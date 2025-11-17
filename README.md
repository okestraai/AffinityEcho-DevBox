# Affinity Echo

An anonymous-first professional networking platform designed for underrepresented communities in tech.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/affinity-echo.git
cd affinity-echo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Setup

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for detailed setup instructions.

## Features

- **Anonymous Forums**: Safe space discussions with affinity-based communities
- **Nooks**: Specialized interest groups for deeper connections
- **Referral Marketplace**: Connect job seekers with employees offering referrals
- **Mentorship Platform**: Find and match with mentors based on goals and experience
- **Secure Messaging**: End-to-end encrypted conversations with progressive identity reveal
- **Real-time Notifications**: Dropdown notification system with live updates
- **Connection Requests**: Manage referral connections and identity reveals
- **Find Mentorship**: Browse and search for available mentors

## Available Routes

### Dashboard Routes
- `/dashboard/forums` - Community discussions
- `/dashboard/nooks` - Interest groups
- `/dashboard/messages` - Secure messaging
- `/dashboard/mentorship` - Your mentorship relationships
- `/dashboard/find-mentorship` - Search for mentors
- `/dashboard/referrals` - Job referral marketplace
- `/dashboard/connections` - Connection requests management
- `/dashboard/profile` - User profile

### Notifications
- Accessible via bell icon dropdown (no dedicated route)
- Real-time updates via Supabase subscriptions
- Mark as read, delete, and take actions directly from dropdown

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Icons**: Lucide React
- **Routing**: React Router v7

## Available Scripts

```bash
# Development
npm run dev          # Start dev server at http://localhost:5173

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint --fix   # Fix auto-fixable issues
```

## Project Structure

```
src/
├── components/
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard views and components
│   │   ├── ForumsView.tsx
│   │   ├── NooksView.tsx
│   │   ├── MessagesView.tsx
│   │   ├── MentorshipView.tsx
│   │   ├── FindMentorshipView.tsx
│   │   ├── ReferralsView.tsx
│   │   ├── ConnectionRequestsView.tsx
│   │   ├── ProfileView.tsx
│   │   ├── NotificationsDropdown.tsx
│   │   └── ...
│   └── onboarding/        # Onboarding flow
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utilities and services
├── types/                 # TypeScript types
└── App.tsx               # Main app with routing

supabase/
└── migrations/           # Database migrations
```

## Key Features

### Progressive Identity Revelation
All users start anonymous. Identities can only be revealed through mutual consent after meaningful connections are established.

### Real-time Notifications System
- Dropdown modal accessed via bell icon
- Live updates using Supabase real-time subscriptions
- Action buttons for direct responses
- Mark as read/delete functionality
- Unread count badge

### Connection Management
- Send and receive connection requests
- Anonymous chat phase
- Identity reveal request system
- Full profile access post-reveal

### Security
- Row Level Security (RLS) policies
- Email/password authentication via Supabase
- Secure data storage
- Privacy-first architecture

## Documentation

- [Feature Summary](./FEATURE_SUMMARY.md) - Comprehensive feature documentation
- [Executive Summary](./EXECUTIVE_SUMMARY.md) - Business overview and vision
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Setup and configuration guide

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linter and fix issues
5. Test thoroughly
6. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Create a GitHub issue
- Check documentation in `/docs`
- Review [Supabase documentation](https://supabase.com/docs)

---

**Built with ❤️ for underrepresented professionals in tech**
