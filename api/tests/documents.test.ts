// api/tests/documents.test.ts
import { server } from './setup';

describe('Documents Service', () => {
  it('POST /v1/documents/upload-url returns presigned URL', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/v1/documents/upload-url',
      headers: { authorization: 'Bearer mock-token' },
      payload: {
        fileName: 'will.pdf',
        contentType: 'application/pdf',
        size: 102400,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.uploadUrl).toBeDefined();
    expect(body.documentUri).toBeDefined();
  });
});
