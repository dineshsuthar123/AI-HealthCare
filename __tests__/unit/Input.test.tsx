import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
    it('renders an input correctly', () => {
        render(<Input placeholder="Enter text" type="text" />);
        const input = screen.getByPlaceholderText('Enter text');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'text');
    });

    it('accepts different input types', () => {
        render(<Input type="email" placeholder="Enter email" />);
        const input = screen.getByPlaceholderText('Enter email');
        expect(input).toHaveAttribute('type', 'email');
    });

    it('applies custom className', () => {
        render(<Input className="custom-class" placeholder="Custom input" />);
        const input = screen.getByPlaceholderText('Custom input');
        expect(input).toHaveClass('custom-class');
    });

    it('can be disabled', () => {
        render(<Input disabled placeholder="Disabled input" />);
        const input = screen.getByPlaceholderText('Disabled input');
        expect(input).toBeDisabled();
    });

    it('accepts and displays value changes', () => {
        render(<Input placeholder="Type here" />);
        const input = screen.getByPlaceholderText('Type here');

        fireEvent.change(input, { target: { value: 'Hello world' } });
        expect(input).toHaveValue('Hello world');
    });

    it('calls onChange handler when value changes', () => {
        const handleChange = jest.fn();
        render(<Input onChange={handleChange} placeholder="Test onChange" />);
        const input = screen.getByPlaceholderText('Test onChange');

        fireEvent.change(input, { target: { value: 'New value' } });
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('handles required attribute', () => {
        render(<Input required placeholder="Required field" />);
        const input = screen.getByPlaceholderText('Required field');
        expect(input).toHaveAttribute('required');
    });

    it('accepts maxLength attribute', () => {
        render(<Input maxLength={10} placeholder="Max length" />);
        const input = screen.getByPlaceholderText('Max length');
        expect(input).toHaveAttribute('maxLength', '10');
    });
});
