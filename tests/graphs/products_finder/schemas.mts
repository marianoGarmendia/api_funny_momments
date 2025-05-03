import { fromPairs } from "lodash-es";
import z, { ZodSchema } from "zod";
import { chatModel } from "./models.mjs";

export const INMUEBLE_PROPS = [
  "banios",
  "dormitorios",
  "m2constr",
  "m2terraza",
  "m2utiles",
  "nascensor",
  "num_terrazas",
  "piscina",
  "precio",
];
const OPERATORS = ["$eq", "$gt", "$lt", "$gte", "$lte"] as const;

export const ConditionSchema = z.object({
  operator: z.enum(OPERATORS),
  value: z.number().nullable(),
});

/**
 * Genera un esquema de zod dinamicamente para validar un filtro de consulta.
 * @param props: string[] - Propiedades que se pueden filtrar.
 * @returns
 */
export const buildQuerySchema = (props: string[]) =>
  z
    .object(
      fromPairs(
        props.map((prop) => [prop, z.array(ConditionSchema).nullable()]),
      ),
    )
    .partial();

/**
 * Genera un filtro de consulta a partir de un objeto de consulta.
 * @param querySchema - Esquema de zod que define las propiedades y condiciones de la consulta.
 * @returns
 */
export const buildQueryFilterModel = (querySchema: ZodSchema) => 
    chatModel.withStructuredOutput(querySchema, {
    strict: false,
  });

  


