import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import fs from 'fs/promises';

// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from "@langchain/openai";

// import { ToolMessage } from "@langchain/core/messages";

// import {
//   ActionRequest,
//   HumanInterruptConfig,
//   HumanInterrupt,
//   HumanResponse,
// } from "@langchain/langgraph/prebuilt";
// import { interrupt } from "@langchain/langgraph";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
import dotenv from "dotenv";
dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // import { join } from 'path';

// const rutaArchivo = path.join(__dirname, "Presentacion_UA_2025.pdf");

// const loader = new PDFLoader(rutaArchivo);

// const docs = await loader.load();

// const embeddings = new OpenAIEmbeddings({
//   model: "text-embedding-3-small",

//   apiKey: process.env.OPENAI_API_KEY,
// });

// const llmGroq = new ChatGroq({
//   model: "llama-3.3-70b-versatile",
//   apiKey: process.env.GROQ_API_KEY,
//   temperature: 0,
//   maxTokens: undefined,
//   maxRetries: 2,
//   // other params...
// });

const model = new ChatOpenAI({
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
});

export const pdfTool = tool(
  async ({ query }) => {
    // const vectorStore = new MemoryVectorStore(embeddings);
    // await vectorStore.addDocuments(docs);

    // const retriever = vectorStore.asRetriever({
    //   k: 5,
    // });
    // const docsFound = await retriever.invoke(query);
    // console.dir(docsFound, { depth: null });

    // const content = docsFound.map((doc) => doc.pageContent);
    // const texto = content.join(" ");
    // return texto;
  },
  {
    name: "universal_info_2025",
    description:
      "Obtiene informacion de Universal Assistance actualizada de 2025",
    schema: z.object({
      query: z
        .string()
        .describe(
          "Consulta a realizar sobre el contenido del documento que contiene la informacion de Universal Assistance 2025"
        ),
    }),
  }
);

// const tavilySearch = new TavilySearchResults({
//   apiKey: process.env.TAVILY_API_KEY,
// });

// Herramienta de simulacion de Cotizacion de viajes

export const cotizacion = tool(
  async ({ destino, fecha, pasajeros }) => {
    const prompt = `
    

    - Simula una cotizacion de asistencia de viaje de Universl assistance para ${pasajeros} pasajeros en la fecha ${fecha} con destino a ${destino}
    - La respuesta debe ser una simulacion de cotizacion de asistencia de viaje
    ejemplo: 
    "Cotizacion de asistencia de viaje para ${pasajeros} pasajeros en la fecha ${fecha} con destino a ${destino}..."

    ### NO BRINDES NINGUN ENLACE EN LA RESPUESTA NI INFORMACION DE OTRA EMPRESA QUE NO SEA UNIVERSAL ASSISTANCE

    
  `;
    const response = await model.invoke(prompt);
    return response.content;
  },
  {
    name: "cotizacion_de_asistencia_de_viaje",
    description: "Simula una cotizacion de asistencia",
    schema: z.object({
      destino: z.string().describe("Destino del viaje"),
      fecha: z.string().describe("Fecha de inicio del viaje"),
      pasajeros: z.number().describe("Cantidad de pasajeros"),
    }),
  }
);

// Herramienta que simula sobre la cobertura vigente del usuario que consulta

export const mi_cobertura = tool(
  async ({ tipo_de_documento, documento }, runContext) => {
    // Accede al tool_call_id desde runContext

    const response = `
    esta es una respuesta simulada sobre una cobertura de un usuario.
    consulta la cobertura vigente para el documento ${tipo_de_documento} ${documento}

    respuesta: 
    ✅ Listo, he encontrado tu cobertura. Según los datos ingresados, actualmente cuentas con el Plan Excellence.

🔹 Detalles de tu cobertura:

Asistencia médica internacional hasta USD 150,000.
Cobertura por COVID-19 incluida.
Reintegro por medicamentos ambulatorios en caso de enfermedad o accidente.
Asistencia en caso de preexistencias hasta un límite específico.
Cobertura en deportes recreativos, por si practicas actividades al aire libre.
Acceso a teleasistencia médica 24/7 para consultas rápidas.
Servicio VIP Delay, que te ofrece acceso a salas VIP en caso de retraso en tu vuelo.
📌 Información adicional:
Tu cobertura está activa desde el 10 de marzo de 2025 y tiene vigencia hasta el 10 de abril de 2025.

Si necesitas más información sobre algún beneficio en particular o deseas realizar cambios en tu cobertura, dime cómo puedo ayudarte. 😊








  `;

    return response;
  },
  {
    name: "mi_cobertura",
    description: "Consulta sobre la cobertura vigente del usuario",
    schema: z
      .object({
        documento: z.string().describe("Documento del usuario"),
        tipo_de_documento: z.string().describe("Tipo de documento del usuario"),
      })
      .describe("Consulta sobre la cobertura vigente del usuario"),
  }
);

