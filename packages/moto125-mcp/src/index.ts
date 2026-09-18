#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPrompts } from "./prompts.js";
import { registerResources } from "./resources.js";
import { registerArticleTools } from "./tools/articles.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerContentHealthTools } from "./tools/contentHealth.js";
import { registerConfigAndPageTools } from "./tools/pages.js";
import { registerMediaTools } from "./tools/media.js";
import { registerMotoTools } from "./tools/motos.js";
import { registerTaxonomyTools } from "./tools/taxonomies.js";

const PACKAGE_VERSION = "0.2.2";

function createServer(): McpServer {
  const server = new McpServer({
    name: "moto125",
    version: PACKAGE_VERSION,
  });

  registerArticleTools(server);
  registerContentHealthTools(server);
  registerMotoTools(server);
  registerCompanyTools(server);
  registerTaxonomyTools(server);
  registerConfigAndPageTools(server);
  registerMediaTools(server);
  registerPrompts(server);
  registerResources(server);

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[moto125-mcp] fatal:", err);
  process.exit(1);
});
