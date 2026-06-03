import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatHeader } from './components/ChatHeader.jsx';
import { MessageBubble } from './components/MessageBubble.jsx';
import { MenuModal } from './components/MenuModal.jsx';
import { BiometricModal } from './components/BiometricModal.jsx';
import { PdfAttachment } from './components/PdfAttachment.jsx';
import { DemoControls } from './components/DemoControls.jsx';
import { mockDebits } from './data/mockDebits.js';
import { downloadDebitsPdf } from './utils/generatePdf.js';
import './styles.css';

const STEPS = {
  START: 'START',
  DNI_VALIDATION: 'DNI_VALIDATION',
  MAIN_MENU_PROMPT: 'MAIN_MENU_PROMPT',
  CARDS_MENU_PROMPT: 'CARDS_MENU_PROMPT',
  BIOMETRIC_REQUIRED: 'BIOMETRIC_REQUIRED',
  PDF_READY: 'PDF_READY',
  NO_DEBITS: 'NO_DEBITS',
  TECHNICAL_ERROR: 'TECHNICAL_ERROR',
  HANDOFF: 'HANDOFF',
  FINISHED: 'FINISHED'
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

const cardMenu = [
  {
    section: 'Tarjeta de Crédito',
    items: [
      { id: 'resumen', label: 'Resumen', description: 'Revisá el monto a pagar y descargá tu resumen.' },
      { id: 'limites', label: 'Límites y disponibles', description: 'Chequeá los límites y disponibles.' }
    ]
  },
  {
    section: 'Tarjeta de Débito',
    items: [
      { id: 'pin', label: 'Blanqueo de PIN', description: 'Blanqueá la clave de tu tarjeta.' },
      { id: 'extraccion', label: 'Extracción sin Tarjeta', description: 'Generá una orden para sacar dinero sin tarjeta.' },
      { id: 'debitos', label: 'Débitos automáticos', description: 'Consultá tus adhesiones de débito.', badge: 'NUEVO', featured: true }
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

const introMessage = {
  from: 'bot',
  text: 'Tocá Iniciar demo o escribí "hola" para comenzar la simulación.',
  actions: [{ label: 'Iniciar demo', action: 'start' }]
};

function makeMessage(from, text, extras = {}) {
  return { id: crypto.randomUUID(), from, text, time: new Date(), ...extras };
}

export function App() {
  const [messages, setMessages] = useState([makeMessage('bot', introMessage.text, { actions: introMessage.actions })]);
  const [input, setInput] = useState('');
  const [currentStep, setCurrentStep] = useState(STEPS.START);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedMainMenuOption, setSelectedMainMenuOption] = useState('tarjetas');
  const [selectedCardMenuOption, setSelectedCardMenuOption] = useState('debitos');
  const [retryCount, setRetryCount] = useState(0);
  const [demoMode, setDemoMode] = useState('normal');
  const [activePhase, setActivePhase] = useState(1);
  const [pdfIncludesStatus, setPdfIncludesStatus] = useState(false);
  const [pendingDebitCancel, setPendingDebitCancel] = useState(false);
  const [biometricOpen, setBiometricOpen] = useState(false);
  const chatEndRef = useRef(null);

  const canType = ![STEPS.HANDOFF, STEPS.FINISHED].includes(currentStep);
  const currentDebits = useMemo(() => (demoMode === 'noDebits' ? [] : mockDebits), [demoMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, openMenu, biometricOpen]);

  function push(...nextMessages) {
    setMessages((prev) => [...prev, ...nextMessages]);
  }

  function resetDemo() {
    setActivePhase(1);
    setMessages([makeMessage('bot', introMessage.text, { actions: introMessage.actions })]);
    setInput('');
    setCurrentStep(STEPS.START);
    setOpenMenu(null);
    setSelectedMainMenuOption('tarjetas');
    setSelectedCardMenuOption('debitos');
    setRetryCount(0);
    setPdfIncludesStatus(false);
    setPendingDebitCancel(false);
    setBiometricOpen(false);
  }

  function resetCurrentPhase() {
    if (activePhase === 1) {
      resetDemo();
      return;
    }
    loadPhaseChat(activePhase);
  }

  function loadPhaseChat(phase) {
    if (phase === 1) {
      resetDemo();
      return;
    }

    const isPhase3 = phase === 3;
    setActivePhase(phase);
    setOpenMenu(null);
    setBiometricOpen(false);
    setRetryCount(0);
    setPendingDebitCancel(false);
    setCurrentStep(STEPS.PDF_READY);
    setPdfIncludesStatus(isPhase3);

    setMessages([
      makeMessage('bot', isPhase3 ? 'Chat demostrativo - Fase 3: trazabilidad y estado.' : 'Chat demostrativo - Fase 2: autogestión parcial.'),
      makeMessage('user', 'Quiero gestionar un débito automático'),
      makeMessage('bot', 'Validación biométrica exitosa. Ya podemos mostrar tus débitos automáticos adheridos a tarjeta de débito.'),
      makeMessage('bot', isPhase3
        ? 'Encontramos tus adhesiones activas. En esta fase se mantienen las acciones de autogestión parcial y el PDF incorpora el estado de cada débito.'
        : 'Encontramos tus adhesiones activas. En esta fase futura se incorporan acciones de autogestión parcial sobre el débito seleccionado.', {
        attachment: true,
        includeStatus: isPhase3,
        actions: [
          { label: 'Desconocer débito automático', action: 'phase_2_dispute' },
          { label: 'Dar de baja débito automático', action: 'phase_2_cancel' },
          { label: 'Volver al Menú Tarjetas', action: 'open_cards_menu' },
          { label: 'Finalizar', action: 'finish' }
        ]
      })
    ]);
  }

  function beginFlow() {
    setRetryCount(0);
    setCurrentStep(STEPS.DNI_VALIDATION);
    push(
      makeMessage('user', 'hola'),
      makeMessage('bot', '¡Hola de vuelta! Me alegra que estés por acá. 🤝\n\nPara cuidar tu seguridad, validemos una vez más tu identidad.\n\n¿Tu DNI termina en 965?', {
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

  function requestBiometric() {
    setCurrentStep(STEPS.BIOMETRIC_REQUIRED);
    push(
      makeMessage('user', 'Débitos automáticos'),
      makeMessage('bot', 'Para proteger tus datos financieros, necesitamos validar tu identidad mediante reconocimiento facial biométrico antes de mostrar tus débitos automáticos.', {
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
        makeMessage('bot', 'En este momento no podemos obtener el listado de tus débitos automáticos. Para que puedas continuar con la gestión, te derivamos con un ejecutivo.'),
        makeMessage('bot', 'Derivación a ejecutivo iniciada.')
      );
      return;
    }

    if (demoMode === 'noDebits') {
      setCurrentStep(STEPS.NO_DEBITS);
      push(makeMessage('bot', 'Actualmente no registramos débitos automáticos adheridos a tu tarjeta de débito. ¿Querés realizar otra consulta?', {
        actions: [
          { label: 'Volver al Menú Tarjetas', action: 'open_cards_menu' },
          { label: 'Finalizar', action: 'finish' }
        ]
      }));
      return;
    }

    setCurrentStep(STEPS.PDF_READY);
    setPdfIncludesStatus(false);
    push(makeMessage('bot', 'Entendemos tu consulta y queremos ayudarte a identificar tus débitos automáticos.\n\nEstamos preparando un documento digital para que puedas visualizarlos de forma simple y ordenada.'));

    window.setTimeout(() => push(makeMessage('bot', 'Consultando débitos adheridos...')), 650);
    window.setTimeout(() => push(makeMessage('bot', 'Generando PDF...')), 1300);
    window.setTimeout(() => {
      push(makeMessage('bot', 'Tus débitos automáticos están listos.\n\n¿Te puedo ayudar con alguna otra consulta?', {
        attachment: true,
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
    push(makeMessage('bot', 'No llegué a interpretar esa consulta. Para este prototipo podés avanzar con los botones del flujo o escribir "hola", "menu", "tarjetas" o "debitos".'));
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
      push(
        makeMessage('user', 'No'),
        makeMessage('bot', 'No pudimos validar tu identidad inicial. Por seguridad, te derivamos con un ejecutivo.')
      );
      return;
    }
    if (action === 'open_main_menu') {
      setPendingDebitCancel(false);
      setOpenMenu('main');
      return;
    }
    if (action === 'open_cards_menu') {
      setPendingDebitCancel(false);
      setOpenMenu('cards');
      return;
    }
    if (action === 'start_biometric') {
      setBiometricOpen(true);
      return;
    }
    if (action === 'phase_2_dispute') {
      push(
        makeMessage('user', 'Desconocer débito automático'),
        makeMessage('bot', 'Para desconocer el cobro de un débito automático, debes realizar un reclamo desde tu homebanking!\nPara realizarlo debes seguir los siguientes pasos:\n\n· Ingresas a: https://personas.supervielle.com.ar/obi/usuarios/login con tu usuario y clave\n· Vas a "Menú" (las tres rayas de la parte superior izquierda) y luego seleccioná la opción "Consultas y reclamos"\n· Apretá el botón rojo que dice "Realizar consulta o reclamo"\n· Seleccionas "Caja de ahorro" y luego "Desconocimiento de débitos"\n· Completas los datos para el desconocimiento!')
      );
      return;
    }
    if (action === 'phase_2_cancel') {
      setPendingDebitCancel(true);
      push(
        makeMessage('user', 'Dar de baja débito automático'),
        makeMessage('bot', 'Para pedir la baja de un débito automático, pasame la referencia del débito que querés dar de baja. La encontrás en el PDF como código de referencia, por ejemplo DEB-AUT-001.')
      );
      return;
    }
    if (action === 'finish') {
      setCurrentStep(STEPS.FINISHED);
      push(makeMessage('user', 'Finalizar'), makeMessage('bot', 'Gracias por comunicarte con Supervielle Chat. Conversación finalizada.'));
    }
  }

  function submitMainMenu() {
    if (selectedMainMenuOption !== 'tarjetas') {
      push(makeMessage('bot', 'Para este prototipo, la funcionalidad disponible corresponde a Tarjetas.'));
      return;
    }
    setOpenMenu(null);
    showCardsPrompt();
  }

  function submitCardsMenu() {
    if (selectedCardMenuOption !== 'debitos') {
      push(makeMessage('bot', 'Esta opción está disponible en el menú real, pero para la demo vamos a continuar con Débitos automáticos.'));
      return;
    }
    setOpenMenu(null);
    requestBiometric();
  }

  function handleSend(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !canType) return;
    setInput('');
    const normalized = text.toLowerCase();
    if (pendingDebitCancel) {
      const matchedDebit = mockDebits.find((debit) => debit.reference.toLowerCase() === normalized);
      push(makeMessage('user', text));
      if (matchedDebit) {
        setPendingDebitCancel(false);
        setRetryCount(0);
        push(makeMessage('bot', `Entiendo. Ya registramos la solicitud de baja para el débito automático con referencia ${matchedDebit.reference} (${matchedDebit.service}).\n\nEs importante que sepas que el banco no cancela el servicio ni rescinde tu contrato con la empresa asociada al débito. Lo que sí queda gestionado es que el débito automático con ese código de referencia ya no se volverá a cobrar en tu tarjeta de débito.`));
        return;
      }

      push(makeMessage('bot', 'No encontré esa referencia entre los débitos del PDF. Revisá el código e ingresalo nuevamente con el formato DEB-AUT-001.'));
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
    if (['debitos', 'débitos', 'debitos automaticos', 'débitos automáticos'].includes(normalized)) {
      requestBiometric();
      return;
    }
    handleUnknown(text);
  }

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
