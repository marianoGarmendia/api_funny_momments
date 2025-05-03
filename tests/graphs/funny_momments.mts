import {
  AIMessage,
  SystemMessage,
  ToolMessage,
  // type BaseMessageLike,
} from "@langchain/core/messages";
// import {
//   ActionRequest,
//   HumanInterrupt,
//   HumanInterruptConfig,
//   HumanResponse,
// } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  Annotation,
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  // interrupt,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
// import { ToolNode } from "@langchain/langgraph/prebuilt";
import { encode } from "gpt-3-encoder";
// import { last } from "lodash-es";
// import { createbookingTool, getAvailabilityTool } from "./booking-cal.mjs";

// import { ensureToolCallsHaveResponses } from "./ensure-tool-response.mjs";
// import { getUniversalFaq, noticias_y_tendencias } from "./firecrawl";

// process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
import * as dotenv from "dotenv";
dotenv.config();

const ENVIAR_WHATSAPP = tool(
  async ({ number_cel, consulta_cliente, nombre_cliente }) => {
    // const regex = /^54\d{10}$/;
    // const is_valid_number = regex.test(number_cel);
    if (number_cel.length < 10) {
      return "Por favor ingresá un número de teléfono válido de 10 dígitos. por ejemplo 2214xx xxxx"
    }
    console.log("enviando mensaje por whatsapp");
    
    const business_phone_number_id = "561091527089092";
    const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN as string;

    const templateFunny = {
      messaging_product: "whatsapp",
      to: "5491135620347",
      type: "template",
      template: {
        name: "consulta_cliente_v2",
        language: { "code": "en" },
        "components": [
          {
            "type": "body",
            "parameters": [
              { type: "text",  parameter_name: "nombre_cliente",  text: `${nombre_cliente}` },
              { type: "text",  parameter_name: "fecha_consulta",  text: `${new Date().toLocaleString()}` },
              { type: "text",  parameter_name: "consulta_cliente",  text: `${consulta_cliente}` },
              { type: "text",  parameter_name: "num_telefono",  text: `${number_cel}` },
              
            ]
          }
        ]
      }
    }

    const response = await responseMessage(
      business_phone_number_id,
      WEBHOOK_VERIFY_TOKEN,
      templateFunny,
    );
    if (!response) {
      return "Hubo un problema al enviar el mensaje por WhatsApp. Por favor, intentá nuevamente más tarde.";
    }
    console.log("Mensaje enviado por WhatsApp:", response);
    
    return "Pronto recibirás un mensaje por WhatsApp con la información que solicitaste. Gracias por elegir Funny moments";
  },

  {
    name: "ENVIAR_WHATSAPP",
    description:
      "Envía un mensaje por WhatsApp a FUNNY MOMENTS con el número de teléfono y el mensaje del cliente.",
    schema: z.object({
      nombre_cliente: z.string().describe("Nombre del cliente"),
      number_cel: z.string().describe("Número de teléfono del cliente"),
      consulta_cliente: z.string().describe("Consulta del cliente"),
    }),
  },
);

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

const tools = [ENVIAR_WHATSAPP];

const stateAnnotation = MessagesAnnotation;

const newState = Annotation.Root({
  ...stateAnnotation.spec,
  summary: Annotation<string>,
  interruptResponse: Annotation<string>,
});

// export const llmGroq = new ChatGroq({
//   model: "llama-3.3-70b-versatile",
//   apiKey: process.env.GROQ_API_KEY,
//   temperature: 0,
//   maxTokens: undefined,
//   maxRetries: 2,
//   // other params...
// }).bindTools(tools);

export const model = new ChatOpenAI({
  model: "gpt-4o",
  streaming: false,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
}).bindTools(tools);

// const toolNode = new ToolNode(tools);

