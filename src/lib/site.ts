// Contato comercial real da Lumen Print. Deixe vazio até que o número seja informado:
// o botão de WhatsApp só aparece quando este valor estiver preenchido (formato: 5511999999999).
export const WHATSAPP_NUMBER = "";

export const whatsappLink = (text = "Olá! Vim pelo site da Lumen Print.") =>
  WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}` : null;

export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateUpload(file: File): string | null {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type))
    return "Formato não permitido. Envie JPG, PNG, WEBP, SVG ou PDF.";
  if (file.size > MAX_UPLOAD_BYTES) return "O arquivo deve ter no máximo 10 MB.";
  return null;
}
