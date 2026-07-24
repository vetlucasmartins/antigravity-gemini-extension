# 🌉 Antigravity Gemini Extension (`antigravity-gemini-extension`)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-green.svg)](manifest.json)
[![Gemini Ready](https://img.shields.io/badge/AI-Google%20Gemini%20Web-orange.svg)](https://gemini.google.com)
[![Multi-Platform](https://img.shields.io/badge/Platforms-Upwork%20%7C%20X%20%7C%20Threads%20%7C%20LinkedIn-purple.svg)](#)

**Antigravity Gemini Extension** é um **Copiloto Web Universal Agêntico** e ponte (**Bridge**) de automação de alto desempenho entre o **Antigravity AI (IDE / CLI)** e o seu navegador **Google Chrome**.

Projetado para operar em **qualquer site da web** — com recursos dedicados para **Upwork**, **X (Twitter)**, **Threads**, **LinkedIn**, redes sociais e plataformas freelance —, a extensão permite navegar, analisar oportunidades, ajustar bios/perfil, publicar conteúdos e executar tarefas autônomas com **deduplicação por memória persistente**.

---

## 🔥 Principais Recursos & Atualizações Recentemente Implementadas

### 🧠 1. Extração Semântica Inteligente (Sem Falsos Positivos)
- **Zero Falsos Positivos**: O algoritmo localiza a área principal de conteúdo (`main`, `article`, `.jobs-search__job-details`, `[data-test="job-details"]`) e elimina ruídos como menus superiores, rodapés, banners de cookies e scripts ocultos.
- **Economia Extrema de Tokens**: Reduziu a carga de contexto de 15.000 caracteres brutos para ~4.500 caracteres de altíssimo sinal (economia de até 70% em tokens por requisição).
- **Pontuação de Elementos para Clique**: A automação pontua elementos interativos para garantir que cliques ocorram no corpo principal da página em vez de links institucionais do cabeçalho.

### 💼 2. Otimizador Upwork & Economia de Connects
- Reconhecimento automático de páginas do **Upwork**, extraindo título da vaga, orçamento estimado e exigência de Connects.
- Avaliação estratégica da vaga e redação de propostas direcionadas sem gasto desnecessário de Connects.

### 🐦 3. Formatação e Publicação Multi-Plataforma
- Presets prontos para gerar, formatar e publicar conteúdos de texto otimizados no **X (Twitter)**, **Threads** e **LinkedIn**.
- Ajustes automáticos de bio e configurações de conta em redes sociais e plataformas freelance.

### 📑 4. Memória Persistente e Deduplicação de Tarefas
- Todo comando e automação é registrado continuamente nas planilhas [historico_tarefas_antigravity.csv](historico_tarefas_antigravity.csv) e [task_history_tracker.md](task_history_tracker.md).
- O agente consulta a memória recente antes de cada meta para **não repetir tarefas já concluídas** (evitando envio de propostas duplicadas no Upwork ou postagens repetidas).

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
2. **Você conversa com o Antigravity** no chat do IDE, no painel lateral da extensão ou no terminal:  
   > *"Antigravity, analise esta vaga no Upwork, veja no histórico se já apliquei para ela e, se não, elabore uma proposta focada no problema do cliente economizando Connects."*
3. **O Antigravity faz tudo sozinho**: ele se conecta via Bridge local, inspeciona o DOM semântico, realiza as ações e registra os resultados na planilha de memória persistente.

---

## 🚀 Instalação Rápida (Apenas 1 Vez)

### Passo 1: Adicionar a Extensão ao Chrome
1. Abra o seu navegador Chrome e acesse: `chrome://extensions`
2. No canto superior direito, ative a chave **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** (*Load Unpacked*).
4. Selecione a pasta deste repositório (`antigravity-gemini-extension`).

### Passo 2: Pronto!
A extensão se conecta automaticamente com o servidor Bridge local na porta `8765`.

---

## 💬 Presets de Automação & Exemplos de Uso

A extensão conta com cards de automação rápida e suporte a qualquer meta via linguagem natural:

- 💼 **Upwork Hunter & Connect Saver**: Analisa a vaga ativa no Upwork, confira orçamento/Connects e gera proposta otimizada.
- 🐦 **Publicar / Formatar Conteúdo Social**: Cria e ajusta postagens para X, Threads e LinkedIn.
- 👤 **Otimizador de Bio e Perfil**: Analisa a página de perfil ou configurações da conta e redige uma bio de alta conversão.
- 📑 **Histórico da Memória Persistente**: Exibe o log em tempo real das tarefas gravadas na planilha CSV/MD.

---

## 🛠️ Arquitetura & Endpoints (Para Desenvolvedores)

- **Servidor Bridge Local (`cli/bridge_server.py`)**: Executado em `http://127.0.0.1:8765`.
  - `GET /status`: Status da conexão da extensão.
  - `GET /api/history`: Consulta o histórico recente de tarefas salvas.
  - `POST /api/log`: Registra uma nova tarefa na memória persistente.
  - `POST /api/command`: Envia comandos remotos do IDE para a extensão.
- **Registrador de Memória (`cli/task_memory_logger.py`)**: Mantém a governança de dados conforme `DATA_LOGGING_RULES.md` nos arquivos `historico_tarefas_antigravity.csv` e `task_history_tracker.md`.
- **Suporte Dual a Modelos**: Funciona com a sessão logada em `gemini.google.com` (Gemini Web) ou via API Direct (Gemini 2.0 Flash / 1.5 Pro).

---

## 📜 Licença

Este projeto é de código aberto e está sob a licença **[Apache License 2.0](LICENSE)**.