const url =
  "https://propiedades_test.techbank.ai:4002/public/productos?limit=100";

// const getPisos = tool(
//   async ({
//     habitaciones,
//     precio_aproximado,
//     zona,
//     piscina,
//     superficie_total,
//   }) => {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`Error: ${response.statusText}`);
//     }
//     let pisos_found: any[] = [];
//     const pisos = await response.json();
//     pisos.forEach((piso:any) => {
//       const props = piso.PRODUCT_PROPS;
//       pisos_found.push(props);
//     });

//     const cadenaJson = JSON.stringify(pisos_found);
//     const prompt2 = `Segun los siguientes parametros: ${habitaciones} habitaciones, - $${precio_aproximado} precio aproximado, zona:  ${zona} , piscina: ${piscina} , ${superficie_total} superficie total, dame una lista de propiedades disponibles en el sistema.
//         Estos son todos los pisos encontrados:
        
//         ${cadenaJson}
        
//         ### INSTRUCCIONES DE RESPUESTA:
//         - Si no encontras una propiedad que cumpla con los 5 los requisitos, sugiere una propiedad que cumpla con 4 requisitos
//         - Si no encontras una propiedad que cumpla con 4 requisitos, sugiere una propiedad que cumpla con 3 requisitos
//         - Si no encontras una propiedad que cumpla con 3 requisitos, sugiere una propiedad que cumpla con 2 requisitos
//         - Si no encontras una propiedad que cumpla con 2 requisitos, sugiere una propiedad que cumpla con 1 requisito
//         - Si no encontras una propiedad que cumpla con 1 requisito, dile que por el momento no hay propiedades disponibles segun sus requisitos

//         - El precio de la propiedad no puede estar alejado del precio aproximado que el usuario ha solicitado ( unos 10% de diferencia maximo)
//         - la superficie total no puede estar alejada de la superficie total que el usuario ha solicitado ( unos 10% de diferencia maximo)
//         - la cantidad de habitaciones no puede estar alejada de la cantidad de habitaciones que el usuario ha solicitado ( unos 10% de diferencia maximo)
//         - la zona no puede estar alejada de la zona que el usuario ha solicitado ( unos 10 km maximo)

//         Evalua los requisitos y responde con la propiedad mas acorde a los requisitos que el usuario ha solicitado, si no hay propiedades disponibles, responde que no hay propiedades disponibles segun sus requisitos.
        

//         `;

//     const res = await model.invoke(prompt2);

//     console.log("res: ", res.content);

//     return res.content;
//   },
//   {
//     name: "Obtener_pisos_en_venta",
//     description: "Obtiene una lista de propiedades disponibles en el sistema",
//     schema: z.object({
//       habitaciones: z
//         .string()
//         .describe("Numero de habitaciones de la propiedad"),
//       precio_aproximado: z
//         .string()
//         .describe("Precio aproximado de la propiedad"),
//       zona: z.string().describe("Zona de la propiedad"),
//       superficie_total: z
//         .string()
//         .describe("Superficie total de la propiedad que busca"),
//       piscina: z
//         .string()
//         .describe("Si busca piscina o no, la palabra de ser si o no"),
//     }),
//   }
// );



