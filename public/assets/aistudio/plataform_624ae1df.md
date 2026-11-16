# Central de Inteligência Operacional
## Especificação funcional e técnica — Versão 1.0

**Data:** 16/11/2026  
**Status:** Escopo inicial consolidado para implementação.

---

# 1. Visão do projeto

Construir uma plataforma web responsiva, com experiência PWA, que acompanhe os grupos de WhatsApp utilizados pela operação de instalação de rastreadores e transforme as mensagens em informações organizadas, pesquisáveis e úteis para a gestão.

O objetivo da primeira versão é **dar clareza sobre o que acontece na operação sem exigir que atendentes ou técnicos mudem a forma como trabalham hoje**.

O WhatsApp continuará sendo o canal de comunicação e execução da rotina. A plataforma acompanhará os grupos, interpretará as mensagens, organizará os acontecimentos e oferecerá painéis, históricos, indicadores e um chat inteligente de consulta.

## 1.1. Princípio central

> O WhatsApp continua sendo o canal de comunicação. A plataforma passa a ser o lugar onde a operação é compreendida.

## 1.2. O que a primeira versão não fará

- Não substituirá os grupos de WhatsApp.
- Não enviará solicitações de encaixe automaticamente aos técnicos.
- Não responderá técnicos ou atendentes em nome da equipe.
- Não alterará chamados, reagendamentos ou status operacionais por meio do chat.
- Não tomará decisões operacionais autônomas.
- Não tratará interpretações da IA como fatos confirmados sem preservar a origem e o nível de confiança.

O chat será exclusivamente para consulta nesta primeira versão.

---

# 2. Fontes de informação

A primeira versão acompanhará três grupos de WhatsApp:

1. **ENCAIXES MESMO DIA**
2. **EQUIPE TÉCNICA**
3. **AGENDAS E MUDANÇAS**

A integração será feita por uma instância da Evolution API conectada a um número de WhatsApp, adicionada aos grupos autorizados.

A plataforma deverá registrar, sempre que disponibilizados pela integração:

- Identificador da mensagem no WhatsApp.
- Grupo de origem.
- Autor/remetente.
- Data e hora.
- Texto original.
- Tipo de conteúdo (texto, imagem, áudio, documento etc.).
- Referência ao conteúdo de mídia, quando acessível.
- Relação com mensagens respondidas, citadas ou encaminhadas, quando disponível.

Mensagens duplicadas não devem gerar eventos duplicados. A ingestão deve ser idempotente.

## 2.1. Limitações de mídia

Mensagens de áudio, imagens e documentos poderão ser armazenados e processados quando a integração e os serviços de IA suportarem o formato.

O sistema deverá indicar quando um conteúdo não pôde ser interpretado. Não deverá inventar o conteúdo de mídias indisponíveis ou ilegíveis.

---

# 3. Módulo de encaixes

O grupo **ENCAIXES MESMO DIA** concentra solicitações para tentar encaixar um cliente na agenda de um técnico no mesmo dia.

## 3.1. Dados identificados nas solicitações

A extração deverá reconhecer, quando presentes:

- Nome do cliente.
- Placa.
- Telefone.
- Endereço.
- Cidade.
- Bairro.
- CEP.
- Região/sub-região/setor.
- NSU ou identificador da ordem de serviço.
- Veículo.
- Data desejada.
- Observações.
- Técnico indicado ou acionado.
- Mensagens posteriores relacionadas à solicitação.

Nem todos os campos estarão presentes em todas as mensagens. A ausência de um campo não deverá impedir o registro inicial.

## 3.2. Acompanhamento do ciclo do encaixe

Cada solicitação deverá ter um registro próprio e um histórico de eventos.

Estados iniciais:

- Recebido/identificado.
- Aguardando identificação ou validação.
- Técnico acionado (identificado pela conversa, sem envio automático pela plataforma).
- Aceito.
- Recusado.
- Sem resposta após o prazo configurado.
- Cancelado.
- Encerrado ou resultado desconhecido.

