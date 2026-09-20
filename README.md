# JOVI Smart Shot

Câmera guiada para fotos melhores e sem complicações.

Projeto desenvolvido para o **Challenge JOVI** (FIAP, 1º ano de Análise e Desenvolvimento de Sistemas, turma 1TDSOA). A proposta simula uma solução web para a marca JOVI Smartphone, orientando o usuário em tempo real durante a captura de fotos (iluminação, estabilidade, distância e enquadramento).

## Estrutura do projeto

```
challenge-jovi-smart-shot/
├── index.html              # Tela inicial (apresentação do recurso)
├── pages/                  # Demais telas do fluxo
│   ├── modo.html           # Escolha do modo (retrato, paisagem, grupo, pet)
│   ├── permissao.html      # Permissão de acesso à câmera
│   ├── captura.html        # Captura guiada (câmera em tempo real)
│   ├── preview.html        # Pré-visualização da foto capturada
│   └── compartilhar.html   # Salvar/compartilhar a foto
├── assets/
│   ├── css/                # Um arquivo de estilo por tela
│   ├── js/                 # Lógica de câmera, captura e compartilhamento
│   └── images/             # Ícones dos modos e imagem de demonstração
└── README.md
```

## Como rodar localmente

Este é um projeto 100% estático (HTML, CSS, JavaScript e Bootstrap via CDN), sem build ou dependências para instalar.

**Importante:** não abra `index.html` direto com duplo clique. A tela de captura usa `getUserMedia` para acessar a câmera, e isso só funciona em contexto seguro (`https://` ou `localhost`). Suba um servidor local a partir da raiz do projeto:

```bash
python -m http.server 8000
```

E acesse `http://localhost:8000/index.html`.

## Stack técnica

- HTML5 semântico
- CSS puro (um arquivo por tela) + Bootstrap 5 (utilitários de layout, espaçamento e componentes)
- JavaScript vanilla (câmera via `MediaDevices.getUserMedia`, captura via `<canvas>`, transição de foto entre telas via `sessionStorage`, compartilhamento via `navigator.share`)

## Equipe (Sprint 2)

| Parte | Responsável |
|---|---|
| HTML, CSS e primeira versão do JavaScript | Giovanna Alves e Manuela Vianna |
| Estrutura do repositório, integração do Bootstrap e desenvolvimento da lógica funcional | Davi Henrick |
| Testes finais e apresentação | Marcelo Becca |

## Status

O fluxo de navegação e a captura real de fotos (câmera, canvas, download, compartilhamento) estão funcionais. A análise em tempo real de iluminação/estabilidade/distância/enquadramento ainda é apenas visual (textos fixos), a lógica de análise real está em desenvolvimento.
