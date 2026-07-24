# 🌉 Antigravity Gemini Extension (`antigravity-gemini-extension`)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-green.svg)](manifest.json)
[![Gemini Ready](https://img.shields.io/badge/AI-Google%20Gemini%20Web-orange.svg)](https://gemini.google.com)

**Antigravity Gemini Extension** é a ponte (**Bridge**) nativa de automação de navegador entre o **Antigravity AI (IDE / CLI)** e o seu navegador **Google Chrome**.

Com esta extensão instalada, você **não precisa executar comandos de terminal manuais**. O próprio **Antigravity AI** se conecta ao seu Chrome em tempo real, lê a tela, inspeciona a página ativa e realiza ações autônomas (como candidatar-se a vagas no LinkedIn, checar mensagens, responder recrutadores e extrair tabelas) usando a sua **própria conta logada no Google Gemini (`gemini.google.com`)**.

---

## ⚡ Como Funciona no Dia a Dia

```text
  ┌────────────────────────┐                   ┌────────────────────────┐
  │                        │  Comandos Autom.  │                        │
  │     Antigravity AI     │ ────────────────> │    Extensão Chrome     │
  │   (no IDE ou no CLI)   │ <──────────────── │   (na sua aba ativa)   │
  │                        │   Contexto & DOM  │                        │
  └────────────────────────┘                   └────────────────────────┘
```

1. **Você instala a extensão** no seu navegador uma única vez.
2. **Você conversa com o Antigravity** no chat do IDE ou terminal normalmente:  
   > *"Antigravity, abra meu LinkedIn, veja se tenho mensagens não lidas e candidate-se às vagas de Full-Stack no UK."*
3. **O Antigravity faz tudo sozinho**: ele ativa o servidor de ponte em segundo plano, comunica-se com a extensão no Chrome, executa as ações na sua aba visível e grava os resultados em uma **planilha organizada**.

---

## 🚀 Instalação Rápida (Apenas 1 Vez)

### Passo 1: Adicionar a Extensão ao Chrome
1. Abra o seu navegador Chrome e acesse: `chrome://extensions`
2. No canto superior direito, ative a chave **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** (*Load Unpacked*).
4. Selecione a pasta deste repositório (`antigravity-gemini-extension`).

### Passo 2: Pronto!
A extensão já está configurada com reconexão automática. Não é necessário abrir o terminal para rodar o Python manualmente — o Antigravity gerencia essa ponte automaticamente em segundo plano.

---

## 💬 Exemplos de Prompts para Usar no Antigravity

Assim que a extensão estiver instalada, você pode pedir qualquer tarefa de navegador diretamente ao Antigravity:

### 💼 Automação de Carreiras & LinkedIn:
> *"Antigravity, dê uma olhada no meu LinkedIn, veja se recebi alguma proposta de serviço ou mensagem não lida e busque vagas de desenvolvedor remoto compatíveis com meu perfil para se candidatar."*

### 💬 Leitura e Resposta de Mensagens:
> *"Antigravity, verifique as notificações pendentes no meu navegador e me apresente um resumo das mais importantes."*

### 📊 Extração de Dados e Planilhas:
> *"Antigravity, extraia os dados da tabela exibida no meu Chrome e salve em uma planilha formatada em Markdown/CSV."*

### 📸 Análise Visual de Páginas:
> *"Antigravity, tire um print da página ativa no meu Chrome e me diga se há algum erro de layout ou botão desalinhado."*

---

## 🛠️ O que Acontece por Trás dos Panos (Para Desenvolvedores)

- **Servidor Bridge Local (`cli/bridge_server.py`)**: Rodado pelo Antigravity em `http://127.0.0.1:8765`, escutando comandos em tempo real.
- **Keep-Alive com `chrome.alarms`**: A extensão no Chrome envia pings constantes para evitar que o Service Worker entre em modo suspenso.
- **Governança de Dados (`DATA_LOGGING_RULES.md`)**: Todas as ações e candidaturas são gravadas de forma persistente com colunas normalizadas (`Timestamp`, `Categoria`, `Empresa`, `Vaga`, `Status`, `Notas`).
- **Sem Dependência de Chaves de API Pagas**: A extensão pode utilizar diretamente a sessão logada em `gemini.google.com` (incluindo Gemini Advanced/Plus).

---

## 📜 Licença

Este projeto é de código aberto e está sob a licença **[Apache License 2.0](LICENSE)**.