A equipe continuará realizando os contatos no WhatsApp. O sistema apenas identificará e registrará o que aconteceu.

## 3.3. Regras importantes

- Aceite, recusa e ausência de resposta são resultados distintos.
- Silêncio não significa recusa.
- Uma solicitação só será classificada como "sem resposta" após o prazo configurado.
- Enquanto o prazo não vencer, o estado permanece pendente.
- Reenvios, cobranças ou mensagens repetidas sobre o mesmo pedido não deverão ser contabilizados como novas solicitações, salvo quando representarem um novo pedido.
- Mudança de técnico, endereço, data ou região deverá ser registrada no histórico, preservando o valor anterior.
- Quando não for possível associar uma resposta a um encaixe com segurança, o sistema deverá marcar para revisão em vez de adivinhar.

## 3.4. Métricas de encaixes por técnico

O card do técnico deverá apresentar:

- Total de solicitações válidas recebidas.
- Quantidade de aceites.
- Quantidade de recusas.
- Quantidade de solicitações sem resposta após o prazo.
- Taxa de aceite.
- Taxa de recusa.
- Taxa de resposta.
- Taxa de ausência de resposta.
- Tempo médio de resposta.
- Histórico por região, dia da semana e período do dia, quando houver amostra suficiente.

### Fórmulas

- **Taxa de aceite:** aceites ÷ solicitações válidas.
- **Taxa de recusa:** recusas ÷ solicitações válidas.
- **Taxa de resposta:** (aceites + recusas) ÷ solicitações válidas.
- **Taxa de ausência:** solicitações sem resposta ÷ solicitações válidas.
- **Tempo médio de resposta:** média do intervalo entre o envio/acionamento identificado e a primeira resposta válida do técnico.

As taxas deverão usar o mesmo universo de solicitações válidas e finalizadas para que sejam comparáveis. Solicitações ainda pendentes não entram no denominador das taxas finalizadas.

Cancelamentos e registros duplicados deverão ser excluídos conforme regras auditáveis.

A ausência de motivo de recusa não impede o cálculo. Motivos, quando informados espontaneamente, serão dados complementares, não obrigatórios.

## 3.5. Probabilidade estimada de aceite

Além da taxa histórica, o sistema poderá apresentar uma estimativa de probabilidade de aceite para um novo encaixe.

A estimativa poderá considerar:

- Histórico geral do técnico.
- Região e setor específicos.
- Dia da semana.
- Horário.
- Agenda do dia (fechada, reduzida, sem serviço ou normal).
- Quantidade de atendimentos já previstos, se disponível.
- Proximidade do encaixe em relação à região/rota conhecida, quando houver dados confiáveis.
- Comportamento recente.

A probabilidade deverá ser identificada como **estimativa**, nunca como fato.

Deve exibir o volume de observações usado e evitar percentuais aparentemente precisos com amostras pequenas. Na ausência de dados suficientes, mostrar "histórico insuficiente".

O cálculo deverá ser feito por regras ou modelo estatístico do sistema, e não por uma resposta livre de IA.

A previsão não deverá, nesta fase, disparar mensagens ou escolher automaticamente o técnico.

---

# 4. Módulo de equipe técnica e ocorrências

O grupo **EQUIPE TÉCNICA** registra acontecimentos durante os atendimentos.

A IA deverá identificar e organizar, quando possível, ocorrências como:

- Cliente não atende telefone ou WhatsApp.
- Cliente ausente.
- Endereço incorreto ou incompleto.
- Região incorreta.
- Cliente solicita reagendamento.
- Cancelamento.
- Solicitação de ajuda ou suporte.
- Problema com placa, OS ou documentação.
- Técnico informa chegada ao local.
- Atendimento realizado ou concluído, quando explicitamente indicado.
- Atendente/supervisor tenta contato com cliente ou representante.
- Autorização ou orientação da equipe.
- Retorno solicitado ou pendência em aberto.
- Outras ocorrências, com categoria "não classificada" quando necessário.

