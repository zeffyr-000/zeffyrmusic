export class PlayerRunning {

    currentTimeStr: string;
    totalTimeStr: string;
    slideLength: number;
    loadVideo: number;

    constructor(currentTimeStr: string, totalTimeStr: string, slideLength: number, loadVideo: number) {
        this.currentTimeStr = currentTimeStr;
        this.totalTimeStr = totalTimeStr;
        this.slideLength = slideLength;
        this.loadVideo = loadVideo;
    }
}
