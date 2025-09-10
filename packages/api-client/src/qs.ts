export function toQueryString(obj: Record<string, any>): string {
  const parts: string[] = [];
  build('', obj, parts);
  return parts.join('&');
}

function build(prefix: string, value: any, out: string[]) {
  if (value == null) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => build(`${prefix}[${i}]`, v, out));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => {
      const key = prefix ? `${prefix}[${encodeURIComponent(k)}]` : encodeURIComponent(k);
      build(key, v, out);
    });
    return;
  }
  // primitive
  out.push(`${prefix}=${encodeURIComponent(String(value))}`);
}
