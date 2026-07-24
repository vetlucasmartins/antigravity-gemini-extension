# 📊 Regras de Armazenamento e Auditoria de Dados em Planilhas

Este documento estabelece as diretrizes obrigatórias de governança, auditoria e persistência estruturada para todas as automações executadas pelo **Antigravity Gemini Extension**.

---

## 🎯 Princípios Fundamentais de Log

Toda e qualquer atividade executada pela extensão — seja via **painel agêntico**, **loop autônomo (Computer Use)** ou **comandos via Bridge do IDE** — deve ser obrigatoriamente registrada de forma estruturada e exportável.

---

## 📋 Estrutura Obrigatória de Colunas da Planilha

Qualquer registro de atividade deve conter no mínimo os seguintes campos normalizados:

| Nome da Coluna | Descrição | Exemplo de Preenchimento |
|---|---|---|
| `Timestamp` | Data e Hora no formato ISO 8601 / Local | `2026-07-24 12:20:00` |
| `Categoria` | Tipo da atividade executada | `Candidatura`, `Mensagem`, `Notificação`, `Navegação` |
| `Alvo / Entidade` | Nome da vaga, empresa, remetente ou botão | `AI Automation Engineer - Impala Search` |
| `Parâmetros` | Detalhes (ex: salário, anos exp, visto) | `7 anos exp, Remoto, Right to Work UK` |
| `Status` | Resultado da ação | `Candidatado (Easy Apply)`, `Lido`, `Sucesso` |
| `URL / Contexto` | URL exata da página processada | `https://www.linkedin.com/jobs/view/...` |
| `Notas / Prova` | ID de confirmação ou log de auditoria | `Candidatura enviada via Easy Apply` |

---

## 🛠️ Regras de Persistência e Exportação

1. **Persistência Local Dupla**:
   - Salvar no `chrome.storage.local` como histórico da extensão.
   - Gerar artefatos formatados em Tabela Markdown (`.md`) e arquivo `.csv` no workspace local.
2. **Segurança e Privacidade**:
   - Senhas, tokens de API e dados sensíveis **nunca** devem ser gravados nos logs exportados.
3. **Imutabilidade do Histórico**:
   - Registros de candidaturas e automações não devem ser sobrescritos, mas sim adicionados (*append-only*).

---

## 📄 Licença de Código Aberto
Este projeto e suas diretrizes de dados são distribuídos sob a licença **Apache 2.0**.
