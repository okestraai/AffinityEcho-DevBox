// Admin Settings: the Events and Storage sections.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '../admin/pages/SettingsPage';
import { GetAdminSettings, UpdateAdminSettings } from '../../api/adminApis';

vi.mock('../../api/adminApis', () => ({
  GetAdminSettings: vi.fn(),
  UpdateAdminSettings: vi.fn().mockResolvedValue({}),
}));

const saved = (over: Record<string, unknown> = {}) =>
  vi.mocked(GetAdminSettings).mockResolvedValue({
    events: { events_per_day: 7, covers_enabled: true, cover_max_mb: 1, update_grouping_minutes: 5 },
    storage: { cover_storage: 'database' },
    storage_status: { bucketReady: false, bucketName: null },
    ...over,
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(UpdateAdminSettings).mockReset().mockResolvedValue({});
});

describe('admin event settings', () => {
  it('shows the saved event values and saves changes', async () => {
    saved();
    render(<SettingsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Events/ }));
    expect(await screen.findByDisplayValue('7')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Allow cover pictures' }));
    await user.click(screen.getByRole('button', { name: '0.5 MB' }));
    await user.click(screen.getByRole('button', { name: /Save Changes/ }));
    await waitFor(() =>
      expect(UpdateAdminSettings).toHaveBeenCalledWith('events', {
        events_per_day: 7,
        covers_enabled: false,
        cover_max_mb: 0.5,
        update_grouping_minutes: 5,
        reminders_enabled: true,
        host_notices_enabled: true,
      }),
    );
    expect(await screen.findByText('Settings saved successfully!')).toBeInTheDocument();
  });

  it('turns guest reminders and host notices off', async () => {
    saved();
    render(<SettingsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Events/ }));
    await screen.findByDisplayValue('7');
    await user.click(screen.getByRole('switch', { name: 'Remind guests before events' }));
    await user.click(screen.getByRole('switch', { name: 'Tell hosts about new guests' }));
    await user.click(screen.getByRole('button', { name: /Save Changes/ }));
    await waitFor(() =>
      expect(UpdateAdminSettings).toHaveBeenCalledWith(
        'events',
        expect.objectContaining({ reminders_enabled: false, host_notices_enabled: false }),
      ),
    );
  });

  it('keeps the events-per-day value inside 1 to 50', async () => {
    saved({ events: { events_per_day: 50, covers_enabled: true, cover_max_mb: 2, update_grouping_minutes: 2 } });
    render(<SettingsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Events/ }));
    await screen.findByDisplayValue('50');
    await user.click(screen.getByTitle('Increase Events per host per day'));
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it("shows the server's reason when a value is refused", async () => {
    saved();
    vi.mocked(UpdateAdminSettings).mockImplementation(async (key) => {
      if (key === 'events') throw { response: { data: { message: 'Events per host per day must be a whole number from 1 to 50' } } };
      return {};
    });
    render(<SettingsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Events/ }));
    await screen.findByDisplayValue('7');
    await user.click(screen.getByTitle('Increase Events per host per day'));
    await user.click(screen.getByRole('button', { name: /Save Changes/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('from 1 to 50');
    expect(screen.queryByText('Settings saved successfully!')).not.toBeInTheDocument();
  });

  it('only lets the bucket be chosen once the server has one', async () => {
    saved();
    const { unmount } = render(<SettingsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Storage/ }));
    expect(await screen.findByRole('radio', { name: /Bucket/ })).toBeDisabled();
    unmount();

    saved({ storage_status: { bucketReady: true, bucketName: 'ae-covers' } });
    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /Storage/ }));
    const bucket = await screen.findByRole('radio', { name: /Bucket \(ae-covers\)/ });
    expect(bucket).toBeEnabled();
    await user.click(bucket);
    await user.click(screen.getByRole('button', { name: /Save Changes/ }));
    await waitFor(() => expect(UpdateAdminSettings).toHaveBeenCalledWith('storage', { cover_storage: 'bucket' }));
  });

  it('saves only the sections that changed, so a stored bucket choice does not block other saves', async () => {
    saved({ storage: { cover_storage: 'bucket' }, storage_status: { bucketReady: false, bucketName: null } });
    render(<SettingsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Events/ }));
    await screen.findByDisplayValue('7');
    await user.click(screen.getByTitle('Increase Events per host per day'));
    await user.click(screen.getByRole('button', { name: /Save Changes/ }));
    await waitFor(() => expect(UpdateAdminSettings).toHaveBeenCalledTimes(1));
    expect(vi.mocked(UpdateAdminSettings).mock.calls[0][0]).toBe('events');
    expect(await screen.findByText('Settings saved successfully!')).toBeInTheDocument();
  });
});
