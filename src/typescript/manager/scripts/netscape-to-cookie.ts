import { readFile } from 'fs/promises';

const file = process.argv[2];
if (!file) {
  console.error('provide a netscape cookie file to convert to header format');
  process.exit(1);
}

(async () => {
  const data = await readFile(file, 'utf-8');
  const lines = data.split('\n');

  const cookies: string[] = [];
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim())
      continue;

    const parts = line.split('\t');
    if (parts.length < 7)
      continue;

    const name = parts[5];
    const value = parts[6];
    cookies.push(`${name}=${value}`);
  }

  console.log(cookies.join('; '));
})();