// ===== AUTENTICAÇÃO DO STUDYFLOW =====

// Verifica se existe usuário logado
const usuarioLogado = localStorage.getItem("usuarioLogado");

if (!usuarioLogado) {
    window.location.href = "login.html";
}


// ===== LOGOUT =====

document.addEventListener("DOMContentLoaded", () => {

    const btnLogout = document.getElementById("btnLogout");

    if (!btnLogout) return;

    btnLogout.addEventListener("click", (event) => {

        event.preventDefault();

        const confirmar = confirm(
            "Deseja realmente sair do StudyFlow?"
        );

        if (!confirmar) return;

        localStorage.removeItem("usuarioLogado");

        window.location.href = "login.html";
    });

});