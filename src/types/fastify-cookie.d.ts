import { CookieSerializeOptions } from '@fastify/cookie';

declare module 'fastify' {
  interface FastifyRequest {
    cookies: { [key: string]: string | undefined };

    unsignCookie(value: string): {
      valid: boolean;
      renew: boolean;
      value: string | null;
    };
  }

  interface FastifyReply {
    setCookie(
      name: string,
      value: string,
      options?: CookieSerializeOptions,
    ): this;

    clearCookie(name: string, options?: CookieSerializeOptions): this;
  }
}