Cada ocorrência deverá relacionar, quando possível:

- Técnico.
- Cliente.
- Placa.
- NSU/ordem de serviço.
- Encaixe ou atendimento relacionado.
- Categoria.
- Descrição resumida.
- Data e hora.
- Grupo e mensagem de origem.
- Autor da mensagem.
- Estado da ocorrência.
- Nível de confiança da interpretação.

## 4.1. Estado da ocorrência

Estados possíveis, ajustáveis conforme a operação:

- Identificada.
- Em acompanhamento.
- Aguardando cliente.
- Aguardando equipe/atendente.
- Aguardando técnico.
- Resolvida/concluída (somente quando houver evidência).
- Sem desfecho identificado.
- Necessita revisão.

Não considerar que uma ocorrência foi resolvida apenas porque a conversa parou. O sistema deverá distinguir "sem novas mensagens" de "resolvida".

---

# 5. Módulo de agendas e mudanças

O grupo **AGENDAS E MUDANÇAS** fornece a configuração diária de trabalho dos técnicos.

A IA deverá interpretar as agendas enviadas e converter o conteúdo em registros estruturados por data e técnico.

## 5.1. Categorias da agenda

- **Fechadas:** técnico com agenda fechada para a data.
- **Sem serviço:** técnico sem atendimento previsto/serviço naquela data.
- **Reduzida:** capacidade/agenda reduzida. A regra operacional exata deverá ser configurável e confirmada com a operação.
- **Mudanças:** alteração temporária das regiões/setores atendidos pelo técnico naquela data.

As mudanças de uma data não deverão ser perpetuadas para os dias seguintes.

Cada agenda será uma configuração diária, preservando o histórico das versões e correções.

## 5.2. Geografia operacional

A estrutura geográfica descrita é hierárquica:

- Região maior: Leste, Norte, Sul, Oeste, ABC, Centro etc.
- Sub-região: Leste 1, Leste 2, Oeste 4, ABC 3 etc.
- Setor geográfico: Alta, Meio, Baixa; em alguns casos, Direita/Esquerda.

Exemplo:

`Leste 1/4 altas`

Significa atendimento ao setor Alta tanto da Leste 1 quanto da Leste 4 na data informada.

Outro exemplo:

`Felipe Sul1 alta/abc3 meio/centro baixa`

Os termos Alta, Meio, Baixa, Direita e Esquerda são subdivisões geográficas internas, não níveis de prioridade nem indicadores de capacidade.

## 5.3. Cobertura do técnico

O cadastro e o card de cada técnico deverão distinguir:

1. **Cobertura habitual:** regiões e setores normalmente atendidos.
2. **Cobertura diária:** áreas efetivamente atribuídas para uma data específica, considerando mudanças temporárias.

O sistema deverá manter o texto original da agenda e a interpretação estruturada, permitindo revisão manual quando houver ambiguidade.

---

# 6. Cadastro e gestão de técnicos

A operação já possui uma base de cadastro de técnicos e regiões.

A plataforma deverá permitir aproveitar essa base por meio de importação ou integração, conforme o formato e a origem identificados durante a implantação.

## 6.1. Importação da base existente

A implementação deverá prever:

- Importação inicial por arquivo (por exemplo, CSV/XLSX) ou integração, se tecnicamente disponível.
- Mapeamento das colunas de origem para os campos internos.
- Pré-visualização antes de confirmar a importação.
- Validação de campos obrigatórios.
- Identificação de possíveis duplicidades.
- Relatório de linhas importadas, ignoradas ou com erro.
- Atualização de cadastros existentes sem apagar histórico operacional.
- Registro da origem e data da importação.

