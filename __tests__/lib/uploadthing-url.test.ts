import { parseUploadThingUrl } from '@/lib/uploads/registry';

jest.mock('@/db/prisma', () => ({ prisma: {} }));
jest.mock('@/lib/uploadthing-helpers', () => ({ deleteUTFiles: jest.fn() }));

describe('parseUploadThingUrl', () => {
  it.each([
    ['https://utfs.io/f/abc123_file-name.v2.jpg', 'abc123_file-name.v2.jpg'],
    ['https://abc123.ufs.sh/f/KEY_1-x.png', 'KEY_1-x.png'],
  ])('accepts %s', (url, key) => {
    expect(parseUploadThingUrl(url)).toEqual({ key });
  });

  it.each([
    ['foreign host', 'https://evil.com/f/KEY'],
    ['host that merely contains utfs.io', 'https://utfs.io.evil.com/f/KEY'],
    ['suffix trick', 'https://evilutfs.io/f/KEY'],
    ['http scheme', 'http://utfs.io/f/KEY'],
    ['nested subdomain', 'https://a.b.ufs.sh/f/KEY'],
    ['bare ufs.sh', 'https://ufs.sh/f/KEY'],
    ['userinfo', 'https://utfs.io@evil.com/f/KEY'],
    ['userinfo on real host', 'https://user:pw@utfs.io/f/KEY'],
    ['port', 'https://utfs.io:8443/f/KEY'],
    ['no /f/ prefix', 'https://utfs.io/KEY'],
    ['empty key', 'https://utfs.io/f/'],
    ['nested key path', 'https://utfs.io/f/a/b'],
    ['path traversal', 'https://utfs.io/f/../secret'],
    ['encoded traversal', 'https://utfs.io/f/%2e%2e'],
    ['query on a foreign host', 'https://evil.com/?u=https://utfs.io/f/KEY'],
    ['raw key', 'abc123_file.jpg'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['empty string', ''],
  ])('rejects %s', (_label, url) => {
    expect(parseUploadThingUrl(url)).toBeNull();
  });

  it('ignores a query string or fragment on a valid URL (key stays clean)', () => {
    expect(parseUploadThingUrl('https://utfs.io/f/KEY.jpg?x=1#frag')).toEqual({ key: 'KEY.jpg' });
  });
});
