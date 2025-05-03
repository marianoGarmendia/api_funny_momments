export const responseMessage = async (
    business_phone_number_id: string,
    WEBHOOK_VERIFY_TOKEN: string,
    template: object,
  ) => {
    // Send a reply message
    try {
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${business_phone_number_id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WEBHOOK_VERIFY_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(template),
        },
      );
  
      const result = await response.json();
  
      console.log("Message sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const consulta = `esto es una consulta`;

  export const messageExampleTemplate = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "542214371684", // Número de teléfono del destinatario en formato internacional
    type: "template",
  
    // Nombre de la plantilla aprobada
    template: {
      namespace: "1ccd7b5a_58fd_4886_8baa_09eef28c2b8c",
      name: "confirm_event", // Nombre de la plantilla aprobada
      language: {
        code: "es", // Código de idioma y localización, por ejemplo, "es_ES" para español de España
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "nombre", text: "Mariano" }, // Valor para {{1}}
            {
              type: "text",
              parameter_name: "evento",
              text: `Consulta de prueba: ${consulta}`,
            }, // Valor para {{2}}
          ],
        },
      ],
    },
  };

  const templateFunny = {
    messaging_product: "whatsapp",
    to: "5492214371684",
    type: "template",
    template: {
      name: "consulta_cliente_v2",
      language: { "code": "en" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { type: "text",  parameter_name: "nombre_cliente",  text: "María" },
            { type: "text",  parameter_name: "fecha_consulta",  text: "26-010-2025" },
            { type: "text",  parameter_name: "consulta_cliente",  text: "Una consulta random" },
            { type: "text",  parameter_name: "num_telefono",  text: "22145454545" },
            
          ]
        }
      ]
    }
  }

 const response =  await responseMessage("561091527089092","EAAM3fbZBVwdIBO9U6FQBSEmZCxvZAkbzQeOCfobBpJB1zkj5ICPGeZApDZCZBcKqPM6CwBfRCtPpes25NNkqQ6y4GZCMUsZBps0ZCPBlG3jG77cwdQiXBqLI5YPRtxGZBdQfy6ZANZBIuJA40Duq0omzajDmZAcZAL890pCNOfMgOKnxy1VTBCMZBtMBXMw7zZAdQ0esZAumprQZDZD", templateFunny)

 console.log(response)
;
 