/**
 * Opens a Microsoft Teams deep-link chat with the specified participants.
 *
 * @param participantEmails - Array of email addresses to include in the chat.
 * @param message - Pre-populated message body for the chat window.
 */
export const openTeamsChat = (participantEmails: string[], message: string): void => {
  if (participantEmails.length === 0) return;

  const usersParam = encodeURIComponent(participantEmails.join(','));
  const encodedMessage = encodeURIComponent(message);

  window.open(
    `https://teams.microsoft.com/l/chat/0/0?users=${usersParam}&message=${encodedMessage}`,
    '_blank',
    'noopener,noreferrer'
  );
};
