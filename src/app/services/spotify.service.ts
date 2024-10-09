import { Injectable } from '@angular/core';
import { PkceService } from './pkce.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { filter, firstValueFrom, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private CLIENT_ID = '593be54702d94fdf83d2d4885605929d';
  private REDIRECT_URI = 'http://localhost:4200';
  private AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
  private TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
  private SCOPES = [
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
    'user-read-email',
  ];

  private SEARCH_ENDPOINT = 'https://api.spotify.com/v1/search';
  private TOP_TRACKS_ENDPOINT =
    'https://api.spotify.com/v1/artists/{id}/top-tracks';
  private CREATE_PLAYLIST_ENDPOINT =
    'https://api.spotify.com/v1/users/{user_id}/playlists';
  private ADD_TRACKS_ENDPOINT =
    'https://api.spotify.com/v1/playlists/{playlist_id}/tracks';
  private USER_PROFILE_ENDPOINT = 'https://api.spotify.com/v1/me';

  constructor(
    private readonly pkceService: PkceService,
    private readonly http: HttpClient
  ) {}

  async login(): Promise<void> {
    const codeVerifier = this.pkceService.generateCodeVerifier();
    const codeChallenge = await this.pkceService.generateCodeChallenge(
      codeVerifier
    );
    localStorage.setItem('code_verifier', codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      scope: this.SCOPES.join(' '),
      redirect_uri: this.REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    window.location.href = `${this.AUTH_ENDPOINT}?${params.toString()}`;
  }

  async handleCallback(): Promise<string> {
    const code = new URLSearchParams(window.location.search).get('code');
    const codeVerifier = localStorage.getItem('code_verifier');

    if (code && codeVerifier) {
      const body = new HttpParams()
        .set('client_id', this.CLIENT_ID)
        .set('grant_type', 'authorization_code')
        .set('code', code)
        .set('redirect_uri', this.REDIRECT_URI)
        .set('code_verifier', codeVerifier);

      const response = await firstValueFrom(
        this.http.post<any>(this.TOKEN_ENDPOINT, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );

      return response.access_token;
    }
    return '';
  }

  private getHeaders(accessToken: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });
  }

  getCurrentUserProfile(accessToken: string): Observable<any> {
    const headers = this.getHeaders(accessToken);
    return this.http.get(this.USER_PROFILE_ENDPOINT, { headers });
  }

  searchArtists(query: string, accessToken: string): Observable<any> {
    const headers = this.getHeaders(accessToken);
    const params = new HttpParams()
      .set('q', query)
      .set('type', 'artist')
      .set('limit', '10');
    return this.http.get(this.SEARCH_ENDPOINT, { headers, params });
  }

  getTopTracks(artistId: string, accessToken: string): Observable<any> {
    const headers = this.getHeaders(accessToken);
    const url = this.TOP_TRACKS_ENDPOINT.replace('{id}', artistId);
    return this.http
      .get(url, { headers, params: { market: 'US' } })
      .pipe(map((data: any) => data.tracks));
  }

  createPlaylist(
    userId: string,
    accessToken: string,
    name: string,
    description?: string
  ): Observable<any> {
    const headers = this.getHeaders(accessToken);
    const url = this.CREATE_PLAYLIST_ENDPOINT.replace('{user_id}', userId);
    const body = { name, description, public: false };
    return this.http.post(url, body, { headers });
  }

  addTracksToPlaylist(
    playlistId: string,
    trackUris: string[],
    accessToken: string
  ): Observable<void> {
    const headers = this.getHeaders(accessToken);
    const url = this.ADD_TRACKS_ENDPOINT.replace('{playlist_id}', playlistId);
    const body = { uris: trackUris };
    return this.http.post<void>(url, body, { headers });
  }
}
