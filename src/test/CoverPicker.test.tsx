// The event cover picker: shows the current picture, removes it, and refuses files that aren't pictures.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoverPicker } from '../components/events/CoverPicker';
import { showToast } from '../Helper/ShowToast';

vi.mock('../Helper/ShowToast', () => ({ showToast: vi.fn() }));

describe('CoverPicker', () => {
  it('offers to add a picture when there is none', () => {
    render(<CoverPicker currentUrl={null} onChange={vi.fn()} />);
    expect(screen.getByText('Add a cover picture')).toBeInTheDocument();
  });

  it('shows the current picture and removes it', async () => {
    const onChange = vi.fn();
    render(<CoverPicker currentUrl="/cover/x?v=1" onChange={onChange} />);
    expect(screen.getByAltText('Cover preview')).toHaveAttribute('src', '/cover/x?v=1');
    await userEvent.setup().click(screen.getByRole('button', { name: /Remove/ }));
    expect(onChange).toHaveBeenCalledWith({ file: null, remove: true });
    expect(screen.getByText('Add a cover picture')).toBeInTheDocument();
  });

  it('refuses a file that is not a picture', async () => {
    const onChange = vi.fn();
    const { container } = render(<CoverPicker currentUrl={null} onChange={onChange} />);
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    await userEvent.setup({ applyAccept: false }).upload(input, new File(['hi'], 'notes.txt', { type: 'text/plain' }));
    expect(showToast).toHaveBeenCalledWith('Choose a picture file.', 'error');
    expect(onChange).not.toHaveBeenCalled();
  });
});
