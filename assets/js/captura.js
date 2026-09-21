const camera = document.getElementById("camera");

const mensagemCamera = document.getElementById("mensagem-camera");

const mensagemCameraTexto = document.getElementById("mensagem-camera-texto");

const ativarCamera = document.getElementById("ativar-camera");

const botaoCapturar = document.getElementById("capturar");

const canvas = document.getElementById("canvas");

const guiaEnquadramento = document.querySelector(".guia-enquadramento");

const areaCamera = document.querySelector(".area-camera");

let stream = null;


/* ==============================
   CANVAS DE ANÁLISE (baixa resolução, não fica visível na tela)
   81x60 para dividir certinho em 3 colunas de 27px e 3 linhas de 20px
============================== */

const analiseCanvas = document.createElement("canvas");

analiseCanvas.width = 81;

analiseCanvas.height = 60;

const analiseCtx = analiseCanvas.getContext("2d", { willReadFrequently: true });

let frameAnterior = null;

let intervaloAnalise = null;


const iconeOrientacao = document.getElementById("icone-orientacao");

const textoOrientacao = document.getElementById("texto-orientacao");

const indicadorIluminacao = document.getElementById("indicador-iluminacao");

const indicadorEstabilidade = document.getElementById("indicador-estabilidade");

const indicadorDistancia = document.getElementById("indicador-distancia");

const indicadorEnquadramento = document.getElementById("indicador-enquadramento");


let ultimaAnalise = {
    iluminacao: "boa",
    estabilidade: "estavel",
    distancia: "adequada",
    enquadramento: "adequado"
};


/* ==============================
   FOTOMETRIA POR ZONAS (3x3), como um fotômetro de câmera de verdade.
   As 9 zonas ficam na ordem: linha 0 (topo) esq/centro/dir [0,1,2],
   linha 1 (meio) esq/centro/dir [3,4,5], linha 2 (base) esq/centro/dir
   [6,7,8].

   Cada modo de foto tem uma posição de sujeito diferente na cena, então
   cada um usa uma estratégia de zona diferente pra saber onde "olhar":

   - CENTRO: um único ponto no meio. Faz sentido pra Retrato, onde
     esperamos um rosto bem centralizado.
   - FAIXA_MEDIA: a faixa horizontal do meio inteira (esquerda+centro+
     direita). Faz sentido pra Grupo, onde várias pessoas ficam
     espalhadas lado a lado, não concentradas num ponto só.
   - CRUZ: centro + os 4 lados adjacentes (formato de cruz). Faz sentido
     pra Pet, que se move e raramente fica perfeitamente centralizado
     como um rosto, mas ainda tende a estar perto do meio.
   - MATRICIAL: peso igual em todas as 9 zonas, sem sujeito isolado.
     Faz sentido pra Paisagem, onde a cena inteira importa (céu,
     horizonte, terreno), não só um ponto central.

   "sujeito" = zonas usadas para medir enquadramento/distância.
   "fundo" = zonas usadas como referência de "fundo/vazio" pra comparar
   com o sujeito. A Paisagem não tem "fundo" separado (o sujeito É o
   quadro inteiro), então distância vira uma leitura menos precisa lá,
   isso está documentado onde essa comparação acontece.
============================== */

const ESTRATEGIA_ZONA = {

    CENTRO: {
        pesos: [0.05, 0.10, 0.05, 0.10, 0.40, 0.10, 0.05, 0.10, 0.05],
        sujeito: [4],
        fundo: [0, 2, 6, 8]
    },

    FAIXA_MEDIA: {
        pesos: [0.05, 0.05, 0.05, 0.20, 0.25, 0.20, 0.05, 0.10, 0.05],
        sujeito: [3, 4, 5],
        fundo: [0, 2, 6, 8]
    },

    CRUZ: {
        pesos: [0.05, 0.15, 0.05, 0.15, 0.20, 0.15, 0.05, 0.15, 0.05],
        sujeito: [1, 3, 4, 5, 7],
        fundo: [0, 2, 6, 8]
    },

    MATRICIAL: {
        pesos: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9],
        sujeito: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        fundo: null
    }

};


/* ==============================
   CONFIGURAÇÃO POR MODO DE FOTO
   Cada modo tem dica, formato de foto e sensibilidade de analise
   diferentes.
============================== */

