import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatHeader } from './components/ChatHeader.jsx';
import { MessageBubble } from './components/MessageBubble.jsx';
import { MenuModal } from './components/MenuModal.jsx';
import { BiometricModal } from './components/BiometricModal.jsx';
import { PdfAttachment } from './components/PdfAttachment.jsx';
import { DemoControls } from './components/DemoControls.jsx';
import { mockDebits } from './data/mockDebits.js';
import {
  mockCreditCards,
  mockCreditTransactions,
  mockDebitTransactions,
  formatMoney,
  toTransactionOption
} from './data/mockTransactions.js';
import { downloadDebitsPdf } from './utils/generatePdf.js';
import './styles.css';

const CLAIM_NUMBER = 'R123456789';

const STEPS = {
  START: 'START',
  DNI_VALIDATION: 'DNI_VALIDATION',
  MAIN_MENU_PROMPT: 'MAIN_MENU_PROMPT',
  CARDS_MENU_PROMPT: 'CARDS_MENU_PROMPT',
  BIOMETRIC_REQUIRED: 'BIOMETRIC_REQUIRED',
  PDF_READY: 'PDF_READY',
  NO_RECORDS: 'NO_RECORDS',
  TECHNICAL_ERROR: 'TECHNICAL_ERROR',
  HANDOFF: 'HANDOFF',
  FINISHED: 'FINISHED'
};

const phaseDescriptions = {
  1: 'Fase 1: listado de débitos automáticos adheridos.',
  2: 'Fase 2: desconocimiento de débitos automáticos y consumos en tarjeta de débito.',
  3: 'Fase 3: estado de pago del mes actual y desconocimiento de consumos en tarjeta de crédito.'
};

const mainMenu = [
  { id: 'prestamos', label: 'Préstamos', description: 'Consultá tu oferta pre aprobada o el detalle de tus préstamos vigentes.' },
  { id: 'tarjetas', label: 'Tarjetas', description: 'Revisá tu resumen, límites, seguimiento de tarjetas y más.' },
  { id: 'cuentas', label: 'Cuentas', description: 'Chequeá tu saldo, movimientos y transferile a tus contactos favoritos.' },
  { id: 'jubilados', label: 'Jubilados', description: 'Conocé tu fecha de cobro y descargá tu recibo de pago.' },
  { id: 'recargas', label: 'Recargas', description: 'Realizá tus recargas de SUBE y celular.' },
  { id: 'transferencias', label: 'Transferencias', description: 'Podés transferir dinero a tus contactos agendados.' },
  { id: 'seguros', label: 'Seguros', description: 'Consultá información de tus seguros vigentes.' },
  { id: 'beneficios', label: 'Beneficios', description: 'Descubrí los beneficios que tenés con tus tarjetas.' }
];

function getCardMenu(phase) {
  const debitItems = [];
  const creditItems = [];

  if (phase === 1) {
    debitItems.push({ id: 'debitos', label: 'Listado de débitos automáticos', description: 'Consultá tus adhesiones de débito.', badge: 'FASE 1', featured: true });
  }

  if (phase >= 2) {
    debitItems.push(
      { id: 'desconocimiento_debito_automatico', label: 'Desconocimiento de débito automático', description: 'Orientación para reclamar un cobro de débito automático.', badge: 'FASE 2', featured: true },
      { id: 'desconocimiento_debito', label: 'Desconocimiento de consumo TD', description: 'Reportá una compra no reconocida en tarjeta de débito.', badge: 'FASE 2', featured: true }
    );
  }

  if (phase >= 3) {
    debitItems.push({ id: 'estado_debito_mes', label: 'Estado de pago del débito', description: 'Consultá el estado del mes actual de tus débitos automáticos.', badge: 'FASE 3', featured: true });
    creditItems.push({ id: 'desconocimiento_credito', label: 'Desconocimiento de consumo TC', description: 'Reportá una compra no reconocida en tarjeta de crédito.', badge: 'FASE 3', featured: true });
  }

  return [
    {
      section: 'Tarjeta de Crédito',
      items: [
        { id: 'resumen', label: 'Resumen', description: 'Revisá el monto a pagar y descargá tu resumen.' },
        { id: 'limites', label: 'Límites y disponibles', description: 'Chequeá los límites y disponibles.' },
        ...creditItems
      ]
    },
    {
      section: 'Tarjeta de Débito',
      items: [
        { id: 'pin', label: 'Blanqueo de PIN', description: 'Blanqueá la clave de tu tarjeta.' },
        { id: 'extraccion', label: 'Extracción sin Tarjeta', description: 'Generá una orden para sacar dinero sin tarjeta.' },
        ...debitItems
      ]
    },
    {
      section: 'Seguimiento de Tarjetas',
      items: [
        { id: 'envio', label: 'Estado del envío', description: 'Chequeá dónde andan tus tarjetas.' },
        { id: 'entrega', label: 'Reprogramá tu entrega', description: 'Gestioná el envío de tus tarjetas a cualquier sucursal.' }
      ]
    }
  ];
}

