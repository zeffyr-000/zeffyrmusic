import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideShareButtonsOptions, withConfig } from 'ngx-sharebuttons';
import { shareIcons } from 'ngx-sharebuttons/icons';
import { httpConfigInterceptor } from './interceptor/httpConfigInterceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(
            withInterceptors([httpConfigInterceptor])
        ),
        provideShareButtonsOptions(
            shareIcons(),
            withConfig({
                include: ['facebook', 'x', 'whatsapp', 'copy'],
            })
        )]
};