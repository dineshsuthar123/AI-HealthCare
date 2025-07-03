import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
    it('renders a primary button correctly', () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('bg-primary');
    });

    it('renders a secondary button when variant is secondary', () => {
        render(<Button variant="secondary">Secondary Button</Button>);
        const button = screen.getByRole('button', { name: /secondary button/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('bg-secondary');
    });

    it('renders a disabled button when disabled prop is true', () => {
        render(<Button disabled>Disabled Button</Button>);
        const button = screen.getByRole('button', { name: /disabled button/i });
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
    });

    it('calls onClick handler when clicked', async () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Clickable Button</Button>);
        const button = screen.getByRole('button', { name: /clickable button/i });

        await userEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled button is clicked', async () => {
        const handleClick = jest.fn();
        render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
        const button = screen.getByRole('button', { name: /disabled button/i });

        await userEvent.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });
});
