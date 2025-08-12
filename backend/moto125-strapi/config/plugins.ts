
module.exports = ({ env }) => ({
    'documentation': {
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
});