// webOS natively injects a `PalmServiceBridge` constructor into every app's
// page - no library needed for that part. The nicer `window.webOS.service
// .request(uri, { method, parameters, onSuccess, onFailure })` wrapper the
// rest of this app calls (platform.js, icons.js) is normally provided by
// LG's `webOSTV.js` SDK helper, which isn't included here - this app only
// ever uses that one call shape, so this is a minimal hand-written
// equivalent built directly on the real native bridge, matching LG's
// documented PalmServiceBridge behavior, instead of pulling in the full
// third-party SDK for one method.
if (typeof window !== "undefined" && typeof window.PalmServiceBridge !== "undefined" && !window.webOS) {
  window.webOS = {
    service: {
      request(uri, { method, parameters = {}, onSuccess, onFailure } = {}) {
        const bridge = new window.PalmServiceBridge();
        bridge.onservicecallback = (msg) => {
          let response;
          try {
            response = JSON.parse(msg);
          } catch (err) {
            onFailure?.({ errorText: "Invalid response from Luna service", raw: msg });
            bridge.cancel();
            return;
          }
          if (response.returnValue === false) {
            onFailure?.(response);
          } else {
            onSuccess?.(response);
          }
          bridge.cancel();
        };
        bridge.call(`${uri}/${method}`, JSON.stringify(parameters));
      },
    },
  };
}
