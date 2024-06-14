import { ApplicationConfig } from '@angular/core';
import { provideShareButtonsOptions, withConfig } from 'ngx-sharebuttons';
import { withIcons } from 'ngx-sharebuttons/icons';

export const appConfig: ApplicationConfig = {
    providers: [
        provideShareButtonsOptions(
            withIcons(),
            withConfig({
                include: ['facebook', 'x', 'whatsapp', 'copy'],
            })
        )]
};