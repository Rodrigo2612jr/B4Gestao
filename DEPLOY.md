# Deploy — Subdomínios B4 Gestão

## 🌐 Estrutura de URLs

| Subdomínio | Função | Audiência |
|---|---|---|
| `b4gestao.com.br` | Site institucional + formulário | Público / lead |
| `pulse.b4gestao.com.br/[token]` | Respondente Pulse NR-1 | Funcionário do cliente |
| `stress.b4gestao.com.br/[token]` | Stress Test (cliente preenche) | Decisor do cliente |
| `admin.b4gestao.com.br` | Painel administrativo (opcional) | B4 (Liege, Luis) |

O painel original em `b4gestao.com.br/admin` continua funcionando — `admin.b4gestao.com.br` é apenas um alias mais "limpo".

## 🔧 Passo 1 — Vercel (adicionar domínios)

No painel da Vercel → Project Settings → Domains, adicionar:

1. `pulse.b4gestao.com.br`
2. `stress.b4gestao.com.br`
3. `admin.b4gestao.com.br` (opcional)

Para cada um, a Vercel vai mostrar **o valor exato do CNAME** a configurar (normalmente `cname.vercel-dns.com`).

## 🔧 Passo 2 — Registro.br (adicionar CNAMEs)

Acessar https://registro.br → Login → b4gestao.com.br → **DNS**.

Adicionar 3 registros do tipo **CNAME**:

| Nome | Tipo | Valor |
|---|---|---|
| `pulse` | CNAME | `cname.vercel-dns.com.` (ponto final importante) |
| `stress` | CNAME | `cname.vercel-dns.com.` |
| `admin` | CNAME | `cname.vercel-dns.com.` |

> O **valor exato** deve ser o que a Vercel mostra na tela do domínio. Use isso, não o padrão acima — pode mudar.

**Propagação**: tipicamente 5-30 minutos. Em alguns casos até 2h.

## 🔧 Passo 3 — Como o app sabe redirecionar?

O arquivo `middleware.ts` faz **rewrite transparente** baseado no `host` da requisição:

```ts
pulse.b4gestao.com.br/ABC123    →  rewrite interno → /pulse/ABC123
stress.b4gestao.com.br/XYZ789   →  rewrite interno → /stress/XYZ789
admin.b4gestao.com.br/users     →  rewrite interno → /admin/users
```

A URL na barra do navegador continua sendo `pulse.b4gestao.com.br/...` — o usuário não vê redirecionamento. É elegante e bom pra SEO/branding.

## 🧪 Testar localmente

Subdomínios não funcionam em `localhost:3000`, mas o roteamento interno funciona. Acesse direto:

- http://localhost:3000/pulse/[token]
- http://localhost:3000/stress/[token]
- http://localhost:3000/admin

## ⚠️ Cuidados

- **HTTPS**: Vercel emite cert SSL automaticamente para cada subdomínio (~30s após DNS propagar)
- **Robôs**: `/admin/*` tem `X-Robots-Tag: noindex` — Google não vai indexar a área administrativa
- **Cookies de sessão**: o cookie do admin é `Secure` + `HttpOnly`. Funciona em `admin.b4gestao.com.br` porque está no mesmo domínio raiz. Não funciona cross-domain.

---

## 🔐 Segurança & acessos (revisão 2026-06)

Hardening completo aplicado (ver `../REVISAO_SEGURANCA_E_ESTRUTURA.md`). Pontos de DEPLOY:

### Variáveis de ambiente (Vercel → Project Settings → Environment Variables)
| Variável | Obrigatória | Observação |
|---|---|---|
| `ADMIN_SESSION_SECRET` | **SIM (≥32 chars)** | **O app agora ABORTA o boot em produção se faltar/curta** (era um fallback inseguro). Garantir em **Production E Preview**. |
| `DATABASE_URL` | Sim | Neon. Já existia. |
| `BLOB_READ_WRITE_TOKEN` | Sim (fotos AEP) | Já existia. |
| `RESEND_API_KEY` / `FROM_EMAIL` / `NOTIFY_EMAILS` | Sim (e-mail de lead) | Já existia. |
| `APP_URL` | Opcional | Base do link de ativação de usuário. Se ausente, deriva do host da requisição (funciona com os subdomínios). |

### Migrações de banco
- **Rodam sozinhas** no 1º request via `initDb()` (idempotente). Adicionam colunas de ciclo de vida em `admin_users` (`is_active`, `access_expires_at`, `failed_attempts`, `locked_until`, etc.) + tabelas `admin_invites` e `rate_limits`. **Nada manual a rodar.**

### Fluxo de acessos temporários (técnicos/supervisores)
1. Admin logado → menu **Equipe & Acessos** (`/admin/usuarios`) → **Novo acesso** (nome, e-mail, papel, validade em dias).
2. Sistema gera **link de ativação de uso único** → admin copia e envia (WhatsApp/pessoalmente). O admin nunca vê a senha.
3. Colaborador abre o link (`/admin/ativar?token=...`) → define a própria senha (mín. 12 chars).
4. Admin pode **Desativar** / **Reativar** / renovar validade (**+90d** / **Sem exp.**) / **Gerar link** novo — efeito no próximo request.

### Papéis (AEP)
- **TÉCNICO**: preenche; **trava após enviar** (não edita nem exclui o que enviou).
- **SUPERVISOR**: edita o conteúdo do técnico (inclusive em "aguardando aprovação") + aprova/reprova. **Não pode aprovar avaliação onde ele é o avaliador** (separação de funções).
- **ADMIN/SST**: veem e revisam tudo; gerenciam usuários.

### Itens deixados para depois (P1 — decisão de produto)
- Fotos do AEP no Blob continuam públicas com URL aleatória (privá-las exige URL assinada + ajuste de UI).
- MFA/TOTP para admin; mover DDL do `initDb` para migrations versionadas.
