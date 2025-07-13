export const ADMIN_EMAILS = [
  'blacksheepwall.xyz@gmail.com',
  'blacksheepwall.xyz@google.com',
  // ... existing admins ...
];

export async function checkIsAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  
  try {
    const response = await fetch('/api/admin/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.isAdmin;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
} 