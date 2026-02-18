import { defineConfig } from "orval";

export default defineConfig({
  festibee: {
    input: {
      target: "./api-docs.fixed.json",
    },
    output: {
      mode: "tags-split",
      target: "./src/generated",
      schemas: "./src/generated/schemas",
      client: "react-query",
      httpClient: "fetch",
      baseUrl: false,
      override: {
        mutator: {
          path: "./src/lib/custom-fetch.ts",
          name: "customFetch",
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: false,
        },
      },
    },
  },
});
