import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './main.jsx';

describe('App', () => {
  it('renders the phase selector and starts the phase 1 chatbot flow', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('button', { name: /Bot Fase 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bot Fase 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bot Fase 3/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Iniciar demo/i }));

    expect(screen.getByText(/DNI termina en 965/i)).toBeInTheDocument();
  });

  it('loads the phase 3 bot with the same management options as phase 2', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Bot Fase 3/i }));

    expect(screen.getByText(/Fase 3: trazabilidad y estado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Desconocer débito automático/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dar de baja débito automático/i })).toBeInTheDocument();
  });
});
