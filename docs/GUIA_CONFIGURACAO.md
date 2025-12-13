# 🏠 Construindo Seu SmartZap: O Guia Definitivo

> *"Simplicidade é a sofisticação máxima."* — Leonardo da Vinci

Você está prestes a construir **seu próprio sistema de WhatsApp Marketing**. 
Não é magia negra. É engenharia. E como toda boa construção, precisa de fundação, estrutura e acabamento.

Vamos juntos?

---

## 🔑 Antes de Começar: Conheça Seus Parceiros

Imagine que você vai construir uma casa. Você não faz tudo sozinho — contrata especialistas.
No mundo digital, esses "especialistas" são **plataformas**. Cada uma faz uma coisa muito bem.

| Especialista | O Papel na Sua Casa | O que ele guarda |
|--------------|---------------------|------------------|
| **GitHub** | O **Arquiteto**. Guarda a planta original do prédio. Você vai "copiar" essa planta para construir a sua versão. | O código-fonte do SmartZap |
| **Vercel** | O **Terreno + Endereço**. É onde sua casa fica "de pé" na internet. Quando alguém digita seu link, é aqui que chegam. | Seu site funcionando 24h |
| **Supabase** | O **Cartório + Arquivo Morto**. Guarda TUDO que é permanente: contatos, histórico de mensagens, campanhas, templates, e as credenciais do WhatsApp. | Contatos, Mensagens, Campanhas |
| **QStash (Upstash)** | O **Despachante**. Organiza a fila de disparos em massa (campanhas) para rodar em segundo plano sem sobrecarregar nada. | Filas/Workflows de disparo |

