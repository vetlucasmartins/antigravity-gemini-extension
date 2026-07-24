# 🚀 Antigravity Gemini Extension (`antigravity-gemini-extension`)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-green.svg)](manifest.json)
[![Gemini Ready](https://img.shields.io/badge/AI-Google%20Gemini%202.0-orange.svg)](https://gemini.google.com)

**Antigravity Gemini Extension** é uma extensão agêntica de automação de navegador para Google Chrome baseada em **Visão Computacional e Uso Autônomo de Computador (Computer Use)**. Conecta o **Google Gemini** (via **Sessão Web** ou **API Direct**) diretamente às abas do seu navegador, permitindo a execução de tarefas complexas como candidaturas automáticas no LinkedIn, extração de dados, resposta de mensagens e navegação agêntica.

Inclui uma **Ponte de Comunicação bidirecional (IDE Bridge Server em Python)** para permitir que IAs no ambiente de desenvolvimento (como o Antigravity IDE) controlem e interajam com o Chrome em tempo real.

---

## ✨ Principais Funcionalidades

- **Gemini Web Session (Sem necessidade de API Key)**: Conecta-se diretamente à sua assinatura e sessão ativa em `gemini.google.com` (incluindo Gemini Advanced / Plus).
- **Modo Gemini Direct API**: Suporte atualizado aos modelos de última geração: `gemini-2.0-flash`, `gemini-1.5-flash` e `gemini-1.5-pro`.
- **Loop Agêntico Autônomo (Computer Use)**: Executa fluxos de múltiplos passos (*click*, *type*, *scroll*, *inspect*, *navigate*) para atingir a meta definida pelo usuário.
- **Ponte IDE ↔ Navegador (`http://localhost:8765`)**: Servidor bridge local em Python que permite comandos CLI ou agentes do IDE inspecionarem o DOM, tirarem screenshots e manipularem abas no Chrome.
- **Regras Obrigatórias de Log em Planilhas (`DATA_LOGGING_RULES.md`)**: Registro e exportação automatizada de todas as candidaturas, mensagens lidas e ações em formato `.csv` e Tabelas Markdown.
- **Keep-Alive com `chrome.alarms`**: Mecanismo de persistência que previne o modo suspenso no Service Worker do Chrome (Manifest V3).

---

## 🏗️ Arquitetura do Sistema

```
+--------------------------+          HTTP POST / GET           +-----------------------------+
|    Antigravity IDE /     | <================================> |     Bridge Server Python    |
|   CLI Terminal Scripts   |        http://localhost:8765       |     (cli/bridge_server.py)  |
+--------------------------+                                    +-----------------------------+
                                                                             || (Long Polling)
                                                                             \/
+--------------------------+          Web Session / API         +-----------------------------+
|   Google Gemini AI Web   | <================================> | Chrome Extension Service    |
|   (gemini.google.com)    |                                    | Worker (background.js)      |
+--------------------------+                                    +-----------------------------+
                                                                             || (ExecuteScript)
                                                                             \/
                                                                +-----------------------------+
                                                                | Active Browser Tab /        |
                                                                | LinkedIn / Web Page DOM     |
                                                                +-----------------------------+
```

---

## 📦 Como Instalar e Rodar

### 1. Carregar a Extensão no Chrome
1. Abra o navegador Chrome e acesse `chrome://extensions`.
2. Ative a opção **Modo do desenvolvedor** no canto superior direito.
3. Clique no botão **Carregar sem compactação** (*Load Unpacked*).
4. Selecione a pasta deste repositório (`antigravity-gemini-extension`).

### 2. Iniciar o Servidor Bridge Local
No terminal, execute o servidor de ponte (não requer instalação de bibliotecas externas, usa Python 3 nativo):

```bash
python3 cli/bridge_server.py
```

### 3. Testar a Conexão via CLI
Em outra janela de terminal, verifique o status do bridge:

```bash
python3 cli/antigravity-web-cli.py --status
```

Resultado esperado:
```json
{
  "status": "online",
  "port": 8765,
  "extension_connected": true,
  "last_ping_seconds_ago": 1.2
}
```

---

## 💻 Comandos da CLI do Bridge

Você pode enviar comandos diretos do terminal para a sua extensão do Chrome:

- **Verificar status da conexão**:
  ```bash
  python3 cli/antigravity-web-cli.py --status
  ```
- **Obter o contexto completo da aba ativa (Título, URL, Texto do DOM)**:
  ```bash
  python3 cli/antigravity-web-cli.py --context
  ```
- **Clicar em um elemento da página por texto ou seletor CSS**:
  ```bash
  python3 cli/antigravity-web-cli.py --click "Candidatura simplificada"
  ```
- **Digitar texto no campo ativo**:
  ```bash
  python3 cli/antigravity-web-cli.py --type "Desenvolvedor Full Stack"
  ```
- **Capturar Screenshot da aba visível**:
  ```bash
  python3 cli/antigravity-web-cli.py --screenshot
  ```

---

## 📊 Regras de Armazenamento de Dados em Planilhas

Todas as tarefas automatizadas executadas por esta extensão devem obrigatoriamente seguir as **Regras de Governança e Armazenamento de Dados** descritas em [`DATA_LOGGING_RULES.md`](DATA_LOGGING_RULES.md).

### Campos Normalizados Gravados nas Planilhas:
- `Timestamp`: Data e Hora da execução.
- `Categoria`: Categoria da ação (`Candidatura`, `Mensagem`, `Notificação`).
- `Alvo / Entidade`: Nome da vaga ou empresa.
- `Parâmetros`: Anos de experiência, pré-requisitos de visto, modelo de trabalho.
- `Status`: Resultado (`Candidatado`, `Lido`, `Pendente`).
- `URL / Contexto`: Link direto da oportunidade.

---

## 📜 Licença

Este projeto é de código aberto e está sob a licença **[Apache License 2.0](LICENSE)**.

```text
Copyright 2026 Antigravity Developers

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
