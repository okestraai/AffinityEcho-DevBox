// src/test/NooksView.test.tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NooksView } from '../components/dashboard/Nooks/NooksView';
import { renderWithRouter } from './testUtils';

// Mock APIs
vi.mock('../../api/nookApis', () => ({
  GetNooks: vi.fn(),
  GetNookMetrics: vi.fn(),
  GetNookById: vi.fn(),
  ToggleNookBookmark: vi.fn(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock all child components to isolate NooksView logic
vi.mock('../components/dashboard/Nooks/NooksHero', () => ({
  NooksHero: () => <div data-testid="nooks-hero">NooksHero</div>,
}));

vi.mock('../components/dashboard/Nooks/NooksStats', () => ({
  NooksStats: (props: any) => (
    <div data-testid="nooks-stats">
      <span data-testid="active-nooks">{props.activeNooks}</span>
      <span data-testid="in-a-nook-now">{props.inANookNow}</span>
      <span data-testid="all-time-created">{props.allTimeNooksCreated}</span>
    </div>
  ),
}));

vi.mock('../components/dashboard/Nooks/NooksFilters', () => ({
  NooksFilters: (props: any) => (
    <div data-testid="nooks-filters">
      <button onClick={props.onReset} data-testid="reset-filters">Reset</button>
    </div>
  ),
}));

vi.mock('../components/dashboard/Nooks/NooksGrid', () => ({
  NooksGrid: (props: any) => (
    <div data-testid="nooks-grid">
      <span data-testid="nook-count">{props.nooks.length}</span>
      <button onClick={() => props.onNookClick('nook-1')} data-testid="click-nook">Open Nook</button>
      <button onClick={() => props.onCreateClick()} data-testid="create-nook-btn">Create</button>
      <button onClick={() => props.onViewModeChange('all')} data-testid="view-all">View All</button>
      {props.nooks.map((n: any) => (
        <div key={n.id} data-testid={`nook-${n.id}`}>
          <span>{n.title}</span>
          <button onClick={(e: any) => props.onBookmarkNook(n.id, e)} data-testid={`bookmark-${n.id}`}>Bookmark</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../components/dashboard/Nooks/NookDetails', () => ({
  NookDetail: (props: any) => (
    <div data-testid="nook-detail">
      <span>{props.nook.title}</span>
      <button onClick={props.onBack} data-testid="back-from-detail">Back</button>
    </div>
  ),
}));

vi.mock('../components/dashboard/Nooks/CreateNookCTA', () => ({
  CreateNookCTA: () => <div data-testid="create-nook-cta">CTA</div>,
}));

vi.mock('../components/dashboard/Nooks/InfiniteScrollLoader', () => ({
  InfiniteScrollLoader: () => <div data-testid="infinite-loader">Loader</div>,
}));

vi.mock('../../components/Modals/NooksModals/CreateNookModal', () => ({
  CreateNookModal: (props: any) => props.isOpen ? <div data-testid="create-modal">Modal</div> : null,
}));

vi.mock('../../components/Modals/UserProfileModal', () => ({
  UserProfileModal: () => null,
}));

vi.mock('../components/dashboard/OkestraPanel', () => ({
  OkestraPanel: () => null,
}));

import { GetNooks, GetNookMetrics, GetNookById, ToggleNookBookmark } from '../../api/nookApis';
import { useAuth } from '../hooks/useAuth';

const mockedGetNooks = vi.mocked(GetNooks);
const mockedGetNookMetrics = vi.mocked(GetNookMetrics);
const mockedGetNookById = vi.mocked(GetNookById);
const mockedToggleBookmark = vi.mocked(ToggleNookBookmark);
const mockedUseAuth = vi.mocked(useAuth);

const mockNooks = [
  { id: 'nook-1', title: 'Nook Alpha', description: 'First nook', urgency: 'high', user_has_bookmarked: false },
  { id: 'nook-2', title: 'Nook Beta', description: 'Second nook', urgency: 'low', user_has_bookmarked: true },
];

function setup() {
  mockedUseAuth.mockReturnValue({
    user: { id: 'u1', username: 'TestUser', avatar: '🚀' },
  } as any);

  // Mirrors what NooksView actually maps (NooksView.tsx:104). The old payload used
  // `anonymousUsers`/`totalMessageParticipants`, which the component never reads, so every stat
  // fell through to its `|| 0` default while the test asserted 100.
  mockedGetNookMetrics.mockResolvedValue({
    activeNooks: 5,
    inANookNow: 100,
    allTimeNooksCreated: 42,
    allTimeNookInteractions: 7,
  });

  mockedGetNooks.mockResolvedValue({
    nooks: mockNooks,
    pagination: { page: 1, totalPages: 1, total: 2 },
  });

  mockedGetNookById.mockResolvedValue({
    nook: {
      id: 'nook-1',
      title: 'Nook Alpha',
      description: 'First nook',
      members_count: 10,
      messages_count: 20,
      timeLeft: '2h',
      temperature: 'hot',
    },
    isMember: true,
    isCreator: false,
  });

  mockedToggleBookmark.mockResolvedValue({ success: true });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NooksView', () => {
  it('renders hero, stats, and grid on mount', async () => {
    setup();
    renderWithRouter(<NooksView />);

    await waitFor(() => {
      expect(screen.getByTestId('nooks-hero')).toBeInTheDocument();
    });

    expect(screen.getByTestId('nooks-stats')).toBeInTheDocument();
    expect(screen.getByTestId('nooks-grid')).toBeInTheDocument();
  });

  it('fetches stats and displays them', async () => {
    setup();
    renderWithRouter(<NooksView />);

    await waitFor(() => {
      expect(screen.getByTestId('active-nooks')).toHaveTextContent('5');
    });

    expect(screen.getByTestId('in-a-nook-now')).toHaveTextContent('100');
    expect(screen.getByTestId('all-time-created')).toHaveTextContent('42');
  });

  it('fetches and displays nooks in grid', async () => {
    setup();
    renderWithRouter(<NooksView />);

    await waitFor(() => {
      expect(screen.getByTestId('nook-count')).toHaveTextContent('2');
    });

    expect(screen.getByText('Nook Alpha')).toBeInTheDocument();
    expect(screen.getByText('Nook Beta')).toBeInTheDocument();
  });

  it('opens nook detail when nook is clicked', async () => {
    setup();
    renderWithRouter(<NooksView />);

    await waitFor(() => {
      expect(screen.getByTestId('click-nook')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('click-nook'));

    await waitFor(() => {
      expect(screen.getByTestId('nook-detail')).toBeInTheDocument();
    });

    expect(screen.getByText('Nook Alpha')).toBeInTheDocument();
  });

  it('returns from nook detail to list', async () => {
    setup();
    renderWithRouter(<NooksView />);

    await waitFor(() => {
      expect(screen.getByTestId('click-nook')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('click-nook'));

    await waitFor(() => {
      expect(screen.getByTestId('nook-detail')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('back-from-detail'));

    await waitFor(() => {
      expect(screen.getByTestId('nooks-grid')).toBeInTheDocument();
    });
  });

  it('toggles nook bookmark', async () => {
    setup();
    renderWithRouter(<NooksView />);

    await waitFor(() => {
      expect(screen.getByTestId('bookmark-nook-1')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('bookmark-nook-1'));

    await waitFor(() => {
      expect(mockedToggleBookmark).toHaveBeenCalledWith('nook-1');
    });
  });

  it('handles API error gracefully', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'u1', username: 'TestUser', avatar: '🚀' },
    } as any);

    mockedGetNookMetrics.mockRejectedValue(new Error('Network'));
    mockedGetNooks.mockRejectedValue(new Error('Network'));

    renderWithRouter(<NooksView />);

    // Should still render the grid (empty)
    await waitFor(() => {
      expect(screen.getByTestId('nooks-grid')).toBeInTheDocument();
    });
  });

  it('shows filters only in all view mode', async () => {
    setup();
    renderWithRouter(<NooksView />);

    await waitFor(() => {
      expect(screen.getByTestId('nooks-grid')).toBeInTheDocument();
    });

    // Filters should not be visible in grid mode
    expect(screen.queryByTestId('nooks-filters')).not.toBeInTheDocument();

    // Switch to all view
    const user = userEvent.setup();
    await user.click(screen.getByTestId('view-all'));

    await waitFor(() => {
      expect(screen.getByTestId('nooks-filters')).toBeInTheDocument();
    });
  });
});
