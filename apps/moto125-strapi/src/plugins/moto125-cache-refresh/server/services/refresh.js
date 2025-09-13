'use strict';

module.exports = ({ strapi }) => ({
  async callExternal() {
    const cfg = strapi.config.get('plugin::moto125-cache-refresh', {});

    const refreshUrl = cfg.refreshUrl;
    const refreshKey = cfg.refreshKey;
    const method = cfg.method || 'POST';
    const headerName = cfg.headerName || 'x-refresh-key';
    const timeoutMs = cfg.timeoutMs || 10000;

    if (!refreshUrl || !refreshKey) {
      return { ok: false, status: 400, error: 'Missing refreshUrl/refreshKey config' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(refreshUrl, {
        method,
        headers: { 'content-type': 'application/json', [headerName]: refreshKey },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      let body;
      try { body = await res.json(); } catch { try { body = await res.text(); } catch {} }

      return { ok: res.ok, status: res.status, body };
    } catch (e) {
      clearTimeout(timeout);
      return { ok: false, status: 500, error: e?.message || 'Fetch failed' };
    }
  },
});
