import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { PokemonService } from '../pokemon.service';

@Component({
  selector: 'app-attendance-records',
  templateUrl: './attendance-records.component.html',
  styleUrl: './attendance-records.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceRecordsComponent implements OnInit {
  pokemonService = inject(PokemonService);

  ngOnInit() {
    this.pokemonService.fetchAttendance();
  }

  deleteRecord(id?: string) {
    if (!id) return;
    this.pokemonService.deleteAttendance(id).subscribe({
      next: () => this.pokemonService.fetchAttendance(),
      error: (err) => console.error('Delete failed', err)
    });
  }

  formatAttendanceDate(dateValue?: string) {
    if (!dateValue) return 'No timestamp';
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return 'Invalid timestamp';
    return parsedDate.toLocaleString();
  }
}
