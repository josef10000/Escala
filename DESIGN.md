---
name: OminiHub / Escala
description: Sistema operacional dark-first para gestão de escalas de plantão, equipes regionais e pontos fixos
colors:
  bg-canvas: "#090A0F"
  bg-surface: "#0e1017"
  bg-elevated: "#1e1f25"
  text-primary: "#e3e1e9"
  accent-cyan: "#00d2d3"
  accent-cyan-ink: "#003737"
  print-bg: "#ffffff"
  print-text: "#0f172a"
typography:
  body:
    fontFamily: "'Geist', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.5
  shell-body:
    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif"
    letterSpacing: "0.005em"
  shell-heading:
    fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif"
    letterSpacing: "-0.015em"
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
rounded:
  sm: "4px"
spacing:
  unit: "8px"
  sub: "4px"
---

## Overview

O **OminiHub / Escala** utiliza uma interface dark-first voltada para leitura contínua em operação de plantões, com superfície base `#090A0F`, texto claro `#e3e1e9` e destaque em ciano (`#00d2d3`). No módulo `central-shell`, há tipografia dedicada para títulos, corpo e números tabulares.

> Nota de auditoria (Impeccable): A base atual ainda carrega fontes sinalizadas como genéricas (`Geist`, `Plus Jakarta Sans`) em `src/index.css` e acentos roxos pontuais em `OperationalKpiModal.tsx` e `UniversalOmniModal.tsx`, que serão refinados nas próximas ondas de UI/UX.

## Colors

- **Fundo principal (`bg-canvas`):** `#090A0F` (definido em `index.html` e `src/index.css`).
- **Superfícies secundárias e scrollbars:** `#0e1017` e `#1e1f25`.
- **Texto principal:** `#e3e1e9`.
- **Acento primário / seleção:** `#00d2d3` com texto `#003737` em seleção (`selection:bg-[#00d2d3] selection:text-[#003737]`).
- **Modo impressão (`@media print`):** fundo `#ffffff` e texto `#0f172a` em orientação paisagem.

## Typography

- **Global (`html`, `body`):** `'Geist', 'Inter', system-ui, ...` com `font-size: 1rem` e `line-height: 1.5`.
- **Central Shell (`.central-shell`):** `'DM Sans'` para corpo, `'Plus Jakarta Sans'` para `h1`–`h4` (com `text-wrap: balance`) e `'JetBrains Mono'` com `font-variant-numeric: tabular-nums` para dados numéricos e códigos.

## Layout

- **Sistema de grade:** Baseado em múltiplos de 8px (`8-Point Grid System`), com sub-escala de 4px para alinhamentos finos.
- **Estrutura principal:** `Navbar` fixa no topo, `ScheduleToolbar` contextual, área principal de visualização (`EscalaGridView`, `MonthCalendarView`, `AgendaView`, `PersonalMonthlyCalendar`, `MobileScheduleView` ou módulos lazy) e `TodayDutyPanel` para leitura rápida do dia.
- **Modais:** Mais de 25 modais carregados sob demanda (`React.lazy`) para fluxos de criação/edição de plantão, trocas, marketplace, autenticação por PIN/Líder, relatórios executivos e exportação WhatsApp/PDF.

## Elevation & Depth

- Superfícies escuras com transparência (glassmorphism) e bordas sutis de separação.
- Cartões 3D interativos (`.card-3d-stage`, `.card-3d-rotator`) com `perspective: 1400px` e efeito de brilho especular (`.card-3d-glare`).

## Shapes

- Scrollbar customizada com `6px` de largura/altura e `border-radius: 4px`.
- Componentes utilitários Tailwind v4 (`rounded-lg`, `rounded-xl`, `rounded-2xl`) aplicados conforme hierarquia de cards, pills e modais.

## Components

- **Navegação (`Navbar.tsx`):** Alternância de módulos e visões, drawer do gestor, badges de pendências (trocas/solicitações/marketplace) e gatilho do Command Menu.
- **Toolbar (`ScheduleToolbar.tsx`):** Navegação mensal, botão "Hoje", filtros por prestador/busca, alternância de regime (`12x36`, `5x2`, `weekend`), status de publicação do mês e métricas ao vivo do plantão de hoje.
- **Visualizações & Modais:** Grades operacionais, calendários pessoais e fluxos modais especializados.

## Do's and Don'ts

- **Do:** Manter alto contraste em fundos escuros (`#090A0F`), usar `tabular-nums` em horários, contadores e datas, e preservar o layout limpo de `@media print`.
- **Don't:** Não usar gradientes roxos/violeta genéricos (`from-purple-*`, `text-purple-*`) fora de tokens semânticos reais; não exibir contas de líder na lista de prestadores da grade; não quebrar o carregamento lazy dos módulos em 4G/mobile.
