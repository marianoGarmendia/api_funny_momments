import { fromPairs, toPairs } from "lodash-es";
import z from "zod";
import { ConditionSchema } from "./schemas.mjs";

/**
 * Genera un filtro de consulta en el formato esperado por Pinecone a partir de un objeto de consulta.
 * @param rawQuery - Objeto de consulta que contiene las propiedades y condiciones de la consulta.
 * @returns
 */
export const buildFilter = <T extends Record<string, any>>(rawQuery: T) => {
  const queryPairs = toPairs(rawQuery) 
    .filter(([key, value]) => value !== null)
    .map(([key, conditions]) => {
      const value = fromPairs(
        (conditions as z.infer<typeof ConditionSchema>[]).map(
          ({ operator, value }) => [operator, value],
        ),
      );
      return [key, value];
    });

  return fromPairs(queryPairs); 
};
