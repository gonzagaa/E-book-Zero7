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

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const telefoneLimpo = String(telefone).replace(/\D/g, "");

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
        email: email.trim(),
        name: nome.trim(),
        mobile_phone: telefoneLimpo,
        cf_tempo_operando_day_trade: tempo
      }
    };

    const response = await fetch("https://api.rd.services/platform/events?event_type=conversion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "Authorization": `Bearer ${process.env.RD_ACCESS_TOKEN}`
      },
      body: JSON.stringify(rdBody)
    });

    const responseText = await response.text();

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
      parsed = { raw: responseText };
    }

    return res.status(200).json({
      success: true,
      rd: parsed
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno no servidor",
      details: error.message
    });
  }
}