async function callModel(state: typeof newState.State) {
  const { messages } = state;

  // console.log("sumary agent en callModel");
  // console.log("-----------------------");
  // console.log(summary);

  const systemsMessage = new SystemMessage(
    `
Eres **Funny Moments Assistant**, un asistente virtual amable y profesional especializado en alquiler de inflables y mobiliario para eventos infantiles. Tu objetivo principal es:

1. **Brindar información clara y completa** sobre nuestros servicios.
2. **Identificar la consulta del cliente** y guiarlo paso a paso hacia la reserva o la cotización.

Para lograrlo, **haz siempre una sola pregunta por vez** y espera la respuesta antes de continuar.

---

**Conocimiento base**:

- Especialistas en alquiler de inflables y mobiliario para eventos infantiles.
- Nos encargamos del envío, armado y retiro de todo el equipamiento.
- El alquiler incluye 3 horas de uso, envío gratuito, instalación rápida y limpieza garantizada.
- Reserva con un anticipo del 50 % (transferencia o depósito); el 50 % restante se abona el día del evento. La seña no es reembolsable, pero es transferible.
- Si el evento es al aire libre y llueve, suspendemos el servicio y reprogramamos sin costo adicional (la turbina no puede mojarse). En interiores no hay problema.
- Catálogo con medidas, rango de edad recomendado (3–7 años) y requisitos de espacio y electricidad.

---

**Flujo de conversación**:

1. **Saludo inicial**:
   > "¡Hola! Gracias por comunicarte con Funny Moments. Somos especialistas en inflables y mobiliario para eventos infantiles. ¿Cómo podemos ayudarte hoy?"

2 - **ACCION QUE DEBES TOMAR**:
- Obtener el nombre del cleinte y preguntale:
- El motivo de la consulta.
- Pregunta de a una cosa a la vez y espera la respuesta del cliente antes de continuar.
- Una vez que tengas suficiente información como tipo de servicio que quiere, una fecha estimada o concreta, zona o direccion, y horario, entonces le dices que se van a comunicar con él o ella y le pides el número de teléfono para enviarle la información por whatsapp.
   

  


6. **Confirmación de pago**:
   - "El anticipo es del 50 % mediante transferencia o depósito; el saldo restante se abona el día del evento. ¿Te parece bien?"

7. **Cierre**:
   - Una vez aclaradas las dudas, confirmar el próximo paso (envío de catálogo más información personalizada según lo que preguntó).

---

### REGLAS DE CONVERSACIÓN:
- La idea es que le brindes información , no que intenes venderle algo.
- No uses frases como "¿En qué más puedo ayudarte?" o "¿Necesitas algo más?".
- Si el cliente pide información o presupuesto pidele el número de teléfono para enviarle la información por whatsapp.
- no hables de otros temas que no sean alquiler de inflables y mobiliario para eventos infantiles.
- Brinda información clara y precisa, evitando tecnicismos innecesarios.
- No agradezcas en cada mensaje ni uses frases como "¿En qué más puedo ayudarte?".
- Cuando el usuario haya despejado sus dudas o consultas preguntale si quiere que se contacten con él o ella para ofrecerle una cotización personalizada.
- Si responde que si entonces preguntale si quiere dejar su número de teléfono para que se contacten via whatsapp.
- Si responde que no, entonces preguntale si quiere que le envien un mail con la cotización personalizada.
- Según lo que responda utiliza una de las dos herramientas designadas para esto

**Estilo y tono**:

- Cercano, cordial y profesional.
- Lenguaje claro y sencillo, sin tecnicismos.
- Pregunta de a una cosa a la vez.
- No uses frases genéricas de cierre repetitivas.

### HERRAMIENTA DISPONIBLE:

- **ENVIAR_WHATSAPP**: Envía un mensaje por WhatsApp a FUNNY MOMENTS con el número de teléfono y el mensaje con la consulta  del cliente.
la consulta del cliente contiene la fecha, horario y dirección del evento y observaciones que deduzcas de la conversación.



### ℹ️ Información adicional

- Hoy es **${new Date().toLocaleDateString()}** y la hora actual es **${new Date().toLocaleTimeString()}**.

  
 `,
  );

  const response = await model.invoke([systemsMessage, ...messages]);

  // console.log("response: ", response);

  const cadenaJSON = JSON.stringify(messages);
  // Tokeniza la cadena y cuenta los tokens
  const tokens = encode(cadenaJSON);
  const numeroDeTokens = tokens.length;
  console.log("Tokens: ", numeroDeTokens);

  // console.dir( state.messages[state.messages.length - 1], {depth: null});

  // console.log(`Número de tokens: ${numeroDeTokens}`);

  return { messages: [...messages, response] };

  // console.log(messages, response);

  // We return a list, because this will get added to the existing list
}

