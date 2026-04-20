/**
 * Utility functions สำหรับจัดการ datetime
 * บังคับใช้ Bangkok timezone เสมอ ไม่ว่า browser จะอยู่ timezone ใด
 */

/**
 * แปลง datetime string เป็น Thai locale string ใน Bangkok timezone
 * @param dateString - ISO datetime string จาก API
 * @returns string ในรูปแบบ "21/1/2569 14:00:00"
 */
export function toBangkokTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';

  try {
    // ถ้าเป็น string ให้พยายาม parse แบบไม่แปลง timezone
    if (typeof dateString === 'string') {
      const match = dateString.match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/i
      );

      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const hour = match[4];
        const minute = match[5];
        const second = match[6] ?? '00';

        // ใช้ปีพุทธศักราช (+543)
        const buddhistYear = year + 543;
        return `${day}/${month}/${buddhistYear} ${hour}:${minute}:${second}`;
      }
    }

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return String(dateString);
    }

    // Fallback: ใช้ toLocaleString โดยไม่ระบุ timeZone (ใช้ browser timezone)
    // วิธีนี้เหมือนกับหน้า Faults ที่แสดงผลถูกต้อง
    const formatted = date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    
    // แปลงเป็นปีพุทธศักราช
    const thaiYear = date.getFullYear() + 543;
    return formatted.replace(String(date.getFullYear()), String(thaiYear));
  } catch (error) {
    console.error('Error converting date to Bangkok time:', error);
    return String(dateString || '-');
  }
}

/**
 * แปลง datetime เป็น short format (เฉพาะเวลา)
 * @param dateString - ISO datetime string
 * @returns string ในรูปแบบ "14:00:00"
 */
export function toBangkokTimeShort(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';

  try {
    if (typeof dateString === 'string') {
      const match = dateString.match(/\d{4}-\d{2}-\d{2}[T\s](\d{2}:\d{2})(?::(\d{2}))?/i);
      if (match) {
        const seconds = match[2] ?? '00';
        return `${match[1]}:${seconds}`;
      }
    }

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return String(dateString);
    }

    // Fallback: ไม่ระบุ timeZone (ใช้ browser timezone)
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return String(dateString || '-');
  }
}

/**
 * แปลง datetime เป็น date only
 * @param dateString - ISO datetime string  
 * @returns string ในรูปแบบ "21/1/2569"
 */
export function toBangkokDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';

  try {
    if (typeof dateString === 'string') {
      const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const buddhistYear = year + 543;
        return `${day}/${month}/${buddhistYear}`;
      }
    }

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return String(dateString);
    }

    // Fallback: ไม่ระบุ timeZone, แปลงเป็นปีพุทธศักราช
    const formatted = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const thaiYear = date.getFullYear() + 543;
    return formatted.replace(String(date.getFullYear()), String(thaiYear));
  } catch (error) {
    return String(dateString || '-');
  }
}
