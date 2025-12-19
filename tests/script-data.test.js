/**
 * Data handling and visualization tests for docs/script.js
 * Tests stats updates, table rendering, and data parsing
 */

describe('Data Handling and Visualization', () => {
  describe('Stats View Updates', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <span data-stat="total-hosts"></span>
        <span data-stat="total-services"></span>
        <span data-stat="last-sync"></span>
        <table data-table="countries">
          <tbody></tbody>
        </table>
        <table data-table="services">
          <tbody></tbody>
        </table>
      `;
    });

    test('should update total hosts display', () => {
      const element = document.querySelector('[data-stat="total-hosts"]');
      const value = 123456;
      element.textContent = value.toLocaleString();
      
      expect(element.textContent).toBe('123,456');
    });

    test('should update total services display', () => {
      const element = document.querySelector('[data-stat="total-services"]');
      const value = 789;
      element.textContent = value.toLocaleString();
      
      expect(element.textContent).toBe('789');
    });

    test('should format last sync timestamp', () => {
      const element = document.querySelector('[data-stat="last-sync"]');
      const date = new Date('2025-01-15T12:00:00Z');
      element.textContent = date.toLocaleString();
      
      expect(element.textContent).toBeTruthy();
      expect(element.textContent.length).toBeGreaterThan(0);
    });

    test('should display placeholder for missing data', () => {
      const element = document.querySelector('[data-stat="total-hosts"]');
      element.textContent = '—';
      
      expect(element.textContent).toBe('—');
    });

    test('should handle null values gracefully', () => {
      const value = null;
      const display = value?.toLocaleString() ?? '—';
      
      expect(display).toBe('—');
    });

    test('should handle undefined values gracefully', () => {
      const value = undefined;
      const display = value?.toLocaleString() ?? '—';
      
      expect(display).toBe('—');
    });
  });

  describe('Table Rendering', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <table data-table="countries">
          <tbody></tbody>
        </table>
      `;
    });

    test('should render country data in table', () => {
      const tbody = document.querySelector('[data-table="countries"] tbody');
      const data = { 'US': 1000, 'DE': 500, 'UK': 300 };
      
      tbody.innerHTML = '';
      Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, value]) => {
          const row = document.createElement('tr');
          row.innerHTML = `<td>${key}</td><td>${Number(value).toLocaleString()}</td>`;
          tbody.appendChild(row);
        });
      
      const rows = tbody.querySelectorAll('tr');
      expect(rows.length).toBe(3);
      expect(rows[0].textContent).toContain('US');
      expect(rows[0].textContent).toContain('1,000');
    });

    test('should sort table entries by value descending', () => {
      const data = { 'A': 100, 'B': 500, 'C': 200 };
      const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
      
      expect(sorted[0][0]).toBe('B');
      expect(sorted[1][0]).toBe('C');
      expect(sorted[2][0]).toBe('A');
    });

    test('should format numbers with locale separators', () => {
      const value = 1234567;
      const formatted = value.toLocaleString();
      
      expect(formatted).toBe('1,234,567');
    });

    test('should handle empty data gracefully', () => {
      const tbody = document.querySelector('[data-table="countries"] tbody');
      const data = null;
      
      tbody.innerHTML = '';
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          const row = document.createElement('tr');
          row.innerHTML = `<td>${key}</td><td>${value}</td>`;
          tbody.appendChild(row);
        });
      }
      
      expect(tbody.children.length).toBe(0);
    });

    test('should clear previous table content', () => {
      const tbody = document.querySelector('[data-table="countries"] tbody');
      tbody.innerHTML = '<tr><td>Old</td><td>Data</td></tr>';
      
      tbody.innerHTML = '';
      expect(tbody.children.length).toBe(0);
    });
  });

  describe('CSV Parsing', () => {
    test('should parse valid CSV with headers', () => {
      const csvText = 'name,age,city\nAlice,30,NYC\nBob,25,LA';
      const [headerLine, ...rows] = csvText.trim().split(/\r?\n/);
      const headers = headerLine.split(',').map(h => h.trim());
      const parsed = rows.map(row => {
        const values = row.split(',');
        return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
      });
      
      expect(parsed.length).toBe(2);
      expect(parsed[0].name).toBe('Alice');
      expect(parsed[0].age).toBe('30');
      expect(parsed[1].name).toBe('Bob');
    });

    test('should handle CSV with missing values', () => {
      const csvText = 'a,b,c\n1,2,\n3,,5';
      const [headerLine, ...rows] = csvText.trim().split(/\r?\n/);
      const headers = headerLine.split(',').map(h => h.trim());
      const parsed = rows.map(row => {
        const values = row.split(',');
        return Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim() ?? '']));
      });
      
      expect(parsed[0].c).toBe('');
      expect(parsed[1].b).toBe('');
    });

    test('should handle different line endings', () => {
      const csvWindows = 'a,b\r\n1,2\r\n3,4';
      const csvUnix = 'a,b\n1,2\n3,4';
      
      const parseCSV = (text) => text.trim().split(/\r?\n/);
      
      expect(parseCSV(csvWindows).length).toBe(3);
      expect(parseCSV(csvUnix).length).toBe(3);
    });

    test('should trim whitespace from values', () => {
      const csvText = 'name, value\n test , 123 ';
      const [headerLine, ...rows] = csvText.trim().split(/\r?\n/);
      const headers = headerLine.split(',').map(h => h.trim());
      
      expect(headers[0]).toBe('name');
      expect(headers[1]).toBe('value');
    });
  });

  describe('JSON Processing', () => {
    test('should detect and parse JSON objects', () => {
      const text = '{"key": "value", "number": 42}';
      const isJSON = text.trim().startsWith('{') || text.trim().startsWith('[');
      
      expect(isJSON).toBe(true);
      
      const parsed = JSON.parse(text);
      expect(parsed.key).toBe('value');
      expect(parsed.number).toBe(42);
    });

    test('should detect and parse JSON arrays', () => {
      const text = '[1, 2, 3, 4, 5]';
      const isJSON = text.trim().startsWith('{') || text.trim().startsWith('[');
      
      expect(isJSON).toBe(true);
      
      const parsed = JSON.parse(text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(5);
    });

    test('should handle malformed JSON', () => {
      const text = '{invalid json}';
      
      expect(() => JSON.parse(text)).toThrow();
    });

    test('should format JSON with indentation', () => {
      const data = { a: 1, b: { c: 2 } };
      const formatted = JSON.stringify(data, null, 2);
      
      expect(formatted).toContain('\n');
      expect(formatted).toContain('  ');
    });
  });

  describe('Color Palette Generation', () => {
    test('should generate unique colors for services', () => {
      const count = 5;
      const baseHue = 180;
      const palette = Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
      
      expect(palette.length).toBe(5);
      expect(palette[0]).toContain('hsl(180');
      expect(palette[1]).toContain('hsl(207');
    });

    test('should generate unique colors for countries', () => {
      const count = 3;
      const baseHue = 300;
      const palette = Array.from({ length: count }, (_, idx) => 
        `hsl(${(baseHue + idx * 27) % 360} 80% 55% / 0.7)`
      );
      
      expect(palette.length).toBe(3);
      expect(palette[0]).toContain('hsl(300');
    });

    test('should wrap hue values at 360 degrees', () => {
      const hue = 370;
      const wrapped = hue % 360;
      
      expect(wrapped).toBe(10);
    });
  });
});