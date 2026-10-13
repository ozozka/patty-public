import { execSync } from 'child_process';
import path from 'path';

import en from '../en.json';
import tr from '../tr.json';

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (isRecordObject(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const IGNORED_PATTERNS = [
  /^date\..*_one$/,
  /^date\..*_other$/,
  /^error\.validation\..*/,
  /^profile\.years_old$/,
  /^profile\.report_reason_.*/,
  /^pet\.preferences_required$/,
];

describe('i18n keys', () => {
  const trKeys = isRecordObject(tr) ? getAllKeys(tr).sort() : [];
  const enKeys = isRecordObject(en) ? getAllKeys(en).sort() : [];

  it('should have all Turkish keys in English translation', () => {
    const missingInEn = trKeys.filter((k) => !enKeys.includes(k));
    expect(missingInEn).toEqual([]);
  });

  it('should have all English keys in Turkish translation', () => {
    const missingInTr = enKeys.filter((k) => !trKeys.includes(k));
    expect(missingInTr).toEqual([]);
  });

  it('should use all defined keys in the source code', () => {
    const srcDir = path.resolve(__dirname, '../../');

    function isKeyUsed(key: string): boolean {
      try {
        const result = execSync(
          `grep -r "${key}" "${srcDir}" --include="*.ts" --include="*.tsx" | grep -v "/i18n/__tests__/" | grep -v "/scripts/"`,
          { encoding: 'utf8', stdio: 'pipe' },
        );
        return result.length > 0;
      } catch {
        return false;
      }
    }

    const unusedKeys = trKeys.filter((key) => {
      if (IGNORED_PATTERNS.some((p) => p.test(key))) return false;

      if (key.endsWith('_one') || key.endsWith('_other')) {
        const baseKey = key.replace(/_(one|other)$/, '');
        if (isKeyUsed(baseKey)) return false;
      }

      return !isKeyUsed(key);
    });

    expect(unusedKeys).toEqual([]);
  });
});
