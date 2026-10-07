/* arttan 서비스워커: 관심 작가 전시 알림(웹 푸시)만 다뤄요. 페이지 캐시는 하지 않아요. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "arttan", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "arttan 전시 소식", {
    body: d.body || "", icon: "/icons/icon-192.png", badge: "/icons/badge-96.png", tag: d.tag || undefined, lang: "ko",
    data: { url: d.url || "/" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) if (c.url.startsWith(self.location.origin) && "focus" in c) { await c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  })());
});
