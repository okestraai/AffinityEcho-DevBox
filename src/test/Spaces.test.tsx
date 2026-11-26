// Spaces: who can post where, Shared forums and the student check.
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from './testUtils';
import { CreateTopicModal } from '../components/Modals/ForumModals/CreateTopicModal';
import { AudiencePicker } from '../components/shared/AudiencePicker';
import { StudentCheckPrompt } from '../components/dashboard/Profile/StudentCheckPrompt';
import { CreateForumTopic, GetGlobalScopeMetrics } from '../../api/forumApis';
import { AnswerStudentCheck } from '../../api/profileApis';
import { useAuth } from '../hooks/useAuth';

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
