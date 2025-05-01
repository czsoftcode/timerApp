// src/utils/formatters.ts - robustní verze funkcí pro formátování dat
/**
 * Funkce pro formátování data ve formátu dd.mm.yyyy
 */
export const formatDate = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Neplatné datum pro formatDate:', date);
    return 'Neplatné datum';
  }

  try {
    // Lokalizované formátování data pro český formát
    return date.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Chyba při formátování data:', error);

    // Záložní řešení bez lokalizace
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }
};

/**
 * Funkce pro formátování času ve formátu HH:MM
 */
export const formatTime = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Neplatné datum pro formatTime:', date);
    return '--:--';
  }

  try {
    // Lokalizované formátování času
    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Chyba při formátování času:', error);

    // Záložní řešení bez lokalizace
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }
};

/**
 * Funkce pro formátování data a času dohromady
 */
export const formatDateTime = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Neplatné datum pro formatDateTime:', date);
    return 'Neplatné datum a čas';
  }

  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Funkce pro formátování trvání v sekundách na formát "Xh Ym"
 */
export const formatDuration = (seconds: number): string => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    console.warn('Neplatné sekundy pro formatDuration:', seconds);
    return '0h 0m';
  }

  try {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0 && minutes === 0) {
      return '0h 0m';
    } else if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  } catch (error) {
    console.error('Chyba při formátování trvání:', error);
    return '0h 0m';
  }
};