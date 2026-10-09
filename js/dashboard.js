// ===== DADOS DO DASHBOARD =====

const totalMaterias = document.getElementById("totalMaterias");
const totalTarefas = document.getElementById("totalTarefas");
const totalEventos = document.getElementById("totalEventos");

const materias =
    JSON.parse(localStorage.getItem("materiasStudyFlow")) || [];

const tarefas =
    JSON.parse(localStorage.getItem("tarefasStudyFlow")) || [];

const eventos =
    JSON.parse(localStorage.getItem("eventosStudyFlow")) || [];


// ===== CONTADORES =====

if (totalMaterias) {
    totalMaterias.textContent = materias.length;
}

if (totalTarefas) {
    totalTarefas.textContent = tarefas.length;
}

if (totalEventos) {
    totalEventos.textContent = eventos.length;
}


// ===== ÚLTIMA TAREFA =====

const ultimaTarefa =
    document.getElementById("ultimaTarefa");

if (ultimaTarefa) {

    if (tarefas.length > 0) {

        ultimaTarefa.textContent =
            tarefas[tarefas.length - 1].nome;

    } else {

        ultimaTarefa.textContent =
            "Nenhuma tarefa cadastrada";

    }

}


// ===== PRÓXIMO EVENTO =====

const proximoEvento =
    document.getElementById("proximoEvento");

if (proximoEvento) {

    if (eventos.length > 0) {

        proximoEvento.textContent =
            eventos[eventos.length - 1].nome;

    } else {

        proximoEvento.textContent =
            "Nenhum evento cadastrado";

    }

}


// ===== MENU MOBILE =====

const btnMenu =
    document.getElementById("btnMenu");

const sidebar =
    document.getElementById("sidebar");

if (btnMenu && sidebar) {

    btnMenu.addEventListener("click", () => {

        sidebar.classList.toggle("hidden");

    });

}


// ===== PERFIL DO USUÁRIO =====

const usuario = JSON.parse(
    localStorage.getItem("usuarioStudyFlow")
);

const nomeUsuario =
    document.getElementById("nomeUsuario");

const perfilNome =
    document.getElementById("perfilNome");

const perfilEmail =
    document.getElementById("perfilEmail");


if (usuario) {

    // Nome da saudação
    if (nomeUsuario) {

        nomeUsuario.textContent =
            `Olá, ${usuario.nome}`;

    }

    // Nome no perfil
    if (perfilNome) {

        perfilNome.textContent =
            usuario.nome;

    }

    // Email no perfil
    if (perfilEmail) {

        perfilEmail.textContent =
            usuario.email;

    }

}