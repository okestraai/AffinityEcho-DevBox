// Spaces: who can post where, Shared forums and the student check.
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from './testUtils';
import { CreateTopicModal } from '../components/Modals/ForumModals/CreateTopicModal';
import { AudiencePicker } from '../components/shared/AudiencePicker';
import { StudentCheckPrompt } from '../components/dashboard/Profile/StudentCheckPrompt';
import { NooksFilters } from '../components/dashboard/Nooks/NooksFilters';
import { CreateForumTopic, GetGlobalScopeMetrics } from '../../api/forumApis';
import { AnswerStudentCheck } from '../../api/profileApis';
import { useAuth } from '../hooks/useAuth';
import { DecryptData } from '../../api/EncrytionApis';

vi.mock('../../api/forumApis', () => ({
  CreateForumTopic: vi.fn().mockResolvedValue({}),
  GetGlobalScopeMetrics: vi.fn(),
  GetUserJoinedForums: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../api/profileApis', () => ({
  AnswerStudentCheck: vi.fn().mockResolvedValue({}),
}));
vi.mock('../../api/EncrytionApis', () => ({
  DecryptData: vi.fn().mockResolvedValue({ decryptedData: 'Google' }),
}));
vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../Helper/ShowToast', () => ({ showToast: vi.fn() }));

const updateUser = vi.fn();
const asUser = (over: Record<string, unknown> = {}) =>
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'u1', company_encrypted: 'enc', company_type: 'static', is_student: false, ...over },
    updateUser,
  } as unknown as ReturnType<typeof useAuth>);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(GetGlobalScopeMetrics).mockResolvedValue({
    forums: [
      { id: 'g1', name: 'Tech Careers', is_global: true },
      { id: 's1', name: 'Parenting', is_global: true, is_shared: true },
      { id: 'ot', name: 'Other topics', is_global: true, is_other_topics: true },
    ],
  });
});

describe('AudiencePicker', () => {
  it('offers Students only to students', () => {
    const { rerender } = renderWithRouter(
      <AudiencePicker value="everyone" onChange={() => {}} isStudent={false} companyLabel="Google" />,
    );
    expect(screen.queryByText('Students')).toBeNull();
    rerender(<AudiencePicker value="everyone" onChange={() => {}} isStudent companyLabel="Google" />);
    expect(screen.getByText('Students')).toBeInTheDocument();
  });

  it("can't pick My company without a company", () => {
    renderWithRouter(<AudiencePicker value="everyone" onChange={() => {}} isStudent={false} companyLabel="" />);
    expect(screen.getByText('My company').closest('button')).toBeDisabled();
  });
});

