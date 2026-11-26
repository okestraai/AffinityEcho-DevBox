// Onboarding and the country prompt for members everywhere.
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from './testUtils';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { CountryPrompt } from '../components/dashboard/Profile/CountryPrompt';
import { guessCountry } from '../constants/countries';
import { CreateOnboardingProfile } from '../../api/authApis';
import { DismissCountryPrompt, UpdateEditableProfile } from '../../api/profileApis';
import { useAuth as useContextAuth } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';

vi.mock('../../api/authApis', () => ({ CreateOnboardingProfile: vi.fn() }));
vi.mock('../../api/profileApis', () => ({
  GetCompanies: vi.fn().mockResolvedValue([{ id: 'c1', name: 'Google' }]),
  UpdateEditableProfile: vi.fn().mockResolvedValue({}),
  DismissCountryPrompt: vi.fn().mockResolvedValue({}),
}));
vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../Helper/ShowToast', () => ({ showToast: vi.fn() }));

const completeOnboarding = vi.fn();
const updateUser = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useContextAuth).mockReturnValue({ completeOnboarding } as any);
  vi.mocked(CreateOnboardingProfile).mockResolvedValue({});
});

const fillStepOne = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText('First name'), 'Ada');
  await user.type(screen.getByPlaceholderText('Last name'), 'Obi');
  await user.click(screen.getByLabelText(/18 years of age or older/));
};

describe('onboarding', () => {
  it('needs a country before moving on', async () => {
    renderWithRouter(<OnboardingFlow />);
    const user = userEvent.setup();
    await fillStepOne(user);
    await user.selectOptions(screen.getByLabelText(/Where are you based/), '');
    expect(screen.getByText('Continue Journey').closest('button')).toBeDisabled();
    await user.selectOptions(screen.getByLabelText(/Where are you based/), 'NG');
    expect(screen.getByText('Continue Journey').closest('button')).toBeEnabled();
  });

  it('sends country, ethnicities, a typed company and student details', async () => {
    renderWithRouter(<OnboardingFlow />);
    const user = userEvent.setup();
    await fillStepOne(user);
    await user.selectOptions(screen.getByLabelText(/Where are you based/), 'NG');
    await user.click(screen.getByLabelText('Caribbean'));
    await user.click(screen.getByText('Continue Journey'));

    await user.click(screen.getByText("I'm working"));
    await user.click(await screen.findByText('Not listed? Type your company'));
    await user.type(screen.getByLabelText('Company name'), 'Dangote');
    await user.click(screen.getByText("I'm a student"));
    expect(screen.getByText('Continue Journey').closest('button')).toBeDisabled();
    await user.type(screen.getByLabelText(/School, college or university/), 'Unilag');
    await user.click(screen.getByText('Continue Journey'));
    await user.click(screen.getByText('Complete Setup'));

    await waitFor(() => expect(CreateOnboardingProfile).toHaveBeenCalled());
    const payload = vi.mocked(CreateOnboardingProfile).mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        country: 'NG',
        ethnicities: ['Caribbean'],
        company: 'Dangote',
        isStudent: true,
        school: 'Unilag',
      }),
    );
    expect(payload).not.toHaveProperty('companyType');
  });

  it('lets a member skip school and work', async () => {
    renderWithRouter(<OnboardingFlow />);
    const user = userEvent.setup();
    await fillStepOne(user);
    await user.selectOptions(screen.getByLabelText(/Where are you based/), 'GB');
    await user.click(screen.getByText('Continue Journey'));
    await user.click(screen.getByText('Continue Journey'));
    await user.click(screen.getByText('Complete Setup'));
    await waitFor(() => expect(CreateOnboardingProfile).toHaveBeenCalled());
    const payload = vi.mocked(CreateOnboardingProfile).mock.calls[0][0];
    expect(payload).not.toHaveProperty('company');
    expect(payload.isStudent).toBe(false);
  });
});

describe('country prompt', () => {
  const asUser = (user: Record<string, unknown>) =>
    vi.mocked(useAuth).mockReturnValue({ user, updateUser } as any);

  it('shows for an onboarded member with no country', () => {
    asUser({ has_completed_onboarding: true });
    renderWithRouter(<CountryPrompt />);
    expect(screen.getByText('Where are you based?')).toBeInTheDocument();
  });

  it.each([
    ['a country is set', { has_completed_onboarding: true, country_code: 'NG' }],
    ['it was dismissed', { has_completed_onboarding: true, country_prompt_dismissed_at: '2026-01-01' }],
    ['onboarding is not finished', { has_completed_onboarding: false }],
  ])('stays hidden when %s', (_label, user) => {
    asUser(user);
    renderWithRouter(<CountryPrompt />);
    expect(screen.queryByText('Where are you based?')).not.toBeInTheDocument();
  });

  it('saves the chosen country', async () => {
    asUser({ has_completed_onboarding: true });
    renderWithRouter(<CountryPrompt />);
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Country'), 'KE');
    await user.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(UpdateEditableProfile).toHaveBeenCalledWith({ basic: { country_code: 'KE' } }),
    );
    expect(updateUser).toHaveBeenCalledWith({ country_code: 'KE' });
  });

  it('stops asking after "Not now"', async () => {
    asUser({ has_completed_onboarding: true });
    renderWithRouter(<CountryPrompt />);
    await userEvent.setup().click(screen.getByLabelText('Not now'));
    expect(DismissCountryPrompt).toHaveBeenCalled();
    expect(screen.queryByText('Where are you based?')).not.toBeInTheDocument();
  });
});

describe('guessCountry', () => {
  const setLanguage = (value: string) =>
    Object.defineProperty(navigator, 'language', { value, configurable: true });

  it('uses the country the browser names', () => {
    setLanguage('en-NG');
    expect(guessCountry()).toBe('NG');
  });

  it('assumes no country from a bare language', () => {
    setLanguage('en');
    expect(guessCountry()).toBe('');
  });
});
