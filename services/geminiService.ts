/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

type ContentType = 'rpp' | 'quiz' | 'announcement';

const buildSystemInstruction = (type?: ContentType) => {
  let base = 'Anda adalah konsultan pendidikan ahli untuk sistem IMAM di MAN 1 Hulu Sungai Tengah. Jawablah dalam Bahasa Indonesia yang baik dan benar.';

  if (type === 'rpp') base += ' Buat RPP yang mendetail dan siap pakai.';
  if (type === 'quiz') base += ' Buat kuis pilihan ganda lengkap kunci jawaban.';
  if (type === 'announcement') base += ' Buat draf pengumuman sekolah yang formal dan ringkas.';

  return base;
};

const getAuthHeaders = (): Record<string, string> => {
  if (typeof localStorage === 'undefined') return {};

  const idToken = localStorage.getItem('imam_id_token');
  if (!idToken) return {};

  return { Authorization: `Bearer ${idToken}` };
};

const generateViaProxy = async (prompt: string, systemInstruction: string): Promise<string> => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
  });

  if (!response.ok) throw new Error(`Gemini proxy error: ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Tidak dapat membuat konten.';
};

export const getEduContent = async (prompt: string, type: ContentType): Promise<string> => {
  try {
    return await generateViaProxy(prompt, buildSystemInstruction(type));
  } catch (error) {
    console.warn('Gemini API Error:', error);
    return 'Maaf, terjadi kendala teknis dalam membuat konten.';
  }
};

export const getBambooAdvice = async (prompt: string): Promise<string> => {
  try {
    return await generateViaProxy(
      prompt,
      'Anda adalah layanan LIVE CHAT IMAM (Helpdesk Digital) dan hanya membantu pengoperasian fitur aplikasi IMAM secara profesional.',
    );
  } catch (error) {
    console.warn('Gemini API Error:', error);
    return 'Saya sedang mengalami gangguan koneksi. Silakan coba beberapa saat lagi.';
  }
};
