// ===== POMODORO =====

// Elementos da página
const timer =
    document.getElementById("timer");

const btnIniciar =
    document.getElementById("btnIniciar");

const btnPausar =
    document.getElementById("btnPausar");

const btnResetar =
    document.getElementById("btnResetar");


// ===== CONFIGURAÇÕES =====

const TEMPO_INICIAL_MINUTOS = 25;


// ===== ESTADO DO TIMER =====

let minutos = TEMPO_INICIAL_MINUTOS;
let segundos = 0;

let intervalo = null;


// ===== ATUALIZAR TELA =====

function atualizarTela() {

    if (!timer) return;

    timer.textContent =
        `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

}


// ===== INICIAR POMODORO =====

function iniciarPomodoro() {

    // Evita criar vários intervalos ao mesmo tempo
    if (intervalo) return;


    intervalo = setInterval(() => {

        // Quando chega em 00 segundos
        if (segundos === 0) {

            // Quando o tempo chega ao final
            if (minutos === 0) {

                clearInterval(intervalo);

                intervalo = null;

                alert("Pomodoro concluído! 🎉");

                atualizarTela();

                return;
            }


            minutos--;

            segundos = 59;

        } else {

            segundos--;

        }


        atualizarTela();

    }, 1000);

}


// ===== PAUSAR POMODORO =====

function pausarPomodoro() {

    if (!intervalo) return;

    clearInterval(intervalo);

    intervalo = null;

}


// ===== RESETAR POMODORO =====

function resetarPomodoro() {

    clearInterval(intervalo);

    intervalo = null;

    minutos = TEMPO_INICIAL_MINUTOS;

    segundos = 0;

    atualizarTela();

}


// ===== EVENTOS DOS BOTÕES =====

if (btnIniciar) {

    btnIniciar.addEventListener(
        "click",
        iniciarPomodoro
    );

}


if (btnPausar) {

    btnPausar.addEventListener(
        "click",
        pausarPomodoro
    );

}


if (btnResetar) {

    btnResetar.addEventListener(
        "click",
        resetarPomodoro
    );

}


// ===== INICIALIZAÇÃO =====

atualizarTela();