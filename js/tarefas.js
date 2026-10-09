// ===== TAREFAS =====

const botaoNovaTarefa =
    document.getElementById("btnNovaTarefa");

const listaTarefas =
    document.getElementById("listaTarefas");


// ===== DADOS =====

let tarefas =
    JSON.parse(
        localStorage.getItem("tarefasStudyFlow")
    ) || [];


// ===== SALVAR TAREFAS =====

function salvarTarefas() {

    localStorage.setItem(
        "tarefasStudyFlow",
        JSON.stringify(tarefas)
    );

}


// ===== RENDERIZAR TAREFAS =====

function renderizarTarefas() {

    // Verifica se a lista existe na página
    if (!listaTarefas) return;

    listaTarefas.innerHTML = "";


    // Caso não existam tarefas
    if (tarefas.length === 0) {

        listaTarefas.innerHTML = `
            <div class="card text-center">
                <p class="text-slate-400">
                    Nenhuma tarefa cadastrada.
                </p>

                <p class="text-slate-500 text-sm mt-2">
                    Clique em "Nova tarefa" para começar.
                </p>
            </div>
        `;

        return;
    }


    // Criar os cards das tarefas
    tarefas.forEach((tarefa, index) => {

        const novaTarefa =
            document.createElement("div");


        novaTarefa.className =
            "bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:-translate-y-1 transition duration-300";


        novaTarefa.innerHTML = `

            <div class="flex items-center gap-5">

                <div
                    class="w-6 h-6 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/30 flex-shrink-0">
                </div>

                <div>

                    <h3 class="text-xl sm:text-2xl font-bold">
                        ${tarefa.nome}
                    </h3>

                    <p class="text-slate-400 mt-1 text-sm">
                        Tarefa salva no sistema.
                    </p>

                </div>

            </div>


            <button
                type="button"
                class="bg-red-500/20 text-red-300 px-5 py-3 rounded-2xl text-sm font-semibold border border-red-500/20 hover:bg-red-500/30 transition">

                Remover

            </button>

        `;


        // ===== BOTÃO REMOVER =====

        const botaoRemover =
            novaTarefa.querySelector("button");


        botaoRemover.addEventListener(
            "click",
            () => {

                const confirmar =
                    confirm(
                        "Deseja realmente remover esta tarefa?"
                    );


                if (!confirmar) return;


                tarefas.splice(index, 1);

                salvarTarefas();

                renderizarTarefas();

            }
        );


        listaTarefas.prepend(novaTarefa);

    });

}


// ===== NOVA TAREFA =====

if (botaoNovaTarefa) {

    botaoNovaTarefa.addEventListener(
        "click",
        () => {

            const nomeTarefa =
                prompt(
                    "Digite o nome da tarefa:"
                );


            if (
                nomeTarefa === null ||
                nomeTarefa.trim() === ""
            ) {
                return;
            }


            tarefas.push({

                nome:
                    nomeTarefa.trim()

            });


            salvarTarefas();

            renderizarTarefas();

        }
    );

}


// ===== INICIALIZAÇÃO =====

renderizarTarefas();

// ===== MENU MOBILE =====

const btnMenuTarefas = document.getElementById("btnMenuTarefas");
const sidebarTarefas = document.getElementById("sidebarTarefas");

if (btnMenuTarefas && sidebarTarefas) {

    btnMenuTarefas.addEventListener("click", () => {

        sidebarTarefas.classList.toggle("hidden");

    });

}