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
- CSS puro (um arquivo por tela) + Bootstrap 5 (utilitários de layout, espaçamento e componentes) + Bootstrap JS (modal "Como funciona")
- Ícones em SVG puro, embutidos em cada página via sprite (`<symbol>` + `<use>`), sem nenhuma biblioteca ou CDN de ícones
- JavaScript vanilla (câmera via `MediaDevices.getUserMedia`, captura via `<canvas>`, transição de foto entre telas via `sessionStorage`, compartilhamento via `navigator.share`)

## Análise em tempo real (tela de captura)

A cada ~400ms, o frame da câmera é analisado num canvas de baixa resolução (81×60), dividido numa grade 3×3 (fotometria por zonas, como um fotômetro de câmera real):

- **Iluminação**: média de brilho ponderada pelas zonas + detecção de estouro de luz (percentual de pixels quase brancos).
- **Estabilidade**: diferença entre o frame atual e o anterior (proxy de tremor/movimento).
- **Enquadramento/Distância**: contraste da área de "sujeito" comparado com os cantos do quadro (proxy de separação sujeito/fundo). Não é detecção de rosto real, que exigiria uma biblioteca fora do escopo permitido.

Cada modo usa uma estratégia de zona diferente (ver `assets/js/captura.js`, `ESTRATEGIA_ZONA`): Retrato mede o centro, Grupo mede a faixa horizontal do meio, Pet mede uma área em cruz mais tolerante, Paisagem mede o quadro inteiro. A foto final também é recortada num formato diferente por modo (retrato 4:5, paisagem 16:9, grupo 3:2, pet 1:1).

## Equipe (Sprint 2)

| Parte | Responsável |
|---|---|
| HTML, CSS e primeira versão do JavaScript | Giovanna Alves e Manuela Vianna |
| Estrutura do repositório, integração do Bootstrap e desenvolvimento da lógica funcional | Davi Henrick |
| Testes finais e apresentação | Marcelo Becca |

## Status

Fluxo de navegação, captura real de fotos (câmera, canvas, download, compartilhamento) e análise em tempo real dos 4 indicadores (iluminação, estabilidade, distância, enquadramento) estão funcionais, com comportamento diferente por modo de foto.

Pendência conhecida: o texto dos quadrinhos de aviso (ícone + mensagem) não está centralizando corretamente em todas as telas, mesmo com o CSS aparentemente correto (`display: grid`, `width: 100%`, `text-align: center` confirmados via DevTools). Não é bloqueante para o uso do app, fica como ajuste futuro.
