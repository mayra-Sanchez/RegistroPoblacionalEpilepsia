// shared-pipes.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from './safeUrl.pipe';

@NgModule({
  declarations: [SafeUrlPipe],
  exports: [SafeUrlPipe], // ¡Importante exportarlo!
  imports: [CommonModule]
})
export class SharedPipesModule { }