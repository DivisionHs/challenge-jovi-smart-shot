const fotoPreview = document.getElementById("foto-preview");

const semFoto = document.getElementById("sem-foto");

const botaoSalvar = document.getElementById("salvar-foto");

const botaoCompartilhar = document.getElementById("compartilhar-foto");


/* ==============================
   RECUPERAR FOTO
============================== */

const foto = sessionStorage.getItem("fotoSmartShot");


if (foto) {

    fotoPreview.src = foto;

    fotoPreview.style.display = "block";

    semFoto.classList.remove("ativo");

} else {

    fotoPreview.style.display = "none";

    semFoto.classList.add("ativo");

}


/* ==============================
   FORMATO DO CONTAINER CONFORME O MODO ESCOLHIDO
   A foto já vem recortada no formato certo desde a captura, aqui só
   ajustamos a caixa que a exibe pra não forçar tudo no mesmo formato.
============================== */

const ASPECTO_POR_MODO = {
    retrato: 4 / 5,
    paisagem: 16 / 9,
    grupo: 3 / 2,
    pet: 1
};

const fotoContainer = document.querySelector(".foto-container");

if (fotoContainer) {

    const modoUsado = sessionStorage.getItem("modoSmartShot") || "retrato";

    const aspectoUsado = ASPECTO_POR_MODO[modoUsado] || ASPECTO_POR_MODO.retrato;

    fotoContainer.style.aspectRatio = aspectoUsado;

    fotoContainer.style.height = "auto";

}


/* ==============================
   RESUMO DA ANÁLISE FEITA NO MOMENTO DA CAPTURA
============================== */

const rotulos = {
    iluminacao: { boa: "Adequada", baixa: "Baixa, ambiente escuro", alta: "Alta, evite contraluz", estourada: "Estourada, muita luz direta" },
    estabilidade: { estavel: "Boa", instavel: "Instável, houve tremor" },
    enquadramento: { adequado: "Adequado", ajustar: "Centralize melhor o objeto" },
    distancia: { adequada: "Adequada", perto: "Muito perto, afaste-se um pouco", longe: "Muito longe, aproxime-se" }
};

function preencherResumo(chave, valorId, iconeId) {

    const analiseSalva = sessionStorage.getItem("analiseSmartShot");

    const valorElemento = document.getElementById(valorId);

    const iconeElemento = document.getElementById(iconeId);

    if (!analiseSalva || !valorElemento || !iconeElemento) {
        return;
    }

    const analise = JSON.parse(analiseSalva);

    const status = analise[chave];

    const adequado = status === "boa" || status === "estavel" || status === "adequado" || status === "adequada";

    valorElemento.textContent = rotulos[chave][status] || "Não analisado";

    iconeElemento.textContent = adequado ? "✓" : "✗";

    iconeElemento.classList.remove("text-success", "text-danger");

    iconeElemento.classList.add(adequado ? "text-success" : "text-danger");

}

preencherResumo("iluminacao", "valor-resumo-iluminacao", "icone-resumo-iluminacao");

preencherResumo("estabilidade", "valor-resumo-estabilidade", "icone-resumo-estabilidade");

preencherResumo("enquadramento", "valor-resumo-enquadramento", "icone-resumo-enquadramento");

preencherResumo("distancia", "valor-resumo-distancia", "icone-resumo-distancia");


/* ==============================
   SALVAR FOTO
============================== */

botaoSalvar.addEventListener("click", function () {

    if (!foto) {
        return;
    }


    const link = document.createElement("a");

    link.href = foto;

    link.download = "jovi-smart-shot.png";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

});


/* ==============================
   COMPARTILHAR
============================== */

botaoCompartilhar.addEventListener("click", async function () {

    if (!foto) {
        return;
    }


    try {

        const resposta = await fetch(foto);

        const blob = await resposta.blob();


        const arquivo = new File(
            [blob],
            "jovi-smart-shot.png",
            {
                type: "image/png"
            }
        );


        if (
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({
                files: [arquivo]
            })
        ) {

            await navigator.share({
                title: "JOVI Smart Shot",
                text: "Foto capturada com o JOVI Smart Shot.",
                files: [arquivo]
            });

        } else {

            window.location.href = "compartilhar.html";

        }

    } catch (erro) {

        console.error(
            "Não foi possível compartilhar:",
            erro
        );

        window.location.href = "compartilhar.html";

    }

});