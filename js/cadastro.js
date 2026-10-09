const btnTermos = document.getElementById("btnTermos");
const modalTermos = document.getElementById("modalTermos");
const fecharTermos = document.getElementById("fecharTermos");

btnTermos.addEventListener("click", () => {

    modalTermos.classList.remove("hidden");

});

fecharTermos.addEventListener("click", () => {

    modalTermos.classList.add("hidden");

});