import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
// import { empresa } from "./graph";

// const CAL_API_KEY = process.env.CAL_API_KEY;
// const CAL_ZENTRUM_API_KEY = process.env.CAL_ZENTRUM_API_KEY;



export const model = new ChatOpenAI({
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY_WIN_2_WIN,
  temperature: 0,
});

interface Slot {
  time: string;
}

interface Slots {
  [fecha: string]: Slot[];
}

interface Data {
  slots: Slots;
}

// Herramienta para agendar una cita en cal
export const createbookingTool = tool(
  async ({ name, start, email }) => {
    const fechaOriginal = new Date(start);
    // Restar 3 horas (3 * 60 * 60 * 1000 milisegundos)
    const fechaAjustada = new Date(
      fechaOriginal.getTime() + 3 * 60 * 60 * 1000
    ).toISOString();
    
    // const fechaOriginalIso = fechaOriginal.toISOString();
    console.log("fecha original: " + fechaOriginal);
    console.log("fecha original en ISO: " + fechaOriginal.toISOString());
    
    console.log("fecha ajustada: " + fechaAjustada);

    try {
      const response = await fetch("https://api.cal.com/v2/bookings", {
        method: "POST",
        headers: {
          Authorization: `Bearer cal_live_c828d63ceb63f84f83184575271493e0`,
          "cal-api-version": "2024-08-13",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendee: {
            name: name,
            timeZone: "America/Santiago",
            language: "es",
            email: email,
          },
          eventTypeId: 1793238, // aca va empresa.eventTypeId
          start: fechaAjustada, // Asegúrate de que start es un string en formato "YYYY-MM-DDTHH:mm:ss.SSSZ"
        }),
      });

      const isBooking = await response.json();
      return isBooking;
    } catch (error) {
      throw new Error("Error al crear la reserva: " + error);
    }
  },
  {
    name: "createbookingTool",
    description: "Crea una reserva en Cal",
    schema: z.object({
      name: z.string().describe("Nombre del asistente"),
      start: z
        .string()
        .describe("Fecha y hora de la reserva en formato ISO 8601 "),
      email: z.string().describe("Email del asistente"),
    }),
  }
);

// Herramienta para obtener la disponibilidad del evento en CAL

export const getAvailabilityTool = tool(
  async ({ startTime, endTime }) => {
    console.log("startTime: " + startTime);
    console.log("endTime: " + endTime);

    try {
      const response = await fetch(
        `https://api.cal.com/v2/slots/available?startTime=${startTime}&endTime=${endTime}&eventTypeId=1793238`,// aca va empresa.eventTypeId
        {
          method: "GET",
          headers: {
            Authorization: "Bearer cal_live_c828d63ceb63f84f83184575271493e0",
          },
        }
      );

      const isAvailability = await response.json();
      console.log("isAvailability: ");
      console.dir(isAvailability, { depth: null });
      
      console.log("disponibilidad: ");
      const data: Data = isAvailability.data;
      console.dir(data, { depth: null });
      
      // Array para almacenar los horarios ajustados
      const horarios_disponibles: string[] = [];

      // Iterar sobre las fechas en 'slots'
      for (const fecha in data.slots) {
        // Iterar sobre los horarios de cada fecha
        data.slots[fecha].forEach((slot: Slot) => {
          // Crear un objeto Date a partir del string de tiempo
          const fechaOriginal = new Date(slot.time);
          // Restar 3 horas (3 * 60 * 60 * 1000 milisegundos)
          const fechaAjustada = new Date(
            fechaOriginal.getTime() - 3 * 60 * 60 * 1000
          );
          // Formatear la fecha ajustada a una cadena ISO y agregar al array
          horarios_disponibles.push(fechaAjustada.toISOString());
        });
      }
      console.log("horarios disponibles despues de parsear: ");
      
      console.log(horarios_disponibles);
      if(horarios_disponibles.length === 0) {
        return "No hay horarios disponibles para la fecha seleccionada";
      }else{
        return horarios_disponibles;

      }

    } catch (error) {
      throw new Error("Error al obtener la disponibilidad: " + error);
    }
  },
  {
    name: "getAvailabilityTool",
    description:
      "Obtiene la disponibilidad de un evento en Cal para un rango de fechas, un dia en este caso",
    schema: z.object({
      startTime: z
        .string()
        .describe(
          "Fecha y hora de inicio de la disponibilidad en formato ISO 8601,  Ejemplo: 2025-02-13T16:00:00.000Z"
        ),
      endTime: z
        .string()
        .describe(
          "Fecha y hora de fin de la disponibilidad en formato ISO 8601, (Ej: 2025-02-13T16:00:00.000Z)"
        ),
    }),
  }
);

// export const check_availability_by_professional_tool = tool(
//   async (horarios) => {
//     const prompt = `Hola`;

//     const listaHorarios = await model.invoke(prompt);
//     return listaHorarios.content;
//   },

//   {
//     name: "check_availability_by_professional_tool",
//     description: "Chequear disponibilidad por profesional",
//     schema: z.array(
//       z
//         .string()
//         .describe(
//           "horarios disponibles en la agenda para comparar con la disponibilidad del profesional"
//         )
//     ),
//   }
// );
