const fotoCompartilhar = document.getElementById("foto-compartilhar");

const semFoto = document.getElementById("sem-foto");

const botaoSalvar = document.getElementById("salvar");

const botaoCompartilhar = document.getElementById("compartilhar");


/* ==============================
   RECUPERAR FOTO
============================== */

const foto = sessionStorage.getItem("fotoSmartShot");


if (foto) {

    fotoCompartilhar.src = foto;

    fotoCompartilhar.style.display = "block";

    semFoto.classList.remove("ativo");

} else {

    fotoCompartilhar.style.display = "none";

    semFoto.classList.add("ativo");

}


/* ==============================
   FORMATO DO CONTAINER CONFORME O MODO ESCOLHIDO
============================== */

const ASPECTO_POR_MODO = {
    retrato: 4 / 5,
    paisagem: 16 / 9,
    grupo: 3 / 2,
    pet: 1
};

const fotoContainerCompartilhar = document.querySelector(".foto-compartilhar");

if (fotoContainerCompartilhar) {

    const modoUsado = sessionStorage.getItem("modoSmartShot") || "retrato";

    const aspectoUsado = ASPECTO_POR_MODO[modoUsado] || ASPECTO_POR_MODO.retrato;

    fotoContainerCompartilhar.style.aspectRatio = aspectoUsado;

    fotoContainerCompartilhar.style.height = "auto";

}


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

            alert(
                "O compartilhamento direto não está disponível neste dispositivo. Você pode salvar a foto na galeria."
            );

        }

    } catch (erro) {

        console.error(
            "Erro ao compartilhar:",
            erro
        );

    }

});