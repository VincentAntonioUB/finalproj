import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/pokemon';

  //Reactive state using signals
  pokemonList = signal<any[]>([]);

  fetchPokemon(){
    this.http.get<any[]>(this.apiUrl).subscribe(data => this.pokemonList.set(data));
  }
  savePokemon(data : any){
    return this.http.post(this.apiUrl, data);
  }
}