O formato e a localização da base atual ainda precisarão ser identificados.

## 6.2. Cadastro e edição manual

Será possível cadastrar, editar, ativar, inativar e consultar técnicos diretamente na plataforma.

Campos sugeridos:

- Nome.
- Identificador interno, se houver.
- Telefone/identificador do WhatsApp, quando disponível.
- Status do cadastro.
- Cobertura habitual.
- Regiões, sub-regiões e setores atendidos.
- Observações administrativas.
- Data de criação e última atualização.

A edição da cobertura habitual não deverá alterar retroativamente as agendas diárias ou os históricos anteriores.

Mudanças deverão valer a partir da data definida e manter trilha de auditoria.

A inativação não apagará o histórico do técnico. Registros anteriores continuarão disponíveis para consultas e indicadores históricos.

---

# 7. Cadastro geográfico

O sistema deverá possuir uma estrutura editável de regiões, sub-regiões e setores.

Também deverá permitir associar CEPs, cidades, bairros e endereços às áreas operacionais correspondentes.

A classificação geográfica deverá ser baseada em uma tabela ou regras de correspondência mantidas no sistema, e não em uma decisão livre da IA.

Quando o endereço não puder ser associado com segurança, o sistema deverá marcar como "região não identificada" ou "requer revisão".

A fonte atual dos dados geográficos e o nível de detalhe disponível deverão ser levantados na implantação.

---

# 8. Cadastro e histórico de clientes/chamados

A plataforma deverá consolidar referências ao mesmo cliente ou atendimento mesmo quando as informações estiverem distribuídas entre os grupos.

Possíveis identificadores para associação:

- Placa.
- NSU/ordem de serviço.
- Telefone.
- Nome do cliente.
- Endereço.

A associação deverá usar regras de correspondência e nível de confiança. Não unir registros automaticamente quando houver risco de confundir pessoas, veículos ou chamados diferentes.

## 8.1. Linha do tempo

Cada cliente/chamado deverá ter uma linha do tempo unificada contendo:

- Solicitação de encaixe.
- Técnico acionado, quando identificado.
- Aceite, recusa ou ausência de resposta.
- Mudanças de endereço ou região.
- Ocorrências durante a execução.
- Tentativas de contato.
- Orientações da equipe.
- Reagendamentos e cancelamentos.
- Conclusão, quando houver evidência.

Cada evento deverá manter link ou referência à mensagem original que o originou.

O sistema deverá separar:

1. O texto original.
2. A interpretação feita pela IA.
3. O estado operacional consolidado.

---

# 9. Chat inteligente de consulta

O sistema terá um chat para consultar informações da operação em linguagem natural.

Exemplos:

- "O que aconteceu com o cliente de placa ABC1D23?"
- "Quais pendências ainda estão abertas hoje?"
- "Quantos encaixes o técnico X recebeu esta semana?"
- "Qual é a taxa de resposta do técnico Y?"
- "Quais técnicos atenderam a Leste 1 ontem?"
- "Quais clientes aguardam retorno?"
- "Resuma as principais ocorrências de hoje."

## 9.1. Regras do chat

- O chat é somente de consulta na primeira versão.
- Não poderá enviar mensagens, atualizar registros ou executar ações.
- Deverá consultar a base estruturada, não depender de reler todo o histórico bruto a cada pergunta.
- Deverá apresentar datas, horários, técnicos e identificadores quando relevantes.
- Deverá diferenciar fatos confirmados, interpretações e informações incertas.
- Deverá informar quando não encontrar evidência suficiente.
- Quando solicitado, deverá apresentar a mensagem original, grupo, autor e horário que sustentam a resposta.
- Deverá respeitar as permissões do usuário.

---

# 10. Painel e experiência da plataforma

A plataforma deverá ser responsiva e adequada para desktop e celular, com possibilidade de instalação como PWA.

## 10.1. Visão geral

