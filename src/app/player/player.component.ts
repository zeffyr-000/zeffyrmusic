import { Component, OnDestroy, OnInit } from '@angular/core';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';

@Component({
    selector: 'app-player',
    templateUrl: './player.component.html',
    styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit, OnDestroy {

    list: any[];
    currentKey: string;

    subscription: any;
    subscriptionChangeKey: any;

    constructor(private readonly initService: InitService,
                private readonly playerService: PlayerService) {
        this.subscription = playerService.subjectCurrentPlaylistChange.subscribe(list => {
            this.list = list;
        });

        this.subscriptionChangeKey = this.playerService.subjectCurrentKeyChange.subscribe(data => {
            this.currentKey = data.currentKey;
        });
    }

    ngOnInit() {
        this.playerService.launchYTApi();
    }

    play(index: number, isInitialIndex: boolean) {
        this.playerService.lecture(index, isInitialIndex);
    }

    removeToPlaylist(index: number) {
        this.playerService.removeToPlaylist(index);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.subscriptionChangeKey.unsubscribe();
    }

}
