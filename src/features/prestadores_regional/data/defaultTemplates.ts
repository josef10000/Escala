import { TemplateItem } from '../types';

export const INITIAL_TEMPLATES: TemplateItem[] = [
  // 1. ABERTURA
  {
    id: 'tpl-abertura-1',
    categoria: '1. ABERTURA',
    titulo: 'Abertura Padrão de Atendimento',
    texto: 'Boa tarde! Estou verificando seu atendimento. Um momento, por favor. As mensagens são respondidas por ordem de envio. Peço que aguarde. 😊',
    badge: '💬 Abertura',
    favorito: true,
  },

  // 2. EM ANÁLISE / VERIFICAÇÃO
  {
    id: 'tpl-analise-1',
    categoria: '2. EM ANÁLISE / VERIFICAÇÃO',
    titulo: 'Verificação de Disponibilidade',
    texto: 'Bom dia! Vou verificar a disponibilidade na agenda da região.',
    badge: '🔍 Verificação',
    favorito: false,
  },
  {
    id: 'tpl-analise-2',
    categoria: '2. EM ANÁLISE / VERIFICAÇÃO',
    titulo: 'Solicitação Encaminhada para Encaixe',
    texto: 'Olá, bom dia/boa tarde! Encaminhei sua solicitação para tentativa de encaixe. Assim que eu tiver um retorno, aviso por aqui.',
    badge: '🔄 Em Análise',
    favorito: true,
  },
  {
    id: 'tpl-analise-3',
    categoria: '2. EM ANÁLISE / VERIFICAÇÃO',
    titulo: 'Orientação sobre Tentativa de Encaixe',
    texto: 'Lembrando que os encaixes são apenas tentativas e dependem da disponibilidade do técnico. Recomendo garantir um agendamento para o cliente, evitando que ele fique aguardando a confirmação do encaixe.',
    badge: '⚠️ Aviso Encaixe',
    favorito: false,
  },

  // 3. ENCAIXE
  {
    id: 'tpl-encaixe-aprovado',
    categoria: '3. ENCAIXE',
    titulo: 'Encaixe Aprovado',
    texto: 'Técnico aceitou o encaixe. Quando estiver a caminho, entrará em contato com o cliente. Ele não vai passar previsão de horário, oriente o cliente a aguardar no local agendado.',
    badge: '✔️ Aprovado',
    favorito: true,
  },
  {
    id: 'tpl-encaixe-aguardando',
    categoria: '3. ENCAIXE',
    titulo: 'Aguardando Retorno do Encaixe',
    texto: 'O técnico ainda não confirmou o encaixe. Deseja continuar aguardando ou prefere reagendar?',
    badge: '⏳ Aguardando',
    favorito: false,
  },
  {
    id: 'tpl-encaixe-reprovado',
    categoria: '3. ENCAIXE',
    titulo: 'Encaixe Não Aprovado',
    texto: 'Infelizmente, o técnico não conseguirá realizar o encaixe hoje. Deseja agendar para uma nova data?',
    badge: '❌ Não aprovado',
    favorito: false,
  },

  // 4. AGENDAMENTO
  {
    id: 'tpl-agendamento-sucesso',
    categoria: '4. AGENDAMENTO',
    titulo: 'Agendamento Confirmado com Sucesso',
    texto: 'Seu agendamento foi realizado com sucesso. Por gentileza, confira a data e, principalmente, o endereço no sistema.',
    badge: '✔️ Sucesso',
    favorito: true,
  },
  {
    id: 'tpl-agendamento-sem-vaga',
    categoria: '4. AGENDAMENTO',
    titulo: 'Sem Vaga para a Data Solicitada',
    texto: 'No momento, não há disponibilidade para a data solicitada. Tenho vaga para o dia ____. O cliente pode nessa data?',
    badge: '⚠️ Sem vaga',
    favorito: true,
  },
  {
    id: 'tpl-agendamento-horario',
    categoria: '4. AGENDAMENTO',
    titulo: 'Regras de Horário e Previsão',
    texto: 'Não há previsão de horário. O atendimento será realizado dentro do horário comercial.\n\nCaso o técnico não consiga contato com o cliente, a equipe fará uma nova tentativa.\n\nA partir das 16h iniciaremos a confirmação da agenda. Se o técnico informar que o atendimento ultrapassará as 18h, avisaremos o cliente.',
    badge: '⏰ Horário',
    favorito: false,
  },

  // 5. PENDÊNCIAS / PEDIDO SEM ASSINATURA (PRÉ-AGENDADO)
  {
    id: 'tpl-pendencia-assinatura',
    categoria: '5. PENDÊNCIAS (SEM ASSINATURA)',
    titulo: 'Documento Sem Assinatura (Pré-Agendado)',
    texto: 'É necessário que o documento esteja assinado para dar andamento ao agendamento ou à tentativa de encaixe. Sem a assinatura, o atendimento permanecerá como pré-agendado.\n\nLembrando que um atendimento pré-agendado não garante vaga na agenda.\n\nApós a assinatura:\n• Com vaga: será confirmado como agendado.\n• Sem vaga: ficará aguardando reagendamento.',
    badge: '📝 Assinatura',
    favorito: false,
  },

  // 6. DADOS OBRIGATÓRIOS PARA ENCAIXE
  {
    id: 'tpl-dados-encaixe',
    categoria: '6. DADOS PARA ENCAIXE',
    titulo: 'Formulário / Dados Obrigatórios para Encaixe',
    texto: 'Placa:\nNome:\nTelefone:\nEndereço com nº:\nCidade:\nBairro:\nCEP:\nRegião do técnico:\nData desejada para o agendamento:',
    badge: '📋 Formulário',
    favorito: true,
  },

  // 7. REGRAS OPA
  {
    id: 'tpl-regras-opa',
    categoria: '7. REGRAS OPA',
    titulo: 'Abertura de Protocolo por Placa',
    texto: 'Para cada placa e solicitação, é necessário abrir um novo protocolo, por questão de organização e produtividade.',
    badge: '📌 Protocolo',
    favorito: false,
  },

  // 8. HORÁRIO DE ATENDIMENTO
  {
    id: 'tpl-horario-atendimento',
    categoria: '8. HORÁRIO DE ATENDIMENTO',
    titulo: 'Horários de Atendimento e Prazos',
    texto: 'Agendamentos para o próximo dia: até às 18h.\nDúvidas e informações: até às 19h.\n\nApós esse horário, o atendimento será retomado no próximo dia, a partir das 7h.',
    badge: '🕒 Prazos',
    favorito: false,
  },

  // 9. PEDIDO PRÉ-AGENDADO
  {
    id: 'tpl-limite-agenda',
    categoria: '9. LIMITE DE AGENDA',
    titulo: 'Regras de Limite de Agenda e Frustração',
    texto: 'Os pedidos não são removidos das agendas apenas por terem sido assinados após o horário limite.\n\nCaso a agenda já tenha atingido o limite com pedidos assinados, qualquer pedido assinado posteriormente também será frustrado. Isso ocorre porque a agenda já atingiu o limite máximo definido pelo técnico, garantindo a qualidade do atendimento.\n\nApós atingir esse limite, não é possível incluir novos atendimentos para o mesmo dia.',
    badge: '🔒 Limite',
    favorito: false,
  },

  // 10. ENCERRAMENTO NO OPA POR FALTA DE INTERAÇÃO
  {
    id: 'tpl-encerramento-falta-interacao',
    categoria: '10. ENCERRAMENTO OPA',
    titulo: 'Encerramento por Falta de Interação',
    texto: 'Atendimento encerrado por falta de interação.',
    badge: '🛑 Encerramento',
    favorito: true,
  },

  // 11. ORIENTAÇÕES / NOTAS IMPORTANTES (BKO & PAGAMENTO)
  {
    id: 'tpl-bko-frustracao',
    categoria: '11. REGRAS BKO & PAGAMENTO',
    titulo: 'Registro de Motivo de Frustração (BKO)',
    texto: 'Sempre que o vendedor pedir para frustrar um atendimento, por favor, registre o motivo. Assim, caso ele, o líder ou o BackOffice (BKO) entre em contato questionando, teremos a informação registrada para repassar.',
    badge: '💡 BKO',
    favorito: false,
  },
  {
    id: 'tpl-pagamento-encaixe',
    categoria: '11. REGRAS BKO & PAGAMENTO',
    titulo: 'Regras de Baixa de Pagamento para Encaixe',
    texto: 'Encaixe só pode ser solicitado após constar a baixa do pagamento no sistema.\n\nPedidos com valor entre R$ 1,00 e R$ 50,00 que não estiverem com o pagamento confirmado não terão solicitação de encaixe. Nesses casos, também não será realizado agendamento para outras datas nem para o dia seguinte.',
    badge: '💳 Pagamento',
    favorito: false,
  },
];