A tela inicial deverá oferecer uma visão resumida da operação, incluindo:

- Encaixes identificados no dia.
- Aceites, recusas e solicitações sem resposta.
- Solicitações ainda aguardando resposta.
- Ocorrências recentes.
- Pendências em aberto.
- Técnicos e situação da agenda diária.
- Alertas de dados que precisam de revisão.

## 10.2. Tela de encaixes

Lista pesquisável e filtrável por data, técnico, região, cliente, placa, status e origem.

## 10.3. Tela de técnicos

Cards e perfil detalhado com:

- Cobertura habitual.
- Cobertura diária.
- Estado da agenda na data selecionada.
- Histórico de encaixes.
- Taxas de aceite, recusa, resposta e ausência.
- Tempo médio de resposta.
- Desempenho por região e período.
- Probabilidade estimada de aceite, quando houver dados suficientes.

## 10.4. Tela de ocorrências

Lista de ocorrências com filtros por técnico, cliente, categoria, data e estado, destacando pendências e itens que precisam de revisão.

## 10.5. Tela de clientes/chamados

Busca por placa, nome, telefone ou NSU e visualização da linha do tempo consolidada.

## 10.6. Chat

Interface de conversa com sugestões de perguntas e respostas fundamentadas nos dados registrados.

---

# 11. Arquitetura técnica proposta

A arquitetura deverá manter responsabilidades separadas para permitir troca de modelos e evolução gradual.

## 11.1. Componentes

- **PWA/painel web:** interface administrativa e operacional.
- **Backend/API:** regras de negócio, autenticação, consultas e gestão dos registros.
- **Evolution API:** conexão com WhatsApp e recebimento dos eventos dos grupos.
- **Banco de dados:** mensagens, pessoas, técnicos, clientes, agendas, encaixes, ocorrências e eventos.
- **Processador de mensagens:** normalização, deduplicação, associação e orquestração das análises.
- **DeepSeek:** interpretação generativa, extração e apoio ao chat, conforme avaliação de qualidade/custo.
- **Google Gemini Decision 1:** classificação e decisões estruturadas, quando aplicável.
- **Motor determinístico/estatístico:** regras geográficas, indicadores e estimativas de probabilidade.
- **Armazenamento de mídia:** referências e arquivos acessíveis, respeitando limites e políticas de retenção.

## 11.2. Fluxo de processamento

1. Evolution API recebe uma mensagem.
2. Backend registra a mensagem original e seus metadados.
3. Sistema verifica duplicidade.
4. Processador identifica grupo, autor, conteúdo e possíveis relações com mensagens anteriores.
5. Modelos de IA extraem informações e classificam eventos conforme necessário.
6. Regras determinísticas associam técnicos, clientes, chamados, regiões e agendas.
7. Sistema grava eventos interpretados, confiança e referência à origem.
8. Painéis, indicadores, históricos e chat consultam os dados estruturados.
9. Casos ambíguos ficam disponíveis para revisão, sem serem convertidos em fatos.

## 11.3. Não delegar à IA

As seguintes responsabilidades deverão permanecer em código e regras controladas:

- Cálculo das taxas.
- Deduplicação.
- Regras de prazo para ausência de resposta.
- Associação geográfica determinística.
- Controle de permissões.
- Integridade e versionamento dos cadastros.
- Histórico e auditoria.
- Cálculo de indicadores e previsões estatísticas.

---

# 12. Uso de IA e controle de custos

A seleção final dos modelos e versões deverá ser validada durante a implementação, considerando disponibilidade, limites, qualidade em português, preços e condições comerciais vigentes.

## 12.1. Papéis planejados

### DeepSeek

- Interpretar mensagens livres.
- Extrair entidades e contexto.
- Gerar resumos e respostas do chat.
- Tratar situações que exigem explicação em linguagem natural.

### Google Gemini Decision 1