function shouldContinue(state: typeof newState.State) {
  const { messages } = state;

  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage?.tool_calls?.length) {
    return "tools";
  } else {
    return END;
  }

  // Otherwise, we stop (reply to the user)
}

// const humanNode = (lastMessage: any) => {
//   const toolArgs = lastMessage.tool_calls[0].args as {
//     habitaciones: string | null;
//     precio_aproximado: string;
//     zona: string;
//     superficie_total: string | null;
//     piscina: "si" | "no" | null;
//     tipo_operacion: "venta" | "alquiler";
//   };

//   const {
//     habitaciones,
//     precio_aproximado,
//     zona,
//     piscina,
//     superficie_total,
//     tipo_operacion,
//   } = toolArgs;

//   // Define the interrupt request
//   const actionRequest: ActionRequest = {
//     action: "Confirma la búsqueda",
//     args: toolArgs,
//   };

//   const description = `Por favor, confirma la búsqueda de propiedades con los siguientes parámetros: ${JSON.stringify(
//     {
//       habitaciones,
//       precio_aproximado,
//       zona,
//       piscina,
//       superficie_total,
//       tipo_operacion,
//     },
//   )}`;

//   const interruptConfig: HumanInterruptConfig = {
//     allow_ignore: false, // Allow the user to `ignore` the interrupt
//     allow_respond: false, // Allow the user to `respond` to the interrupt
//     allow_edit: true, // Allow the user to `edit` the interrupt's args
//     allow_accept: true, // Allow the user to `accept` the interrupt's args
//   };

//   const request: HumanInterrupt = {
//     action_request: actionRequest,
//     config: interruptConfig,
//     description,
//   };

//   const humanResponse = interrupt<HumanInterrupt[], HumanResponse[]>([
//     request,
//   ])[0];
//   console.log("request: ", request);

//   console.log("humanResponse: ", humanResponse);

//   if (humanResponse.type === "response") {
//     const message = `User responded with: ${humanResponse.args}`;
//     return { interruptResponse: message, humanResponse: humanResponse.args };
//   } else if (humanResponse.type === "accept") {
//     const message = `User accepted with: ${JSON.stringify(humanResponse.args)}`;
//     return { interruptResponse: message, humanResponse: humanResponse };
//   } else if (humanResponse.type === "edit") {
//     const message = `User edited with: ${JSON.stringify(humanResponse.args)}`;
//     return { interruptResponse: message, humanResponse: humanResponse.args };
//   } else if (humanResponse.type === "ignore") {
//     const message = "User ignored interrupt.";
//     return { interruptResponse: message, humanResponse: humanResponse };
//   }

//   return {
//     interruptResponse:
//       "Unknown interrupt response type: " + JSON.stringify(humanResponse),
//   };
// };

// interface pisosToolArgs {
//   habitaciones: string | null;
//   precio_aproximado: string;
//   zona: string;
//   superficie_total: string | null;
//   piscina: "si" | "no" | null;
//   tipo_operacion: "venta" | "alquiler";
// }

const toolNodo = async (state: typeof newState.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls && lastMessage.tool_calls?.length > 0) {
    const toolArgs = lastMessage?.tool_calls[0].args as {
      nombre_cliente: string;
      number_cel: string;
      consulta_cliente: string;
    };
    const toolCallId = lastMessage?.tool_calls[0].id as string;
    const toolName = lastMessage?.tool_calls[0].name as string;
    if (toolName === "ENVIAR_WHATSAPP") {
      const { nombre_cliente, number_cel, consulta_cliente } = toolArgs;
      const response = await ENVIAR_WHATSAPP.invoke({
        nombre_cliente,
        number_cel,
        consulta_cliente,
      });
      const toolMessage = new ToolMessage(response, toolCallId, toolName);
      return { messages: [...messages, toolMessage] };
    }
  }
};
// const delete_messages = async (state: typeof newState.State) => {
//   const { messages, summary } = state;
//   console.log("delete_messages");
//   console.log("-----------------------");

//   console.log(messages);

//   let summary_text = "";

