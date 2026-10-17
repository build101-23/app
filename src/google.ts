// Google sign-in configuration. The client ID is public, like the Supabase publishable key.
export const googleClientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

// The sign-in screen leads with Google only when a client ID is configured; otherwise it shows the email form.
export const googleAvailable = Boolean(googleClientId)