describe('new topic', () => {
  it('posts to Other topics with an audience and a label when no forum is picked', async () => {
    asUser({ is_student: true });
    renderWithRouter(<CreateTopicModal isOpen onClose={() => {}} />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Students'));
    await user.type(screen.getByLabelText(/Label/), '  visas ');
    await user.type(screen.getByPlaceholderText("What's on your mind?"), 'Visa wait');
    await user.type(screen.getByPlaceholderText(/Share your thoughts/), 'Anyone else?');
    await user.click(screen.getByText('Post Topic'));

    await waitFor(() => expect(CreateForumTopic).toHaveBeenCalled());
    const payload = vi.mocked(CreateForumTopic).mock.calls[0][0];
    expect(payload).toMatchObject({ audience: 'students', label: 'visas' });
    expect(payload.forumId).toBeUndefined();
    expect(payload.companyName).toBeUndefined();
  });

  it('says a Shared forum posts to everyone, and leaves Other topics out of the forum list', async () => {
    asUser();
    renderWithRouter(<CreateTopicModal isOpen onClose={() => {}} />);
    const user = userEvent.setup();
    const select = await screen.findByLabelText(/Forum/);
    await waitFor(() => expect(screen.getByRole('option', { name: /Parenting/ })).toBeInTheDocument());
    // Other topics is the "no forum" choice, not a listed forum.
    expect(document.querySelector('option[value="ot"]')).toBeNull();
    await user.selectOptions(select, 's1');
    expect(screen.getByText('Posting to everyone on Affinity Echo')).toBeInTheDocument();
  });
});

describe('new topic from a space page', () => {
  const postFrom = async (space: string) => {
    renderWithRouter(<CreateTopicModal isOpen onClose={() => {}} forumName={space} space={space} />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("What's on your mind?"), 'Hello');
    await user.type(screen.getByPlaceholderText(/Share your thoughts/), 'Body');
    await user.click(screen.getByText('Post Topic'));
    await waitFor(() => expect(CreateForumTopic).toHaveBeenCalled());
    return vi.mocked(CreateForumTopic).mock.calls[0][0];
  };

  it('posts to Students when opened from the Students space', async () => {
    asUser({ is_student: true });
    expect(await postFrom('Students')).toMatchObject({ audience: 'students' });
  });

  it("posts to the member's company when opened from their company space", async () => {
    asUser();
    renderWithRouter(<CreateTopicModal isOpen onClose={() => {}} forumName="Google" space="Google" />);
    await waitFor(() => expect(screen.getByText('My company').closest('button')).toHaveAttribute('aria-pressed', 'true'));
  });

  it("doesn't claim a past company's space in the heading", async () => {
    asUser();
    renderWithRouter(<CreateTopicModal isOpen onClose={() => {}} forumName="OldCo" space="OldCo" />);
    await waitFor(() => expect(DecryptData).toHaveBeenCalled());
    expect(screen.getByText('Create New Topic')).toBeInTheDocument();
    expect(screen.queryByText(/in OldCo/)).toBeNull();
    expect(screen.getByText('Everyone').closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it("can't post from a company space until the member's company is known", async () => {
    asUser();
    vi.mocked(DecryptData).mockReturnValueOnce(new Promise(() => {}));
    renderWithRouter(<CreateTopicModal isOpen onClose={() => {}} forumName="Google" space="Google" />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("What's on your mind?"), 'Hello');
    await user.type(screen.getByPlaceholderText(/Share your thoughts/), 'Body');
    expect(screen.getByText('Post Topic').closest('button')).toBeDisabled();
  });
});

describe('Still a student?', () => {
  const openAt = (url: string) =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <StudentCheckPrompt />
      </MemoryRouter>,
    );

  it('shows only when the notification link asks, and only to students', () => {
    asUser({ is_student: false });
    const first = openAt('/dashboard?student-check=1');
    expect(screen.queryByText('Still a student?')).toBeNull();
    first.unmount();

    asUser({ is_student: true });
    const second = openAt('/dashboard');
    expect(screen.queryByText('Still a student?')).toBeNull();
    second.unmount();

    openAt('/dashboard?student-check=1');
    expect(screen.getByText('Still a student?')).toBeInTheDocument();
  });

  it('sends "no" and updates the member', async () => {
    asUser({ is_student: true });
    render(
      <MemoryRouter initialEntries={['/dashboard?student-check=1']}>
        <StudentCheckPrompt />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByText("No, I've finished"));
    await waitFor(() => expect(AnswerStudentCheck).toHaveBeenCalledWith({ stillStudent: false }));
    expect(updateUser).toHaveBeenCalledWith({ is_student: false, expected_grad_year: null });
  });
});

describe('Nooks filter', () => {
  const filters = { urgency: 'all', scope: 'all', temperature: 'all', hashtag: '' } as const;

  it('offers Students only to students', () => {
    asUser({ is_student: false });
    const first = renderWithRouter(<NooksFilters filters={filters} onFilterChange={() => {}} onReset={() => {}} />);
    expect(screen.queryByRole('option', { name: 'Students' })).toBeNull();
    first.unmount();

    asUser({ is_student: true });
    renderWithRouter(<NooksFilters filters={filters} onFilterChange={() => {}} onReset={() => {}} />);
    expect(screen.getByRole('option', { name: 'Students' })).toBeInTheDocument();
  });
});
