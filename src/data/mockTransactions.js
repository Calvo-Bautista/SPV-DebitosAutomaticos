export const mockCreditCards = [
  { id: 'master_credit', label: 'Mastercard Crédito', description: 'Terminada en 6405', maskedNumber: '**** **** **** 6405' },
  { id: 'visa_credit', label: 'Visa Crédito', description: 'Terminada en 1234', maskedNumber: '**** **** **** 1234' }
];

export const mockDebitCards = [
  { id: 'visa_debit', label: 'Visa Débito', description: 'Terminada en 4821', maskedNumber: '**** **** **** 4821' }
];

export const mockCreditTransactions = [
  {
    id: 'tc-001',
    date: '25/05/2026',
    time: '16:35',
    business: 'MERCADOPAGO',
    amount: 45200,
    currency: 'ARS',
    voucher: 'CP-884201',
    card: '****6405'
  },
  {
    id: 'tc-002',
    date: '24/05/2026',
    time: '21:18',
    business: 'ROCKSTAR GAMES',
    amount: 12.5,
    currency: 'USD',
    voucher: 'CP-219845',
    card: '****6405'
  },
  {
    id: 'tc-003',
    date: '23/05/2026',
    time: '11:42',
    business: 'CARREFOUR',
    amount: 85340,
    currency: 'ARS',
    voucher: 'CP-552019',
    card: '****6405'
  }
];

export const mockDebitTransactions = [
  {
    id: 'td-001',
    date: '26/05/2026',
    time: '10:14',
    business: 'SHELL',
    amount: 43100,
    currency: 'ARS',
    voucher: 'TD-118203',
    card: '****4821'
  },
  {
    id: 'td-002',
    date: '25/05/2026',
    time: '19:28',
    business: 'UBER TRIP',
    amount: 4500,
    currency: 'ARS',
    voucher: 'TD-990124',
    card: '****4821'
  },
  {
    id: 'td-003',
    date: '24/05/2026',
    time: '13:51',
    business: 'FARMACITY',
    amount: 19200,
    currency: 'ARS',
    voucher: 'TD-773401',
    card: '****4821'
  }
];

export function formatMoney(transaction) {
  const prefix = transaction.currency === 'USD' ? 'US$' : '$';
  return `${prefix}${transaction.amount.toLocaleString('es-AR')}`;
}

export function toTransactionOption(transaction) {
  return {
    id: transaction.id,
    label: `${transaction.date} ${transaction.time} - ${transaction.business}`,
    description: `Importe: ${formatMoney(transaction)} | Cupón: ${transaction.voucher} | Tarjeta: ${transaction.card}`
  };
}
