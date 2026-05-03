import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { PokemonService } from '../pokemon.service';

@Component({
  selector: 'app-student-history',
  templateUrl: './student-history.component.html',
  styleUrl: './student-history.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentHistoryComponent implements OnInit {
  auth = inject(AuthService);
  pokemonService = inject(PokemonService);

  ngOnInit() {
    this.pokemonService.fetchMyAttendance();
  }

  formatAttendanceDate(dateValue?: string) {
    if (!dateValue) return 'No timestamp';
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return 'Invalid timestamp';
    return parsedDate.toLocaleString();
  }
}
