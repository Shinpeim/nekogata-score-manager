export function getDeviceId(): string {
  const key = 'nekogata-device-id';
  let deviceId = localStorage.getItem(key);
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(key, deviceId);
  }
  
  return deviceId;
}

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  const userAgent = navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  
  return `${timestamp}-${randomPart}-${userAgent}`;
}