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