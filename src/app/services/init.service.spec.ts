import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { config } from 'rxjs';
import fr from '../../assets/i18n/fr.json';
import { environment } from '../../environments/environment';
import { InitService } from './init.service';

describe('InitService', () => {

  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule,
        HttpClientTestingModule,
        TranslocoTestingModule.withLangs({ fr },
          {
            availableLangs: ['fr', 'en'],
            defaultLang: 'fr',
            ...config
          })]
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    const service: InitService = TestBed.inject(InitService);
    expect(service).toBeTruthy();
  });

  it('getPing returned Observable should match the right data', () => {
    const mockPing = {
      "est_connecte": false,
      "liste_video": [{
        "id_video": "11241091",
        "id_playlist": "12320",
        "key": "8CdAfYwEGCI",
        "titre": "Careless Whisper",
        "artiste": "George Michael",
        "ordre": "0",
        "duree": "369",
        "titre_album": null,
        "tab_element": [
          {
            "key": "8CdAfYwEGCI",
            "duree": "369"
          },
          {
            "key": "u1lkws-Y6qc",
            "duree": "133"
          },
          {
            "key": "fi8z-QwO9yY",
            "duree": "178"
          },
          {
            "key": "gpqmoBYkQfc",
            "duree": "302"
          },
          {
            "key": "izGwDsrQ1eQ",
            "duree": "301"
          }
        ]
      },
      {
        "id_video": "11241096",
        "id_playlist": "12320",
        "key": "N_39tAlKGrM",
        "titre": "Lost on You",
        "artiste": "LP",
        "ordre": "1",
        "duree": "230",
        "titre_album": null,
        "tab_element": [
          {
            "key": "N_39tAlKGrM",
            "duree": "230"
          },
          {
            "key": "boeuk8N_Gsw",
            "duree": "266"
          },
          {
            "key": "KDoTQrQ2Fhs",
            "duree": "208"
          },
          {
            "key": "wDjeBNv6ip0",
            "duree": "308"
          },
          {
            "key": "hn3wJ1_1Zsg",
            "duree": "270"
          }
        ]
      }],
      "tab_video": [],
      "tab_index": []
    };

    const service: InitService = TestBed.inject(InitService);

    /*
    service.getPing();

    let hardcodedRaces;

    http.expectOne(`${environment.URL_SERVER}ping/fr`).flush(hardcodedRaces);

    console.log(hardcodedRaces);
    
      .subscribe(coursesData => {
        expect(coursesData[0].name).toEqual('Chessable');
        expect(coursesData[0].description).toEqual(
          'Space repetition to learn chess, backed by science'
        );
  
        expect(coursesData[1].name).toEqual('ICC');
        expect(coursesData[1].description).toEqual(
          'Play chess online'
        );
      });
  
    const req = httpTestingController.expectOne(
      'http://localhost:8089/topics/1/courses'
    );
  
    req.flush(mockPing);
    */
  });
});
