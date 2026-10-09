// ===== CALENDÁRIO / EVENTOS =====

const botaoNovoEvento =
    document.getElementById("btnNovoEvento");

const listaEventos =
    document.getElementById("listaEventos");


// ===== DADOS =====

let eventos =
    JSON.parse(
        localStorage.getItem("eventosStudyFlow")
    ) || [];


// ===== SALVAR EVENTOS =====

function salvarEventos() {

    localStorage.setItem(
        "eventosStudyFlow",
        JSON.stringify(eventos)
    );

}


// ===== RENDERIZAR EVENTOS =====

function renderizarEventos() {

    // Evita erro caso a lista não exista
    if (!listaEventos) return;

    listaEventos.innerHTML = "";


    // Caso não existam eventos
    if (eventos.length === 0) {

        listaEventos.innerHTML = `
            <div class="card text-center">

                <p class="text-slate-400">
                    Nenhum evento cadastrado.
                </p>

                <p class="text-slate-500 text-sm mt-2">
                    Clique em "Novo evento" para começar.
                </p>

            </div>
        `;

        return;
    }


    // Criar os cards dos eventos
    eventos.forEach((evento, index) => {

        const novoEvento =
            document.createElement("div");


        novoEvento.className =
            "bg-slate-900/60 border border-cyan-500/20 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4";


        novoEvento.innerHTML = `

            <div>

                <h3 class="text-xl font-bold">
                    ${evento.nome}
                </h3>


                <p class="text-slate-400 mt-2">
                    ${evento.dia} Maio • 08:00
                </p>

            </div>


            <button
                type="button"
                class="bg-red-500/20 text-red-300 px-4 py-2 rounded-xl text-sm border border-red-500/20 hover:bg-red-500/30 transition">

                Remover

            </button>

        `;


        // ===== BOTÃO REMOVER =====

        const botaoRemover =
            novoEvento.querySelector("button");


        botaoRemover.addEventListener(
            "click",
            () => {

                const confirmar =
                    confirm(
                        "Deseja realmente remover este evento?"
                    );


                if (!confirmar) return;


                eventos.splice(index, 1);

                salvarEventos();

                renderizarEventos();

            }
        );


        listaEventos.prepend(novoEvento);

    });

}


// ===== NOVO EVENTO =====

if (botaoNovoEvento) {

    botaoNovoEvento.addEventListener(
        "click",
        () => {

            const nomeEvento =
                prompt(
                    "Digite o nome do evento:"
                );


            if (
                nomeEvento === null ||
                nomeEvento.trim() === ""
            ) {
                return;
            }


            const diaEvento =
                prompt(
                    "Digite o dia do evento:"
                );


            if (
                diaEvento === null ||
                diaEvento.trim() === ""
            ) {
                return;
            }


            eventos.push({

                nome:
                    nomeEvento.trim(),

                dia:
                    diaEvento.trim()

            });


            salvarEventos();

            renderizarEventos();

        }
    );

}


// ===== INICIALIZAÇÃO =====

renderizarEventos();