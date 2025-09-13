module.exports = ({ env }) => ({
  documentation: {
    enabled: true,
  },
  upload: {
    config: {
      provider: "strapi-provider-upload-azure-storage",
      providerOptions: {
        authType: env("STORAGE_AUTH_TYPE", "default"),
        account: env("STORAGE_ACCOUNT"),
        accountKey: env("STORAGE_ACCOUNT_KEY"),
        containerName: env("STORAGE_CONTAINER_NAME"),
        defaultPath: "assets",
      },
    },
  },
  graphql: {
    enabled: true,
    config: {
      endpoint: "/graphql",
      shadowCRUD: true,
      v4CompatibilityMode: false,
      apolloServer: {
        introspection: true,
      },
      maxLimit: -1,
    },
  },
  "moto125-cache-refresh": {
    enabled: true,
    resolve: './src/plugins/moto125-cache-refresh',
    config: {
      refreshUrl: env("M125_REFRESH_URL"),
      refreshKey: env("M125_REFRESH_KEY"),
      method: env("M125_REFRESH_METHOD", "POST"),
      headerName: env("M125_REFRESH_HEADER", "x-refresh-key"),
      timeoutMs: env.int("M125_REFRESH_TIMEOUT_MS", 10000),
    },
  },
});
