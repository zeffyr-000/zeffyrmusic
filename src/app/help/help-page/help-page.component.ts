import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-help-page',
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.css'
})
export class HelpPageComponent implements OnInit {
  page: string;

  constructor(private route: ActivatedRoute) { }


  ngOnInit() {
    this.page = this.route.snapshot.paramMap.get('page');
  }
}
