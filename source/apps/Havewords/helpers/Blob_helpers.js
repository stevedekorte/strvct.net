
// --- Fetch a Blob ---

Object.defineSlot(Blob.prototype, "asyncToDataUrl", function() {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function () {
        const base64data = reader.result;
        resolve(base64data);
    }
    reader.onerror = reject;
    reader.readAsDataURL(this);
  });
});

Object.defineSlot(Blob, "asyncFromDataUrl", async function(dataUrlString) {
  const response = await fetch(dataUrlString);
  return await response.blob();
});

