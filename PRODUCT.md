# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Gestor / Líder da Escala:** Planeja, publica e audita escalas mensais, aprova trocas e solicitações, gerencia prestadores, registra ocorrências operacionais e acompanha KPIs e relatórios executivos.
- **Colaborador / Prestador (PJ / Técnico):** Consulta seus plantões no calendário pessoal ou na grade geral, acessa com PIN de 4 dígitos, solicita trocas/folgas e negocia plantões no marketplace.
- **Operação Regional (Módulo Prestadores & CEP):** Consulta rapidamente prestadores por região/CEP, status de pontos fixos presenciais e acionamento via WhatsApp ou GPS.

## Product Purpose

Centralizar o planejamento, publicação e consulta de escalas de plantão (regimes `12x36`, `5x2` e `weekend`, modalidades `presencial` e `home_office`), gestão de equipes regionais (Turma A / Turma B), pontos fixos presenciais e fluxo de trocas/marketplace com sincronização em nuvem (Firebase/Firestore) e operação em dispositivos desktop e mobile.

## Positioning

Aplicação operacional multi-módulo para gestão de escalas de plantão e equipes regionais (`OminiHub / Escala — dr.monitora®`), combinando grade corporativa por turma/regime, acesso individual por PIN de 4 dígitos, diretório regional com busca por CEP/WhatsApp e marketplace interno de plantões em uma única interface.

## Operating Context

- **Idioma:** Português do Brasil (`pt-BR`), com feriados brasileiros (`holidaysBR.ts`) e formatação local de datas/horários.
- **Dispositivos e ambiente:** Uso contínuo em desktop (sala de operação / gestão) e mobile 4G em campo (técnicos e prestadores), além de exportação para impressão/PDF e disparo formatado para WhatsApp.
- **Módulos principais:** Quadro Geral de Escalas (`EscalaGridView`, `MonthCalendarView`, `AgendaView`, `PersonalMonthlyCalendar`, `MobileScheduleView`), Técnicos & CEP (`PrestadoresRegionalModule`), Central de Inteligência (`CentralInteligenciaModule`) e Feedbacks do Gestor (`GestorFeedbacksPage`).

## Capabilities and Constraints

- **Stack:** React 19, TypeScript (`tsc --noEmit`), Tailwind CSS v4, Vite, Lucide React, Phosphor Icons, Motion, Firebase/Firestore, jsPDF/html2canvas, Express/tsx.
- **Controle de acesso (RBAC):** Contas de líder nunca aparecem como prestadores na grade; ações administrativas e cadastro de prestadores são restritos ao perfil de líder autenticado; colaboradores usam PIN individual de 4 dígitos.
- **Performance em 4G/Mobile:** Views e modais carregados sob demanda com `React.lazy` e `Suspense`.
- **Impressão:** Layout dedicado em `@media print` (paisagem, fundo branco, ocultando barras de navegação e controles).

## Brand Commitments

- **Marca:** OminiHub / Escala (`dr.monitora®`).
- **Identidade visual base:** Interface dark-first (`#090A0F`), acento principal em ciano (`#00d2d3`), suporte a impressão em fundo claro.

## Product Principles

1. **Clareza operacional imediata:** Quem está de plantão hoje, em qual turno/modalidade e eventuais lacunas devem ser legíveis em segundos.
2. **Separação clara entre gestão e consulta:** O líder tem ferramentas de edição e auditoria; o colaborador tem visão limpa dos próprios plantões e trocas.
3. **Velocidade em campo:** Busca instantânea (atalho de Command Menu, filtros por turma/regime/CEP) e carregamento leve para uso em celular.
4. **Confiabilidade de dados:** Estados explícitos de publicação do mês, confirmações claras para ações destrutivas e sincronização transparente.
