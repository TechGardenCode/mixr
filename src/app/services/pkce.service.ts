import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PkceService {
  constructor() {}

  // src/app/services/pkce-utils.ts

  // Generate a random string (code verifier)
  generateCodeVerifier(): string {
    const array = new Uint32Array(56 / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, (dec) => ('0' + dec.toString(16)).substr(-2)).join(
      ''
    );
  }

  // Generate a SHA-256 hashed code challenge from the code verifier
  async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
