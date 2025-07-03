import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card Component', () => {
    it('renders the Card correctly', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Test Title</CardTitle>
                    <CardDescription>Test Description</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Test Content</p>
                </CardContent>
                <CardFooter>
                    <p>Test Footer</p>
                </CardFooter>
            </Card>
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
        expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });

    it('renders the Card with custom className', () => {
        render(
            <Card className="test-class">
                <CardContent>Test Content</CardContent>
            </Card>
        );

        const card = screen.getByText('Test Content').closest('div');
        expect(card).toHaveClass('test-class');
    });

    it('renders CardHeader with custom className', () => {
        render(
            <Card>
                <CardHeader className="header-class">
                    <CardTitle>Test Title</CardTitle>
                </CardHeader>
            </Card>
        );

        const header = screen.getByText('Test Title').closest('div');
        expect(header).toHaveClass('header-class');
    });

    it('renders CardTitle with custom className', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle className="title-class">Test Title</CardTitle>
                </CardHeader>
            </Card>
        );

        const title = screen.getByText('Test Title');
        expect(title).toHaveClass('title-class');
    });

    it('renders CardDescription with custom className', () => {
        render(
            <Card>
                <CardHeader>
                    <CardDescription className="desc-class">Test Description</CardDescription>
                </CardHeader>
            </Card>
        );

        const desc = screen.getByText('Test Description');
        expect(desc).toHaveClass('desc-class');
    });

    it('renders CardContent with custom className', () => {
        render(
            <Card>
                <CardContent className="content-class">Test Content</CardContent>
            </Card>
        );

        const content = screen.getByText('Test Content').closest('div');
        expect(content).toHaveClass('content-class');
    });

    it('renders CardFooter with custom className', () => {
        render(
            <Card>
                <CardFooter className="footer-class">Test Footer</CardFooter>
            </Card>
        );

        const footer = screen.getByText('Test Footer').closest('div');
        expect(footer).toHaveClass('footer-class');
    });
});