export const getPisos2 = tool(
  async ({
    habitaciones,
    precio_aproximado,
    zona,
    piscina,
    superficie_total,
    tipo_operacion,
  }) => {

  
    console.log("Obteniendo pisos...");
    console.log(habitaciones, precio_aproximado, zona, piscina, superficie_total);
    
    

    try {
      // Validación de zona
      if (!zona || zona.trim().length < 2) {
        return "Por favor, proporciona una zona válida con al menos 2 caracteres.";
      }

      // Validación precio
      const precioInput = Number(precio_aproximado);
      if (isNaN(precioInput)) {
        return "El precio aproximado debe ser un número válido.";
      }
      const precioMin = precioInput * 0.9;
      const precioMax = precioInput * 1.1;

      // Validación de superficie
      const superficieInput = superficie_total
        ? Number(superficie_total)
        : null;
      const superficieMin = superficieInput ? superficieInput * 0.7 : null;
      const superficieMax = superficieInput ? superficieInput * 1.2 : null;
     
        
      
      const response = await fetch(url);
      if (!response.ok) {
        return "Hubo un error al consultar las propiedades. Por favor, intenta nuevamente.";
      }

      const pisos = await response.json();

      
      await fs.writeFile('pisos.json', JSON.stringify(pisos, null, 2), 'utf-8');


      const pisos_filtrables = pisos
        .map((p:any) => p.PRODUCT_PROPS)
        .filter((p:any) => {
          const estado_ok = p.estado?.toLowerCase() !== "no disponible";
          const operacion_ok =
            p.tipo_operacion?.toLowerCase() === tipo_operacion.toLowerCase();
          return estado_ok && operacion_ok;
        });

      const pisosPuntuados = pisos_filtrables.map((piso:any) => {
        let score = 0;

        // Habitaciones
        if (!habitaciones) {
          score++;
        } else {
          const pedidas = Number(habitaciones.trim());
          const disponibles = Number(piso.dormitorios?.trim());
          if (disponibles === pedidas || disponibles === pedidas + 1) score++;
        }

        // Zona
        const zonaInput = zona.toLowerCase().trim();
        const ubicaciones = [piso.zona, piso.ciudad, piso.provincia, piso.pais];
        if (ubicaciones.some((u) => u?.toLowerCase().includes(zonaInput)))
          score++;

        // Piscina
        if (!piscina) {
          score++;
        } else if (piscina === "si" ? piso.piscina === "1" : true) {
          score++;
        }

        // Precio
        let precio = 0;
        try {
          const precioStr = piso.precio?.toString().replace(/\s/g, "") || "";
          precio = Number(precioStr);
        } catch {}
        if (precio >= precioMin && precio <= precioMax) score++;

        // Superficie
        const sup = piso.m2constr ? Number(piso.m2constr.toString().trim()) : 0;
        if (
          !superficie_total ||
          (sup >= superficieMin! && sup <= superficieMax!)
        ) {
          score++;
        }

        return { piso, score };
      });

      for (let minScore = 5; minScore >= 2; minScore--) {
        const matches = pisosPuntuados
          .filter(({ score }:{score:any}) => score === minScore)
          .map(({ piso }:{piso:any}) => piso);

        if (matches.length > 0) {
          return matches
            .map((p:any) => {
              return `
            Ciudad: ${p.ciudad || "Sin dato"}
            Ubicación: ${p.ubicacion || p.zona || "Sin dato"}
            Dormitorios: ${p.dormitorios || "Sin dato"}
            Baños: ${p.banios || "Sin dato"}
            Metros construidos: ${p.m2constr?.trim() || "Sin dato"} m²
            Antigüedad: ${p.antiguedad || "Sin dato"}
            Precio: ${p.precio ? `${p.precio} €` : "Sin dato"}
            Descripción: ${p.descripcion?.slice(0, 200).trim() || "Sin descripción"}...
            Características: ${
                Array.isArray(p.caracteristicas)
                  ? p.caracteristicas.join(", ")
                  : "Sin dato"
              }
              `.trim();
            })
            .join("\n\n---------------------\n\n");
        }
      }

      return "Lamentablemente no hay propiedades que cumplan con los requisitos que busca.";
    } catch (error) {
      console.error("Error en getPisos2:", error);
      return "Ocurrió un error interno al procesar la búsqueda de propiedades.";
    }
  },
  {
    name: "Obtener_pisos_en_venta_dos",
    description: "Obtiene una lista de propiedades disponibles en el sistema",
    schema: z.object({
      habitaciones: z
        .string()
        .regex(/^\d+$/, "Debe ser un número entero en formato texto")
        .nullable()
        .describe("Número exacto de habitaciones que desea la persona"),

      precio_aproximado: z
        .string()
        .regex(
          /^\d+$/,
          "Debe ser un número aproximado sin símbolos ni decimales"
        )
        .describe("Precio aproximado de la propiedad en euros (ej: '550000')"),

      zona: z
        .string()
        .min(2, "La zona debe tener al menos 2 caracteres")
        .describe("Zona o localidad donde desea buscar la propiedad"),

      superficie_total: z
        .string()
        .regex(/^\d+$/, "Debe ser un número aproximado en m2")
        .nullable()
        .describe("Superficie total del terreno de la propiedad en m²"),

      piscina: z
        .enum(["si", "no"])
        .nullable()
        .describe("Indica si desea piscina: 'si' o 'no'"),

      tipo_operacion: z
        .enum(["venta", "alquiler"])
        .describe("Indica si busca una propiedad en 'venta' o en 'alquiler'"),
    }),
  }
);
