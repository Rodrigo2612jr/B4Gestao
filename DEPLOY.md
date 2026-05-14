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