const configPorModo = {

    retrato: {
        titulo: "Captura inteligente — Retrato",
        dica: "Fique a um braço de distância e centralize o rosto na moldura, evitando contraluz atrás da pessoa.",
        limiarEstabilidade: 18,
        limiarContraste: 12,
        zona: "CENTRO",
        aspecto: 4 / 5 // vertical, formato clássico de retrato
    },

    paisagem: {
        titulo: "Captura inteligente — Paisagem",
        dica: "Mantenha o horizonte nivelado, aproveite a luz natural e segure o celular bem firme para não perder nitidez.",
        limiarEstabilidade: 14,
        limiarContraste: 10,
        zona: "MATRICIAL",
        aspecto: 16 / 9 // widescreen horizontal
    },

    grupo: {
        titulo: "Captura inteligente — Grupo",
        dica: "Afaste-se o suficiente para incluir todas as pessoas lado a lado no quadro.",
        limiarEstabilidade: 22,
        limiarContraste: 10,
        zona: "FAIXA_MEDIA",
        aspecto: 3 / 2 // horizontal, mais largo pra caber varias pessoas
    },

    pet: {
        titulo: "Captura inteligente — Pet",
        dica: "Pets se movem bastante: a tolerância a tremores é maior, foque em capturar o momento certo.",
        limiarEstabilidade: 32,
        limiarContraste: 12,
        zona: "CRUZ",
        aspecto: 1 // quadrado, formato comum pra fotos de pet/redes sociais
    }

};

const modoSelecionado = sessionStorage.getItem("modoSmartShot") || "retrato";

const configAtual = configPorModo[modoSelecionado] || configPorModo.retrato;

const tituloCapturaModo = document.getElementById("titulo-captura-modo");

const descricaoCapturaModo = document.getElementById("descricao-captura-modo");

if (tituloCapturaModo) {
    tituloCapturaModo.textContent = configAtual.titulo;
}

if (descricaoCapturaModo) {
    descricaoCapturaModo.textContent = configAtual.dica;
}


/* ==============================
   AJUSTA A MOLDURA VISUAL PARA O FORMATO DO MODO ESCOLHIDO
   Sem isso, a moldura sempre mostraria o mesmo retangulo generico,
   mesmo a foto sendo recortada em outro formato na hora de capturar.
============================== */

function ajustarGuiaEnquadramento() {

    if (!guiaEnquadramento || !areaCamera) {
        return;
    }

    const larguraArea = areaCamera.clientWidth;

    const alturaArea = areaCamera.clientHeight;

    const aspecto = configAtual.aspecto;

    let largura;
    let altura;

    if (larguraArea / alturaArea > aspecto) {
        altura = alturaArea * 0.86;
        largura = altura * aspecto;
    } else {
        largura = larguraArea * 0.86;
        altura = largura / aspecto;
    }

    guiaEnquadramento.style.left = "50%";
    guiaEnquadramento.style.right = "auto";
    guiaEnquadramento.style.top = "50%";
    guiaEnquadramento.style.bottom = "auto";
    guiaEnquadramento.style.width = largura + "px";
    guiaEnquadramento.style.height = altura + "px";
    guiaEnquadramento.style.transform = "translate(-50%, -50%)";

}

ajustarGuiaEnquadramento();

window.addEventListener("resize", ajustarGuiaEnquadramento);


/* ==============================
   INICIAR CÂMERA
============================== */

async function iniciarCamera() {

    // Se ja existe um stream ativo (ex.: usuario clicou em "Ativar câmera"
    // de novo), encerra as trilhas antes de pedir um novo acesso. Sem isso,
    // o navegador pode recusar a segunda chamada por a câmera "ja estar em
    // uso" pela tentativa anterior.

    if (stream) {
        stream.getTracks().forEach(function (trilha) {
            trilha.stop();
        });
        stream = null;
    }

    try {

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            },
            audio: false
        });

        camera.srcObject = stream;

        mensagemCamera.classList.add("oculta");

        botaoCapturar.disabled = false;

        iniciarAnalise();

    } catch (erro) {

        console.error("Erro ao acessar a câmera:", erro);

        if (mensagemCameraTexto) {
            mensagemCameraTexto.textContent =
                "Não foi possível acessar a câmera (" + erro.name + "): " + erro.message;
        }

        mensagemCamera.classList.remove("oculta");

        botaoCapturar.disabled = true;

    }

}


/* ==============================
   BOTÃO ATIVAR CÂMERA
============================== */

ativarCamera.addEventListener("click", function () {

    iniciarCamera();

});


/* ==============================
   ANÁLISE EM TEMPO REAL DO FRAME DA CÂMERA
============================== */

function iniciarAnalise() {

    if (intervaloAnalise) {
        return;
    }

    intervaloAnalise = setInterval(analisarFrame, 400);

}


