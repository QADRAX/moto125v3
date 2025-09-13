import pluginId from './admin/src/pluginId';

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: () => '⟳',
      intlLabel: { id: `${pluginId}.menu.label`, defaultMessage: 'Actualizar caché' },
      // Carga perezosa del componente (mejor para bundles grandes)
      Component: async () => {
        const mod = await import('./admin/src/pages/Refresh');
        return mod.default;
      },
      permissions: [],
    });
  },
  bootstrap() {},
};