- Classificações estruturadas.
- Avaliação de alternativas e decisões delimitadas.
- Identificação de categorias, estados ou rótulos com saída estruturada.
- Apoio a casos ambíguos quando seu uso trouxer benefício mensurável.

### Motor próprio

- Indicadores históricos.
- Taxas e tempos de resposta.
- Probabilidades estimadas, com controle de amostra e calibração.
- Regras operacionais e geográficas.

Os modelos não precisam processar toda mensagem em duplicidade. A orquestração deverá encaminhar cada tarefa ao modelo mais adequado e econômico, com escalonamento para outro modelo apenas quando necessário.

## 12.2. Estimativa preliminar do Gemini Decision 1

A estimativa discutida considera tarifa de referência de **US$ 0,10 por milhão de tokens de entrada**, sem cobrança de tokens de saída, conforme a informação de preço consultada durante o planejamento.

Essa tarifa, disponibilidade, limites e eventuais condições de uso deverão ser confirmados novamente na documentação oficial antes da contratação e implantação.

| Tokens de entrada/mês | Custo estimado |
|---:|---:|
| 1 milhão | US$ 0,10 |
| 5 milhões | US$ 0,50 |
| 10 milhões | US$ 1,00 |
| 30 milhões | US$ 3,00 |
| 50 milhões | US$ 5,00 |
| 100 milhões | US$ 10,00 |

Esses valores não representam o custo total da IA. Ainda será necessário medir:

- Quantidade de mensagens por grupo/dia.
- Tokens médios por mensagem e contexto.
- Percentual de mensagens encaminhadas a cada modelo.
- Reprocessamentos e casos ambíguos.
- Quantidade e tamanho das consultas ao chat.
- Uso de mídia e eventuais serviços adicionais.

O sistema deverá registrar consumo por modelo, tarefa, período e ambiente, permitindo construir um custo mensal real.

---

# 13. Banco de dados — entidades conceituais

A modelagem definitiva será feita na implementação, mas deverá contemplar pelo menos:

- Usuários e permissões.
- Grupos do WhatsApp.
- Mensagens originais.
- Anexos/mídias e referências.
- Técnicos.
- Coberturas habituais.
- Regiões, sub-regiões e setores.
- Correspondência de CEP, cidade, bairro e endereço.
- Agendas diárias.
- Mudanças diárias de cobertura.
- Clientes.
- Veículos.
- Chamados/ordens de serviço.
- Encaixes.
- Ocorrências.
- Eventos e linha do tempo.
- Interpretações da IA.
- Revisões humanas.
- Consumo e custos de IA.
- Logs de auditoria.

Toda interpretação deverá manter referência à mensagem original sempre que possível.

---

# 14. Segurança, auditoria e confiabilidade

- Autenticação de usuários.
- Perfis e permissões.
- Segredos e chaves de API armazenados somente no backend.
- Comunicação protegida por HTTPS.
- Registro de alterações manuais.
- Histórico de importações.
- Auditoria de alterações em técnicos, regiões e agendas.
- Proteção contra duplicidade de mensagens.
- Tratamento de falhas e retentativas.
- Monitoramento da conexão da Evolution API.
- Política de retenção de mensagens e mídias a definir.
- Controle de acesso a dados pessoais e informações de clientes.
- Adequação à LGPD, incluindo finalidade, acesso, retenção e proteção dos dados.

A plataforma deverá exibir claramente quando a integração estiver desconectada ou quando houver falha no processamento, para que ausência de dados não seja confundida com ausência de ocorrências.

---

# 15. Implantação por etapas

## Etapa 1 — Fundação e integração

- Preparar ambiente, backend, banco e autenticação.
- Conectar Evolution API.
- Receber e armazenar mensagens dos três grupos.
- Implementar deduplicação e monitoramento.
- Criar estrutura inicial de usuários e permissões.

## Etapa 2 — Cadastros e agendas

