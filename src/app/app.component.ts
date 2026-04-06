import { Component } from '@angular/core';
import { PokemonFormComponent } from "./pokemon-form/pokemon-form.component";

@Component({
  selector: 'app-root',
  imports: [PokemonFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'pokemon-catcher';
}
