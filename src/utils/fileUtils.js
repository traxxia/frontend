export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const fileKey = (file) => `${file.name}__${file.size}`;

const findEOCD = (view, length) => {
  const start = Math.max(0, length - 22 - 65535);
  for (let i = length - 22; i >= start; i--) {
    if (view.getUint32(i, true) === 0x06054B50) return i;
  }
  return -1;
};

const countZipFilesByPrefix = (bytes, prefix) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEOCD(view, bytes.length);
  if (eocd === -1) return 0;

  const numEntries = view.getUint16(eocd + 8,  true);
  let   pos        = view.getUint32(eocd + 16, true);
  const enc        = new TextEncoder().encode(prefix);
  let   count      = 0;

  for (let e = 0; e < numEntries && pos + 46 <= bytes.length; e++) {
    if (view.getUint32(pos, true) !== 0x02014B50) break;
    const fnLen      = view.getUint16(pos + 28, true);
    const extraLen   = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);

    if (fnLen >= enc.length) {
      let match = true;
      for (let j = 0; j < enc.length; j++) {
        if (bytes[pos + 46 + j] !== enc[j]) { match = false; break; }
      }
      if (match) count++;
    }
    pos += 46 + fnLen + extraLen + commentLen;
  }
  return count;
};

const readZipEntry = async (bytes, targetName) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEOCD(view, bytes.length);
  if (eocd === -1) return null;

  const numEntries = view.getUint16(eocd + 8,  true);
  let   pos        = view.getUint32(eocd + 16, true);

  for (let e = 0; e < numEntries && pos + 46 <= bytes.length; e++) {
    if (view.getUint32(pos, true) !== 0x02014B50) break;
    const compMethod  = view.getUint16(pos + 10, true);
    const compSize    = view.getUint32(pos + 20, true);
    const fnLen       = view.getUint16(pos + 28, true);
    const extraLen    = view.getUint16(pos + 30, true);
    const commentLen  = view.getUint16(pos + 32, true);
    const localOffset = view.getUint32(pos + 42, true);
    const name        = new TextDecoder().decode(bytes.slice(pos + 46, pos + 46 + fnLen));

    if (name === targetName) {
      const localFNLen  = view.getUint16(localOffset + 26, true);
      const localExtLen = view.getUint16(localOffset + 28, true);
      const dataStart   = localOffset + 30 + localFNLen + localExtLen;
      const compData    = bytes.slice(dataStart, dataStart + compSize);

      if (compMethod === 0) {
        return new TextDecoder().decode(compData);
      }
      if (compMethod === 8 && typeof DecompressionStream !== 'undefined') {
        const ds     = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(compData);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const out = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0));
        let off = 0;
        for (const c of chunks) { out.set(c, off); off += c.length; }
        return new TextDecoder().decode(out);
      }
      return null;
    }
    pos += 46 + fnLen + extraLen + commentLen;
  }
  return null;
};

export const computePageCount = async (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  try {
    if (ext === 'pdf') {
      const buf  = await file.arrayBuffer();
      const text = new TextDecoder('latin1').decode(buf);

      // Primary: find the largest /Count N in the PDF (root Pages tree node holds total count)
      // This works even when page objects are inside compressed cross-reference streams
      let countFromCount = 0;
      const countRegex = /\/Count\s+(\d+)/g;
      let m;
      while ((m = countRegex.exec(text)) !== null) {
        const val = parseInt(m[1], 10);
        if (val > countFromCount && val < 100000) countFromCount = val;
      }

      // Fallback: count individual /Type /Page dictionary occurrences (uncompressed PDFs)
      const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
      const countFromType = pageMatches ? pageMatches.length : 0;

      const count = countFromCount || countFromType;
      return count > 0 ? { count, unit: count === 1 ? 'page' : 'pages' } : null;
    }

    if (['pptx', 'ppt', 'xlsx', 'xls', 'docx', 'doc'].includes(ext)) {
      const buf   = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);

      if (ext === 'pptx' || ext === 'ppt') {
        const count = countZipFilesByPrefix(bytes, 'ppt/slides/slide');
        return count > 0 ? { count, unit: count === 1 ? 'slide' : 'slides' } : null;
      }

      if (ext === 'xlsx' || ext === 'xls') {
        const count = countZipFilesByPrefix(bytes, 'xl/worksheets/sheet');
        return count > 0 ? { count, unit: count === 1 ? 'sheet' : 'sheets' } : null;
      }

      if (ext === 'docx' || ext === 'doc') {
        // Step 1: read page count from app.xml metadata (can be stale if doc not re-saved)
        let metaCount = 0;
        const appXml = await readZipEntry(bytes, 'docProps/app.xml');
        if (appXml) {
          const match = appXml.match(/<[^>:]*:?Pages[^>]*>\s*(\d+)\s*<\/[^>:]*:?Pages>/i);
          if (match) metaCount = parseInt(match[1], 10);
        }

        // Step 2: for .docx, always scan word/document.xml for Word's own page-break markers
        // These are inserted by Word's layout engine and are the most reliable page count source
        let docCount = 0;
        if (ext === 'docx') {
          const docXml = await readZipEntry(bytes, 'word/document.xml');
          if (docXml) {
            const renderedBreaks = (docXml.match(/<w:lastRenderedPageBreak/g) || []).length;
            if (renderedBreaks > 0) {
              // Each break represents the END of a page, so total pages = breaks + 1
              docCount = renderedBreaks + 1;
            } else if (metaCount === 0) {
              // No breaks and no metadata — last resort: estimate from word count
              // (Only triggered when we have zero information, avoids inflating real 1-page docs)
              const textContent = docXml.replace(/<[^>]+>/g, ' ');
              const words = textContent.split(/\s+/).filter(w => w.length > 0).length;
              if (words > 0) {
                docCount = Math.max(1, Math.ceil(words / 350));
              }
            }
          }
        }

        // Take the best (highest reliable) count we found
        const count = Math.max(metaCount, docCount);
        return count > 0 ? { count, unit: count === 1 ? 'page' : 'pages' } : null;
      }
    }

    // ── CSV: count data rows (lines minus the header row) ──────────────────────
    if (ext === 'csv') {
      const text  = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      const rows  = Math.max(0, lines.length - 1); // subtract header row
      return rows > 0 ? { count: rows, unit: rows === 1 ? 'row' : 'rows' } : null;
    }

    // ── Plain text / RTF: estimate pages from word count ───────────────────────
    if (ext === 'txt' || ext === 'rtf') {
      const raw  = await file.text();
      // For RTF strip control words so we count only real words
      const text = ext === 'rtf'
        ? raw.replace(/\\\w+\s?/g, ' ').replace(/[{}]/g, ' ')
        : raw;
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      if (words === 0) return null;
      const count = Math.max(1, Math.ceil(words / 350));
      return { count, unit: count === 1 ? 'page' : 'pages' };
    }

    // ── Images: always 1 page ─────────────────────────────────────────────────
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return { count: 1, unit: 'image' };
    }

  } catch (_) {
    // Silently fall back
  }
  return null;
};

export const getFileDetails = (file, pageInfo) => {
  const sizeStr = formatFileSize(file.size);
  if (pageInfo) return `${sizeStr} \u00b7 ${pageInfo.count} ${pageInfo.unit}`;
  return sizeStr;
};