const introMessage = {
  text: 'Tocá Iniciar chat o escribí "hola" para comenzar la simulación.',
  actions: [{ label: 'Iniciar chat', action: 'start' }]
};

function makeMessage(from, text, extras = {}) {
  return { id: crypto.randomUUID(), from, text, time: new Date(), ...extras };
}

function getInitialCardOption(phase) {
  if (phase === 1) return 'debitos';
  if (phase === 2) return 'desconocimiento_debito_automatico';
  return 'estado_debito_mes';
}

function blankClaimDraft(channel = 'TD') {
  return {
    channel,
    transaction: null,
    email: '',
    type: '',
    contactCommerce: '',
    hasCard: '',
    duplicated: '',
    deliveryProblem: '',
    notes: ''
  };
}

export function App() {
  const [activePhase, setActivePhase] = useState(1);
  const [messages, setMessages] = useState([makeMessage('bot', introMessage.text, { actions: introMessage.actions })]);
  const [input, setInput] = useState('');
  const [currentStep, setCurrentStep] = useState(STEPS.START);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedMainMenuOption, setSelectedMainMenuOption] = useState('tarjetas');
  const [selectedCardMenuOption, setSelectedCardMenuOption] = useState(getInitialCardOption(1));
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [selectedCreditCard, setSelectedCreditCard] = useState(mockCreditCards[0].id);
  const [selectedTransactionId, setSelectedTransactionId] = useState(mockDebitTransactions[0].id);
  const [retryCount, setRetryCount] = useState(0);
  const [demoMode, setDemoMode] = useState('normal');
  const [pdfIncludesStatus, setPdfIncludesStatus] = useState(false);
  const [pendingDebitCancel, setPendingDebitCancel] = useState(false);
  const [claimStep, setClaimStep] = useState(null);
  const [claimDraft, setClaimDraft] = useState(blankClaimDraft());
  const [biometricOpen, setBiometricOpen] = useState(false);
  const chatEndRef = useRef(null);

  const canType = ![STEPS.HANDOFF, STEPS.FINISHED].includes(currentStep);
  const currentDebits = useMemo(() => (demoMode === 'noDebits' ? [] : mockDebits), [demoMode]);
  const currentTransactions = selectedFlow === 'desconocimiento_credito' ? mockCreditTransactions : mockDebitTransactions;
  const cardMenu = useMemo(() => getCardMenu(activePhase), [activePhase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, openMenu, biometricOpen]);

  function push(...nextMessages) {
    setMessages((prev) => [...prev, ...nextMessages]);
  }

  function resetForPhase(phase) {
    setActivePhase(phase);
    setMessages([makeMessage('bot', `${phaseDescriptions[phase]}\n\n${introMessage.text}`, { actions: introMessage.actions })]);
    setInput('');
    setCurrentStep(STEPS.START);
    setOpenMenu(null);
    setSelectedMainMenuOption('tarjetas');
    setSelectedCardMenuOption(getInitialCardOption(phase));
    setSelectedFlow(null);
    setSelectedCreditCard(mockCreditCards[0].id);
    setSelectedTransactionId(phase === 3 ? mockCreditTransactions[0].id : mockDebitTransactions[0].id);
    setRetryCount(0);
    setPdfIncludesStatus(phase === 3);
    setPendingDebitCancel(false);
    setClaimStep(null);
    setClaimDraft(blankClaimDraft(phase === 3 ? 'TC' : 'TD'));
    setBiometricOpen(false);
  }

  function resetCurrentPhase() {
    resetForPhase(activePhase);
  }

  function loadPhaseChat(phase) {
    resetForPhase(phase);
  }

  function beginFlow() {
    setRetryCount(0);
    setCurrentStep(STEPS.DNI_VALIDATION);
    push(
      makeMessage('user', 'hola'),
      makeMessage('bot', '¡Hola de vuelta! Me alegra que estés por acá.\n\nPara cuidar tu seguridad, validemos una vez más tu identidad.\n\n¿Tu DNI termina en 965?', {
        actions: [
          { label: 'Sí', action: 'dni_yes' },
          { label: 'No', action: 'dni_no' }
        ]
      })
    );
  }

  function showMainPrompt() {
    setCurrentStep(STEPS.MAIN_MENU_PROMPT);
    push(makeMessage('bot', 'Elegí una opción o contame lo que estás buscando.', {
      actions: [{ label: 'Menú Principal', action: 'open_main_menu' }]
    }));
  }

  function showCardsPrompt() {
    setCurrentStep(STEPS.CARDS_MENU_PROMPT);
    push(
      makeMessage('user', 'Tarjetas'),
      makeMessage('bot', 'Elegí una opción o contame lo que estás buscando.', {
        actions: [{ label: 'Menú Tarjetas', action: 'open_cards_menu' }]
      })
    );
  }

  function requestBiometric(flow) {
    setSelectedFlow(flow);
    setCurrentStep(STEPS.BIOMETRIC_REQUIRED);
    const label = {
      debitos: 'mostrar tus débitos automáticos',
      desconocimiento_debito_automatico: 'orientarte con el desconocimiento de un débito automático',
      desconocimiento_debito: 'gestionar el desconocimiento de consumo en tarjeta de débito',
      desconocimiento_credito: 'gestionar el desconocimiento de consumo en tarjeta de crédito',
      estado_debito_mes: 'mostrar el estado de pago del mes actual'
    }[flow];

    push(
      makeMessage('user', cardMenu.flatMap((group) => group.items).find((item) => item.id === flow)?.label ?? 'Tarjetas'),
      makeMessage('bot', `Para proteger tus datos financieros, necesitamos validar tu identidad mediante reconocimiento facial biométrico antes de ${label}.`, {
        actions: [{ label: 'Iniciar validación facial', action: 'start_biometric' }]
      })
    );
  }

  function completeBiometric() {
    setBiometricOpen(false);
    if (demoMode === 'biometricError') {
      setCurrentStep(STEPS.HANDOFF);
      push(makeMessage('bot', 'No pudimos completar la validación biométrica. Por seguridad, te derivamos con un ejecutivo.'));
      return;
    }

    if (demoMode === 'technicalError') {
      setCurrentStep(STEPS.TECHNICAL_ERROR);
      push(
        makeMessage('bot', 'En este momento no podemos conectarnos con los servidores para procesar la información. Para que puedas continuar con la gestión, te derivamos con un ejecutivo.'),
        makeMessage('bot', 'Derivación a ejecutivo iniciada.')
      );
      return;
    }

    if (selectedFlow === 'debitos') {
      handleDebitListReady(false);
      return;
    }

    if (selectedFlow === 'estado_debito_mes') {
      handleDebitListReady(true);
      return;
    }

    if (selectedFlow === 'desconocimiento_debito_automatico') {
      push(makeMessage('bot', 'Para desconocer el cobro de un débito automático, debes realizar un reclamo desde tu homebanking.\n\nPasos sugeridos:\n· Ingresá a https://personas.supervielle.com.ar/obi/usuarios/login con usuario y clave.\n· Abrí Menú > Consultas y reclamos.\n· Seleccioná Realizar consulta o reclamo.\n· Elegí Caja de ahorro y luego Desconocimiento de débitos.\n· Completá los datos del desconocimiento.', {
        actions: [
          { label: 'Volver al Menú Tarjetas', action: 'open_cards_menu' },
          { label: 'Finalizar', action: 'finish' }
        ]
      }));
      return;
    }

    if (selectedFlow === 'desconocimiento_debito') {
      if (demoMode === 'noDebits') {
        setCurrentStep(STEPS.NO_RECORDS);
        push(makeMessage('bot', 'Actualmente no registramos consumos recientes para esta tarjeta de débito.', {
          actions: [{ label: 'Volver al Menú Tarjetas', action: 'open_cards_menu' }]
        }));
        return;
      }
      push(makeMessage('bot', 'Identidad validada. A continuación te mostramos los últimos consumos de tu tarjeta de débito.', {
        actions: [{ label: 'Ver consumos TD', action: 'open_transactions_menu' }]
      }));
      return;
    }

    if (selectedFlow === 'desconocimiento_credito') {
      if (demoMode === 'noDebits') {
        setCurrentStep(STEPS.NO_RECORDS);
        push(makeMessage('bot', 'Actualmente no registramos consumos recientes para esta tarjeta de crédito.', {
          actions: [{ label: 'Volver al Menú Tarjetas', action: 'open_cards_menu' }]
        }));
        return;
      }
      push(makeMessage('bot', 'Identidad validada. Seleccioná la tarjeta de crédito para revisar sus consumos recientes.', {
        actions: [{ label: 'Elegir tarjeta TC', action: 'open_card_selector' }]
      }));
    }
  }

  function handleDebitListReady(includeStatus) {
    if (demoMode === 'noDebits') {
      setCurrentStep(STEPS.NO_RECORDS);
      push(makeMessage('bot', 'Actualmente no registramos débitos automáticos adheridos a tu tarjeta de débito.', {
        actions: [{ label: 'Volver al Menú Tarjetas', action: 'open_cards_menu' }]
      }));
      return;
    }

    setCurrentStep(STEPS.PDF_READY);
    setPdfIncludesStatus(includeStatus);
    const statusText = includeStatus
      ? 'El documento incluye el estado de pago del mes actual para cada débito automático.'
      : 'El documento incluye el listado de débitos automáticos adheridos.';

    push(makeMessage('bot', `Estamos preparando el documento digital.\n\n${statusText}`));
    window.setTimeout(() => push(makeMessage('bot', 'Consultando registros...')), 650);
    window.setTimeout(() => push(makeMessage('bot', 'Generando PDF...')), 1300);
    window.setTimeout(() => {
      push(makeMessage('bot', 'El documento está listo.\n\n¿Te puedo ayudar con alguna otra consulta?', {
        attachment: true,
        includeStatus,
        actions: [
          { label: 'Volver al Menú Tarjetas', action: 'open_cards_menu' },
          { label: 'Finalizar', action: 'finish' }
        ]
      }));
    }, 2000);
  }

  function handleUnknown(text) {
    const nextCount = retryCount + 1;
    setRetryCount(nextCount);
    push(makeMessage('user', text));
    if (nextCount >= 3) {
      setCurrentStep(STEPS.HANDOFF);
      push(makeMessage('bot', 'Para asegurar que resuelvas tu gestión de la mejor manera, te derivo en este momento con uno de nuestros ejecutivos de atención. Un ejecutivo continuará la conversación.'));
      return;
    }
    push(makeMessage('bot', 'No llegué a interpretar esa consulta. Podés avanzar con los botones del menú o escribir "hola" o "tarjetas".'));
  }

  function handleAction(action) {
    if (action === 'start') {
      beginFlow();
      return;
    }
    if (action === 'dni_yes') {
      push(makeMessage('user', 'Sí'));
      showMainPrompt();
      return;
    }
    if (action === 'dni_no') {
      setCurrentStep(STEPS.HANDOFF);
      push(makeMessage('user', 'No'), makeMessage('bot', 'No pudimos validar tu identidad inicial. Por seguridad, te derivamos con un ejecutivo.'));
      return;
    }
    if (action === 'open_main_menu') {
      setPendingDebitCancel(false);
      setClaimStep(null);
      setOpenMenu('main');
      return;
    }
    if (action === 'open_cards_menu') {
      setPendingDebitCancel(false);
      setClaimStep(null);
      setOpenMenu('cards');
      return;
    }
    if (action === 'start_biometric') {
      setBiometricOpen(true);
      return;
    }
    if (action === 'open_card_selector') {
      setOpenMenu('card_selector');
      return;
    }
    if (action === 'open_transactions_menu') {
      setSelectedTransactionId(currentTransactions[0].id);
      setOpenMenu('transactions');
      return;
    }
    if (action === 'finish') {
      setCurrentStep(STEPS.FINISHED);
      push(makeMessage('user', 'Finalizar'), makeMessage('bot', 'Gracias por comunicarte con Supervielle Chat. Conversación finalizada.'));
      return;
    }

    if (action.startsWith('claim_type_')) {
      const type = action.replace('claim_type_', '');
      setClaimDraft((draft) => ({ ...draft, type }));
      setClaimStep('contactCommerce');
      push(makeMessage('user', type), makeMessage('bot', '¿Tuviste contacto con el comercio?', {
        actions: [
          { label: 'Sí', action: 'claim_contact_yes' },
          { label: 'No', action: 'claim_contact_no' }
        ]
      }));
      return;
    }

    if (action === 'claim_contact_yes' || action === 'claim_contact_no') {
      const contactCommerce = action === 'claim_contact_yes' ? 'Sí' : 'No';
      setClaimDraft((draft) => ({ ...draft, contactCommerce }));
      setClaimStep('hasCard');
      push(makeMessage('user', contactCommerce), makeMessage('bot', '¿Tenés tu tarjeta?', {
        actions: [
          { label: 'Sí', action: 'claim_has_card_yes' },
          { label: 'No', action: 'claim_has_card_no' }
        ]
      }));
      return;
    }

    if (action === 'claim_has_card_yes' || action === 'claim_has_card_no') {
      const hasCard = action === 'claim_has_card_yes' ? 'Sí' : 'No';
      setClaimDraft((draft) => ({ ...draft, hasCard }));
      setClaimStep('duplicated');
      push(makeMessage('user', hasCard), makeMessage('bot', '¿La compra está duplicada?', {
        actions: [
          { label: 'Sí', action: 'claim_duplicated_yes' },
          { label: 'No', action: 'claim_duplicated_no' }
        ]
      }));
      return;
    }

    if (action === 'claim_duplicated_yes' || action === 'claim_duplicated_no') {
      const duplicated = action === 'claim_duplicated_yes' ? 'Sí' : 'No';
      setClaimDraft((draft) => ({ ...draft, duplicated }));
      setClaimStep('delivery');
      push(makeMessage('user', duplicated), makeMessage('bot', '¿Hubo algún problema con la entrega del producto?', {
        actions: [
          { label: 'Sí', action: 'claim_delivery_yes' },
          { label: 'No', action: 'claim_delivery_no' }
        ]
      }));
      return;
    }

    if (action === 'claim_delivery_yes' || action === 'claim_delivery_no') {
      const deliveryProblem = action === 'claim_delivery_yes' ? 'Sí' : 'No';
      setClaimDraft((draft) => ({ ...draft, deliveryProblem }));
      setClaimStep('notes');
      push(makeMessage('user', deliveryProblem), makeMessage('bot', 'Si querés, agregá una nota adicional para el reclamo. Si no tenés nada para agregar, escribí "sin notas".'));
    }
  }

  function submitMainMenu() {
    if (selectedMainMenuOption !== 'tarjetas') {
      push(makeMessage('bot', 'En este momento solo puedo ayudarte con consultas sobre Tarjetas. Por favor, seleccioná esa opción.'));
      return;
    }
    setOpenMenu(null);
    showCardsPrompt();
  }

  function submitCardsMenu() {
    const allowedByPhase = {
      1: ['debitos'],
      2: ['desconocimiento_debito_automatico', 'desconocimiento_debito'],
      3: ['desconocimiento_debito_automatico', 'desconocimiento_debito', 'estado_debito_mes', 'desconocimiento_credito']
    }[activePhase];

    if (!allowedByPhase.includes(selectedCardMenuOption)) {
      push(makeMessage('bot', `Esta opción no corresponde a la ${phaseDescriptions[activePhase].replace(':', '').toLowerCase()}. Seleccioná una opción marcada para esta fase.`));
      return;
    }
    setOpenMenu(null);
    requestBiometric(selectedCardMenuOption);
  }

  function submitCardSelector() {
    const card = mockCreditCards.find((item) => item.id === selectedCreditCard);
    setOpenMenu(null);
    push(
      makeMessage('user', card.label),
      makeMessage('bot', `A continuación te mostramos los últimos consumos de tu ${card.label} ${card.description}.`, {
        actions: [{ label: 'Ver consumos TC', action: 'open_transactions_menu' }]
      })
    );
  }

  function submitTransactionSelector() {
    setOpenMenu(null);
    if (selectedTransactionId === 'agent_handoff') {
      setCurrentStep(STEPS.HANDOFF);
      push(makeMessage('bot', 'Entendido. Te derivamos con un ejecutivo para verificar consumos más antiguos o no listados.'));
      return;
    }
    const transaction = currentTransactions.find((item) => item.id === selectedTransactionId);
    const channel = selectedFlow === 'desconocimiento_credito' ? 'TC' : 'TD';
    setClaimDraft({ ...blankClaimDraft(channel), transaction });
    setClaimStep('email');
    push(
      makeMessage('user', `Seleccionado: ${transaction.business}`),
      makeMessage('bot', `Seleccionaste:\nFecha y hora: ${transaction.date} ${transaction.time}\nComercio: ${transaction.business}\nImporte: ${formatMoney(transaction)}\nCupón: ${transaction.voucher}\nTarjeta: ${transaction.card}\n\nPara enviarte la devolución del reclamo, indicame tu mail de contacto.`)
    );
  }

  function completeClaim(notes) {
    const finalDraft = { ...claimDraft, notes };
    setClaimDraft(finalDraft);
    setClaimStep(null);
    setCurrentStep(STEPS.FINISHED);
    push(makeMessage('bot', `Perfecto, registramos el reclamo por desconocimiento de consumo.\n\nNro. de reclamo: ${CLAIM_NUMBER}\nCanal: ${finalDraft.channel}\nComercio: ${finalDraft.transaction.business}\nImporte: ${formatMoney(finalDraft.transaction)}\nMail de contacto: ${finalDraft.email}\nTipo: ${finalDraft.type}\nTuviste contacto con el comercio: ${finalDraft.contactCommerce}\nTenés tu tarjeta: ${finalDraft.hasCard}\nCompra duplicada: ${finalDraft.duplicated}\nProblema con entrega: ${finalDraft.deliveryProblem}\nNotas: ${finalDraft.notes || 'Sin notas'}\n\nTe vamos a enviar la devolución del reclamo al mail informado.`));
  }

  function handleSend(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !canType) return;
    setInput('');
    const normalized = text.toLowerCase();

    if (claimStep === 'email') {
      setClaimDraft((draft) => ({ ...draft, email: text }));
      setClaimStep('type');
      push(makeMessage('user', text), makeMessage('bot', 'Indicá qué tipo de desconocimiento querés realizar:', {
        actions: [
          { label: 'Consumo cuestionado', action: 'claim_type_Consumo cuestionado' },
          { label: 'Consumo duplicado', action: 'claim_type_Consumo duplicado' },
          { label: 'Desconocimiento de consumo', action: 'claim_type_Desconocimiento de consumo' },
          { label: 'Otro', action: 'claim_type_Otro' }
        ]
      }));
      return;
    }

    if (claimStep === 'notes') {
      push(makeMessage('user', text));
      completeClaim(normalized === 'sin notas' ? '' : text);
      return;
    }

    if (pendingDebitCancel) {
      const matchedDebit = mockDebits.find((debit) => debit.reference.toLowerCase() === normalized);
      push(makeMessage('user', text));
      if (matchedDebit) {
        setPendingDebitCancel(false);
        setRetryCount(0);
        push(makeMessage('bot', `Entiendo. Ya registramos la solicitud de baja para el débito automático con referencia ${matchedDebit.reference} (${matchedDebit.service}).\n\nEs importante que sepas que el banco no cancela el servicio ni rescinde tu contrato con la empresa asociada al débito. Lo que sí queda gestionado es que el débito automático con ese código de referencia ya no se volverá a cobrar en tu tarjeta de débito.`));
        return;
      }
      push(makeMessage('bot', 'No encontré esa referencia entre los débitos. Revisá el código e ingresalo nuevamente con el formato DEB-AUT-001.'));
      return;
    }

    if (['hola', 'iniciar', 'inicio'].includes(normalized) && currentStep === STEPS.START) {
      beginFlow();
      return;
    }
    if (normalized === 'menu') {
      push(makeMessage('user', text));
      setOpenMenu('main');
      return;
    }
    if (normalized === 'tarjetas') {
      showCardsPrompt();
      return;
    }
    handleUnknown(text);
  }

  const transactionOptions = [
    ...currentTransactions.map(toTransactionOption),
    { id: 'agent_handoff', label: 'El consumo es más antiguo o no aparece', description: 'Hablar con un ejecutivo para buscar otros movimientos.' }
  ];

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-label="Simulador de WhatsApp">
        <ChatHeader />
        <div className="chat-surface">
          <div className="date-chip">Hoy</div>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onAction={handleAction}>
              {message.attachment && (
                <PdfAttachment onOpen={() => downloadDebitsPdf({ debits: currentDebits, includeStatus: message.includeStatus ?? pdfIncludesStatus })} />
              )}
            </MessageBubble>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form className="composer" onSubmit={handleSend}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={canType ? 'Escribí un mensaje' : 'Conversación cerrada'}
            disabled={!canType}
          />
          <button type="submit" disabled={!canType || !input.trim()} aria-label="Enviar">
            ➤
          </button>
        </form>
      </section>

      <DemoControls
        demoMode={demoMode}
        activePhase={activePhase}
        onModeChange={setDemoMode}
        onReset={resetCurrentPhase}
        onSelectPhase={loadPhaseChat}
      />

      {openMenu === 'main' && (
        <MenuModal
          title="Menú Principal"
          options={mainMenu}
          selectedId={selectedMainMenuOption}
          onSelect={setSelectedMainMenuOption}
          onClose={() => setOpenMenu(null)}
          onSubmit={submitMainMenu}
        />
      )}
      {openMenu === 'cards' && (
        <MenuModal
          title="Menú Tarjetas"
          sections={cardMenu}
          selectedId={selectedCardMenuOption}
          onSelect={setSelectedCardMenuOption}
          onClose={() => setOpenMenu(null)}
          onSubmit={submitCardsMenu}
          footer="Tocá un elemento para seleccionarlo"
        />
      )}
      {openMenu === 'card_selector' && (
        <MenuModal
          title="Tus tarjetas de crédito"
          options={mockCreditCards}
          selectedId={selectedCreditCard}
          onSelect={setSelectedCreditCard}
          onClose={() => setOpenMenu(null)}
          onSubmit={submitCardSelector}
          footer="Elegí la tarjeta a consultar"
        />
      )}
      {openMenu === 'transactions' && (
        <MenuModal
          title="Consumos recientes"
          options={transactionOptions}
          selectedId={selectedTransactionId}
          onSelect={setSelectedTransactionId}
          onClose={() => setOpenMenu(null)}
          onSubmit={submitTransactionSelector}
          footer="Elegí el consumo que no reconocés"
        />
      )}
      {biometricOpen && (
        <BiometricModal
          shouldFail={demoMode === 'biometricError'}
          onClose={() => setBiometricOpen(false)}
          onContinue={completeBiometric}
        />
      )}
    </main>
  );
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
