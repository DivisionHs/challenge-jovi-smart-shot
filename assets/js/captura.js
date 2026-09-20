const camera = document.getElementById("camera");

const mensagemCamera = document.getElementById("mensagem-camera");

const ativarCamera = document.getElementById("ativar-camera");

const botaoCapturar = document.getElementById("capturar");

const canvas = document.getElementById("canvas");

let stream = null;


/* ==============================
   INICIAR CÂMERA
============================== */

async function iniciarCamera() {

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

    } catch (erro) {

        console.error("Erro ao acessar a câmera:", erro);

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
   CAPTURAR FOTO
============================== */

botaoCapturar.addEventListener("click", function () {

    if (!stream) {
        return;
    }


    canvas.width = camera.videoWidth;

    canvas.height = camera.videoHeight;


    const contexto = canvas.getContext("2d");


    contexto.drawImage(
        camera,
        0,
        0,
        canvas.width,
        canvas.height
    );


    const foto = canvas.toDataURL("image/png");


    sessionStorage.setItem(
        "fotoSmartShot",
        foto
    );


    window.location.href = "preview.html";

});


/* ==============================
   INICIAR AUTOMATICAMENTE
============================== */

iniciarCamera();