function analisarFrame() {

    if (!stream || camera.videoWidth === 0) {
        return;
    }


    analiseCtx.drawImage(
        camera,
        0,
        0,
        analiseCanvas.width,
        analiseCanvas.height
    );

    const frame = analiseCtx.getImageData(
        0,
        0,
        analiseCanvas.width,
        analiseCanvas.height
    );

    const dados = frame.data;

    const totalPixelsFrame = dados.length / 4;

    const larguraZona = analiseCanvas.width / 3;

    const alturaZona = analiseCanvas.height / 3;


    // Um unico passe por todos os pixels: acumula por zona (3x3) pra
    // fotometria, soma geral (pra detectar estouro de luz) e guarda o
    // canal vermelho pra comparar com o frame anterior (estabilidade).

    const zonas = [];

    for (let z = 0; z < 9; z++) {
        zonas.push({ soma: 0, somaQuadrado: 0, total: 0 });
    }

    let pixelsEstourados = 0;

    for (let y = 0; y < analiseCanvas.height; y++) {

        const linhaZona = Math.min(2, Math.floor(y / alturaZona));

        for (let x = 0; x < analiseCanvas.width; x++) {

            const colunaZona = Math.min(2, Math.floor(x / larguraZona));

            const zonaIndice = linhaZona * 3 + colunaZona;

            const indice = (y * analiseCanvas.width + x) * 4;

            const r = dados[indice];
            const g = dados[indice + 1];
            const b = dados[indice + 2];

            const luminancia = 0.299 * r + 0.587 * g + 0.114 * b;

            zonas[zonaIndice].soma += luminancia;
            zonas[zonaIndice].somaQuadrado += luminancia * luminancia;
            zonas[zonaIndice].total++;

            if (r > 245 && g > 245 && b > 245) {
                pixelsEstourados++;
            }

        }

    }

    const estrategia = ESTRATEGIA_ZONA[configAtual.zona];

    const mediasZona = zonas.map(function (zona) {
        return zona.soma / zona.total;
    });

    let luminanciaPonderada = 0;

    for (let i = 0; i < 9; i++) {
        luminanciaPonderada += mediasZona[i] * estrategia.pesos[i];
    }

    const percentualEstourado = pixelsEstourados / totalPixelsFrame;


    // ILUMINAÇÃO: estouro detectado vence qualquer média (uma foto com
    // realces estourados é ruim mesmo com a média geral "normal").

    let statusIluminacao;

    if (percentualEstourado > 0.12) {
        statusIluminacao = "estourada";
    } else if (luminanciaPonderada < 60) {
        statusIluminacao = "baixa";
    } else if (luminanciaPonderada > 210) {
        statusIluminacao = "alta";
    } else {
        statusIluminacao = "boa";
    }


    // ESTABILIDADE: diferença media de pixels entre este frame e o anterior (proxy de movimento/tremor)

    let statusEstabilidade = "estavel";

    if (frameAnterior) {

        let somaDiferenca = 0;

        for (let i = 0; i < dados.length; i += 4) {
            somaDiferenca += Math.abs(dados[i] - frameAnterior[i]);
        }

        const diferencaMedia = somaDiferenca / totalPixelsFrame;

        statusEstabilidade = diferencaMedia > configAtual.limiarEstabilidade ? "instavel" : "estavel";

    }

    frameAnterior = dados;


    // ENQUADRAMENTO / DISTÂNCIA: proxy por contraste, não é deteccao de
    // rosto/objeto de verdade (exigiria biblioteca externa fora do escopo
    // permitido). Pouco contraste na área de "sujeito" do modo (ver
    // ESTRATEGIA_ZONA) indica que nao ha nada bem definido ali (longe,
    // ou sem sujeito claro).
    //
    // Para "perto", NÃO usamos "muito contraste no sujeito" como sinal:
    // cabelo, barba, pelagem e outras texturas geram bastante contraste
    // local mesmo numa distância normal, e uma aproximação excessiva de
    // verdade tende a sair do foco da câmera (o que reduz contraste, nao
    // aumenta). Em vez disso, comparamos a área de sujeito com a área de
    // "fundo" (normalmente os 4 cantos): se o fundo tem quase tanto
    // detalhe quanto o sujeito, ele provavelmente esta ocupando o quadro
    // inteiro (perto demais). Se o fundo é bem mais "vazio" que o
    // sujeito, é sinal de boa separação sujeito/fundo.
    //
    // A Paisagem (estrategia MATRICIAL) não tem fundo separado, o
    // "sujeito" já é o quadro inteiro, então não existe uma comparação
    // de distância significativa ali. Nesse caso, distância acompanha a
    // mesma leitura do enquadramento, é uma limitação honesta do proxy
    // pra esse tipo de foto, não uma medida independente de verdade.

    function desvioPadraoDeZonas(indices) {

        let somaTotal = 0;
        let somaQuadradoTotal = 0;
        let totalPixels = 0;

        indices.forEach(function (indice) {
            somaTotal += zonas[indice].soma;
            somaQuadradoTotal += zonas[indice].somaQuadrado;
            totalPixels += zonas[indice].total;
        });

        const media = somaTotal / totalPixels;

        const variancia = (somaQuadradoTotal / totalPixels) - (media * media);

        return Math.sqrt(Math.max(variancia, 0));

    }

    const desvioPadraoSujeito = desvioPadraoDeZonas(estrategia.sujeito);

    const statusEnquadramento = desvioPadraoSujeito > configAtual.limiarContraste ? "adequado" : "ajustar";

    let statusDistancia;

    if (desvioPadraoSujeito <= configAtual.limiarContraste) {

        statusDistancia = "longe";

    } else if (!estrategia.fundo) {

        statusDistancia = statusEnquadramento === "adequado" ? "adequada" : "longe";

    } else {

        const desvioPadraoFundo = desvioPadraoDeZonas(estrategia.fundo);

        statusDistancia = desvioPadraoFundo > desvioPadraoSujeito * 0.75 ? "perto" : "adequada";

    }


    atualizarIndicadores({
        iluminacao: statusIluminacao,
        estabilidade: statusEstabilidade,
        distancia: statusDistancia,
        enquadramento: statusEnquadramento
    });

}


