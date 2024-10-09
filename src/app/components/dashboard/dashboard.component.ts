import { CommonModule } from '@angular/common';
import { afterNextRender, afterRender, Component } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SpotifyService } from '../../services/spotify.service';
import { ArtistSearchComponent } from '../artist-search/artist-search.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        ArtistSearchComponent,
        ReactiveFormsModule,
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
    errorRetries = 3;
    accessToken = '';
    userId = '';
    selectedArtists: any[] = [];
    playlistUrl = '';
    pageLoad = false;
    playlistName = '';
    playlistDescription = '';

    constructor(private readonly spotifyService: SpotifyService) {
        afterNextRender(() => {
            const token = sessionStorage.getItem('access_token');
            if (!token) {
                this.initSession();
            } else {
                this.accessToken = token;
                this.fetchUserProfile();
            }
            this.pageLoad = true;
        });
    }

    fetchUserProfile(): void {
        this.spotifyService.getCurrentUserProfile(this.accessToken).subscribe(
            (profile) => {
                this.userId = profile.id;
            },
            (error) => {
                sessionStorage.removeItem('access_token');
                if (this.errorRetries > 0) {
                    this.errorRetries--;
                    this.initSession();
                }
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
            const uniqueTrackUris = [
                ...new Set(allTracks.map((track) => track.uri)),
            ];

            // Create playlist using the fetched userId
            this.spotifyService
                .createPlaylist(
                    this.userId,
                    this.accessToken,
                    this.playlistName,
                    this.playlistDescription
                )
                .subscribe((playlist) => {
                    this.spotifyService
                        .addTracksToPlaylist(
                            playlist.id,
                            uniqueTrackUris,
                            this.accessToken
                        )
                        .subscribe(() => {
                            this.playlistUrl = playlist.external_urls.spotify;
                        });
                });
        });
    }

    removeArtist({ name }: any) {
        this.selectedArtists = this.selectedArtists.filter(
            (a) => a.name !== name
        );
    }
}
