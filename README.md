# OminiHub / Escala — Gestão, Escalas & Produtividade

<div align="center">

![OminiHub Logo](/public/assets/aistudio/76071eca-dcd2-40c5-905e-3a374e2f25a8-Photoroom_1947334c.png)

### Sistema Multi-Tenant Robusto para Gestão de Plantões, CRMs, Técnicos e Produtividade Operacional

[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-Fast-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

</div>

---

## 🚀 Sobre o Projeto

O **OminiHub (Escala)** é uma aplicação corporativa de alta performance desenvolvida para gerenciar escalas de plantão, prestadores de serviço (PJ), equipes regionais (Leste, Oeste, Norte, Sul, ABC, Campinas, Sorocaba), pontos fixos de atendimento presencial e regras operacionais.

Com uma interface moderna inspirada em **3D Spatial Glassmorphism** e construída rigorosamente sob o **Sistema de 8 Pontos (8-Point Grid System)**, o OminiHub oferece controle granular para gestores (líderes) e autonomia para colaboradores e técnicos visualizarem seus plantões, realizarem trocas e negociações com total segurança.

---

## ✨ Principais Funcionalidades

### 1. 📅 Quadro Geral de Escalas
- **Gestão Completa do Mês**: Visualização em grade corporativa por prestador, dia e turno.
- **Filtros Avançados**: Filtragem por Turma (Turma A / Turma B) e Departamentos (UTI, Enfermaria, Regulação, etc.).
- **Modos de Visualização**: Quadro Geral, Grade Mensal, Calendário Pessoal do Colaborador, Visão Semanal e Agenda.

### 2. 👥 Técnicos & CEP (Módulo Regional)
- **Consulta Universal**: Busca instantânea por código, nome, cidade, região ou CEP em toda a base.
- **Cartões de Prestadores**: Exibição detalhada de contatos, WhatsApp corporativo com saudação automática por horário, e regime contratual.
- **Filtros Regionais com Cores Dinâmicas**: Identificação visual elegante e discreta das regiões (Leste, Oeste, Norte, Sul, ABC, etc.).
- **Modos de Exibição**: Cartões (Amplo e Compacto), Tabela Analítica e Terminal Rápido.

### 3. 📍 Pontos Fixos & Agendas
- **Bases Presenciais**: Status em tempo real de abertura/fechamento das bases de atendimento.
- **Navegação GPS Integrada**: Links diretos de rota para **Google Maps** e **Waze**.
- **Cópia Instantânea de CEP e Endereço**: Botões de 1 clique para copiar dados formatados para o OPA / WhatsApp.

### 4. 🔒 Segurança & Perfis
- **Autenticação por PIN (4 Dígitos)**: Proteção de perfil individual para cada colaborador.
- **Acesso Personalizado**: Colaboradores logados acessam diretamente seu calendário mensal individual com estatísticas de plantões trabalhados e folgas auditadas, sem poluição visual.
- **Controle de Permissões (RBAC)**: Ações sensíveis restritas ao líder autenticado ou ao próprio prestador em seu respectivo perfil.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 19 + TypeScript estrito
- **Estilização**: Tailwind CSS utilitário com Glassmorphism avançado
- **Ícones**: Lucide React
- **Build Tool**: Vite (rápido com HMR)
- **Armazenamento**: Persistência local robusta com sincronização em tempo real

---

## 📦 Como Executar o Projeto Localmente

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/omnihub-escala.git
   cd omnihub-escala
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**:
   `http://localhost:3000`

---

## 📐 Diretrizes de Design & UI/UX

- **Grid de 8 Pulos**: Todos os espaçamentos, margens e paddings seguem estritamente múltiplos de 8px (ou sub-escala de 4px para alinhamentos finos).
- **Sem "Bordas Cegas"**: Cards com efeitos translúcidos, reflexos especulares e transições suaves (`transition-all duration-200`).
- **Acessibilidade & Contraste**: Fundos escuros profissionais (`#090A0F`, `#0e1017`) combinados com acentos em ciano, azul e esmeralda.

---

## 📄 Licença

Este projeto é desenvolvido sob licença proprietária para **OminiHub / dr.monitora®**. Todos os direitos reservados.
