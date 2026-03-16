export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { nome, email, telefone, tempo } = req.body || {};

    if (!nome || !email || !telefone || !tempo) {
      return res.status(400).json({
        error: "Dados obrigatórios ausentes"
      });
    }

    const nomeLimpo = String(nome).trim();
    const emailLimpo = String(email).trim().toLowerCase();
    const telefoneLimpo = String(telefone).replace(/\D/g, "");
    const tempoLimpo = String(tempo).trim();

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo);

    if (!emailValido) {
      return res.status(400).json({ error: "E-mail inválido" });
    }

    if (telefoneLimpo.length < 10) {
      return res.status(400).json({ error: "Telefone inválido" });
    }

    const rdBody = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: process.env.RD_CONVERSION_IDENTIFIER,
        email: emailLimpo,
        name: nomeLimpo,
        mobile_phone: telefoneLimpo,
        cf_tempo_operando_day_trade: tempoLimpo
      }
    };

    console.log("Payload enviado ao RD:", rdBody);

    const response = await fetch("https://api.rd.services/platform/conversions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "x-api-key": process.env.RD_API_KEY
      },
      body: JSON.stringify(rdBody)
    });

    const responseText = await response.text();

    console.log("Status RD:", response.status);
    console.log("StatusText RD:", response.statusText);
    console.log("Resposta bruta RD:", responseText);

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erro ao enviar lead para o RD Station",
        rd_status: response.status,
        rd_status_text: response.statusText,
        details: responseText || "Resposta vazia do RD"
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { raw: responseText || "Resposta sem JSON" };
    }

    return res.status(200).json({
      success: true,
      message: "Lead enviado ao RD Station com sucesso",
      rd: parsed
    });
  } catch (error) {
    console.error("Erro interno:", error);

    return res.status(500).json({
      error: "Erro interno no servidor",
      details: error.message
    });
  }
}