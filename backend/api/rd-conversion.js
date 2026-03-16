export default async function handler(req, res) {
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
    console.log("=== INICIO REQUISICAO ===");
    console.log("BODY RECEBIDO:", req.body);

    const { nome, email, telefone, tempo } = req.body || {};

    if (!nome || !email || !telefone || !tempo) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        recebidos: { nome, email, telefone, tempo }
      });
    }

    const emailLimpo = String(email).trim().toLowerCase();
    const telefoneLimpo = String(telefone).replace(/\D/g, "");
    const nomeLimpo = String(nome).trim();
    const tempoLimpo = String(tempo).trim();

    const payloadRD = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: "LP - E-book Day Trade",
        email: emailLimpo,
        name: nomeLimpo,
        personal_phone: telefoneLimpo,
        cf_tempo_operando_day_trade: tempoLimpo
      }
    };

    console.log("PAYLOAD ENVIADO AO RD:", JSON.stringify(payloadRD, null, 2));
    console.log("TOKEN EXISTE?", Boolean(process.env.RD_STATION_API_KEY));

    const rdResponse = await fetch("https://api.rd.services/platform/conversions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RD_STATION_API_KEY}`
      },
      body: JSON.stringify(payloadRD)
    });

    const responseText = await rdResponse.text();

    console.log("STATUS RD:", rdResponse.status);
    console.log("RESPOSTA BRUTA RD:", responseText);

    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }

    if (!rdResponse.ok) {
      return res.status(rdResponse.status).json({
        error: "Erro ao enviar conversão para o RD Station",
        rd_status: rdResponse.status,
        rd_response: responseJson
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversão enviada com sucesso",
      rd_status: rdResponse.status,
      rd_response: responseJson
    });
  } catch (error) {
    console.error("ERRO INTERNO BACKEND:", error);

    return res.status(500).json({
      error: "Erro interno no servidor",
      details: error.message
    });
  }
}