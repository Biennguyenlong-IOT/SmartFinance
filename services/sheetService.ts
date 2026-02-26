
export const syncToSheet = async (url: string, payload: any) => {
  if (!url || !url.startsWith('https://script.google.com')) return;
  
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Sheet Sync Error:", error);
    return false;
  }
};

export const fetchFromSheet = async (url: string) => {
  if (!url || !url.startsWith('https://script.google.com')) return null;
  
  try {
    // Apps Script yêu cầu chuyển hướng, fetch thông thường sẽ xử lý được
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Sheet Fetch Error:", error);
    return null;
  }
};
