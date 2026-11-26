// Events: the public page, registering by email code, and the helpers behind them.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EventPage } from '../components/events/EventPage';
import { CodeSignIn } from '../components/auth/CodeSignIn';
import { zonedToIso, isoToZoned } from '../components/events/EventFormPage';
import { rememberReturnTo, takeReturnTo } from '../utils/returnTo';
import { eventWhen } from '../utils/eventTime';
import {
  GetEventForMember,
  GetPublicEvent,
  RegisterForEvent,
  RevealEventDetails,
} from '../../api/eventApis';
import { SendSignInCode, VerifySignInCode } from '../../api/authApis';
import { useAuth } from '../hooks/useAuth';
import { useAuth as useContextAuth } from '../contexts/AuthContext';

vi.mock('../../api/eventApis', () => ({
  GetPublicEvent: vi.fn(),
  GetEventForMember: vi.fn(),
  RegisterForEvent: vi.fn(),
  RevealEventDetails: vi.fn(),
}));
vi.mock('../../api/authApis', () => ({
  SendSignInCode: vi.fn().mockResolvedValue({ message: 'If this email can sign in, a code is on its way.' }),
  VerifySignInCode: vi.fn(),
}));
vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../Helper/ShowToast', () => ({ showToast: vi.fn() }));

const event = {
  id: 'e1',
  slug: 'career-night-abcdef',
  title: 'Career night',
  description: 'Talks',
  mode: 'hybrid',
  startsAt: '2026-12-10T17:00:00.000Z',
  endsAt: '2026-12-10T19:00:00.000Z',
  timeZone: 'Africa/Lagos',
  venueName: 'Hub One',
  venueCity: 'Lagos',
  organiserName: 'Lagos Grads',
  status: 'published',
  registrationOpen: true,
  placesLeft: { inPerson: 3, online: null },
};

const signInWithCode = vi.fn();
const asVisitor = (signedIn: boolean) => {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: signedIn,
    isLoading: false,
    user: signedIn ? { id: 'u1', first_name: 'Ada' } : null,
  } as unknown as ReturnType<typeof useAuth>);
  vi.mocked(useContextAuth).mockReturnValue({ signInWithCode } as unknown as ReturnType<typeof useContextAuth>);
};

