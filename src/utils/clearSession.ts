export const clearAndReload = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
};

// You can call this from the browser console as clearAndReload()
if (typeof window !== 'undefined') {
  (window as any).clearAndReload = clearAndReload;
}