//   let messages_parsed: any[] = [];
//   messages_parsed = messages.map((message) => {
//     if (message instanceof AIMessage) {
//       return {
//         ...messages_parsed,
//         role: "assistant",
//         content: message.content,
//       };
//     }
//     if (message instanceof HumanMessage) {
//       return { ...messages_parsed, role: "Human", content: message.content };
//     }
//   });

//   // 1. Filtrar elementos undefined
//   const filteredMessages = messages_parsed.filter(
//     (message) => message !== undefined
//   );

//   // 2. Formatear cada objeto
//   const formattedMessages = filteredMessages.map(
//     (message) => `${message.role}: ${message.content}`
//   );

//   // 3. Unir las cadenas con un salto de línea
//   const prompt_to_messages = formattedMessages.join("\n");

//   if (messages.length > 3) {
//     if (!summary) {
//       const intructions_summary = `Como asistente de inteligencia artificial, tu tarea es resumir los siguientes mensajes para mantener el contexto de la conversación. Por favor, analiza cada mensaje y elabora un resumen conciso que capture la esencia de la información proporcionada, asegurándote de preservar el flujo y coherencia del diálogo
//         mensajes: ${prompt_to_messages}
//         `;

//       const summary_message = await model.invoke(intructions_summary);
//       summary_text = summary_message.content as string;
//     } else {
//       const instructions_with_summary = `"Como asistente de inteligencia artificial, tu tarea es resumir los siguientes mensajes para mantener el contexto de la conversación y además tener en cuenta el resumen previo de dicha conversación. Por favor, analiza cada mensaje y el resumen y elabora un nuevo resumen conciso que capture la esencia de la información proporcionada, asegurándote de preservar el flujo y coherencia del diálogo.

//       mensajes: ${prompt_to_messages}

//       resumen previo: ${summary}

//       `;

//       const summary_message = await model.invoke(instructions_with_summary);

//       summary_text = summary_message.content as string;
//     }

//     const mssageReduced = messages.slice(0, -3).map((message) => {
//       return new RemoveMessage({ id: message.id as string });
//     });

//     const messagesChecked = ensureToolCallsHaveResponses(mssageReduced);

//     return {
//       messages: [...messagesChecked],
//       summary: summary_text,
//     };
//   }
//   return { messages };
// };

const graph = new StateGraph(newState);

graph
  .addNode("agent", callModel)
  .addNode("tools", toolNodo)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

const checkpointer = new MemorySaver();

export const workflow = graph.compile({ checkpointer });
// let config = { configurable: { thread_id: "123" } };

// const response = await workflow.invoke({messages:"dame las noticias ams relevantes de este 2025"}, config)

// console.log("response: ", response);

// const response =  workflow.streamEvents({messages: [new HumanMessage("Hola como estas? ")]}, {configurable: {thread_id: "1563"} , version: "v2" });
// console.log("-----------------------");
// console.log("response: ", response);

// await workflow.stream({messages: [new HumanMessage("Podes consultar mi cobertura?")]}, {configurable: {thread_id: "1563"} , streamMode: "messages" });

// console.log("-----------------------");

// await workflow.stream({messages: [new HumanMessage("Mi dni es 32999482, tipo dni")]}, {configurable: {thread_id: "1563"} , streamMode: "messages" });

// for await (const message of response) {

//   // console.log(message);
//   // console.log(message.content);
//   // console.log(message.tool_calls);

//   console.dir({
//     event: message.event,
//     messages: message.data,

//   },{
//     depth: 3,
//   });
// }

// for await (const message of response) {
//   // console.log(message);

//   console.dir(message, {depth: null});
// }

// await workflow.stream(new Command({resume: true}));

// Implementacion langgraph studio sin checkpointer
// export const workflow = graph.compile();

// MODIFICAR EL TEMA DE HORARIOS
// En el calendar de cal esta configurado el horario de bs.as.
// El agente detecta 3hs mas tarde de lo que es en realidad es.
// Ejemplo: si el agente detecta 16hs, en realidad es 13hs.
// Para solucionar este problema, se debe modificar el horario de la herramienta "create_booking_tool".
// En la herramienta "create_booking_tool" se debe modificar el horario de la variable "start".
// En la variable "start" se debe modificar la hora de la reserva.
