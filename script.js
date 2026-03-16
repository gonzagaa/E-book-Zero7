const steps = document.querySelectorAll("#quiz .step");
const nextButtons = document.querySelectorAll("#quiz .next");
const backButtons = document.querySelectorAll("#quiz .back");
const form = document.getElementById("quizForm");

const nome = document.getElementById("nome");
const tempo = document.getElementById("tempo");
const email = document.getElementById("email");
const telefone = document.getElementById("telefone");

let currentStep = 1;

function showStep(step) {
  steps.forEach((item) => item.classList.remove("active"));
  document.querySelector(`#quiz .step[data-step="${step}"]`)?.classList.add("active");
  currentStep = step;
}

function validateStep(step) {
  if (step === 1) {
    return nome.value.trim() !== "";
  }

  if (step === 2) {
    return tempo.value.trim() !== "";
  }

  if (step === 3) {
    const value = email.value.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  if (step === 4) {
    return telefone.value.replace(/\D/g, "").length >= 10;
  }

  return true;
}

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!validateStep(currentStep)) return;
    showStep(currentStep + 1);
  });
});

backButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showStep(currentStep - 1);
  });
});

telefone.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "").slice(0, 11);

  if (value.length > 10) {
    value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (value.length > 6) {
    value = value.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, "($1) $2-$3");
  } else if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d+)/, "($1) $2");
  } else if (value.length > 0) {
    value = value.replace(/^(\d+)/, "($1");
  }

  e.target.value = value;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateStep(4)) return;

  const dados = {
    nome: nome.value.trim(),
    email: email.value.trim(),
    telefone: telefone.value.trim(),
    tempo: tempo.value.trim()
  };

  try {
    const response = await fetch("https://zero7-ebook-backend.vercel.app/api/rd-conversion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dados)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Erro RD:", result);
      alert("Não foi possível enviar agora. Tente novamente.");
      return;
    }

    showStep(5);

    /*
    Quando tiver o PDF final, reativa isso:
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = "./assets/ebook.pdf";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }, 700);
    */
  } catch (error) {
    console.error("Erro de conexão:", error);
    alert("Erro de conexão. Tente novamente.");
  }
});