import type { Locale } from "@/lib/i18n";

export type LegalSection = {
  id: string;
  title: Record<Locale, string>;
  body: Record<Locale, string>;
};

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: {
      en: "1. Acceptance of terms",
      es: "1. Aceptación de los términos",
    },
    body: {
      en: "By accessing or using MovePilotAi (“Service”), you agree to these Terms of Service. If you do not agree, do not use the Service. MovePilotAi is operated from the United States and intended for users planning residential moves.",
      es: "Al acceder o usar MovePilotAi (“Servicio”), aceptas estos Términos de servicio. Si no estás de acuerdo, no uses el Servicio. MovePilotAi opera desde Estados Unidos y está pensado para usuarios que planifican mudanzas residenciales.",
    },
  },
  {
    id: "service",
    title: {
      en: "2. Description of the service",
      es: "2. Descripción del servicio",
    },
    body: {
      en: "MovePilotAi provides software tools to plan relocations, including checklists, route suggestions, budget estimates, document storage, and an AI assistant (“Pilot”). We may update, add, or remove features at any time.",
      es: "MovePilotAi ofrece herramientas para planificar mudanzas: checklists, sugerencias de ruta, estimaciones de presupuesto, almacenamiento de documentos y un asistente de IA (“Pilot”). Podemos actualizar, añadir o eliminar funciones en cualquier momento.",
    },
  },
  {
    id: "estimates",
    title: {
      en: "3. Estimates are not quotes",
      es: "3. Las estimaciones no son cotizaciones",
    },
    body: {
      en: "Budget figures, truck rental prices, fuel costs, route distances, and other calculations are estimates for planning purposes only. They are not binding quotes from MovePilotAi or any third-party provider. Always confirm prices, availability, and terms directly with rental companies, movers, utilities, and other vendors before spending money.",
      es: "Los importes de presupuesto, precios de alquiler de camiones, combustible, distancias de ruta y otros cálculos son estimaciones solo para planificar. No son cotizaciones vinculantes de MovePilotAi ni de terceros. Confirma siempre precios, disponibilidad y condiciones directamente con arrendadoras, mudanzas, servicios y demás proveedores antes de pagar.",
    },
  },
  {
    id: "accounts",
    title: {
      en: "4. Accounts and security",
      es: "4. Cuentas y seguridad",
    },
    body: {
      en: "You are responsible for keeping your login credentials confidential and for activity under your account. You must provide accurate information when registering. You may delete your account from Settings at any time.",
      es: "Eres responsable de mantener confidenciales tus credenciales y de la actividad en tu cuenta. Debes proporcionar información veraz al registrarte. Puedes eliminar tu cuenta desde Ajustes en cualquier momento.",
    },
  },
  {
    id: "acceptable-use",
    title: {
      en: "5. Acceptable use",
      es: "5. Uso aceptable",
    },
    body: {
      en: "You may not misuse the Service, attempt unauthorized access, scrape or overload our systems, upload unlawful content, or use the Service in violation of applicable law. We may suspend accounts that violate these terms.",
      es: "No debes hacer un uso indebido del Servicio, intentar accesos no autorizados, saturar nuestros sistemas, subir contenido ilegal ni usar el Servicio infringiendo la ley aplicable. Podemos suspender cuentas que incumplan estos términos.",
    },
  },
  {
    id: "third-party",
    title: {
      en: "6. Third-party services and links",
      es: "6. Servicios y enlaces de terceros",
    },
    body: {
      en: "The Service may link to third parties (e.g. U-Haul, Penske, Google Maps). We do not control and are not responsible for their products, pricing, or policies. Your use of third-party sites is governed by their terms.",
      es: "El Servicio puede enlazar a terceros (p. ej. U-Haul, Penske, Google Maps). No controlamos ni somos responsables de sus productos, precios o políticas. El uso de sitios de terceros se rige por sus propios términos.",
    },
  },
  {
    id: "ai",
    title: {
      en: "7. AI-generated content",
      es: "7. Contenido generado por IA",
    },
    body: {
      en: "Pilot and other AI features may produce inaccurate or incomplete information. You should verify important decisions (legal, financial, safety, routing) with qualified professionals or official sources.",
      es: "Pilot y otras funciones de IA pueden generar información incompleta o inexacta. Debes verificar decisiones importantes (legales, financieras, de seguridad, rutas) con profesionales cualificados o fuentes oficiales.",
    },
  },
  {
    id: "ip",
    title: {
      en: "8. Intellectual property",
      es: "8. Propiedad intelectual",
    },
    body: {
      en: "MovePilotAi and its branding, software, and content (excluding your uploaded data) are owned by us or our licensors. You retain ownership of documents and move data you upload. You grant us a limited license to host and process that data to provide the Service.",
      es: "MovePilotAi y su marca, software y contenido (excepto tus datos subidos) nos pertenecen a nosotros o a nuestros licenciantes. Conservas la propiedad de los documentos y datos de mudanza que subes. Nos concedes una licencia limitada para alojarlos y procesarlos a fin de prestar el Servicio.",
    },
  },
  {
    id: "liability",
    title: {
      en: "9. Disclaimer and limitation of liability",
      es: "9. Exención y limitación de responsabilidad",
    },
    body: {
      en: "THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, MOVEPILOTAI AND ITS OPERATORS SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, OR FOR LOSSES ARISING FROM YOUR MOVE, THIRD-PARTY SERVICES, OR RELIANCE ON ESTIMATES OR AI OUTPUT.",
      es: "EL SERVICIO SE OFRECE “TAL CUAL”, SIN GARANTÍAS DE NINGÚN TIPO. EN LA MEDIDA MÁXIMA PERMITIDA POR LA LEY, MOVEPILOTAI Y SUS OPERADORES NO SERÁN RESPONSABLES DE DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES O CONSECUENTES, NI DE PÉRDIDAS DERIVADAS DE TU MUDANZA, SERVICIOS DE TERCEROS O CONFIANZA EN ESTIMACIONES O RESPUESTAS DE IA.",
    },
  },
  {
    id: "payments",
    title: {
      en: "10. Paid plans",
      es: "10. Planes de pago",
    },
    body: {
      en: "MovePilot Pro is a one-time payment of $29 USD per move, processed securely by Stripe. New accounts receive a 7-day full-access trial before payment is required. Prices shown at checkout are final unless a promotion code is applied.",
      es: "MovePilot Pro es un pago único de 29 USD por mudanza, procesado de forma segura con Stripe. Las cuentas nuevas reciben 7 días de acceso completo antes de requerir pago. Los precios mostrados en el checkout son finales salvo que se aplique un código promocional.",
    },
  },
  {
    id: "changes",
    title: {
      en: "11. Changes and termination",
      es: "11. Cambios y terminación",
    },
    body: {
      en: "We may modify these Terms or discontinue the Service. Material changes will be posted on this page with an updated date. Continued use after changes constitutes acceptance. You may stop using the Service at any time.",
      es: "Podemos modificar estos Términos o discontinuar el Servicio. Los cambios importantes se publicarán en esta página con fecha actualizada. El uso continuado tras los cambios implica aceptación. Puedes dejar de usar el Servicio en cualquier momento.",
    },
  },
  {
    id: "contact",
    title: {
      en: "12. Contact",
      es: "12. Contacto",
    },
    body: {
      en: "Questions about these Terms: support@movepilotai.com",
      es: "Preguntas sobre estos Términos: support@movepilotai.com",
    },
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "intro",
    title: {
      en: "1. Overview",
      es: "1. Resumen",
    },
    body: {
      en: "This Privacy Policy explains how MovePilotAi (“we”) collects, uses, and protects personal information when you use movepilotai.com and related services.",
      es: "Esta Política de privacidad explica cómo MovePilotAi (“nosotros”) recopila, usa y protege información personal cuando usas movepilotai.com y servicios relacionados.",
    },
  },
  {
    id: "collect",
    title: {
      en: "2. Information we collect",
      es: "2. Información que recopilamos",
    },
    body: {
      en: "Account data: name, email, password hash, language preference.\nMove data: origin/destination, dates, household details, budget, checklist, inventory, documents you upload, chat messages with Pilot, and settings.\nTechnical data: session cookies, IP address (for security and rate limiting), and basic server logs.",
      es: "Datos de cuenta: nombre, email, hash de contraseña, idioma preferido.\nDatos de mudanza: origen/destino, fechas, hogar, presupuesto, checklist, inventario, documentos que subes, mensajes con Pilot y ajustes.\nDatos técnicos: cookies de sesión, dirección IP (seguridad y límites de uso) y registros básicos del servidor.",
    },
  },
  {
    id: "use",
    title: {
      en: "3. How we use information",
      es: "3. Cómo usamos la información",
    },
    body: {
      en: "We use your data to provide and improve the Service, personalize your move plan, send transactional emails (invites, reminders, password reset), respond to support requests, and protect against abuse.",
      es: "Usamos tus datos para prestar y mejorar el Servicio, personalizar tu plan de mudanza, enviar emails transaccionales (invitaciones, recordatorios, restablecer contraseña), atender soporte y proteger contra abusos.",
    },
  },
  {
    id: "ai-processing",
    title: {
      en: "4. AI processing",
      es: "4. Procesamiento con IA",
    },
    body: {
      en: "When you use Pilot or inventory assist, relevant move context and your messages may be sent to our AI provider (OpenAI) to generate responses. Do not submit sensitive information you do not want processed for this purpose.",
      es: "Cuando usas Pilot o asistencia de inventario, el contexto de tu mudanza y tus mensajes pueden enviarse a nuestro proveedor de IA (OpenAI) para generar respuestas. No envíes información sensible que no quieras procesar con este fin.",
    },
  },
  {
    id: "sharing",
    title: {
      en: "5. Sharing",
      es: "5. Compartición",
    },
    body: {
      en: "We do not sell your personal information. We share data with service providers that help us operate (hosting, email, AI, maps/weather APIs) under contractual obligations. We may disclose information if required by law or to protect rights and safety.",
      es: "No vendemos tu información personal. Compartimos datos con proveedores que nos ayudan a operar (hosting, email, IA, APIs de mapas/clima) bajo obligaciones contractuales. Podemos divulgar información si la ley lo exige o para proteger derechos y seguridad.",
    },
  },
  {
    id: "cookies",
    title: {
      en: "6. Cookies and local storage",
      es: "6. Cookies y almacenamiento local",
    },
    body: {
      en: "We use essential cookies for login sessions and optional locale preference storage. If analytics are enabled, we may use privacy-friendly analytics that do not use cross-site tracking cookies.",
      es: "Usamos cookies esenciales para sesión de login y almacenamiento opcional de idioma. Si se activan analíticas, podemos usar analíticas respetuosas con la privacidad sin cookies de seguimiento entre sitios.",
    },
  },
  {
    id: "retention",
    title: {
      en: "7. Retention",
      es: "7. Conservación",
    },
    body: {
      en: "We retain your data while your account is active. You may export or delete your account from Settings. Backups may persist for a limited period after deletion.",
      es: "Conservamos tus datos mientras tu cuenta esté activa. Puedes exportar o eliminar tu cuenta desde Ajustes. Las copias de seguridad pueden persistir un periodo limitado tras la eliminación.",
    },
  },
  {
    id: "rights",
    title: {
      en: "8. Your rights",
      es: "8. Tus derechos",
    },
    body: {
      en: "Depending on your location, you may have rights to access, correct, delete, or export your data. Contact support@movepilotai.com to exercise these rights.",
      es: "Según tu ubicación, puedes tener derecho a acceder, corregir, eliminar o exportar tus datos. Escribe a support@movepilotai.com para ejercer estos derechos.",
    },
  },
  {
    id: "security",
    title: {
      en: "9. Security",
      es: "9. Seguridad",
    },
    body: {
      en: "We use industry-standard measures including encrypted connections (HTTPS), hashed passwords, and access controls. No method of transmission or storage is 100% secure.",
      es: "Usamos medidas estándar del sector: conexiones cifradas (HTTPS), contraseñas hasheadas y controles de acceso. Ningún método de transmisión o almacenamiento es 100% seguro.",
    },
  },
  {
    id: "children",
    title: {
      en: "10. Children",
      es: "10. Menores",
    },
    body: {
      en: "The Service is not directed to children under 13. We do not knowingly collect data from children under 13.",
      es: "El Servicio no está dirigido a menores de 13 años. No recopilamos datos de menores de 13 a sabiendas.",
    },
  },
  {
    id: "updates",
    title: {
      en: "11. Policy updates",
      es: "11. Actualizaciones",
    },
    body: {
      en: "We may update this Policy. The “Last updated” date at the top reflects the latest version. Continued use after changes means you accept the updated Policy.",
      es: "Podemos actualizar esta Política. La fecha “Última actualización” refleja la versión vigente. El uso continuado tras los cambios implica aceptación.",
    },
  },
  {
    id: "contact",
    title: {
      en: "12. Contact",
      es: "12. Contacto",
    },
    body: {
      en: "Privacy questions: support@movepilotai.com",
      es: "Preguntas de privacidad: support@movepilotai.com",
    },
  },
];

