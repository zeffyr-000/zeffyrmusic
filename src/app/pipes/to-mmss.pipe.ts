import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'toMMSS',
    // eslint-disable-next-line @angular-eslint/prefer-standalone
    standalone: false
})
export class ToMMSSPipe implements PipeTransform {

    transform(value: string): string {
        const secNum = parseInt(value, 10);
        const minuts = Math.floor((secNum) / 60);
        const seconds = secNum - (minuts * 60);

        let minutsStr = minuts.toString();

        if (minuts < 10) { minutsStr = '0' + minuts.toString(); }

        let secondsStr = seconds.toString();

        if (seconds < 10) { secondsStr = '0' + seconds.toString(); }

        const time = minutsStr + ':' + secondsStr;
        return time;
    }

}
