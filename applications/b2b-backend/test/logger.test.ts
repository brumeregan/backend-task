import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { redactConfig } from '../src/resources/logger';

const memoryLogger = () => {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write: (chunk: Buffer, _enc, cb) => {
      lines.push(JSON.parse(chunk.toString()) as Record<string, unknown>);
      cb();
    },
  });
  return { lines, stream };
};

describe('logger redaction', () => {
  it('redacts credentials and personal data', () => {
    const { lines, stream } = memoryLogger();
    // No pid/time: their digits could randomly contain a "secret" such as 4242 and flake the test.
    const log = pino({ redact: redactConfig, base: null, timestamp: false }, stream);
    log.info(
      {
        req: { headers: { authorization: 'Bearer secret', cookie: 'sid=1' } },
        res: { headers: { 'set-cookie': 'sid=1' } },
        user: {
          email: 'anna@example.com',
          phone: '+4670',
          firstName: 'Anna',
          lastName: 'Andersson',
          taxNumber: '19900101-1234',
          tax_number: '19900101-1234',
        },
        card: { last4: '4242', id: 'keep-me' },
      },
      'test',
    );
    const text = JSON.stringify(lines[0]);
    for (const secret of ['Bearer secret', 'sid=1', 'anna@example.com', '+4670', 'Anna', '19900101', '4242']) {
      expect(text).not.toContain(secret);
    }
    expect(text).toContain('[REDACTED]');
    expect(text).toContain('keep-me');
  });
});
