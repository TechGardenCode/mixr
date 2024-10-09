import {
    Component,
    Input,
    Output,
    EventEmitter,
    afterNextRender,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { SpotifyService } from '../../services/spotify.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-artist-search',
    standalone: true,
    imports: [FormsModule, CommonModule, ReactiveFormsModule],
    templateUrl: './artist-search.component.html',
    styleUrl: './artist-search.component.scss',
})
export class ArtistSearchComponent {
    @Input() accessToken = '';
    @Output() selectArtist = new EventEmitter<any>();

    artistSearchForm: FormGroup;

    artists: any[] = [];
    searchTerm = '';

    constructor(
        private readonly spotifyService: SpotifyService,
        private readonly formBuilder: FormBuilder
    ) {
        this.artistSearchForm = this.formBuilder.group({
            searchText: [''],
            filters: this.formBuilder.group({
                type: this.formBuilder.array(['artist']),
                market: ['US'],
            }),
        });
    }

    onSearch(): void {
        if (this.searchTerm) {
            this.spotifyService
                .searchArtists(this.searchTerm, this.accessToken)
                .subscribe((data) => {
                    this.artists = data.artists.items;
                });
        }
    }

    select(artist: any): void {
        this.selectArtist.emit(artist);
    }

    onSubmit() {
        if (
            this.artistSearchForm.valid &&
            this.artistSearchForm.value.searchText
        ) {
            this.searchTerm = this.artistSearchForm.value.searchText;
            this.onSearch();
        }
    }
}
