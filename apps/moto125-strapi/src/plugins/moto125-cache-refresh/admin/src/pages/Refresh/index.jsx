import React, { useState } from "react";
import { Button, Divider, Typography, Box, Flex } from "@strapi/design-system";
import { useFetchClient, useNotification } from "@strapi/strapi/admin";

const RefreshPage = () => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [loading, setLoading] = useState(false);
  const [lastRunAt, setLastRunAt] = useState(null);

  // Trigger cache refresh on the public UI
  const onRefresh = async () => {
    setLoading(true);

    try {
      const res = await post("/moto125-cache-refresh/refresh", {});
      if (res?.data?.ok) {
        const when = new Date().toLocaleString();
        setLastRunAt(when);
        toggleNotification({
          type: "success",
          message: "La caché de la web se está actualizando.",
        });
      } else {
        throw new Error(res?.data?.error || "Error desconocido");
      }
    } catch (e) {
      toggleNotification({
        type: "danger",
        message: `No se pudo refrescar la caché: ${e?.message ?? "Error"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding={6}>
      <Flex direction="column" alignItems="stretch" gap={4}>
        <Box
          background="neutral100"
          hasRadius
          padding={4}
          shadow="tableShadow"
          borderColor="neutral200"
        >
          <Flex direction="column" gap={3}>
            <Typography variant="alpha">Actualizar caché de Moto125.cc</Typography>
            <Typography textColor="neutral600">
              La web pública de Moto125.cc guarda una copia en caché del contenido
              para mostrarlo más rápido. Cuando apliques cambios aquí en Strapi,
              puedes usar este botón para que la caché se actualice al momento.
            </Typography>
            <Divider />
            <Button onClick={onRefresh} loading={loading} disabled={loading}>
              {loading ? "Actualizando…" : "Actualizar caché ahora"}
            </Button>

            {lastRunAt && (
              <Typography textColor="neutral600">
                Última actualización solicitada: {lastRunAt}
              </Typography>
            )}
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default RefreshPage;
