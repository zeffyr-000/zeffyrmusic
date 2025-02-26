export class PlayerRunning {

    key: string;
    currentTimeStr: string;
    totalTimeStr: string;
    slideLength: number;
    loadVideo: number;
    totalTime: number;

    constructor(key: string, currentTimeStr: string, totalTimeStr: string, slideLength: number, loadVideo: number, totalTime: number) {
        this.key = key;
        this.currentTimeStr = currentTimeStr;
        this.totalTimeStr = totalTimeStr;
        this.slideLength = slideLength;
        this.loadVideo = loadVideo;
        this.totalTime = totalTime;
    }

    equals(other: PlayerRunning): boolean {
        return (
            this.key === other.key &&
            this.currentTimeStr === other.currentTimeStr &&
            this.totalTimeStr === other.totalTimeStr &&
            this.slideLength === other.slideLength &&
            this.loadVideo === other.loadVideo &&
            this.totalTime === other.totalTime
        );
    }
}
