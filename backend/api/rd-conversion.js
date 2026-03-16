export default async function handler(req, res) {
  // CORS para o frontend hospedado em outro lugar
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { nome, email, telefone, tempo } = req.body || {};

    if (!nome || !email || !telefone || !tempo) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes"
      });
    }

    const emailLimpo = String(email).trim().toLowerCase();
    const telefoneLimpo = String(telefone).replace(/\D/g, "");

    const rdResponse = await fetch("https://api.rd.services/platform/conversions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RD_STATION_API_KEY}`
      },
      body: JSON.stringify({
        event_type: "CONVERSION",
        event_family: "CDP",
        payload: {
          conversion_identifier: "LP - E-book Day Trade",
          email: emailLimpo,
          name: String(nome).trim(),
          personal_phone: telefoneLimpo,
          cf_tempo_operando_day_trade: String(tempo).trim()
        }
      })
    });

    const data = await rdResponse.json().catch(() => ({}));

    if (!rdResponse.ok) {
      return res.status(rdResponse.status).json({
        error: "Erro ao enviar conversão para o RD Station",
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversão enviada com sucesso",
      data
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno no servidor",
      details: error.message
    });
  }
}