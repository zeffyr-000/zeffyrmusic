import { ApplicationConfig } from '@angular/core';
import { provideShareButtonsOptions, withConfig } from 'ngx-sharebuttons';
import { shareIcons } from 'ngx-sharebuttons/icons';

export const appConfig: ApplicationConfig = {
    providers: [
        provideShareButtonsOptions(
            shareIcons(),
            withConfig({
                include: ['facebook', 'x', 'whatsapp', 'copy'],
            })
        )]
};