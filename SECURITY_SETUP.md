# Configuração de segurança do OminiHub

## Administrador autorizado

O acesso administrativo está limitado ao e-mail `jfs10219@hotmail.com`. O painel exige autenticação Firebase e o Firestore valida o e-mail verificado nas próprias regras, não apenas na interface.

## Ativação obrigatória no Firebase

1. Abra o projeto Firebase `noverde-1d8a9`.
2. Em **Authentication → Sign-in method**, habilite **Email/Password** e/ou **Google**.
3. Em **Authentication → Users**, crie a conta `jfs10219@hotmail.com` caso ainda não exista. Para Email/Password, defina uma senha forte e conclua a verificação do e-mail.
4. Em **Authentication → Settings → Authorized domains**, confira o domínio de produção da Vercel e os domínios de desenvolvimento utilizados.
5. Publique as regras no banco nomeado configurado em `firebase.json`:
   ```bash
   npx firebase-tools deploy --only firestore:rules --project noverde-1d8a9
   ```
6. Configure `GEMINI_API_KEY` nas variáveis de ambiente da Vercel para habilitar a importação com IA.

## Observações

- O arquivo `firestore.rules` nega acesso por padrão e libera somente o documento operacional `schedule_store/main` para o administrador autenticado.
- A função `api/ai/parse-schedule.ts` valida o token Firebase no servidor, limita a frequência de chamadas e não confia no estado de login do navegador.
- O painel é administrativo nesta etapa. O login individual de prestadores por PIN não deve ser tratado como mecanismo de segurança para acesso externo.
- A publicação das regras no Firebase é uma operação separada do push no GitHub. Confirme a implantação das regras antes de considerar o banco protegido.
