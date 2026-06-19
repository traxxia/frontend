export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 1024) return bytes + ' Bytes';
  // Match Windows Explorer: always show KB with comma-separated thousands (e.g. 1,395 KB)
  if (bytes < 1024 * 1024 * 1024) return Math.ceil(bytes / 1024).toLocaleString() + ' KB';
  return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(1)) + ' GB';
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

      // Strategy 1: XMP metadata — uncompressed, reliable even in compressed PDFs
      // e.g. <xmpTPg:NPages>23</xmpTPg:NPages>
      const xmpMatch = text.match(/<[^>]*:?NPages[^>]*>\s*(\d+)\s*<\/[^>]*:?NPages>/i)
                    || text.match(/xmpTPg:NPages[^>]*>(\d+)/i);
      if (xmpMatch) {
        const count = parseInt(xmpMatch[1], 10);
        if (count > 0) return { count, unit: count === 1 ? 'page' : 'pages' };
      }

      // Strategy 2: Linearized PDF hint — /N gives total page count in the hint dict
      // e.g. /Linearized 1 ... /N 23
      const linearMatch = text.match(/\/Linearized\s+[\d.]+[^>]*\/N\s+(\d+)/);
      if (linearMatch) {
        const count = parseInt(linearMatch[1], 10);
        if (count > 0) return { count, unit: count === 1 ? 'page' : 'pages' };
      }

      // Strategy 3: Largest /Count N in the body (root Pages tree node)
      let countFromCount = 0;
      const countRegex = /\/Count\s+(\d+)/g;
      let m;
      while ((m = countRegex.exec(text)) !== null) {
        const val = parseInt(m[1], 10);
        if (val > countFromCount && val < 100000) countFromCount = val;
      }
      if (countFromCount > 0) return { count: countFromCount, unit: countFromCount === 1 ? 'page' : 'pages' };

      // Strategy 4: Count /Type /Page occurrences (uncompressed PDFs only)
      const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
      const countFromType = pageMatches ? pageMatches.length : 0;
      if (countFromType > 0) return { count: countFromType, unit: countFromType === 1 ? 'page' : 'pages' };

      return null;
    }

    if (['pptx', 'ppt', 'xlsx', 'xls', 'docx', 'doc'].includes(ext)) {
      const buf   = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);

      if (ext === 'pptx' || ext === 'ppt') {
        // Primary: count ppt/slides/slide*.xml files in ZIP central directory
        const zipCount = countZipFilesByPrefix(bytes, 'ppt/slides/slide');
        if (zipCount > 0) return { count: zipCount, unit: zipCount === 1 ? 'slide' : 'slides' };

        // Fallback: read ppt/presentation.xml and count <p:sldId entries
        const presXml = await readZipEntry(bytes, 'ppt/presentation.xml');
        if (presXml) {
          const slideMatches = presXml.match(/<p:sldId\b/gi);
          if (slideMatches && slideMatches.length > 0) {
            const count = slideMatches.length;
            return { count, unit: count === 1 ? 'slide' : 'slides' };
          }
        }
        return null;
      }

      if (ext === 'xlsx' || ext === 'xls') {
        console.log('[fileUtils] xlsx detected, size=', bytes.length, 'file=', file.name);

        // Primary: count xl/worksheets/sheet*.xml files in ZIP central directory
        const zipCount = countZipFilesByPrefix(bytes, 'xl/worksheets/sheet');
        console.log('[fileUtils] zipCount (xl/worksheets/sheet)=', zipCount);

        if (zipCount > 0) return { count: zipCount, unit: zipCount === 1 ? 'sheet' : 'sheets' };

        // Fallback: read xl/workbook.xml and count <sheet elements
        const workbookXml = await readZipEntry(bytes, 'xl/workbook.xml');
        console.log('[fileUtils] workbookXml found=', !!workbookXml, workbookXml ? workbookXml.substring(0, 300) : '');
        if (workbookXml) {
          const sheetMatches = workbookXml.match(/<sheet\b/gi);
          console.log('[fileUtils] sheetMatches=', sheetMatches);
          if (sheetMatches && sheetMatches.length > 0) {
            const count = sheetMatches.length;
            return { count, unit: count === 1 ? 'sheet' : 'sheets' };
          }
        }

        // Last resort: scan raw bytes for sheet XML entry names
        const decoder = new TextDecoder('latin1');
        const raw = decoder.decode(bytes);
        const sheetFileMatches = raw.match(/xl\/worksheets\/sheet\d+\.xml/g);
        console.log('[fileUtils] raw scan sheet files=', sheetFileMatches);
        if (sheetFileMatches) {
          const unique = new Set(sheetFileMatches);
          const count = unique.size;
          if (count > 0) return { count, unit: count === 1 ? 'sheet' : 'sheets' };
        }

        return null;
      }

      if (ext === 'docx' || ext === 'doc') {
        // Step 1: read page count from app.xml metadata (can be stale if doc not re-saved)
        let metaCount = 0;
        const appXml = await readZipEntry(bytes, 'docProps/app.xml');
        if (appXml) {
          const match = appXml.match(/<[^>:]*:?Pages[^>]*>\s*(\d+)\s*<\/[^>:]*:?Pages>/i);
          if (match) metaCount = parseInt(match[1], 10);
        }

        // Step 2: for .docx, scan word/document.xml using a 4-tier strategy:
        //   Tier 1 — <w:lastRenderedPageBreak>   : Word layout engine markers (most accurate)
        //   Tier 2 — <w:br w:type="page"/>       : Explicit/forced page breaks
        //   Tier 3 — <w:sectPr> section breaks   : Section-based page divisions (common in topic docs)
        //   Tier 4 — word count ÷ 350            : Estimation fallback
        let docCount = 0;
        if (ext === 'docx') {
          const docXml = await readZipEntry(bytes, 'word/document.xml');
          if (docXml) {
            // Tier 1: Word layout engine markers (added when Word renders the document)
            const renderedBreaks = (docXml.match(/<w:lastRenderedPageBreak/g) || []).length;

            // Tier 2: Explicit forced page breaks e.g. <w:br w:type="page"/>
            const explicitBreaks = (docXml.match(/<w:br\b[^>]*w:type=["']page["'][^>]*\/?>/g) || []).length;

            // Tier 3: Section breaks — each <w:sectPr> in a paragraph marks a section division.
            // Total <w:sectPr> count minus 1 (the body-level default sectPr at end of document)
            // minus any "continuous" type sections (those don't create a new page).
            const allSectPr = (docXml.match(/<w:sectPr[\s>\/]/g) || []).length;
            const continuousSects = (docXml.match(/<w:type\s+w:val=["']continuous["']/gi) || []).length;
            const sectionBreaks = Math.max(0, allSectPr - 1 - continuousSects);

            if (renderedBreaks > 0) {
              // Most accurate: Word's own page layout markers
              docCount = renderedBreaks + 1;
            } else {
              // Structural: combine explicit page breaks + section breaks
              // (they represent different separator mechanisms, both create new pages)
              const structuralBreaks = explicitBreaks + sectionBreaks;
              if (structuralBreaks > 0) {
                docCount = structuralBreaks + 1;
              } else {
                // Tier 4: Layout-aware estimation — accounts for formatting overhead,
                // not just raw word count (which ignores headings, line breaks, spacing).
                //
                // Formula: total "line units" / lines_per_page
                //   - textLines     : raw word content (≈10 words per line)
                //   - lineBreaks    : explicit <w:br/> (shift-enter) — each is a full line
                //   - paragraphs×0.5: each paragraph has top/bottom spacing
                //   - headings×1.5  : Heading styles add ~1.5 extra lines of spacing
                //   - 45 lines/page : typical single-spaced A4/Letter page
                const textContent = docXml.replace(/<[^>]+>/g, ' ');
                const words = textContent.split(/\s+/).filter(w => w.length > 0).length;
                const paragraphs = (docXml.match(/<w:p[ >]/g) || []).length;
                const lineBreaks = (docXml.match(/<w:br\s*\/?>/g) || []).length; // plain <w:br/> only, not page/col breaks
                const headings = (docXml.match(/w:val=["']Heading\d["']/gi) || []).length;

                const textLines  = Math.ceil(words / 10);
                const lineUnits  = textLines + lineBreaks + (paragraphs * 0.5) + (headings * 1.5);
                docCount = Math.max(1, Math.ceil(lineUnits / 45));
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
