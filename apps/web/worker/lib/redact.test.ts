// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { maskPersonal, MAX_QUESTION_CHARS, redact } from './redact';

describe('maskPersonal', () => {
  it.each([
    ['write to jane.doe+work@example.co.uk please', 'write to [email] please'],
    ['call 480-555-0123 today', 'call [phone] today'],
    ['call (480) 555 0123 today', 'call [phone] today'],
    ['call 480.555.0123 today', 'call [phone] today'],
    ['call 4805550123 today', 'call [phone] today'],
    ['reach me on +44 20 7946 0958', 'reach me on [phone]'],
    ['local 555-0123 only', 'local [phone] only'],
    ['my id is 123456789', 'my id is [number]'],
    ['card 4111111111111111 here', 'card [number] here'],
  ])('masks %j', (input, expected) => {
    expect(maskPersonal(input)).toBe(expected);
  });

  it.each([
    'What did he do from 2023 to 2025?',
    'He worked 2023-2025 at Thryv',
    'TestPilot ran 1200 tests in 45 seconds',
    'Version 3.14.159 shipped in 2024',
    'a 4 person team',
  ])('leaves ordinary numbers alone: %j', (input) => {
    expect(maskPersonal(input)).toBe(input);
  });

  it('masks every occurrence', () => {
    expect(maskPersonal('a@b.com and c@d.org')).toBe('[email] and [email]');
  });
});

describe('redact', () => {
  it('tidies whitespace and trims', () => {
    expect(redact('  hello \n\n  there  ')).toBe('hello there');
  });

  it('caps a question at 1,000 characters, ending with an ellipsis', () => {
    const out = redact('a'.repeat(5000));
    expect(out).toHaveLength(MAX_QUESTION_CHARS);
    expect(out.endsWith('…')).toBe(true);
  });

  it('keeps text at exactly the cap untouched', () => {
    const exact = 'b'.repeat(MAX_QUESTION_CHARS);
    expect(redact(exact)).toBe(exact);
  });

  it('accepts a different cap', () => {
    expect(redact('abcdefghij', 5)).toBe('abcd…');
  });

  it('masks before capping, so a cut cannot leave half an email behind', () => {
    const out = redact(`${'x '.repeat(10)}someone@example.com`, 1000);
    expect(out).not.toContain('someone');
  });
});

describe('redact with details to keep', () => {
  const keep = ['ybakshi@asu.edu', 'bakshi.yash@outlook.com'];

  it('leaves the owner’s own addresses alone, in whatever case they are written', () => {
    const text = 'Email ybakshi@asu.edu or Bakshi.Yash@Outlook.com.';
    expect(redact(text, 1000, keep)).toBe('Email ybakshi@asu.edu or Bakshi.Yash@Outlook.com.');
  });

  it('still masks every other address and number', () => {
    const text = 'Write to ybakshi@asu.edu, not boss@example.com, or call 480-555-0123.';
    expect(redact(text, 1000, keep)).toBe(
      'Write to ybakshi@asu.edu, not [email], or call [phone].',
    );
  });

  it('masks everything when nothing is to be kept', () => {
    expect(redact('ybakshi@asu.edu')).toBe('[email]');
  });
});
