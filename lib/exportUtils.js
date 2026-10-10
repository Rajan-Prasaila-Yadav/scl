export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))
export function exportToCSV(filename, headers, rows) {
  const csvContent = "\ufeff" + [
    headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(','),
    ...rows.map(row => row.map(val => {
      let stringVal = val === null || val === undefined ? '' : String(val);
      if (/^[\s]*[=+@-]/.test(stringVal) && typeof val !== 'number') stringVal = "'" + stringVal;
      // Escape double quotes and wrap in double quotes if there are commas, newlines, or quotes
      const escaped = stringVal.replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printToPDF(title, headers, rows, subtitle = '') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { window.alert("Allow popups to open the printable document."); return; }

  const html = `
    <html>
      <head>
        <title>${escapeHTML(title)}</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #111;
            padding: 30px;
            margin: 0;
            background-color: #ffffff;
          }
          .header {
            margin-bottom: 25px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0 0 5px 0;
            font-size: 24px;
            color: #1e3a8a;
          }
          .header p {
            margin: 0;
            color: #4b5563;
            font-size: 14px;
          }
          .timestamp {
            font-size: 11px;
            margin-top: 8px;
            color: #9ca3af;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: bold;
            text-align: left;
            padding: 12px 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            color: #4b5563;
          }
          tr:nth-child(even) td {
            background-color: #f9fafb;
          }
          .footer {
            margin-top: 40px;
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHTML(title)}</h1>
          ${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ''}
          <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(val => `<td>${escapeHTML(val)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          EduCore School Management System
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