/* ==============================
   ATUALIZA A INTERFACE COM O RESULTADO DA ANÁLISE
============================== */

function atualizarIndicadores(status) {

    ultimaAnalise = status;

    aplicarStatus(indicadorIluminacao, status.iluminacao === "boa");

    aplicarStatus(indicadorEstabilidade, status.estabilidade === "estavel");

    aplicarStatus(indicadorDistancia, status.distancia === "adequada");

    aplicarStatus(indicadorEnquadramento, status.enquadramento === "adequado");


    const tudoOk =
        status.iluminacao === "boa" &&
        status.estabilidade === "estavel" &&
        status.enquadramento === "adequado";

    if (tudoOk) {

        textoOrientacao.textContent = "Tudo certo, pode capturar";

        iconeOrientacao.textContent = "✓";

    } else if (status.iluminacao === "estourada") {

        textoOrientacao.textContent = "Luz estourada, afaste-se da fonte de luz";

        iconeOrientacao.textContent = "☀";

    } else if (status.iluminacao === "baixa") {

        textoOrientacao.textContent = "Ambiente escuro, procure mais luz";

        iconeOrientacao.textContent = "☀";

    } else if (status.iluminacao === "alta") {

        textoOrientacao.textContent = "Muita luz, evite contraluz";

        iconeOrientacao.textContent = "☀";

    } else if (status.estabilidade === "instavel") {

        textoOrientacao.textContent = "Segure o celular com mais firmeza";

        iconeOrientacao.textContent = "◉";

    } else {

        textoOrientacao.textContent = "Centralize melhor o que vai fotografar";

        iconeOrientacao.textContent = "⌗";

    }

}


function aplicarStatus(elemento, adequado) {

    if (!elemento) {
        return;
    }

    elemento.classList.remove("text-success", "text-danger");

    elemento.classList.add(adequado ? "text-success" : "text-danger");

}


/* ==============================
   CAPTURAR FOTO (recortada no formato do modo escolhido)
============================== */

botaoCapturar.addEventListener("click", function () {

    if (!stream) {
        return;
    }


    const aspecto = configAtual.aspecto;

    const larguraVideo = camera.videoWidth;

    const alturaVideo = camera.videoHeight;

    let larguraRecorte;
    let alturaRecorte;

    if (larguraVideo / alturaVideo > aspecto) {
        alturaRecorte = alturaVideo;
        larguraRecorte = alturaVideo * aspecto;
    } else {
        larguraRecorte = larguraVideo;
        alturaRecorte = larguraVideo / aspecto;
    }

    const origemX = (larguraVideo - larguraRecorte) / 2;

    const origemY = (alturaVideo - alturaRecorte) / 2;


    canvas.width = larguraRecorte;

    canvas.height = alturaRecorte;


    const contexto = canvas.getContext("2d");


    contexto.drawImage(
        camera,
        origemX,
        origemY,
        larguraRecorte,
        alturaRecorte,
        0,
        0,
        larguraRecorte,
        alturaRecorte
    );


    const foto = canvas.toDataURL("image/png");


    sessionStorage.setItem(
        "fotoSmartShot",
        foto
    );

    sessionStorage.setItem(
        "analiseSmartShot",
        JSON.stringify(ultimaAnalise)
    );


    window.location.href = "preview.html";

});


/* ==============================
   INICIAR AUTOMATICAMENTE
============================== */

iniciarCamera();