export const REFUNDS_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: {
      en: "1. Overview",
      es: "1. Resumen",
    },
    body: {
      en: "MovePilot Pro is sold as a one-time payment per move (currently $29 USD). This Refund Policy explains when you may request a refund and how to contact us.",
      es: "MovePilot Pro se vende como un pago único por mudanza (actualmente 29 USD). Esta Política de reembolsos explica cuándo puedes solicitar un reembolso y cómo contactarnos.",
    },
  },
  {
    id: "trial",
    title: {
      en: "2. Free trial",
      es: "2. Prueba gratuita",
    },
    body: {
      en: "New accounts include a 7-day trial with full Pro access. No payment is collected during the trial unless you choose to upgrade early. If you have not paid, cancel simply by not upgrading — no refund is needed.",
      es: "Las cuentas nuevas incluyen 7 días de prueba con acceso Pro completo. No se cobra durante la prueba salvo que decidas mejorar antes. Si no has pagado, basta con no actualizar — no hace falta reembolso.",
    },
  },
  {
    id: "eligible",
    title: {
      en: "3. When refunds may apply",
      es: "3. Cuándo puede aplicar un reembolso",
    },
    body: {
      en: "We may issue a full refund within 14 days of purchase if:\n• You were charged by mistake (duplicate payment)\n• The Service was unavailable for an extended period due to our fault\n• You request a refund before meaningfully using Pro features after payment\n\nWe generally do not refund after substantial use of Pro features (AI chat, exports, shared links, document uploads) for the same move.",
      es: "Podemos emitir un reembolso completo dentro de los 14 días posteriores a la compra si:\n• Se te cobró por error (pago duplicado)\n• El Servicio estuvo indisponible por un periodo prolongado por nuestra culpa\n• Solicitas reembolso antes de usar de forma significativa las funciones Pro tras el pago\n\nPor lo general no reembolsamos tras un uso sustancial de funciones Pro (chat IA, exportaciones, enlaces compartidos, subida de documentos) para la misma mudanza.",
    },
  },
  {
    id: "how",
    title: {
      en: "4. How to request a refund",
      es: "4. Cómo solicitar un reembolso",
    },
    body: {
      en: "Email support@movepilotai.com with the subject “Refund request”, your account email, and the reason. We respond within 2 business days. Approved refunds are processed to your original payment method via Stripe within 5–10 business days.",
      es: "Escribe a support@movepilotai.com con asunto “Refund request”, el email de tu cuenta y el motivo. Respondemos en 2 días hábiles. Los reembolsos aprobados se procesan al método de pago original vía Stripe en 5–10 días hábiles.",
    },
  },
  {
    id: "stripe",
    title: {
      en: "5. Receipts and billing",
      es: "5. Recibos y facturación",
    },
    body: {
      en: "Stripe sends a payment receipt to your email after checkout. Pro users can open the Stripe billing portal from Settings → Your plan → Manage billing to view payment history.",
      es: "Stripe envía un recibo a tu email tras el pago. Los usuarios Pro pueden abrir el portal de facturación de Stripe desde Ajustes → Tu plan → Gestionar facturación para ver el historial de pagos.",
    },
  },
  {
    id: "contact",
    title: {
      en: "6. Contact",
      es: "6. Contacto",
    },
    body: {
      en: "Refund questions: support@movepilotai.com",
      es: "Preguntas sobre reembolsos: support@movepilotai.com",
    },
  },
];

export const LEGAL_LAST_UPDATED: Record<Locale, string> = {
  en: "June 10, 2026",
  es: "10 de junio de 2026",
};
