import { afterNextRender, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpotifyService } from './services/spotify.service';
import { CommonModule } from '@angular/common';
import { ArtistSearchComponent } from './components/artist-search/artist-search.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ArtistSearchComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'mixr';
  accessToken = '';
  selectedArtists: any[] = [];
  playlistUrl = '';
  userId = '';

  constructor(private spotifyService: SpotifyService) {
    afterNextRender(() => {
      const token = sessionStorage.getItem('access_token');
      if (!token) {
        this.initSession();
      } else {
        this.accessToken = token;
        this.fetchUserProfile();
      }
    });
  }

  fetchUserProfile(): void {
    this.spotifyService.getCurrentUserProfile(this.accessToken).subscribe(
      (profile) => {
        this.userId = profile.id; // Store the fetched userId
      },
      (error) => {
        sessionStorage.removeItem('access_token');
        this.initSession();
      }
    );
  }

  initSession(): void {
    this.spotifyService.handleCallback().then((accessToken) => {
      if (accessToken) {
        sessionStorage.setItem('access_token', accessToken);
        this.accessToken = accessToken;
        this.fetchUserProfile();
      }
    });
  }

  login(): void {
    this.spotifyService.login();
  }

  selectArtist(artist: any): void {
    if (!this.selectedArtists.find((a) => a.id === artist.id)) {
      this.selectedArtists.push(artist);
    }
  }

  createPlaylist(): void {
    const trackObservables = this.selectedArtists.map((artist) =>
      this.spotifyService.getTopTracks(artist.id, this.accessToken)
    );

    // Wait until all track fetching is completed
    forkJoin(trackObservables).subscribe((tracksArray) => {
      const allTracks = tracksArray.flat();
      const uniqueTrackUris = [...new Set(allTracks.map((track) => track.uri))];

      // Create playlist using the fetched userId
      this.spotifyService
        .createPlaylist(this.userId, this.accessToken, 'My Generated Playlist')
        .subscribe((playlist) => {
          this.spotifyService
            .addTracksToPlaylist(playlist.id, uniqueTrackUris, this.accessToken)
            .subscribe(() => {
              this.playlistUrl = playlist.external_urls.spotify;
            });
        });
    });
  }
}
