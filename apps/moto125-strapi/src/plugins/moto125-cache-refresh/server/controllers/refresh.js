'use strict';

module.exports = ({ strapi }) => ({
  async trigger(ctx) {
    const svc = strapi.plugin('moto125-cache-refresh').service('refresh');
    const result = await svc.callExternal();

    if (!result.ok) {
      ctx.status = result.status || 500;
      ctx.body = { ok: false, error: result.error || result.body || 'Refresh failed' };
      return;
    }

    ctx.status = 200;
    ctx.body = { ok: true, status: result.status, data: result.body ?? null };
  },
});
