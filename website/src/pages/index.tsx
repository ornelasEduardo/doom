import React from 'react';
import Layout from '@theme/Layout';
import { Button, Card, Text, useTheme, Grid, Flex, Switch } from 'doom-design-system';
import Link from '@docusaurus/Link';

export default function Home() {
  const { setTheme, theme } = useTheme();

  return (
    <Layout
      title="Doom Design System"
      description="Neubrutalist React UI Kit">
      <main style={{ minHeight: 'calc(100vh - 60px)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        
        {/* Hero Section */}
        <Flex direction="column" align="center" justify="center" gap="3rem" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          
          <Flex direction="column" align="center" gap="1rem">
            <Text variant="h1" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', margin: 0 }}>
              DOOM DESIGN SYSTEM
            </Text>
            <Text variant="body" style={{ fontSize: '1.25rem', maxWidth: '600px', opacity: 0.9 }}>
              A bold, high-contrast UI kit for React. Subtlety is dead.
            </Text>
          </Flex>

          <Flex gap="1rem" wrap>
            <Link to="/docs/intro" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                Get Started
              </Button>
            </Link>
            <Link to="/docs/components/switch" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="lg">
                View Components
              </Button>
            </Link>
          </Flex>

        </Flex>

        {/* Theme Switcher Section */}
        <Flex direction="column" align="center" gap="2rem" style={{ padding: '2rem 1rem', backgroundColor: 'var(--card-bg)', borderTop: 'var(--border-width) solid var(--card-border)', borderBottom: 'var(--border-width) solid var(--card-border)' }}>
          <Text variant="h3" style={{ margin: 0 }}>CHOOSE YOUR THEME</Text>
          <Flex gap="1rem" wrap justify="center">
            <Button size="sm" variant={theme === 'default' ? 'primary' : 'outline'} onClick={() => setTheme('default')}>Default</Button>
            <Button size="sm" variant={theme === 'doom' ? 'primary' : 'outline'} onClick={() => setTheme('doom')}>Doomsday</Button>
            <Button size="sm" variant={theme === 'neighbor' ? 'primary' : 'outline'} onClick={() => setTheme('neighbor')}>The Captain</Button>
            <Button size="sm" variant={theme === 'vigilante' ? 'primary' : 'outline'} onClick={() => setTheme('vigilante')}>Dark Knight</Button>
          </Flex>
        </Flex>

        {/* Features Section */}
        <Flex justify="center" style={{ padding: '4rem 1rem' }}>
          <Grid columns="repeat(auto-fit, minmax(300px, 1fr))" gap="2rem" style={{ width: '100%', maxWidth: '1200px' }}>
            <Card>
              <Text variant="h3">Bold Aesthetics</Text>
              <Text variant="body">High contrast, hard shadows, and thick borders. Designed to stand out in a sea of flat design.</Text>
            </Card>
            <Card>
              <Text variant="h3">Theming Engine</Text>
              <Text variant="body">Switch between radically different visual themes instantly using our powerful CSS variable system.</Text>
            </Card>
            <Card>
              <Text variant="h3">Framework Agnostic</Text>
              <Text variant="body">Built for React. Works seamlessly with Next.js, Vite, Remix, or any other React environment.</Text>
            </Card>
          </Grid>
        </Flex>

      </main>
    </Layout>
  );
}
