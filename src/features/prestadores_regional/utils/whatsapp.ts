/**
 * Utility functions for formatting and generating WhatsApp links
 * Reusing a single named tab/window ('dr_monitora_whatsapp') so the browser
 * does NOT open multiple WhatsApp tabs.
 */

export const WHATSAPP_TAB_NAME = 'dr_monitora_whatsapp';

export function cleanPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  if (!digits) return '';

  // If already starts with 55 and has 12 or 13 digits (55 + DDD + 8 or 9 digits)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Standard Brazilian format: DDD (2 digits) + 8 or 9 digits = 10 or 11 digits
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Fallback: if it's 8 or 9 digits without DDD, assume São Paulo (DDD 11)
  if (digits.length === 8 || digits.length === 9) {
    return `5511${digits}`;
  }

  return digits;
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function getWhatsAppUrl(phone: string, prestadorNome?: string, prestadorCodigo?: string): string {
  const clean = cleanPhoneNumber(phone);
  if (!clean) return '';

  const message = prestadorNome
    ? `Olá ${prestadorNome}${prestadorCodigo ? ` (${prestadorCodigo})` : ''}, contato da central dr.monitora®. Tudo bem?`
    : 'Olá, contato da central dr.monitora®.';

  const encodedMessage = encodeURIComponent(message);

  // If on mobile, use wa.me which opens the native WhatsApp app directly
  if (isMobileDevice()) {
    return `https://wa.me/${clean}?text=${encodedMessage}`;
  }

  // On desktop, directly target web.whatsapp.com so it reuses the open WhatsApp Web tab
  // without intermediate "Continuar para a conversa" confirmation pages
  return `https://web.whatsapp.com/send?phone=${clean}&text=${encodedMessage}`;
}

/**
 * Opens WhatsApp in the same dedicated tab ('dr_monitora_whatsapp')
 * preventing multiple duplicate tabs from being created.
 */
export function openWhatsApp(phone: string, prestadorNome?: string, prestadorCodigo?: string): void {
  const url = getWhatsAppUrl(phone, prestadorNome, prestadorCodigo);
  if (!url) return;

  const win = window.open(url, WHATSAPP_TAB_NAME);
  if (win) {
    try {
      win.focus();
    } catch {
      // In case of cross-origin focus restrictions
    }
  }
}