> ✅ **Sua primeira missão:** Crie uma conta gratuita em cada uma dessas 4 plataformas.
> São 2 minutos cada. Não configure nada ainda — só crie a conta.
>
> | Plataforma | Link |
> |------------|------|
> | GitHub | [github.com](https://github.com) |
> | Vercel | [vercel.com](https://vercel.com) |
> | Supabase | [supabase.com](https://supabase.com) |
> | QStash (Upstash) | [upstash.com](https://upstash.com) |

---

## 📐 Etapa 1: Pegando a Planta (Fork do GitHub)

Lembra do arquiteto? Ele tem a planta original. Você vai fazer uma **cópia oficial** dessa planta para o seu nome.

No GitHub, isso se chama **Fork**.

> 🍴 **[CLIQUE AQUI PARA FAZER O FORK](https://github.com/thaleslaray/smartzap/fork)**

Após clicar, você terá uma cópia do SmartZap na SUA conta do GitHub.
Agora a planta é sua. Você pode personalizar.

> 💡 **O que é GitHub?** É a maior "biblioteca de código" do mundo. Mais de 100 milhões de desenvolvedores guardam seus projetos lá. Grandes empresas como Google, Microsoft e Meta usam GitHub para colaborar em código. Quando você faz um "Fork", está criando uma cópia independente que você pode modificar sem afetar o original. É como tirar uma xerox de um livro e poder rabiscar à vontade!

### ♻️ Mantendo seu Fork atualizado (botão “Sincronizar fork”)

Quando o SmartZap receber melhorias e correções no **repositório original**, o seu **Fork não atualiza sozinho** — afinal, ele é uma cópia independente no seu GitHub.

Para puxar as novidades **sem terminal e sem complicação**:

1.  Abra o **seu repositório `smartzap` no GitHub** (o que você fez Fork).
2.  Se aparecer um aviso dizendo que seu Fork está “atrasado”, clique em **Sincronizar fork** (ou **Sync fork**).
3.  Clique em **Atualizar branch** (ou **Update branch**) e aguarde finalizar.

Pronto: seu Fork fica atualizado.
Se o seu projeto estiver conectado na Vercel, ela normalmente vai **reconstruir e publicar automaticamente** a nova versão após essa atualização.

Saiba mais (opcional): [Sincronizando um fork no GitHub](https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)

> ⚠️ **Dica importante (conflitos):** se você alterou arquivos no seu Fork e o repositório original mudou as mesmas partes, o GitHub pode não conseguir sincronizar automaticamente. Nesse caso, pare por aqui e peça ajuda no suporte antes de tentar “resolver no escuro”.

---

## 🏗️ Etapa 2: Comprando o Terreno (Deploy na Vercel)

Com a planta em mãos, precisamos de um terreno para construir.

1.  Acesse [vercel.com](https://vercel.com) e faça login.
2.  Clique em **"Add New"** → **"Project"**.
3.  Ele vai mostrar seus repositórios do GitHub. Selecione o **smartzap** (o que você acabou de copiar).
4.  Clique em **Deploy**.
5.  Aguarde 2-3 minutos.

<details>
  <summary><strong>📸 Ver prints do deploy na Vercel (opcional)</strong></summary>

  1. **Vercel → Add New Project**
      ![Vercel — Add New Project (print sanitizado)](./image.png)

  2. **Selecione o repositório do GitHub para importar**
      ![Vercel — selecionar repositório (print sanitizado)](./image-1.png)

  3. **Clique em Deploy**
      ![Vercel — Deploy (print sanitizado)](./image-2.png)

  4. **Clique em “Continue to Dashboard”**
      ![Vercel — Continue to Dashboard (print sanitizado)](./image-3.png)

  5. **Abra “Domains” e copie a URL do projeto**
      ![Vercel — Domains (print sanitizado)](./image-4.png)

</details>

**O que vai acontecer?**
A Vercel vai "construir" sua casa. Quando terminar, você terá um link tipo:
`https://seu-nome-smartzap.vercel.app`

> ⚠️ **Atenção:** A casa está construída, mas está **vazia**. Não tem móveis (banco de dados), não tem luz (credenciais). Vamos mobiliar agora.

> 💡 **O que é Vercel?** É uma plataforma de hospedagem criada pelos mesmos desenvolvedores do Next.js (o framework que usamos). A mágica da Vercel é o **deploy automático**: toda vez que você atualiza seu código no GitHub, ela automaticamente reconstrói e publica o site. Empresas como TikTok, Twitch e Washington Post usam Vercel. O plano gratuito aguenta muito mais do que você imagina!

---

## 🧪 Testando localmente (localhost)

Se você quer **rodar e testar no seu computador** (sem Vercel), o fluxo é bem mais direto: você só precisa configurar um `.env.local` e rodar o Next.

1. **Instale as dependências** (na raiz do projeto):
    - `npm install`

2. **Crie seu arquivo de ambiente local**:
    - `cp .env.example .env.local`

3. **Preencha o mínimo no `.env.local`** (para abrir o app e conectar no banco via Supabase):
    - `NEXT_PUBLIC_SUPABASE_URL=https://...`
    - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...` (ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
    - `SUPABASE_SECRET_KEY=sb_secret_...`

    > ✅ Estas são as únicas chaves de Supabase suportadas no código atual (padrão 2025+).

4. **Crie as tabelas no Supabase**
    - Abra o **Supabase Dashboard → SQL Editor**
    - Execute o SQL em `lib/migrations/0001_initial_schema.sql`

    > Se as tabelas não existirem, o app até abre, mas rotas que dependem do banco vão falhar.

### 🧱 Aplicando/atualizando o schema no Supabase (produção e local)

Se o seu projeto já estava rodando com um schema mais antigo, você precisa **atualizar** o banco para suportar:

- **Ignorados (`skipped`)** com motivo (`skip_code`, `skip_reason`)
- **Idempotência** do workflow (`status='sending'` + `sending_at`) para evitar double-send em retries
- **Snapshot do template por campanha** (anti-drift e auditoria)

✅ A boa notícia: o arquivo consolidado já está preparado com `IF NOT EXISTS`, então é **seguro** rodar de novo.

#### Passo a passo (Supabase Dashboard)

1. Abra o **Supabase Dashboard → SQL Editor**
2. Clique em **New query**
3. Cole **todo o conteúdo** do arquivo `lib/migrations/0001_initial_schema.sql`
4. Clique em **Run**

> Dica: se você já tem tabelas com dados, isso não apaga nada — o script usa `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

#### Verificação rápida (cole no SQL Editor e rode)

Depois de executar a migration, rode estas queries para confirmar que o schema está pronto:

1) **Colunas de idempotência e skipped em `campaign_contacts`**

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
    and table_name = 'campaign_contacts'
    and column_name in (
        'status',
        'skipped_at',
        'skip_code',
        'skip_reason',
        'sending_at'
    )
order by column_name;
```

2) **Colunas de snapshot em `campaigns`**

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
    and table_name = 'campaigns'
    and column_name in (
        'template_snapshot',
        'template_spec_hash',
        'template_parameter_format',
        'template_fetched_at'
    )
order by column_name;
```

3) **`templates` com cache de spec**

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
    and table_name = 'templates'
    and column_name in ('parameter_format', 'spec_hash', 'fetched_at')
order by column_name;
```

Se todas as colunas aparecerem, o banco está pronto.

5. **Suba o projeto**:
    - `npm run dev`
    - Abra `http://localhost:3000`

### O que é opcional no local?

- **WhatsApp / QStash / Gemini**: só precisa configurar se você for testar disparos, campanhas, IA, etc.
- **Vercel Token / Wizard**: o wizard existe para automatizar o setup na Vercel. Localmente, geralmente é mais rápido editar o `.env.local` direto.

---

## 🔐 Etapa 3: Coletando as Chaves (Credenciais)

Antes de entrar no Wizard, vamos **juntar todas as chaves** que você vai precisar.
Abra um bloco de notas e copie cada uma:

### 🗄️ Chaves do Supabase (O Cartório)
1.  Acesse [supabase.com](https://supabase.com) → Seu Projeto → **Project Settings** → **API**.
2.  Copie:
    - `Project URL` → Ex: `https://abc123.supabase.co`
    - **Publishable key** (`sb_publishable_...`) → A chave pública (segura para frontend)
    - **Secret key** (`sb_secret_...`) → Clique em "Reveal" e copie (SOMENTE backend)

    > ⚠️ Este repositório está configurado para usar **apenas** o padrão novo (2025+):
    > `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) e `SUPABASE_SECRET_KEY`.

<details>
    <summary><strong>📸 Print de referência (opcional)</strong></summary>

    > Nota: os prints abaixo são **sanitizados** (chaves e dados sensíveis ficam mascarados), mas ajudam a localizar as telas no painel.

    **Supabase: API Keys**
    ![Supabase — API keys (print sanitizado)](./image-12.png)

    **(Se solicitado) Connection string: use “Transaction pooler” e inclua a senha**
    - Clique em **Connection string** → altere o método para **Transaction pooler**
    - Não esqueça de colocar a **senha** na URL (se precisar, use o link de reset no painel)
    ![Supabase — Transaction pooler (print sanitizado)](./image-13.png)

</details>

> 💡 **O que é Supabase?** É uma alternativa open-source ao Firebase do Google. Ele oferece um banco de dados PostgreSQL completo, autenticação de usuários e storage de arquivos — tudo de graça até certo limite. O PostgreSQL é o banco de dados mais avançado do mundo (usado por empresas como Apple, Spotify e Netflix).
>
> A diferença entre **publishable/anon** e **secret/service_role**? A primeira é "pública" e segura para usar no navegador; a segunda é "secreta" e tem poderes administrativos (bypassa RLS) — **nunca exponha no frontend**.

### 🧯 Troubleshooting Supabase: erro 403 (42501) "permission denied for table"

Se, ao usar o SmartZap (ou ao chamar `/api/auth/status` / `/api/setup/complete-setup`), você vir que o Supabase retorna **403** com algo como:

- `PostgREST error=42501`
- `permission denied for table settings`

isso significa que as tabelas foram criadas, mas **os GRANTs não foram aplicados** (isso é comum quando você cria tabelas via **SQL Editor**).

✅ Solução rápida (Supabase Dashboard → **SQL Editor**): execute os GRANTs do arquivo:

- `lib/migrations/0001_initial_schema.sql` (no final do arquivo existe a seção **PERMISSIONS**)

> ✅ Recomendação: em produção, trate permissões com carinho.
> O SmartZap usa `SUPABASE_SECRET_KEY` no backend (service_role) para operações administrativas.
> Se você abrir demais para `anon/authenticated`, faça isso conscientemente (ou implemente RLS/policies).

Depois disso, recarregue o app.

> ⚠️ Nota de segurança: conceder permissões para `anon`/`authenticated` torna as tabelas acessíveis via PostgREST com a chave pública. Em produção, o ideal é usar RLS/policies ou um modelo de segurança apropriado ao seu caso.

### 🔒 Chaves do QStash (A Fila de Disparos)
1.  Acesse [upstash.com](https://upstash.com) e faça login.
2.  No topo, clique em **QStash**.
3.  Na tela do QStash, procure o bloco **Quickstart** (ele mostra um exemplo de `.env`).
4.  Copie o valor de **`QSTASH_TOKEN`**.

<details>
    <summary><strong>📸 Onde achar no QStash (opcional)</strong></summary>

    > Nota: o print do Quickstart está **sanitizado** (valores do token/keys ficam mascarados).

    ![QStash — Quickstart (print sanitizado)](./image-16.png)

    ![QStash — etapa no Wizard (print sanitizado)](./image-17.png)

</details>

> ✅ **Importante:** para este setup você **só precisa do `QSTASH_TOKEN`**.
>
> - Você **não precisa** configurar nem copiar **Signing Keys**.
> - Você **não precisa informar URL do QStash**: o SmartZap se conecta usando apenas o token, e a biblioteca já conhece o endpoint padrão do serviço.

> 💡 **O que é QStash?** É um serviço de filas/workflows via HTTP. No SmartZap, ele roda os disparos de campanha em segundo plano e controla o ritmo de envio, ajudando a evitar sobrecarga e erros de limite.

#### 📊 (Opcional) Monitoramento do QStash (Infra)
Se você quiser ver estatísticas de uso (mensagens, execuções, custo), você pode configurar o acesso ao **Upstash Management API**.

1.  No Upstash, vá em **Personal Settings** → **Management API**.
2.  Copie:
    - **Seu e-mail da conta Upstash** (para `UPSTASH_EMAIL`)
    - **A API Key** criada ali (para `UPSTASH_API_KEY`)

> ✅ **Opcional:** o SmartZap funciona sem isso.
> 💡 Com essas credenciais, o dashboard consegue buscar estatísticas do QStash via `api.upstash.com`.

### 📱 Chaves do WhatsApp (O Telefone)
1.  Acesse [developers.facebook.com](https://developers.facebook.com) → Meus Apps → Seu App.
2.  Menu lateral: **WhatsApp** → **API Setup**.
3.  Copie:
    - `Phone Number ID`
    - `WhatsApp Business Account ID`
    - `Temporary Access Token` (válido por 24h — para testes)

> 💡 **O que é a WhatsApp Cloud API?** Em 2022, a Meta (dona do WhatsApp) abriu uma API oficial para empresas enviarem mensagens em massa. Antes, você precisava de provedores caros ou soluções ilegais. Agora, qualquer um pode usar gratuitamente (até 1.000 conversas/mês). O `Phone Number ID` identifica seu número; o `Business Account ID` identifica sua conta empresarial; e o `Access Token` é a "senha" para fazer chamadas à API. **Dica:** O token temporário expira em 24h — depois você vai precisar criar um token permanente nas configurações do app.

### 🎫 O Token Mestre (Vercel)
1.  Acesse [vercel.com](https://vercel.com) → Sua foto → **Settings** → **Tokens**.
2.  Clique em **Create** → Nome: `SmartZap` → Scope: **Full Account** → Create.
3.  **COPIE AGORA!** Ele só aparece uma vez.

<details>
    <summary><strong>📸 Prints do token na Vercel (opcional)</strong></summary>

    ![Vercel — Tokens (print sanitizado)](./image-5.png)
    ![Vercel — Create Token (print sanitizado)](./image-6.png)

    **Token criado (exemplo)**
    ![Vercel — Token Created (print sanitizado)](./image-7.png)

</details>

> 💡 **Por que Full Account?** O wizard do SmartZap precisa de permissão para criar variáveis de ambiente automaticamente no seu projeto. É como dar a chave da sua casa para o encanador — ele precisa entrar para fazer o serviço. Não se preocupe: o token fica só no seu navegador durante o setup e nunca é enviado para servidores externos.

---

## 🪄 Etapa 4: O Wizard (A Mágica Acontece)

Agora que você tem todas as chaves no bloco de notas, vamos usá-las.

1.  Acesse: `https://SEU-PROJETO.vercel.app/setup`
2.  O sistema vai pedir o **Vercel Token**. Cole.
3.  Siga os 5 passos do Wizard:

| Passo | O que fazer |
|-------|-------------|
| **1. Senha Mestra** | Crie uma senha forte. É a chave do reino. |
| **2. Supabase** | Cole URL + 2 chaves. **CLIQUE EM "VERIFICAR E MIGRAR"!** |
| **3. QStash** | Cole o **`QSTASH_TOKEN`** (copiado do **Quickstart do QStash**). Teste ficou verde? Próximo. |
| **4. WhatsApp (Opcional)** | Se tiver, cole Token, Phone ID, Business ID. Se não tiver ainda, clique em **Pular** e configure depois em **Configurações**. |
| **5. Perfil** | Seu nome (pessoa) — aparece no painel. |

> 🔴 **CRÍTICO:** No passo 2, o botão "Verificar e Migrar" cria as tabelas no banco. Se você não clicar, o sistema não funciona.

> 💡 **O que o Wizard está fazendo?** Ele está salvando todas essas chaves como "variáveis de ambiente" no seu projeto Vercel. Variáveis de ambiente são como cofres secretos que guardam informações sensíveis fora do código. Assim, mesmo que alguém veja seu código no GitHub, não terá acesso às suas credenciais. É uma prática de segurança usada por todas as empresas de tecnologia.

<details>
  <summary><strong>📸 Prints do Wizard (opcional)</strong></summary>

  1. **Projeto encontrado → confirmar**
      ![Wizard — confirmar projeto (print sanitizado)](./image-8.png)

  2. **Senha mestra**
      ![Wizard — senha mestra (print sanitizado)](./image-9.png)

  3. **Supabase (preencher dados)**
      ![Wizard — Supabase (dados) (print sanitizado)](./image-14.png)

  4. **Supabase (Connect / Verificar e Migrar)**
      ![Wizard — Supabase (connect/migrar) (print sanitizado)](./image-10.png)

  5. **Selecionar framework do app**
      ![Wizard — framework do app (print sanitizado)](./image-11.png)

  6. **Continuar**
      ![Wizard — continuar (print sanitizado)](./image-15.png)

  7. **WhatsApp Cloud API (opcional)**
      ![Wizard — WhatsApp Cloud API (print sanitizado)](./image-20.png)

  8. **Seus dados (finalização)**
      ![Wizard — seus dados (finalização) (print sanitizado)](./image-22.png)

  > Nota: todos os prints foram **sanitizados** (tokens/chaves/e-mail/telefone ficam mascarados).

</details>

---

## 🚀 Etapa 5: O Lançamento

Ao terminar o Wizard:
1.  O SmartZap salva tudo na Vercel.
2.  Dispara um novo deploy (aguarde 90 segundos).
3.  Você é redirecionado para o `/login`.

**Entre com:**
- E-mail: (o que você definiu como admin)
- Senha: (a Senha Mestra do passo 1)

> 💡 **Por que 90 segundos?** A Vercel precisa "reconstruir" sua aplicação com as novas variáveis de ambiente. Esse processo inclui: baixar o código, instalar dependências, compilar TypeScript para JavaScript, otimizar imagens e criar páginas estáticas. Tudo isso acontece em servidores ultra-rápidos — é por isso que é tão rápido!

---

## 🎉 Etapa 6: O Primeiro Envio (Prova de Vida)

Vamos testar se tudo funciona:

1.  No menu, vá em **Contatos** → Crie um contato com **seu próprio número**.
2.  Vá em **Campanhas** → **Nova Campanha**.
3.  Escreva: `Olá, mundo! O SmartZap funciona! 🚀`
4.  Envie.

**Chegou no seu WhatsApp?**

Se sim: **Parabéns. Você construiu um SAAS do zero.** 🏆

> 💡 **Você sabia?** Você acaba de fazer o que milhares de startups fazem: conectar frontend, backend, banco de dados e APIs externas em um produto funcional. Isso é a base de qualquer aplicativo moderno — de um Uber até um iFood. A diferença entre você e um dev sênior? Experiência. Continue praticando!

---

## 🆘 Dúvidas?

Entre na comunidade:
[👉 **Entrar no Grupo de Suporte**](https://chat.whatsapp.com/K24Xek8pinPBwzOU7H4DCg?mode=hqrt1)

---
*Versão 4.0 — "The Educational Edition" (12/2025)*

## 📸 Apêndice: Setup com imagens (Vercel + Wizard)

As imagens abaixo ficam na pasta `docs/` e ilustram o fluxo do deploy na Vercel e o setup pelo Wizard.

> ⚠️ **Nota de segurança:** os prints deste apêndice são **sanitizados** (tokens/chaves/e-mail/telefone ficam mascarados). Se você adicionar prints novos, use imagens borradas/mascaradas.

### Vercel — Deploy

1. **Vercel → Add New Project**
    ![Vercel — Add New Project (print sanitizado)](./image.png)

2. **Selecione o repositório do GitHub para importar**
    ![Vercel — selecionar repositório (print sanitizado)](./image-1.png)

3. **Clique em Deploy**
    ![Vercel — Deploy (print sanitizado)](./image-2.png)

4. **Clique em “Continue to Dashboard”**
    ![Vercel — Continue to Dashboard (print sanitizado)](./image-3.png)

5. **Abra “Domains” e copie a URL do projeto**
    ![Vercel — Domains (print sanitizado)](./image-4.png)

### Vercel — Token

6. **Tokens / Create Token**
    ![Vercel — Tokens (print sanitizado)](./image-5.png)
    ![Vercel — Create Token (print sanitizado)](./image-6.png)
    ![Vercel — Token Created (print sanitizado)](./image-7.png)

### Wizard — Setup

7. **Wizard: projeto detectado → confirmar**
    ![Wizard — confirmar projeto (print sanitizado)](./image-8.png)

8. **Wizard: defina uma senha mestra segura**
    ![Wizard — senha mestra (print sanitizado)](./image-9.png)

9. **Wizard: Supabase — adicione os dados e clique em Connect / Verificar e Migrar**
    ![Wizard — Supabase (dados) (print sanitizado)](./image-14.png)
    ![Wizard — Supabase (connect/migrar) (print sanitizado)](./image-10.png)

10. **Wizard: selecione o framework do app**
    ![Wizard — framework do app (print sanitizado)](./image-11.png)

11. **Clique em “Continuar” depois de inserir todos os dados**
    ![Wizard — continuar (print sanitizado)](./image-15.png)

12. **Wizard: QStash (referência da etapa)**
    ![QStash — etapa no Wizard (print sanitizado)](./image-17.png)

13. **Wizard: WhatsApp Cloud API (opcional)**
    ![Wizard — WhatsApp Cloud API (print sanitizado)](./image-20.png)

14. **Wizard: seus dados (finalização)**
    ![Wizard — seus dados (finalização) (print sanitizado)](./image-22.png)

### Supabase — Pooler (quando solicitado)

15. **(Se solicitado) Connection string: use “Transaction pooler” e inclua a senha**
    ![Supabase — Transaction pooler (print sanitizado)](./image-13.png)