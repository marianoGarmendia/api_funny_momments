import { tool } from "@langchain/core/tools";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { z } from "zod";
import { buildFilter } from "./helpers.mjs";
import { embeddingModel } from "./models.mjs";
import { buildQueryFilterModel, buildQuerySchema } from "./schemas.mjs";
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

dotenv.config();

const INDEX_NAME = "products";
const index = pinecone.Index(INDEX_NAME);

const findProducts = async (prompt: string, props: string[]) => {
  const querySchema = buildQuerySchema(props);
  const queryFilterModel = buildQueryFilterModel(querySchema);
  const rawQueryFilter = await queryFilterModel.invoke(prompt);
  console.log("rawQueryFilter", rawQueryFilter);
  
  const filter = buildFilter(rawQueryFilter);
  const embeddedPrompt = await embeddingModel.embedQuery(prompt);
  const result = await index.query({
    vector: embeddedPrompt,
    topK: 5,
    includeMetadata: true,
    filter,
  });

  return result.matches;
};

const BASE_URL = "https://propiedades.winwintechbank.com/#/producto";
const buildUrl = (id: string | number) => `${BASE_URL}/${id}`;

export const productsFinder = tool(
  async ({ prompt, props }) => {
    try {
      const rawProducts = await findProducts(prompt, props);
      const products = rawProducts.map((product) => ({
        ...product.metadata,
        id: product.id,
        url: buildUrl(product.id),
      }));

      return JSON.stringify(products);
    } catch (error) {
      return "Ocurrió un error interno al procesar la búsqueda de productos.";
    }
  },
  {
    name: "products_finder",
    description: "Obtiene una lista de productos disponibles en el sistema",
    schema: z.object({
      prompt: z
        .string()
        .describe("Consulta del usuario sobre el producto buscado"),
      props: z
        .array(z.string())
        .describe("Atributos del producto que se pueden filtrar"),
    }),
  },
);
