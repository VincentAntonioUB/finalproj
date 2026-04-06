import { Component, inject, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { PokemonService } from '../pokemon.service';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-pokemon-form',
  imports: [ReactiveFormsModule],
  templateUrl: './pokemon-form.component.html',
  styleUrl: './pokemon-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokemonFormComponent implements OnInit{
  private formBuilder = inject(FormBuilder);
    pokemonForm = this.formBuilder.nonNullable.group({
        name: ['', Validators.required],
        type: ['', Validators.required],
        level: ['', Validators.required, Validators.min(1)],
        nature: ['', Validators.required],
    })

pokemonService = inject(PokemonService);
ngOnInit(){
  this.pokemonService.fetchPokemon();
}
onSubmit(){
  if(this.pokemonForm.invalid) return;

  const data = this.pokemonForm.getRawValue();
  this.pokemonService.savePokemon(data).subscribe({
    
    next: () => {
      this.pokemonService.fetchPokemon();
      this.pokemonForm.reset();
    },
    error: (err) => console.error("Save Failed", err)
  })
}
}