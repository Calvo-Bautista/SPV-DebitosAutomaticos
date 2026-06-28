import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './main.jsx';

async function openCardsMenu(user) {
  await user.click(screen.getByRole('button', { name: /Iniciar chat/i }));
  await user.click(screen.getByRole('button', { name: /^Sí$/i }));
  await user.click(screen.getByRole('button', { name: /Menú Principal/i }));
  await user.click(within(screen.getByRole('dialog', { name: /Menú Principal/i })).getByRole('button', { name: /Enviar/i }));
  await user.click(screen.getByRole('button', { name: /Menú Tarjetas/i }));
}

describe('App', () => {
  it('phase 1 exposes the automatic debit listing', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openCardsMenu(user);

    const cardsDialog = screen.getByRole('dialog', { name: /Menú Tarjetas/i });
    expect(within(cardsDialog).getByRole('button', { name: /Listado de débitos automáticos/i })).toBeInTheDocument();
    expect(within(cardsDialog).queryByRole('button', { name: /Desconocimiento de consumo TD/i })).not.toBeInTheDocument();
  });

  it('phase 2 exposes automatic debit dispute and debit-card consumption dispute', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Bot Fase 2/i }));
    await openCardsMenu(user);

    const cardsDialog = screen.getByRole('dialog', { name: /Menú Tarjetas/i });
    expect(within(cardsDialog).getByRole('button', { name: /Desconocimiento de débito automático/i })).toBeInTheDocument();
    expect(within(cardsDialog).getByRole('button', { name: /Desconocimiento de consumo TD/i })).toBeInTheDocument();
    expect(within(cardsDialog).queryByRole('button', { name: /Desconocimiento de consumo TC/i })).not.toBeInTheDocument();
  });

  it('phase 3 adds current-month debit status and credit-card consumption dispute', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Bot Fase 3/i }));
    await openCardsMenu(user);

    const cardsDialog = screen.getByRole('dialog', { name: /Menú Tarjetas/i });
    expect(within(cardsDialog).getByRole('button', { name: /Estado de pago del débito/i })).toBeInTheDocument();
    expect(within(cardsDialog).getByRole('button', { name: /Desconocimiento de consumo TC/i })).toBeInTheDocument();
  });
});