- Importar a base atual de técnicos.
- Permitir cadastro, edição e inativação de técnicos.
- Cadastrar estrutura geográfica.
- Interpretar agendas diárias e mudanças.
- Permitir revisão manual das interpretações.

## Etapa 3 — Encaixes

- Identificar solicitações.
- Associar respostas.
- Registrar aceite, recusa, pendência e ausência de resposta.
- Implementar métricas e histórico por técnico.

## Etapa 4 — Ocorrências e histórico

- Interpretar mensagens da equipe técnica.
- Consolidar clientes, placas e chamados.
- Criar linha do tempo com referências às mensagens de origem.
- Acompanhar pendências sem presumir resolução.

## Etapa 5 — Painel e chat

- Implementar visão geral.
- Implementar telas de encaixes, técnicos, ocorrências e clientes.
- Implementar chat de consulta com respostas fundamentadas.
- Adicionar filtros, busca e referências às fontes.

## Etapa 6 — Calibração e piloto

- Comparar interpretações com mensagens reais.
- Medir precisão de identificação e classificação.
- Ajustar regras, prompts e encaminhamento entre modelos.
- Medir tokens e custo real.
- Validar indicadores com a equipe.
- Liberar gradualmente para uso operacional.

---

# 16. Critérios de aceite da primeira versão

A primeira versão será considerada funcional quando:

1. Receber mensagens dos três grupos e armazená-las sem duplicidade.
2. Exibir a origem, autor e horário das mensagens.
3. Permitir importar a base existente de técnicos.
4. Permitir cadastrar, editar e inativar técnicos manualmente.
5. Distinguir cobertura habitual de cobertura diária.
6. Interpretar e armazenar agendas e mudanças por data.
7. Identificar solicitações de encaixe e acompanhar respostas.
8. Distinguir aceite, recusa, pendência e ausência de resposta.
9. Calcular as métricas definidas sem contar solicitações pendentes como finalizadas.
10. Identificar e organizar ocorrências do grupo da equipe técnica.
11. Consolidar histórico de clientes/chamados com referência às mensagens.
12. Permitir consultar a operação pelo chat sem executar ações.
13. Sinalizar incertezas e casos que precisam de revisão.
14. Exibir falhas de integração e processamento.
15. Registrar consumo de IA para apuração dos custos.

---

# 17. Pendências para levantamento na implantação

Estas informações não impedem a aprovação do escopo. Deverão ser levantadas antes ou durante as etapas correspondentes.

| Pendência | Tratamento previsto |
|---|---|
| Formato e localização da base atual de técnicos | Levantar e preparar importador |
| Mapa/tabela de CEPs, bairros e regiões | Importar ou construir cadastro geográfico |
| Prazo para considerar um encaixe sem resposta | Configuração administrativa; valor inicial sugerido de 30 minutos, sujeito à validação |
| Regra exata de agenda "reduzida" | Confirmar com responsável pela agenda |
| Identificadores oficiais dos chamados/OS | Mapear fontes e prioridade de correspondência |
| Volume médio de mensagens por grupo | Medir no piloto para estimar custo real |
| Regras de acesso por perfil | Definir antes da liberação para usuários |
| Retenção de mensagens e mídias | Definir conforme necessidade operacional e LGPD |

---

# 18. Diretriz final

A primeira versão deverá priorizar **confiabilidade, rastreabilidade e clareza**, não automação de ações.

É melhor o sistema informar "não foi possível identificar" do que inventar uma associação. É melhor mostrar "sem desfecho identificado" do que afirmar que um chamado foi concluído sem evidência. É melhor apresentar uma probabilidade com amostra pequena sinalizada do que transmitir falsa precisão.

O sucesso do projeto será medido pela capacidade de responder rapidamente perguntas que hoje exigem ler conversas extensas em vários grupos de WhatsApp — mantendo o vínculo entre cada informação organizada e aquilo que realmente foi comunicado na operação.