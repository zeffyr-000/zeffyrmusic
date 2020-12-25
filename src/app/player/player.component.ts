import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';

@Component({
    selector: 'app-player',
    templateUrl: './player.component.html',
    styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit, OnDestroy {

    isConnected = false;
    list: any[];
    currentKey: string;

    subscription: any;
    subscriptionChangeKey: any;
    subscriptionConnected: any;

    constructor(private readonly initService: InitService,
                private readonly playerService: PlayerService,
                private readonly ngZone: NgZone) {
        this.subscription = playerService.subjectCurrentPlaylistChange.subscribe(list => {
            this.list = list;
        });

        this.subscriptionChangeKey = this.playerService.subjectCurrentKeyChange.subscribe(data => {
            this.ngZone.run( () => {
                this.currentKey = data.currentKey;
             });
        });

        this.subscriptionConnected = this.initService.subjectConnectedChange.subscribe(data => {
            this.isConnected = data.isConnected;
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
        this.subscriptionConnected.unsubscribe();
    }

}