const openEvent = () =>
  render(
    <MemoryRouter initialEntries={[`/events/${event.slug}`]}>
      <Routes>
        <Route path="/events/:slug" element={<EventPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('public event page', () => {
  it('shows the venue name and city but not the address or join link, and says the host sees your name', async () => {
    asVisitor(false);
    vi.mocked(GetPublicEvent).mockResolvedValue(event as never);
    openEvent();
    expect(await screen.findByText('Career night')).toBeInTheDocument();
    expect(screen.getByText('Hub One')).toBeInTheDocument();
    expect(screen.getByText(/Lagos · full address shared with guests/)).toBeInTheDocument();
    expect(screen.getByText('The join link is shared with guests.')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('Allen Avenue');
    expect(screen.getByText('Your name will be shown to the host.')).toBeInTheDocument();
    // Sharing the email is off until the guest ticks it.
    expect(screen.getByLabelText(/Share my email with the host/)).not.toBeChecked();
  });

  it('registers a signed-in member in one tap', async () => {
    asVisitor(true);
    vi.mocked(GetEventForMember).mockResolvedValue({ ...event, isHost: false, registration: null, details: null } as never);
    vi.mocked(RegisterForEvent).mockResolvedValue({
      ...event,
      isHost: false,
      registration: { id: 'r1', attendance: 'in_person', shareEmail: false, checkInCode: 'ABCD2345', checkedIn: false },
      details: { venueAddress: '12 Allen Avenue', mapUrl: null, joinUrl: 'https://meet.example.com/a' },
    } as never);
    openEvent();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Register' }));
    await waitFor(() =>
      expect(RegisterForEvent).toHaveBeenCalledWith(event.slug, expect.objectContaining({ attendance: 'in_person', shareEmail: false })),
    );
    expect(await screen.findByText("You're registered")).toBeInTheDocument();
    expect(screen.getByText(/12 Allen Avenue, Lagos/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Join the event/ })).toHaveAttribute('href', 'https://meet.example.com/a');
    expect(screen.getByText('ABCD2345')).toBeInTheDocument();
  });

  it("shows a guest's join link after they enter their event code", async () => {
    asVisitor(false);
    vi.mocked(GetPublicEvent).mockResolvedValue(event as never);
    vi.mocked(RevealEventDetails).mockResolvedValue({ attendance: 'online', venueAddress: null, mapUrl: null, joinUrl: 'https://meet.example.com/x' });
    openEvent();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Already registered?'), 'abcd-2345');
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(RevealEventDetails).toHaveBeenCalledWith(event.slug, 'ABCD2345');
    expect(await screen.findByRole('link', { name: /Join the event/ })).toHaveAttribute('href', 'https://meet.example.com/x');
    expect(document.body.textContent).not.toContain('Allen Avenue');
  });

  it('says when registration is closed', async () => {
    asVisitor(false);
    vi.mocked(GetPublicEvent).mockResolvedValue({ ...event, registrationOpen: false } as never);
    openEvent();
    expect(await screen.findByText('Registration is closed.')).toBeInTheDocument();
  });
});

describe('email code sign-in', () => {
  it('sends a code, then signs in with the name and terms', async () => {
    asVisitor(false);
    const data = { access_token: 'a', refresh_token: 'r', user: { id: 'u9', has_completed_onboarding: false } };
    vi.mocked(VerifySignInCode).mockResolvedValue(data as never);
    const onSignedIn = vi.fn();
    render(
      <MemoryRouter>
        <CodeSignIn askName onSignedIn={onSignedIn} />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('First name'), 'Tolu');
    await user.type(screen.getByLabelText('Email'), 'tolu@example.com');
    // The code can't be sent until the terms are ticked, so it isn't wasted.
    expect(screen.getByRole('button', { name: /Email me a code/ })).toBeDisabled();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /Email me a code/ }));
    expect(SendSignInCode).toHaveBeenCalledWith('tolu@example.com');
    await user.type(await screen.findByLabelText('6-digit code'), '12a3456');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() =>
      expect(VerifySignInCode).toHaveBeenCalledWith({
        email: 'tolu@example.com',
        code: '123456',
        firstName: 'Tolu',
        lastName: undefined,
        termsAccepted: true,
      }),
    );
    expect(signInWithCode).toHaveBeenCalledWith(data);
    expect(onSignedIn).toHaveBeenCalledWith(data);
  });
});

describe('helpers', () => {
  it('turns a local time in the event zone into the exact moment and back', () => {
    expect(zonedToIso('2026-12-10T18:00', 'Africa/Lagos')).toBe('2026-12-10T17:00:00.000Z');
    expect(zonedToIso('2026-07-01T09:30', 'America/New_York')).toBe('2026-07-01T13:30:00.000Z');
    expect(isoToZoned('2026-12-10T17:00:00.000Z', 'Africa/Lagos')).toBe('2026-12-10T18:00');
    // Right after New York's clocks go forward: 03:30 EDT is 07:30 UTC.
    expect(zonedToIso('2026-03-08T03:30', 'America/New_York')).toBe('2026-03-08T07:30:00.000Z');
    expect(zonedToIso('2026-11-01T09:00', 'America/New_York')).toBe('2026-11-01T14:00:00.000Z');
  });

  it("shows the event's own time when the viewer is elsewhere", () => {
    const same = eventWhen(event.startsAt, event.endsAt, 'Africa/Lagos', 'Africa/Lagos');
    expect(same.there).toBeNull();
    const away = eventWhen(event.startsAt, event.endsAt, 'Africa/Lagos', 'Asia/Tokyo');
    expect(away.there).toMatch(/where it happens/);
  });

  it('remembers only event pages to return to after onboarding', () => {
    rememberReturnTo('/events/career-night-abcdef');
    expect(takeReturnTo()).toBe('/events/career-night-abcdef');
    expect(takeReturnTo()).toBeNull();
    rememberReturnTo('https://evil.example.com');
    rememberReturnTo('/admin');
    expect(takeReturnTo()).toBeNull();
  });
});
