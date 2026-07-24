# 🌉 Antigravity Gemini Extension (`antigravity-gemini-extension`)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-green.svg)](manifest.json)
[![Gemini Ready](https://img.shields.io/badge/AI-Google%20Gemini%20Web-orange.svg)](https://gemini.google.com)

**Antigravity Gemini Extension** é uma ponte de comunicação (**Bridge**) de alta performance entre o seu **IDE (Antigravity IDE, Cursor, Claude Code)** ou **Terminal CLI** e o seu **Navegador Chrome**. 

Ela permite que o agente de IA do IDE execute ações em tempo real na aba ativa do seu navegador (como clicar em botões, digitar textos, rolar páginas, capturar contexto do DOM e prints de tela), utilizando a sua **própria conta logada no Google Gemini (`gemini.google.com`)**.

---

## 🎯 Por que usar?

- **Sem dependência de Chaves de API**: Conecta-se diretamente à sua sessão ativa do Google Gemini Web (incluindo assinaturas Gemini Advanced/Plus).
- **Controle Direto pelo IDE/CLI**: O IDE envia comandos para um servidor local em Python (`http://localhost:8765`), e a extensão executa imediatamente no Chrome.
- **Automação Autônoma**: Ideal para navegação agêntica, candidaturas no LinkedIn, leitura de mensagens e automação de tarefas no navegador.
- **Log Automático em Planilhas**: Registra todas as ações executadas em tabelas/planilhas para auditoria.

---

## 📖 Passo a Passo: Como Instalar e Usar

### 1️⃣ Instalar a Extensão no Chrome
1. Abra o navegador Chrome e acesse a página: `chrome://extensions`
2. No canto superior direito, ative a chave **Modo do desenvolvedor**.
3. Clique no botão **Carregar sem compactação** (*Load Unpacked*).
4. Selecione a pasta deste projeto (`antigravity-gemini-extension`).

---

### 2️⃣ Iniciar o Servidor Bridge Local
No terminal do seu IDE ou máquina, inicie o servidor bridge em Python (não requer instalação de pacotes externos):

```bash
python3 cli/bridge_server.py
```

Você verá a mensagem:
```text
🚀 Antigravity Extension Bridge Server rodando na porta 8765...
```

---

### 3️⃣ Usar a Extensão via IDE ou CLI

Com o servidor rodando e a extensão instalada no Chrome, você pode enviar comandos do seu IDE ou terminal:

#### 🟢 Verificar se o Chrome está conectado ao IDE:
```bash
python3 cli/antigravity-web-cli.py --status
```
*Retorna `extension_connected: true` quando a extensão está ativa no Chrome.*

#### 📄 Ler o conteúdo da página aberta no Chrome:
```bash
python3 cli/antigravity-web-cli.py --context
```
*Extrai o título, a URL e o texto limpo da aba ativa no seu navegador.*

#### 🖱️ Clicar em um botão ou link na página:
```bash
python3 cli/antigravity-web-cli.py --click "Candidatura simplificada"
```
*Localiza o botão por texto ou seletor e clica automaticamente.*

#### ⌨️ Digitar texto em um campo de entrada:
```bash
python3 cli/antigravity-web-cli.py --type "Desenvolvedor Full Stack"
```

#### 📸 Tirar um print da aba atual:
```bash
python3 cli/antigravity-web-cli.py --screenshot
```

---

## 📊 Regras de Armazenamento em Planilhas

Todas as tarefas executadas pelo agente seguem as diretrizes de governança descritas em [`DATA_LOGGING_RULES.md`](DATA_LOGGING_RULES.md). As candidaturas e automações são registradas com data, hora, empresa, cargo e status em planilhas localmente.

---

## 📜 Licença

Este projeto é open-source e distribuído sob a licença **[Apache License 2.0](LICENSE)**.
